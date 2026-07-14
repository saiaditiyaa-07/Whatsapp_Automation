'use client';

import React, { useState } from 'react';
import { Search, MessageSquareDashed, AlertCircle, Loader2, Filter, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Conversation } from '@/hooks/useConversationSocket';
import { ConversationItem } from './ConversationItem';
import { ConnectionStatus } from './ConnectionStatus';
import { WsStatus } from '@/hooks/useWebSocketConnection';
import { Badge } from '../common/Badge';

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'urgent' | 'bot'>('all');

  // Filter conversations locally based on active tab pill
  const filteredConversations = conversations.filter((c) => {
    if (activeFilter === 'unread') return c.unread_count > 0;
    if (activeFilter === 'urgent') return (c.last_message || '').toLowerCase().includes('urgent') || (c.last_message || '').toLowerCase().includes('human');
    if (activeFilter === 'bot') return (c.unread_count === 0);
    return true;
  });

  return (
    <div className="w-80 sm:w-88 shrink-0 border-r border-darkBorder flex flex-col bg-darkSurface/90 select-none h-full">
      {/* Top Header */}
      <div className="p-4 border-b border-darkBorder flex flex-col gap-3.5 bg-darkCard/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-white tracking-tight">Active Inbox</h3>
            <Badge variant="indigo" size="sm">
              {conversations.length}
            </Badge>
          </div>
          <ConnectionStatus status={connectionStatus} />
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, phone (+1...), or message..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-darkBg border border-darkBorder rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo focus:ring-1 focus:ring-brandIndigo transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {[
            { id: 'all', label: 'All Chats' },
            { id: 'unread', label: 'Unread' },
            { id: 'urgent', label: 'Urgent' },
            { id: 'bot', label: 'Bot Handled' },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-brandIndigo text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-darkBg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-darkBorder/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-darkBorder/40 custom-scrollbar">
        {isLoading && conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-brandIndigo" />
            <span className="text-xs font-semibold">Synchronizing conversations...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-rose-400 px-6 text-center">
            <AlertCircle className="h-6 w-6" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500 px-6 text-center">
            <MessageSquareDashed className="h-8 w-8 text-slate-600" />
            <p className="text-xs font-medium">
              {searchQuery
                ? `No conversations found for "${searchQuery}"`
                : activeFilter !== 'all'
                ? `No conversations match "${activeFilter}" filter.`
                : 'No conversations right now.'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={selectedId === conv.id}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="px-4 py-2.5 border-t border-darkBorder bg-darkBg/60 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
        <span>Real-time WebSocket active</span>
        <span className="text-indigo-400">256-bit encrypted</span>
      </div>
    </div>
  );
}
