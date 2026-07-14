'use client';

import React, { useRef, useState } from 'react';
import { Send, Loader2, Smile, Paperclip, Mic, Sparkles, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showTemplates, setShowTemplates] = useState(false);

  const quickTemplates = [
    "Hello! How can I help you today?",
    "Thank you for contacting us. We are reviewing your inquiry right now.",
    "Could you please provide your order ID or account email?",
    "We have scheduled your request. Our support team will follow up shortly.",
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isSending && !disabled) {
        onSend(e as unknown as React.FormEvent);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const insertTemplate = (t: string) => {
    onChange(value ? `${value} ${t}` : t);
    setShowTemplates(false);
    inputRef.current?.focus();
  };

  return (
    <div className="border-t border-darkBorder bg-darkSurface/90 backdrop-blur-md px-6 py-4 flex flex-col gap-2.5 shrink-0 select-none relative">
      {/* Quick Replies & Template Popup */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-6 right-6 mb-3 bg-darkCard border border-darkBorder rounded-2xl shadow-2xl p-3 z-30"
          >
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-darkBorder/60">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Quick Reply Snippets
              </span>
              <button onClick={() => setShowTemplates(false)} className="text-[10px] text-slate-400 hover:text-white">
                Close [X]
              </button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {quickTemplates.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => insertTemplate(t)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-darkBg/60 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors border border-darkBorder/40"
                >
                  {t}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={onSend} className="flex items-end gap-3 w-full">
        {/* Attachment & Snippets Triggers */}
        <div className="flex items-center gap-1 pb-1">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition-colors outline-none"
            title="Quick Replies & Snippets"
          >
            <Sparkles className="h-4.5 w-4.5 text-amber-400" />
          </button>
          <button
            type="button"
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors outline-none hidden sm:inline-flex"
            title="Attach Document / Media"
          >
            <Paperclip className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Textarea Composer */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isSending || disabled}
            placeholder="Write a message to customer... (Press Enter to send, Shift+Enter for newline)"
            className="w-full resize-none px-4 py-3 text-xs sm:text-sm bg-darkBg border border-darkBorder hover:border-slate-600 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandIndigo focus:ring-1 focus:ring-brandIndigo transition-all leading-relaxed disabled:opacity-50 custom-scrollbar"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isSending || !value.trim() || disabled}
          className="h-11 px-5 shrink-0 bg-brandIndigo hover:bg-brandIndigoHover disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all duration-150 shadow-lg shadow-indigo-500/25 active:scale-95 outline-none"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Send</span>
              <Send className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
