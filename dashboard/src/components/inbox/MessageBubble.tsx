'use client';

import React from 'react';
import { Message } from '@/hooks/useChatSocket';

interface MessageBubbleProps {
  message: Message;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function StatusTick({ status }: { status: string }) {
  if (status === 'sending') {
    return <span className="text-[9px] text-slate-500 select-none ml-1">○</span>;
  }
  if (status === 'sent') {
    return <span className="text-[9px] text-indigo-300/70 select-none ml-1">✓</span>;
  }
  if (status === 'delivered') {
    return <span className="text-[9px] text-indigo-300/70 select-none ml-1">✓✓</span>;
  }
  if (status === 'read') {
    return <span className="text-[9px] text-sky-400 font-bold select-none ml-1">✓✓</span>;
  }
  return null;
}

export function MessageBubble({ message: m }: MessageBubbleProps) {
  const isInbound = m.direction === 'INBOUND';
  const isPending = m._optimistic;

  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'} group`}>
      <div
        className={`relative max-w-[72%] rounded-2xl px-4 py-2.5 text-xs shadow-md transition-opacity duration-300 ${
          isPending ? 'opacity-70' : 'opacity-100'
        } ${
          isInbound
            ? 'bg-slate-800/80 text-slate-100 rounded-tl-sm border border-slate-700/40'
            : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm'
        }`}
      >
        {/* Message text */}
        <p className="leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>

        {/* Footer row: timestamp + status */}
        <div className="flex items-center justify-end gap-0.5 mt-1.5">
          <span className={`text-[9px] font-mono ${isInbound ? 'text-slate-500' : 'text-indigo-200/70'}`}>
            {formatTime(m.timestamp)}
          </span>
          {!isInbound && <StatusTick status={m.status} />}
        </div>
      </div>
    </div>
  );
}
