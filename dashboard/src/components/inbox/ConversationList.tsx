'use client';

import React from 'react';
import { Search, MessageSquareDashed, AlertCircle, Loader2 } from 'lucide-react';
import { Conversation } from '@/hooks/useConversationSocket';
import { ConversationItem } from './ConversationItem';
import { ConnectionStatus } from './ConnectionStatus';
import { WsStatus } from '@/hooks/useWebSocketConnection';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  error: string | null;
  connectionStatus: WsStatus;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  isLoading,
  error,
  connectionStatus,
}: ConversationListProps) {
  return (
    <div className="w-80 shrink-0 border-r border-white/5 flex flex-col bg-darkSurface/60">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white tracking-tight">Inbox</h3>
          <ConnectionStatus status={connectionStatus} />
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name or phone…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[11px] bg-white/5 border border-white/8 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all"
          />
        </div>
      </div>

      {/* List body */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {isLoading && conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            <span className="text-xs">Loading conversations…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-rose-400/80 px-6 text-center">
            <AlertCircle className="h-6 w-6" />
            <p className="text-xs">{error}</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-600 px-6 text-center">
            <MessageSquareDashed className="h-8 w-8" />
            <p className="text-xs">
              {searchQuery ? `No conversations matching "${searchQuery}"` : 'No active conversations yet.'}
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={selectedId === conv.id}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>

      {/* Footer count */}
      <div className="px-4 py-2 border-t border-white/5 text-[9px] text-slate-600 text-right">
        {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
