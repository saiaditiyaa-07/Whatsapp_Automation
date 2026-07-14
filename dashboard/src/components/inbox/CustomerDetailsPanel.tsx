'use client';

import React, { useState } from 'react';
import { Conversation } from '@/hooks/useConversationSocket';
import { 
  User, 
  Phone, 
  Mail, 
  Tag, 
  Calendar, 
  Clock, 
  FileText, 
  ShieldAlert, 
  ExternalLink, 
  Edit3, 
  Check, 
  Plus, 
  X, 
  MessageSquare, 
  Copy, 
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';

interface CustomerDetailsPanelProps {
  conversation: Conversation | undefined;
  onClose?: () => void;
}

export function CustomerDetailsPanel({ conversation, onClose }: CustomerDetailsPanelProps) {
  const toast = useToast();
  const [notes, setNotes] = useState('Customer inquired regarding WhatsApp Cloud API enterprise rate limits and automated keyword triggers.');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tags, setTags] = useState(['VIP Lead', 'WhatsApp Opt-In', 'High Intent']);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  if (!conversation) return null;

  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
      setIsAddingTag(false);
      toast.success('CRM Tag Added', `Added tag "${newTagInput.trim()}" to contact.`);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(`+${conversation.customer_phone}`);
    toast.info('Phone Number Copied', `+${conversation.customer_phone} copied to clipboard.`);
  };

  return (
    <div className="w-80 sm:w-88 shrink-0 border-l border-darkBorder bg-darkSurface/90 flex flex-col h-full overflow-y-auto custom-scrollbar select-none">
      {/* Header */}
      <div className="p-5 border-b border-darkBorder flex items-center justify-between bg-darkCard/50">
        <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
          <User className="h-4 w-4 text-brandIndigo" /> Customer CRM Profile
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="p-5 border-b border-darkBorder text-center">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center font-black text-white text-xl shadow-xl shadow-indigo-500/20 mb-3">
          {conversation.customer_name ? conversation.customer_name.slice(0, 2).toUpperCase() : 'C'}
        </div>
        <h4 className="text-base font-extrabold text-white">{conversation.customer_name || 'Anonymous Lead'}</h4>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <span className="text-xs text-slate-400 font-mono">+{conversation.customer_phone}</span>
          <button onClick={handleCopyPhone} className="p-1 text-slate-500 hover:text-slate-200" title="Copy Phone">
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Badge variant="emerald" size="sm" pulse>WhatsApp Active</Badge>
          <Badge variant="indigo" size="sm">Tier 1 Account</Badge>
        </div>
      </div>

      {/* CRM Tags Section */}
      <div className="p-5 border-b border-darkBorder space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-indigo-400" /> CRM Segments & Tags
          </span>
          {!isAddingTag && (
            <button
              onClick={() => setIsAddingTag(true)}
              className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add Tag
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-darkBg border border-darkBorder/80 text-xs font-semibold text-slate-200"
            >
              <span>{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-slate-500 hover:text-rose-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        {isAddingTag && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Tag name..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              className="flex-1 bg-darkBg border border-darkBorder rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brandIndigo"
              autoFocus
            />
            <Button variant="primary" size="sm" onClick={handleAddTag}>Add</Button>
            <Button variant="ghost" size="sm" onClick={() => setIsAddingTag(false)}>Cancel</Button>
          </div>
        )}
      </div>

      {/* Internal Agent Notes Section */}
      <div className="p-5 border-b border-darkBorder space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-amber-400" /> Internal Notes
          </span>
          <button
            onClick={() => {
              if (isEditingNotes) toast.success('Notes Saved', 'Internal CRM notes updated.');
              setIsEditingNotes(!isEditingNotes);
            }}
            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300"
          >
            {isEditingNotes ? 'Save Notes' : 'Edit Notes'}
          </button>
        </div>

        {isEditingNotes ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-darkBg border border-indigo-500/60 rounded-xl p-3 text-xs text-slate-200 focus:outline-none min-h-[96px] resize-y"
          />
        ) : (
          <p className="text-xs text-slate-400 bg-darkBg/50 border border-darkBorder/60 rounded-xl p-3 leading-relaxed">
            {notes}
          </p>
        )}
      </div>

      {/* Campaign & Session History */}
      <div className="p-5 border-b border-darkBorder space-y-3">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-cyan-400" /> Engagement History
        </span>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-darkBorder/40">
            <span className="text-slate-400">First Contacted</span>
            <span className="font-semibold text-slate-200">Jul 10, 2026</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-darkBorder/40">
            <span className="text-slate-400">Total Messages</span>
            <span className="font-semibold text-white">24 messages</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400">Campaign Received</span>
            <span className="font-semibold text-indigo-300">Q3 Launch Blast</span>
          </div>
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="p-5 space-y-2.5 mt-auto">
        <Button variant="outline" fullWidth size="sm" onClick={() => toast.info('Exporting Transcript', 'Generating PDF chat logs...')}>
          Export Chat Transcript
        </Button>
        <Button variant="danger" fullWidth size="sm" leftIcon={<ShieldAlert className="h-3.5 w-3.5" />} onClick={() => toast.warning('Contact Blocked', 'Number added to opt-out blacklist.')}>
          Block & Opt-Out Contact
        </Button>
      </div>
    </div>
  );
}
