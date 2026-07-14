'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
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

  // Track whether user is at the bottom
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 60; // px from bottom
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
  };

  // Auto-scroll only when the user was already at the bottom
  useEffect(() => {
    if (atBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, atBottom]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' });
      setAtBottom(true);
    }
  }, [messages.length === 0]); // only when transitioning from empty

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          <span className="text-xs">Loading messages…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-5 py-5 space-y-3 scroll-smooth"
      style={{ overscrollBehavior: 'contain' }}
    >
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-xs text-slate-600">No messages yet. Say hello!</p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Sentinel for auto-scroll */}
      <div ref={bottomRef} className="h-px" />

      {/* Scroll-to-bottom button */}
      {!atBottom && (
        <button
          onClick={() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setAtBottom(true);
          }}
          className="fixed bottom-24 right-8 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-3 py-1.5 rounded-full shadow-xl transition-all animate-bounce"
        >
          ↓ Latest
        </button>
      )}
    </div>
  );
}
