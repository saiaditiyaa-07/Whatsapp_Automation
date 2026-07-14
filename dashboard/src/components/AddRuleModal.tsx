import React, { useState } from 'react';
import { X, HelpCircle, FileText, Zap } from 'lucide-react';

interface AddRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { triggerKeyword: string; replyText: string | null; templateId: string | null }) => void;
}

export function AddRuleModal({ isOpen, onClose, onSubmit }: AddRuleModalProps) {
  const [keyword, setKeyword] = useState('');
  const [responseType, setResponseType] = useState<'text' | 'template'>('text');
  const [replyText, setReplyText] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [errors, setErrors] = useState<{ keyword?: string; replyText?: string; templateId?: string }>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!keyword.trim()) {
      newErrors.keyword = 'Trigger keyword is required';
    } else if (keyword.length < 2) {
      newErrors.keyword = 'Keyword must be at least 2 characters';
    }

    if (responseType === 'text') {
      if (!replyText.trim()) {
        newErrors.replyText = 'Reply text is required for text response';
      }
    } else {
      if (!templateId.trim()) {
        newErrors.templateId = 'Template ID is required for template response';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      triggerKeyword: keyword.trim(),
      replyText: responseType === 'text' ? replyText.trim() : null,
      templateId: responseType === 'template' ? templateId.trim() : null,
    });

    // Reset fields
    setKeyword('');
    setReplyText('');
    setTemplateId('');
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070c]/70 backdrop-blur-sm transition-opacity">
      <div className="bg-darkSurface border border-darkBorder rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="p-6 border-b border-darkBorder flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Create Automation Rule</h3>
            <p className="text-[11px] text-slate-400 mt-1">Configure keyword triggers and auto-replies for this workspace.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors outline-none">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Keyword Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Trigger Keyword
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                if (errors.keyword) setErrors((prev) => ({ ...prev, keyword: undefined }));
              }}
              placeholder="e.g. support, help, status"
              className={`w-full px-3 py-2.5 text-xs bg-darkBg border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo transition-colors ${
                errors.keyword ? 'border-brandRed' : 'border-darkBorder'
              }`}
            />
            {errors.keyword && <p className="text-[10px] text-brandRed mt-1">{errors.keyword}</p>}
            <p className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> Keyword matching is case-insensitive.
            </p>
          </div>

          {/* Action Type Tabs */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Response Action Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-darkBg rounded-lg border border-darkBorder">
              <button
                type="button"
                onClick={() => setResponseType('text')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all outline-none ${
                  responseType === 'text'
                    ? 'bg-indigo-500/10 text-brandIndigo border border-indigo-500/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="h-3.5 w-3.5" /> Text Reply
              </button>
              <button
                type="button"
                onClick={() => setResponseType('template')}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all outline-none ${
                  responseType === 'template'
                    ? 'bg-emerald-500/10 text-brandGreen border border-emerald-500/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Template Send
              </button>
            </div>
          </div>

          {/* Response Payload */}
          {responseType === 'text' ? (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Plain Text Response Body
              </label>
              <textarea
                value={replyText}
                onChange={(e) => {
                  setReplyText(e.target.value);
                  if (errors.replyText) setErrors((prev) => ({ ...prev, replyText: undefined }));
                }}
                rows={4}
                placeholder="Write the auto-reply message..."
                className={`w-full px-3 py-2 text-xs bg-darkBg border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo transition-colors resize-none ${
                  errors.replyText ? 'border-brandRed' : 'border-darkBorder'
                }`}
              />
              {errors.replyText && <p className="text-[10px] text-brandRed mt-1">{errors.replyText}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Meta Registered Template name/ID
              </label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => {
                  setTemplateId(e.target.value);
                  if (errors.templateId) setErrors((prev) => ({ ...prev, templateId: undefined }));
                }}
                placeholder="e.g. welcome_intro_standard"
                className={`w-full px-3 py-2 text-xs bg-darkBg border rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo transition-colors ${
                  errors.templateId ? 'border-brandRed' : 'border-darkBorder'
                }`}
              />
              {errors.templateId && <p className="text-[10px] text-brandRed mt-1">{errors.templateId}</p>}
              <p className="text-[10px] text-slate-500 mt-1.5">
                Ensure the template is approved on your Meta Business Suite console.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-darkBorder">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 rounded-lg transition-colors outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-all outline-none"
            >
              Save Automation Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
