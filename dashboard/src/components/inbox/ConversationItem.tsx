'use client';

import React from 'react';
import { Conversation } from '@/hooks/useConversationSocket';
import { Badge } from '../common/Badge';

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

export function ConversationItem({ conversation: c, isSelected, onClick }: ConversationItemProps) {
  const initials = getInitials(c.customer_name, c.customer_phone);
  const avatarGradient = getAvatarColor(c.id);
  const timeStr = formatTime(c.last_message_time);
  const hasUnread = c.unread_count > 0;

  // Determine mock CRM tag for visual richness based on ID/phone
  const tagHash = (c.customer_phone.slice(-1) ? parseInt(c.customer_phone.slice(-1), 10) : 0) % 4;
  const tags = ['VIP Lead', 'Customer', 'Support', 'New Contact'];
  const tagColors: any = ['purple', 'emerald', 'amber', 'slate'];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 flex items-start gap-3.5 transition-all duration-150 relative group outline-none ${
        isSelected
          ? 'bg-indigo-500/15 border-l-2 border-brandIndigo pl-3.5 shadow-inner'
          : 'hover:bg-slate-800/40 border-l-2 border-transparent'
      }`}
    >
      {/* Avatar with Online/Unread Dot */}
      <div className="relative shrink-0">
        <div
          className={`h-10 w-10 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-xs font-black text-white shadow-md`}
        >
          {initials}
        </div>
        {hasUnread ? (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-brandIndigo rounded-full border-2 border-darkSurface animate-pulse" />
        ) : (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-darkSurface" />
        )}
      </div>

      {/* Conversation Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className={`text-xs font-bold truncate ${hasUnread ? 'text-white' : 'text-slate-200'}`}>
              {c.customer_name || 'Anonymous'}
            </span>
            <Badge variant={tagColors[tagHash]} size="sm" className="hidden sm:inline-flex scale-90 origin-left">
              {tags[tagHash]}
            </Badge>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold shrink-0">{timeStr}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs truncate max-w-[170px] ${hasUnread ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
            {c.last_message || `+${c.customer_phone}`}
          </p>
          {hasUnread && (
            <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-brandIndigo text-[10px] font-black text-white rounded-full flex items-center justify-center shadow-md shadow-indigo-500/30">
              {c.unread_count > 99 ? '99+' : c.unread_count}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-slate-500 font-mono">+{c.customer_phone}</span>
          <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Open chat →</span>
        </div>
      </div>
    </button>
  );
}
