'use client';

import React from 'react';
import { Message } from '@/hooks/useChatSocket';
import { Check, CheckCheck, Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function StatusTick({ status }: { status: string }) {
  if (status === 'sending') {
    return <span className="text-[10px] text-slate-400 select-none ml-1 animate-pulse">○</span>;
  }
  if (status === 'sent') {
    return <Check className="h-3.5 w-3.5 text-indigo-200/80 select-none ml-1 shrink-0" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-3.5 w-3.5 text-indigo-200/90 select-none ml-1 shrink-0" />;
  }
  if (status === 'read') {
    return (
      <span title="Read by customer" className="inline-flex items-center ml-1 shrink-0">
        <CheckCheck className="h-3.5 w-3.5 text-sky-300 font-extrabold select-none" />
      </span>
    );
  }
  return null;
}

export function MessageBubble({ message: m }: MessageBubbleProps) {
  const isInbound = m.direction === 'INBOUND';
  const isPending = m._optimistic;

  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'} group`}>
      <div
        className={`relative max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-lg transition-all duration-200 ${
          isPending ? 'opacity-70 scale-[0.99]' : 'opacity-100 scale-100'
        } ${
          isInbound
            ? 'bg-darkCard text-slate-100 rounded-tl-sm border border-darkBorder shadow-black/40'
            : 'bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-indigo-500/20'
        }`}
      >
        {/* Sender Indicator header if inbound */}
        {isInbound && (
          <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-darkBorder/40 text-[10px] font-bold text-indigo-400">
            <User className="h-3 w-3" />
            <span>Customer Reply</span>
          </div>
        )}

        {/* Message text */}
        <p className="leading-relaxed whitespace-pre-wrap break-words font-normal">{m.text}</p>

        {/* Footer timestamp & checkmarks */}
        <div className="flex items-center justify-end gap-1 mt-2">
          <span className={`text-[10px] font-mono ${isInbound ? 'text-slate-500' : 'text-indigo-100/80'}`}>
            {formatTime(m.timestamp)}
          </span>
          {!isInbound && <StatusTick status={m.status} />}
        </div>
      </div>
    </div>
  );
}
