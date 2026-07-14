'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, ArrowDown, Sparkles, ShieldAlert, Bot } from 'lucide-react';
import { Message } from '@/hooks/useChatSocket';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  // Track whether user is near the bottom
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 80;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
  };

  // Auto-scroll when new messages arrive and user was near bottom
  useEffect(() => {
    if (atBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, atBottom]);

  // Initial scroll to bottom on load
  useEffect(() => {
    if (messages.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' });
      setAtBottom(true);
    }
  }, [messages.length === 0]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-darkBg/30">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin text-brandIndigo" />
          <span className="text-xs font-semibold">Loading conversation history...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scroll-smooth bg-gradient-to-b from-darkBg/20 via-transparent to-darkBg/40 custom-scrollbar relative"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Session Security Banner */}
      <div className="flex justify-center my-2 select-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-darkSurface/80 border border-darkBorder/60 text-[11px] text-slate-400 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>End-to-End Encrypted WhatsApp Cloud API Session</span>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center select-none">
          <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
            <Bot className="h-7 w-7 text-indigo-400" />
          </div>
          <p className="text-sm font-bold text-slate-300">No messages yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Send a message below or let your automated keyword rules reply instantly.
          </p>
        </div>
      )}

      {messages.map((msg, idx) => (
        <MessageBubble key={msg.id || idx} message={msg} />
      ))}

      {/* Sentinel for auto-scroll */}
      <div ref={bottomRef} className="h-2" />

      {/* Floating Scroll to Bottom Button */}
      {!atBottom && (
        <button
          onClick={() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setAtBottom(true);
          }}
          className="fixed bottom-28 right-12 z-20 bg-brandIndigo hover:bg-brandIndigoHover text-white text-xs font-bold px-4 py-2 rounded-full shadow-2xl shadow-indigo-500/50 flex items-center gap-1.5 transition-all animate-bounce"
        >
          <span>↓ Jump to Latest</span>
        </button>
      )}
    </div>
  );
}
