'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Zap, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Loader2, 
  Clock, 
  Tag, 
  UserPlus, 
  Globe, 
  Sparkles,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Copy
} from 'lucide-react';
import VisualWorkflowBuilder from './VisualWorkflowBuilder';

interface WorkflowBuilderProps {
  activeWorkspace: any;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function WorkflowBuilder({ activeWorkspace }: WorkflowBuilderProps) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'logs'>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canvasWorkflowId, setCanvasWorkflowId] = useState<string | null>(null);

  // Editor Modal / Panel States
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wfName, setWfName] = useState('');
  const [wfDesc, setWfDesc] = useState('');
  const [wfActive, setWfActive] = useState(true);

  // Triggers, Conditions, Actions Builder states
  const [triggers, setTriggers] = useState<any[]>([{ trigger_type: 'incoming_message', config: {} }]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([{ action_type: 'send_message', config: { text: '' }, sequence: 0 }]);

  const getHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchWorkflows = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/workflows/?workspace_id=${activeWorkspace.id}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      } else {
        setErrorMessage('Failed to load workflows.');
      }
    } catch (err) {
      setErrorMessage('Network connection error.');
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace]);

  const fetchLogs = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/workflows/history/logs?workspace_id=${activeWorkspace.id}&limit=50`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (activeWorkspace) {
      fetchWorkflows();
      fetchLogs();
    }
  }, [activeWorkspace, fetchWorkflows, fetchLogs]);

  const handleOpenCreator = async () => {
    setIsLoading(true);
    try {
      const payload = {
        name: 'New Automation Workflow',
        description: 'Visual draft automation workflow.',
        is_active: false,
        triggers: [],
        conditions: [],
        actions: [],
        canvas: { nodes: [], edges: [] }
      };
      const res = await fetch(`${API_BASE}/api/v1/workflows/?workspace_id=${activeWorkspace.id}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setCanvasWorkflowId(data.id);
      }
    } catch (err) {
      console.error("Failed to create draft workflow:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditor = (wf: any) => {
    setCanvasWorkflowId(wf.id);
  };

  const handleAddCondition = () => {
    setConditions([...conditions, { condition_type: 'message_contains', config: { text: '' } }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, key: string, val: any) => {
    setConditions(conditions.map((c, i) => {
      if (i !== index) return c;
      if (key === 'condition_type') {
        // Reset config based on type
        let conf = {};
        if (val === 'message_contains') conf = { text: '' };
        else if (val === 'exact_keyword') conf = { keyword: '' };
        else if (val === 'customer_tag') conf = { tag: '' };
        else if (val === 'time_range') conf = { start: '09:00', end: '17:00' };
        else if (val === 'conversation_status') conf = { status: 'open' };
        return { ...c, condition_type: val, config: conf };
      }
      return { ...c, config: { ...c.config, [key]: val } };
    }));
  };

  const handleAddAction = () => {
    setActions([...actions, { action_type: 'send_message', config: { text: '' }, sequence: actions.length }]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index).map((a, i) => ({ ...a, sequence: i })));
  };

  const handleActionChange = (index: number, key: string, val: any) => {
    setActions(actions.map((a, i) => {
      if (i !== index) return a;
      if (key === 'action_type') {
        let conf = {};
        if (val === 'send_message') conf = { text: '' };
        else if (val === 'delay') conf = { duration_seconds: 10 };
        else if (val === 'add_tag' || val === 'remove_tag') conf = { tag: '' };
        else if (val === 'assign_conversation') conf = { user_id: '' };
        else if (val === 'call_webhook') conf = { url: '' };
        else if (val === 'ai_response') conf = { prompt: '' };
        return { ...a, action_type: val, config: conf };
      }
      return { ...a, config: { ...a.config, [key]: val } };
    }));
  };

  const handleTriggerChange = (key: string, val: any) => {
    setTriggers(triggers.map((t, i) => {
      if (i !== 0) return t; // support 1 trigger for simplicity in GUI
      if (key === 'trigger_type') {
        let conf = {};
        if (val === 'keyword_match') conf = { keywords: [''] };
        else if (val === 'business_hours') conf = { start_hour: 9, end_hour: 17, match_out_of_hours: false };
        return { ...t, trigger_type: val, config: conf };
      }
      return { ...t, config: { ...t.config, [key]: val } };
    }));
  };

  const handleKeywordChange = (kwIdx: number, val: any) => {
    const trigger = triggers[0];
    const keywords = [...(trigger.config.keywords || [])];
    keywords[kwIdx] = val;
    handleTriggerChange('keywords', keywords);
  };

  const handleAddKeyword = () => {
    const trigger = triggers[0];
    const keywords = [...(trigger.config.keywords || []), ''];
    handleTriggerChange('keywords', keywords);
  };

  const handleRemoveKeyword = (kwIdx: number) => {
    const trigger = triggers[0];
    const keywords = (trigger.config.keywords || []).filter((_: any, idx: number) => idx !== kwIdx);
    handleTriggerChange('keywords', keywords);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wfName.trim()) return;

    setIsSaving(true);
    setErrorMessage(null);

    const payload = {
      name: wfName,
      description: wfDesc,
      is_active: wfActive,
      triggers,
      conditions,
      actions
    };

    try {
      const url = editingId 
        ? `${API_BASE}/api/v1/workflows/${editingId}?workspace_id=${activeWorkspace.id}`
        : `${API_BASE}/api/v1/workflows/?workspace_id=${activeWorkspace.id}`;
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsOpen(false);
        fetchWorkflows();
        fetchLogs();
      } else {
        const err = await res.json();
        setErrorMessage(err.detail || 'Failed to save workflow.');
      }
    } catch (err) {
      setErrorMessage('Network connection failure.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/workflows/${id}?workspace_id=${activeWorkspace.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchWorkflows();
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (wf: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/workflows/${wf.id}/toggle?workspace_id=${activeWorkspace.id}`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/workflows/${id}/duplicate?workspace_id=${activeWorkspace.id}`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (canvasWorkflowId && activeWorkspace) {
    return (
      <VisualWorkflowBuilder
        workflowId={canvasWorkflowId}
        workspaceId={activeWorkspace.id}
        onBack={() => {
          setCanvasWorkflowId(null);
          fetchWorkflows();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Workflow Automations</h3>
          <p className="text-xs text-slate-400 mt-1">Design production-grade state machines to automate replies, delay actions, add tags, and assign chats.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-darkBg border border-darkBorder rounded-lg p-0.5 select-none">
            <button 
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Workflows
            </button>
            <button 
              onClick={() => { setActiveTab('logs'); fetchLogs(); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Execution History
            </button>
          </div>
          {activeTab === 'list' && (
            <button
              onClick={handleOpenCreator}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md transition-all outline-none"
            >
              <Plus className="h-4 w-4" /> Create Workflow
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {errorMessage}
        </div>
      )}

      {/* WORKFLOWS LIST TAB */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && workflows.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              <span className="text-xs">Loading workflows…</span>
            </div>
          ) : workflows.length === 0 ? (
            <div className="col-span-full py-16 bg-darkSurface border border-darkBorder rounded-xl flex flex-col items-center justify-center gap-3 text-slate-500">
              <Zap className="h-8 w-8 text-slate-600" />
              <p className="text-xs">No active automation workflows configured yet.</p>
              <button 
                onClick={handleOpenCreator}
                className="text-xs font-semibold text-indigo-400 hover:underline"
              >
                Create your first workflow now
              </button>
            </div>
          ) : (
            workflows.map((wf) => (
              <div key={wf.id} className="bg-darkSurface border border-darkBorder rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col justify-between h-48 select-none">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-xs font-semibold text-white truncate max-w-[170px]">{wf.name}</h4>
                    <button 
                      onClick={() => handleToggleActive(wf)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {wf.is_active ? (
                        <ToggleRight className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-600" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 h-8 text-left">{wf.description || 'No description provided.'}</p>
                </div>

                <div className="pt-3 border-t border-darkBorder flex items-center justify-between">
                  <div className="flex gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-semibold text-indigo-400 uppercase tracking-wider">
                      {(() => {
                        const triggerNode = wf.canvas?.nodes?.find((n: any) => 
                          ['incoming_message', 'keyword_match', 'first_customer_message', 'business_hours', 'conversation_created'].includes(n.type)
                        );
                        return triggerNode ? triggerNode.type.replace('_', ' ') : (wf.triggers[0]?.trigger_type?.replace('_', ' ') || 'No Trigger');
                      })()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                      {(() => {
                        const actCount = wf.canvas?.nodes?.filter((n: any) => 
                          ['send_message', 'delay', 'add_tag', 'remove_tag', 'assign_conversation', 'call_webhook', 'ai_response'].includes(n.type)
                        ).length || wf.actions.length;
                        return `${actCount} Action${actCount !== 1 ? 's' : ''}`;
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenEditor(wf)}
                      title="Edit Canvas"
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDuplicate(wf.id)}
                      title="Duplicate Workflow"
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(wf.id)}
                      className="p-1 rounded hover:bg-slate-800 text-rose-400 hover:text-rose-350 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* EXECUTION HISTORY TAB */}
      {activeTab === 'logs' && (
        <div className="bg-darkSurface border border-darkBorder rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-darkBorder bg-darkBg/20 text-slate-400 text-[10px] font-semibold uppercase tracking-wider select-none">
                <th className="px-6 py-4">Workflow</th>
                <th className="px-6 py-4">Trigger Event</th>
                <th className="px-6 py-4">Step Logs</th>
                <th className="px-6 py-4">Execution Status</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder/40 text-xs text-slate-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No automation executions recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-100 max-w-xs truncate">
                      {workflows.find(w => w.id === log.workflow_id)?.name || 'Deleted Workflow'}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400 uppercase">
                      {Object.keys(log.step_results?.triggers || {})[0]?.replace('_', ' ') || 'Incoming Message'}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="space-y-1 text-[10px] text-slate-400 font-mono text-left">
                        {Object.entries(log.step_results?.actions || {}).map(([key, val]: any) => (
                          <div key={key} className="flex gap-1.5 items-start">
                            <span className="text-indigo-400 shrink-0 font-semibold">{key.split('_')[0]}:</span>
                            <span className="truncate">{val}</span>
                          </div>
                        ))}
                        {Object.keys(log.step_results?.actions || {}).length === 0 && (
                          <span className="text-slate-500">Triggers matched, conditions skipped.</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 uppercase select-none ${
                        log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.status === 'failed' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <span className={`h-1 w-1 rounded-full ${
                          log.status === 'success' ? 'bg-emerald-400' :
                          log.status === 'failed' ? 'bg-rose-400' : 'bg-slate-500'
                        }`} />
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono select-none">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATOR/EDITOR DRAWER MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#05070c]/70 backdrop-blur-sm transition-opacity">
          <div className="bg-darkSurface border-l border-darkBorder w-full max-w-xl h-full shadow-2xl flex flex-col justify-between text-left select-none">
            {/* Header */}
            <div className="p-6 border-b border-darkBorder flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-white">{editingId ? 'Edit Automation Workflow' : 'Create Automation Workflow'}</h3>
                <p className="text-[11px] text-slate-400 mt-1">Configure your triggers, condition limits, and actions sequence.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-850 transition-colors outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Name & Desc */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-2">Workflow Name</label>
                  <input
                    type="text"
                    value={wfName}
                    onChange={(e) => setWfName(e.target.value)}
                    placeholder="e.g., Automatic Greeting & Routing"
                    className="w-full px-3 py-2 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200 focus:outline-none focus:border-brandIndigo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={wfDesc}
                    onChange={(e) => setWfDesc(e.target.value)}
                    placeholder="Add operational notes about this automation..."
                    rows={2}
                    className="w-full px-3 py-2 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200 focus:outline-none focus:border-brandIndigo resize-none"
                  />
                </div>
              </div>

              {/* 1. TRIGGERS BUILDER */}
              <div className="p-4 bg-darkBg/30 border border-darkBorder/60 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-darkBorder pb-2">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <Zap className="h-3.5 w-3.5 text-indigo-400" /> Step 1: Trigger Event
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[9px] font-semibold text-slate-450 uppercase mb-1.5">When event occurs...</label>
                    <select
                      value={triggers[0]?.trigger_type}
                      onChange={(e) => handleTriggerChange('trigger_type', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200 focus:outline-none focus:border-brandIndigo"
                    >
                      <option value="incoming_message">Incoming Message (Any received text)</option>
                      <option value="keyword_match">Keyword Match (Contains specific words)</option>
                      <option value="first_customer_message">First Customer Message (New chat session)</option>
                      <option value="business_hours">Business Hours (Based on timestamp window)</option>
                      <option value="conversation_created">Conversation Created</option>
                    </select>
                  </div>

                  {/* Trigger Configs */}
                  {triggers[0]?.trigger_type === 'keyword_match' && (
                    <div className="space-y-2 border-t border-darkBorder/40 pt-3">
                      <label className="block text-[9px] font-semibold text-slate-400 uppercase">Keywords to match (case-insensitive)</label>
                      <div className="space-y-2">
                        {(triggers[0]?.config?.keywords || []).map((kw: string, idx: number) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={kw}
                              onChange={(e) => handleKeywordChange(idx, e.target.value)}
                              placeholder="e.g., support"
                              className="flex-1 px-3 py-1.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200 focus:outline-none focus:border-brandIndigo"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(idx)}
                              className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="text-[10px] font-semibold text-indigo-400 hover:underline flex items-center gap-1 mt-1"
                      >
                        <Plus className="h-3 w-3" /> Add Keyword
                      </button>
                    </div>
                  )}

                  {triggers[0]?.trigger_type === 'business_hours' && (
                    <div className="grid grid-cols-3 gap-2 border-t border-darkBorder/40 pt-3">
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">Start Hour (24h)</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={triggers[0]?.config?.start_hour ?? 9}
                          onChange={(e) => handleTriggerChange('start_hour', parseInt(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-1">End Hour (24h)</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={triggers[0]?.config?.end_hour ?? 17}
                          onChange={(e) => handleTriggerChange('end_hour', parseInt(e.target.value))}
                          className="w-full px-3 py-1.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={triggers[0]?.config?.match_out_of_hours ?? false}
                            onChange={(e) => handleTriggerChange('match_out_of_hours', e.target.checked)}
                            className="rounded border-darkBorder bg-darkBg text-indigo-600 focus:ring-0"
                          />
                          Trigger if OUT of hours
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. CONDITIONS BUILDER */}
              <div className="p-4 bg-darkBg/30 border border-darkBorder/60 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-darkBorder pb-2">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" /> Step 2: Conditions (All must pass)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="text-[10px] font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Condition
                  </button>
                </div>

                <div className="space-y-4">
                  {conditions.map((cond, idx) => (
                    <div key={idx} className="flex flex-col gap-3 p-3 bg-darkBg/40 border border-darkBorder rounded-lg relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(idx)}
                        className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      <div className="grid grid-cols-2 gap-3 pr-6">
                        <div>
                          <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">Condition Type</label>
                          <select
                            value={cond.condition_type}
                            onChange={(e) => handleConditionChange(idx, 'condition_type', e.target.value)}
                            className="w-full px-2 py-1 text-[11px] bg-darkBg border border-darkBorder rounded text-slate-200"
                          >
                            <option value="message_contains">Message Contains Text</option>
                            <option value="exact_keyword">Message is Exact Keyword</option>
                            <option value="customer_tag">Customer has Tag</option>
                            <option value="time_range">Current Time Range</option>
                            <option value="conversation_status">Conversation Status</option>
                          </select>
                        </div>

                        {/* Condition Config Rendering */}
                        {cond.condition_type === 'message_contains' && (
                          <div>
                            <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">Contains Text</label>
                            <input
                              type="text"
                              value={cond.config.text || ''}
                              onChange={(e) => handleConditionChange(idx, 'text', e.target.value)}
                              placeholder="e.g., invoice"
                              className="w-full px-2 py-1 text-[11px] bg-darkBg border border-darkBorder rounded text-slate-200"
                              required
                            />
                          </div>
                        )}

                        {cond.condition_type === 'exact_keyword' && (
                          <div>
                            <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">Exact Keyword</label>
                            <input
                              type="text"
                              value={cond.config.keyword || ''}
                              onChange={(e) => handleConditionChange(idx, 'keyword', e.target.value)}
                              placeholder="e.g., refund"
                              className="w-full px-2 py-1 text-[11px] bg-darkBg border border-darkBorder rounded text-slate-200"
                              required
                            />
                          </div>
                        )}

                        {cond.condition_type === 'customer_tag' && (
                          <div>
                            <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">Tag Name</label>
                            <input
                              type="text"
                              value={cond.config.tag || ''}
                              onChange={(e) => handleConditionChange(idx, 'tag', e.target.value)}
                              placeholder="e.g., vip-status"
                              className="w-full px-2 py-1 text-[11px] bg-darkBg border border-darkBorder rounded text-slate-200"
                              required
                            />
                          </div>
                        )}

                        {cond.condition_type === 'time_range' && (
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">Start (HH:MM)</label>
                              <input
                                type="text"
                                value={cond.config.start || '09:00'}
                                onChange={(e) => handleConditionChange(idx, 'start', e.target.value)}
                                className="w-full px-2 py-1 text-[11px] bg-darkBg border border-darkBorder rounded text-slate-200"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">End (HH:MM)</label>
                              <input
                                type="text"
                                value={cond.config.end || '17:00'}
                                onChange={(e) => handleConditionChange(idx, 'end', e.target.value)}
                                className="w-full px-2 py-1 text-[11px] bg-darkBg border border-darkBorder rounded text-slate-200"
                              />
                            </div>
                          </div>
                        )}

                        {cond.condition_type === 'conversation_status' && (
                          <div>
                            <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">Status</label>
                            <select
                              value={cond.config.status || 'open'}
                              onChange={(e) => handleConditionChange(idx, 'status', e.target.value)}
                              className="w-full px-2 py-1 text-[11px] bg-darkBg border border-darkBorder rounded text-slate-200"
                            >
                              <option value="open">Open</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {conditions.length === 0 && (
                    <p className="text-[10px] text-slate-500 italic py-2 text-center">No conditions configured. Actions run immediately upon trigger.</p>
                  )}
                </div>
              </div>

              {/* 3. ACTIONS SEQUENCE BUILDER */}
              <div className="p-4 bg-darkBg/30 border border-darkBorder/60 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-darkBorder pb-2">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <ChevronRight className="h-3.5 w-3.5 text-indigo-400" /> Step 3: Actions Sequence
                  </span>
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className="text-[10px] font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Action
                  </button>
                </div>

                <div className="space-y-4">
                  {actions.map((act, idx) => (
                    <div key={idx} className="flex flex-col gap-3 p-4 bg-darkBg/40 border border-darkBorder rounded-lg relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400">Action #{idx + 1}</span>
                        {actions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAction(idx)}
                            className="text-rose-400 hover:text-rose-350"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">Action Type</label>
                          <select
                            value={act.action_type}
                            onChange={(e) => handleActionChange(idx, 'action_type', e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200"
                          >
                            <option value="send_message">Send WhatsApp Message</option>
                            <option value="delay">Delay (Pause processing)</option>
                            <option value="add_tag">Add Customer Tag</option>
                            <option value="remove_tag">Remove Customer Tag</option>
                            <option value="assign_conversation">Assign Conversation</option>
                            <option value="call_webhook">Call External Webhook</option>
                            <option value="ai_response">Simulate AI Smart Reply</option>
                          </select>
                        </div>

                        {/* Action Config Fields */}
                        {act.action_type === 'send_message' && (
                          <div>
                            <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">Message Text (Placeholders: {"{{customer_name}}"}, {"{{customer_phone}}"})</label>
                            <textarea
                              value={act.config.text || ''}
                              onChange={(e) => handleActionChange(idx, 'text', e.target.value)}
                              placeholder="Write reply text..."
                              rows={2}
                              className="w-full px-3 py-2 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-205 focus:outline-none"
                              required
                            />
                          </div>
                        )}

                        {act.action_type === 'delay' && (
                          <div>
                            <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">Delay Duration (seconds)</label>
                            <input
                              type="number"
                              min={5}
                              value={act.config.duration_seconds ?? 10}
                              onChange={(e) => handleActionChange(idx, 'duration_seconds', parseInt(e.target.value))}
                              className="w-full px-3 py-2 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-205"
                              required
                            />
                          </div>
                        )}

                        {(act.action_type === 'add_tag' || act.action_type === 'remove_tag') && (
                          <div>
                            <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">Tag Name</label>
                            <input
                              type="text"
                              value={act.config.tag || ''}
                              onChange={(e) => handleActionChange(idx, 'tag', e.target.value)}
                              placeholder="e.g., support-required"
                              className="w-full px-3 py-2 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-205"
                              required
                            />
                          </div>
                        )}

                        {act.action_type === 'assign_conversation' && (
                          <div>
                            <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">Agent / User UUID</label>
                            <input
                              type="text"
                              value={act.config.user_id || ''}
                              onChange={(e) => handleActionChange(idx, 'user_id', e.target.value)}
                              placeholder="e.g. standard user ID uuid"
                              className="w-full px-3 py-2 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-205 font-mono"
                              required
                            />
                          </div>
                        )}

                        {act.action_type === 'call_webhook' && (
                          <div>
                            <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">POST Webhook URL</label>
                            <input
                              type="url"
                              value={act.config.url || ''}
                              onChange={(e) => handleActionChange(idx, 'url', e.target.value)}
                              placeholder="https://api.domain.com/incoming-whatsapp"
                              className="w-full px-3 py-2 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-205"
                              required
                            />
                          </div>
                        )}

                        {act.action_type === 'ai_response' && (
                          <div>
                            <label className="block text-[8px] font-semibold text-slate-450 uppercase mb-1">AI Context / Prompt instructions</label>
                            <input
                              type="text"
                              value={act.config.prompt || ''}
                              onChange={(e) => handleActionChange(idx, 'prompt', e.target.value)}
                              placeholder="Instructions for generating simulated reply"
                              className="w-full px-3 py-2 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-205"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-darkBorder flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/40 rounded-lg outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !wfName.trim()}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-505 disabled:opacity-50 rounded-lg shadow-md transition-all outline-none flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                  </>
                ) : (
                  'Save Automation Workflow'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
