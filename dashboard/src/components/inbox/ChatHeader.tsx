'use client';

import React from 'react';
import { Phone } from 'lucide-react';
import { Conversation } from '@/hooks/useConversationSocket';
import { ConnectionStatus } from './ConnectionStatus';
import { WsStatus } from '@/hooks/useWebSocketConnection';

interface ChatHeaderProps {
  conversation: Conversation | undefined;
  connectionStatus: WsStatus;
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
  'from-violet-500 to-indigo-600',
  'from-sky-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ChatHeader({ conversation, connectionStatus }: ChatHeaderProps) {
  if (!conversation) return null;

  const initials = getInitials(conversation.customer_name, conversation.customer_phone);
  const avatarGradient = getAvatarColor(conversation.id);

  return (
    <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between bg-darkSurface/40 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-xs font-bold text-white shadow-md shrink-0`}
        >
          {initials}
        </div>

        {/* Info */}
        <div>
          <h4 className="text-sm font-semibold text-white leading-tight">
            {conversation.customer_name || 'Unknown Customer'}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Phone className="h-2.5 w-2.5 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-mono">+{conversation.customer_phone}</span>
          </div>
        </div>
      </div>

      {/* Right side: connection status */}
      <ConnectionStatus status={connectionStatus} />
    </div>
  );
}
