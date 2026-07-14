import React from 'react';
import { ToggleLeft, ToggleRight, Trash2, Zap, FileText } from 'lucide-react';

export interface Rule {
  id: string;
  triggerKeyword: string;
  replyText: string | null;
  templateId: string | null;
  isActive: boolean;
  createdAt: string;
}

interface RuleTableProps {
  rules: Rule[];
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RuleTable({ rules, onToggleActive, onDelete }: RuleTableProps) {
  return (
    <div className="bg-darkSurface border border-darkBorder rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-darkBorder flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Active Triggers & Rules</h2>
          <p className="text-xs text-slate-400 mt-1">
            Incoming messages containing these keywords will trigger automated responses.
          </p>
        </div>
        <span className="text-[10px] font-medium bg-indigo-500/15 text-indigo-400 px-2 py-1 rounded-full">
          {rules.length} Rules Defined
        </span>
      </div>

      {rules.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <Zap className="h-8 w-8 text-slate-500 mb-3 animate-pulse" />
          <h3 className="text-xs font-semibold text-slate-300">No automation rules</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Click the "Add Rule" button to create your first keyword trigger.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-darkBorder bg-darkBg/20 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Trigger Keyword</th>
                <th className="px-6 py-4">Action Type</th>
                <th className="px-6 py-4">Response Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder/40">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-indigo-300 bg-brandIndigo/5 border border-brandIndigo/10 px-2 py-0.5 rounded">
                        {rule.triggerKeyword}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-200 font-medium">
                    {rule.templateId ? (
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <FileText className="h-3.5 w-3.5" /> Template
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <Zap className="h-3.5 w-3.5" /> Text Reply
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
                    {rule.templateId ? (
                      <code className="text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700">
                        {rule.templateId}
                      </code>
                    ) : (
                      rule.replyText
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onToggleActive(rule.id)}
                      className="text-slate-400 hover:text-slate-200 transition-colors outline-none"
                      title={rule.isActive ? 'Deactivate rule' : 'Activate rule'}
                    >
                      {rule.isActive ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-brandGreen">
                          <ToggleRight className="h-5 w-5 text-brandGreen cursor-pointer" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <ToggleLeft className="h-5 w-5 text-slate-500 cursor-pointer" /> Inactive
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(rule.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onDelete(rule.id)}
                      className="text-slate-500 hover:text-brandRed hover:bg-brandRed/10 p-1.5 rounded-lg transition-all outline-none"
                      title="Delete rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
