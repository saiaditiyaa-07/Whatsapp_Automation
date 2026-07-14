'use client';

import React from 'react';
import { Conversation } from '@/hooks/useConversationSocket';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

export function ConversationItem({ conversation: c, isSelected, onClick }: ConversationItemProps) {
  const initials = getInitials(c.customer_name, c.customer_phone);
  const avatarGradient = getAvatarColor(c.id);
  const timeStr = formatTime(c.last_message_time);
  const hasUnread = c.unread_count > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-all duration-150 hover:bg-slate-800/30 relative ${
        isSelected
          ? 'bg-indigo-500/10 border-l-2 border-indigo-500 pl-3.5'
          : 'border-l-2 border-transparent'
      }`}
    >
      {/* Avatar */}
      <div
        className={`relative h-10 w-10 shrink-0 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-xs font-bold text-white shadow-md`}
      >
        {initials}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-indigo-500 rounded-full border-2 border-darkSurface" />
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={`text-xs font-semibold truncate max-w-[130px] ${hasUnread ? 'text-white' : 'text-slate-300'}`}>
            {c.customer_name || 'Anonymous'}
          </span>
          <span className="text-[9px] text-slate-500 shrink-0 ml-2">{timeStr}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] truncate max-w-[155px] ${hasUnread ? 'text-slate-300' : 'text-slate-500'}`}>
            {c.last_message || `+${c.customer_phone}`}
          </span>
          {hasUnread && (
            <span className="shrink-0 h-5 min-w-[20px] px-1.5 bg-indigo-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center shadow-lg">
              {c.unread_count > 99 ? '99+' : c.unread_count}
            </span>
          )}
        </div>

        <span className="text-[9px] text-slate-600 font-mono">+{c.customer_phone}</span>
      </div>
    </button>
  );
}
