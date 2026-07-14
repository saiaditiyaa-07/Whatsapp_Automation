'use client';

import React, { useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface MessageComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  isSending: boolean;
  disabled?: boolean;
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  isSending,
  disabled = false,
}: MessageComposerProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isSending && !disabled) {
        onSend(e as unknown as React.FormEvent);
      }
    }
  };

  // Auto-grow textarea up to 4 rows
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Reset height before measuring
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
  };

  return (
    <form
      onSubmit={onSend}
      className="px-4 py-3 border-t border-white/5 bg-darkSurface/30 flex items-end gap-3 shrink-0"
    >
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isSending || disabled}
          placeholder="Write a response… (Enter to send, Shift+Enter for newline)"
          className="w-full resize-none px-4 py-3 text-xs bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all leading-relaxed disabled:opacity-50 scrollbar-thin"
          style={{ minHeight: '40px', maxHeight: '96px' }}
        />
      </div>

      <button
        type="submit"
        disabled={isSending || !value.trim() || disabled}
        className="h-10 w-10 shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all duration-150 shadow-md hover:shadow-indigo-500/25 active:scale-95"
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </form>
  );
}
