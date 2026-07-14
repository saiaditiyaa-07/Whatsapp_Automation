/**
 * useChatSocket
 *
 * Conversation-scoped WebSocket hook.
 *
 * On mount:
 *   1. Loads message history via REST (initial state).
 *   2. Opens /ws/chat/{conversationId} WebSocket.
 *
 * WebSocket events handled:
 *   - message_received  → append inbound message
 *   - message_sent      → merge with optimistic message or append
 *   - message_status_updated → update status on existing message
 *
 * Optimistic UI:
 *   - sendOptimistic() immediately appends a pending message to the list.
 *   - When message_sent arrives from the server, the optimistic entry is replaced.
 *
 * Auto-scroll:
 *   - Controlled by caller via atBottomRef to preserve scroll position.
 *
 * NO polling. NO setInterval.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { WsEvent, WsStatus, useWebSocketConnection } from './useWebSocketConnection';
import { API_BASE, WS_BASE } from '../lib/config';

export interface Message {
  id: string;
  conversation_id: string;
  meta_message_id: string | null;
  direction: 'INBOUND' | 'OUTBOUND';
  message_type: string;
  text: string;
  status: string;
  timestamp: string;
  _optimistic?: boolean; // local-only flag
}

interface UseChatSocketReturn {
  messages: Message[];
  connectionStatus: WsStatus;
  isLoading: boolean;
  error: string | null;
  /** Append an optimistic outgoing message before server confirms */
  appendOptimistic: (text: string) => string;
  /** Mark an optimistic message as confirmed (or replace with server copy) */
  confirmOptimistic: (tempId: string, serverMsg: Message) => void;
}

let _optimisticCounter = 0;

export function useChatSocket(
  conversationId: string | null,
  workspaceId: string | null
): UseChatSocketReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- REST initial load ---
  const fetchMessages = useCallback(async () => {
    if (!conversationId || !workspaceId) return;
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/whatsapp/conversations/${conversationId}/messages?workspace_id=${workspaceId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Failed to load messages');
      const data: Message[] = await res.json();
      setMessages(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, workspaceId]);

  useEffect(() => {
    setMessages([]); // clear on conversation switch
    fetchMessages();
  }, [fetchMessages]);

  // --- WebSocket live updates ---
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const wsUrl = conversationId && token
    ? `${WS_BASE}/ws/chat/${conversationId}?token=${token}`
    : null;

  const handleMessage = useCallback((event: WsEvent) => {
    const { type, payload } = event;

    if (type === 'message_received') {
      const msg = payload as Message;
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } else if (type === 'message_sent') {
      const msg = payload as Message;
      setMessages(prev => {
        // Replace the first optimistic pending message, or append if none
        const optimisticIdx = prev.findIndex(m => m._optimistic);
        if (optimisticIdx !== -1) {
          const next = [...prev];
          next[optimisticIdx] = msg;
          return next;
        }
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } else if (type === 'message_status_updated') {
      const { message_id, status } = payload as { message_id: string; status: string };
      setMessages(prev =>
        prev.map(m => m.id === message_id ? { ...m, status } : m)
      );
    }
  }, []);

  const { status: connectionStatus } = useWebSocketConnection(wsUrl, {
    onMessage: handleMessage,
    enabled: !!wsUrl,
  });

  // --- Optimistic UI ---
  const appendOptimistic = useCallback((text: string): string => {
    const tempId = `optimistic-${++_optimisticCounter}`;
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversationId ?? '',
      meta_message_id: null,
      direction: 'OUTBOUND',
      message_type: 'text',
      text,
      status: 'sending',
      timestamp: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    return tempId;
  }, [conversationId]);

  const confirmOptimistic = useCallback((tempId: string, serverMsg: Message) => {
    setMessages(prev =>
      prev.map(m => m.id === tempId ? serverMsg : m)
    );
  }, []);

  return { messages, connectionStatus, isLoading, error, appendOptimistic, confirmOptimistic };
}
