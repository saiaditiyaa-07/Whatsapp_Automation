'use client';

import React from 'react';
import { Phone, UserCheck, Shield, Sparkles, Search, MoreVertical, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Conversation } from '@/hooks/useConversationSocket';
import { ConnectionStatus } from './ConnectionStatus';
import { WsStatus } from '@/hooks/useWebSocketConnection';
import { Badge } from '../common/Badge';

interface ChatHeaderProps {
  conversation: Conversation | undefined;
  connectionStatus: WsStatus;
  isPanelOpen?: boolean;
  onTogglePanel?: () => void;
}

function getInitials(name: string | null, phone: string): string {
  if (name) {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return phone.slice(-2);
}

const AVATAR_COLORS = [
  'from-indigo-600 to-purple-600',
  'from-cyan-600 to-blue-600',
  'from-emerald-600 to-teal-600',
  'from-rose-600 to-pink-600',
  'from-amber-600 to-orange-600',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ChatHeader({ conversation, connectionStatus, isPanelOpen = true, onTogglePanel }: ChatHeaderProps) {
  if (!conversation) return null;

  const initials = getInitials(conversation.customer_name, conversation.customer_phone);
  const avatarGradient = getAvatarColor(conversation.id);

  return (
    <div className="px-6 py-4 border-b border-darkBorder flex items-center justify-between bg-darkSurface/90 backdrop-blur-md shrink-0 select-none">
      <div className="flex items-center gap-3.5">
        {/* Avatar with status */}
        <div className="relative">
          <div
            className={`h-11 w-11 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-sm font-black text-white shadow-lg`}
          >
            {initials}
          </div>
          <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-400 rounded-full border-2 border-darkSurface" title="Online on WhatsApp" />
        </div>

        {/* Customer Info */}
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight">
              {conversation.customer_name || 'Unknown Customer'}
            </h4>
            <Badge variant="purple" size="sm" leftIcon={<Sparkles className="h-3 w-3 text-amber-400" />}>
              AI Handled
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Phone className="h-3 w-3 text-slate-500" />
              <span>+{conversation.customer_phone}</span>
            </div>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              Active Session (24h Window)
            </span>
          </div>
        </div>
      </div>

      {/* Right Action Toolbar */}
      <div className="flex items-center gap-3">
        {/* Connection status indicator */}
        <div className="hidden md:block">
          <ConnectionStatus status={connectionStatus} />
        </div>

        {/* Assign Agent button */}
        <button
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-darkBg border border-darkBorder hover:border-indigo-500/50 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          title="Transfer to agent"
        >
          <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
          <span>Assign Agent</span>
        </button>

        {/* Toggle Right CRM Details Panel */}
        {onTogglePanel && (
          <button
            onClick={onTogglePanel}
            className={`p-2 rounded-xl transition-colors outline-none ${
              isPanelOpen ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-darkBg text-slate-400 hover:text-white border border-darkBorder'
            }`}
            title={isPanelOpen ? 'Hide CRM Details' : 'Show CRM Details'}
          >
            {isPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
