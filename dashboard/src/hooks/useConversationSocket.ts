/**
 * useConversationSocket
 *
 * Workspace-scoped WebSocket hook.
 *
 * On mount:
 *   1. Loads conversation list via REST (initial state).
 *   2. Opens /ws/conversations/{workspaceId} WebSocket.
 *
 * WebSocket events handled:
 *   - conversation_created  → prepend new conversation
 *   - conversation_updated  → update + re-sort by last_message_time
 *   - message_received      → update unread_count + last_message preview
 *   - message_sent          → update last_message preview
 *
 * NO polling. NO setInterval for data refresh.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { WsEvent, WsStatus, useWebSocketConnection } from './useWebSocketConnection';
import { API_BASE, WS_BASE } from '../lib/config';

export interface Conversation {
  id: string;
  workspace_id: string;
  customer_name: string | null;
  customer_phone: string;
  last_message: string | null;
  last_message_time: string | null;
  is_archived: boolean;
  unread_count: number;
  created_at: string;
}

interface UseConversationSocketReturn {
  conversations: Conversation[];
  connectionStatus: WsStatus;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

function sortByLatest(convs: Conversation[]): Conversation[] {
  return [...convs].sort((a, b) => {
    const ta = a.last_message_time ? new Date(a.last_message_time).getTime() : new Date(a.created_at).getTime();
    const tb = b.last_message_time ? new Date(b.last_message_time).getTime() : new Date(b.created_at).getTime();
    return tb - ta;
  });
}

export function useConversationSocket(
  workspaceId: string | null,
  searchQuery: string = ''
): UseConversationSocketReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef(searchQuery);
  useEffect(() => { searchRef.current = searchQuery; }, [searchQuery]);

  // --- REST initial load ---
  const fetchConversations = useCallback(async () => {
    if (!workspaceId) return;
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setIsLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/whatsapp/conversations?workspace_id=${workspaceId}&search=${encodeURIComponent(searchRef.current)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load conversations');
      const data: Conversation[] = await res.json();
      setConversations(sortByLatest(data));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  // Reload when workspace or search changes
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, searchQuery]);

  // --- WebSocket live updates ---
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const wsUrl = workspaceId && token
    ? `${WS_BASE}/ws/conversations/${workspaceId}?token=${token}`
    : null;

  const handleMessage = useCallback((event: WsEvent) => {
    const { type, payload } = event;

    if (type === 'conversation_created') {
      const conv = payload as Conversation;
      setConversations(prev => {
        // Guard duplicate
        if (prev.some(c => c.id === conv.id)) return prev;
        return sortByLatest([conv, ...prev]);
      });
    } else if (type === 'conversation_updated') {
      const updated = payload as Conversation;
      setConversations(prev => {
        const exists = prev.some(c => c.id === updated.id);
        const next = exists
          ? prev.map(c => c.id === updated.id ? updated : c)
          : [updated, ...prev];
        return sortByLatest(next);
      });
    } else if (type === 'message_received' || type === 'message_sent') {
      // Payload is a MessagePayload – update the matching conversation's preview
      const msg = payload as {
        conversation_id: string;
        text: string;
        timestamp: string;
        direction: string;
      };
      setConversations(prev =>
        sortByLatest(prev.map(c => {
          if (c.id !== msg.conversation_id) return c;
          return {
            ...c,
            last_message: msg.text,
            last_message_time: msg.timestamp,
            unread_count: type === 'message_received' ? c.unread_count + 1 : c.unread_count,
          };
        }))
      );
    }
  }, []);

  const { status: connectionStatus } = useWebSocketConnection(wsUrl, {
    onMessage: handleMessage,
    enabled: !!wsUrl,
  });

  return { conversations, connectionStatus, isLoading, error, refetch: fetchConversations };
}
