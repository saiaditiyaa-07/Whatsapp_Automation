'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/Sidebar';
import { MetricsGrid } from '../../components/MetricsGrid';
import { RuleTable, Rule } from '../../components/RuleTable';
import { AddRuleModal } from '../../components/AddRuleModal';
import {
  Plus,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
// Module 4 – WebSocket Inbox
import { useConversationSocket } from '../../hooks/useConversationSocket';
import { useChatSocket } from '../../hooks/useChatSocket';
import { ConversationList } from '../../components/inbox/ConversationList';
import { ChatHeader } from '../../components/inbox/ChatHeader';
import { MessageList } from '../../components/inbox/MessageList';
import { MessageComposer } from '../../components/inbox/MessageComposer';
import { WorkflowBuilder } from '../../components/workflow/WorkflowBuilder';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function DashboardPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('overview');
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);
  const [rules, setRules] = useState<Rule[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteError, setInviteError] = useState('');

  // Workspaces State
  const [workspacesList, setWorkspacesList] = useState<any[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('VIEWER');

  // Secure API Connection Settings State
  const [phoneId, setPhoneId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('acme_production_secure_handshake_token');
  const [appSecret, setAppSecret] = useState('');
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const [error, setError] = useState('');

  // Inbox States
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatText, setActiveChatText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // WebSocket-powered conversation list (no polling)
  const {
    conversations,
    connectionStatus: convSocketStatus,
    isLoading: isLoadingConversations,
    error: convError,
  } = useConversationSocket(
    activeWorkspace?.id ?? null,
    searchQuery
  );

  // WebSocket-powered chat messages (no polling)
  const {
    messages,
    connectionStatus: chatSocketStatus,
    isLoading: isLoadingMessages,
    appendOptimistic,
    confirmOptimistic,
  } = useChatSocket(
    selectedConversationId,
    activeWorkspace?.id ?? null
  );

  // Dynamic contacts mapping from WebSocket conversation updates
  const contacts = (conversations || []).map((c: any) => ({
    id: c.id,
    phone: c.customer_phone,
    name: c.customer_name || 'Anonymous Contact',
    lastActive: c.last_message_time || c.created_at
  }));

  // Authenticated state check
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const loadWorkspaces = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/workspaces/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const list = await res.json();
          setWorkspacesList(list);
          if (list.length > 0) {
            setActiveWorkspace(list[0]);
          }
          setIsVerifyingAuth(false);
        } else if (res.status === 401) {
          localStorage.removeItem('auth_token');
          router.push('/auth/login');
        } else {
          setIsVerifyingAuth(false);
        }
      } catch (err) {
        console.error("Failed to load workspaces:", err);
        setIsVerifyingAuth(false);
      }
    };
    loadWorkspaces();
  }, [router]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, []);

  const fetchWorkflows = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/workflows/?workspace_id=${activeWorkspace.id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const list = await res.json();
        const mapped = list.map((w: any) => {
          const triggerNode = w.canvas?.nodes?.find((n: any) => n.type === 'keyword_match' || n.type === 'trigger');
          const actionNode = w.canvas?.nodes?.find((n: any) => n.type === 'send_message' || n.type === 'action');
          const kw = triggerNode?.data?.config?.keywords?.[0] || triggerNode?.data?.config?.keyword || 'keyword';
          const reply = actionNode?.data?.config?.text || 'Automated reply';
          return {
            id: w.id,
            triggerKeyword: kw,
            replyText: reply,
            templateId: null,
            isActive: w.is_active,
            createdAt: w.created_at
          };
        });
        setRules(mapped);
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeWorkspace, getAuthHeaders]);

  const fetchLogs = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/messages?workspace_id=${activeWorkspace.id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeWorkspace, getAuthHeaders]);

  // Load User Role and components whenever active Workspace changes
  useEffect(() => {
    if (!activeWorkspace) return;
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const fetchWorkspaceMembers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/workspaces/${activeWorkspace.id}/members`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const membersList = await res.json();
          // Map to local mock structure
          setMembers(membersList.map((m: any) => ({
            id: m.id,
            name: m.user.full_name || 'Anonymous User',
            email: m.user.email,
            role: m.role,
            joinedAt: new Date().toISOString()
          })));

          // Extract current user ID from JWT payload sub parameter
          const payloadBase64 = token.split('.')[1];
          const decodedPayload = JSON.parse(atob(payloadBase64));
          const userId = decodedPayload.sub;
          const currentMember = membersList.find((m: any) => m.user_id === userId);
          if (currentMember) {
            setUserRole(currentMember.role);
          }
        }
      } catch (err) {
        console.error("Error loading members:", err);
      }
    };

    fetchWorkspaceMembers();
    fetchWhatsappStatus();
    fetchWorkflows();
    fetchLogs();
    // Inbox conversations are fetched automatically by useConversationSocket
    // when activeWorkspace changes — no manual call needed here.
  }, [activeWorkspace, currentTab, fetchWorkflows, fetchLogs]);

  // Auto-scroll is handled inside MessageList component (smart scroll)

  const handleToggleRuleActive = async (id: string) => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/workflows/${id}/toggle?workspace_id=${activeWorkspace.id}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/workflows/${id}?workspace_id=${activeWorkspace.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRule = async (data: { triggerKeyword: string; replyText: string | null; templateId: string | null }) => {
    if (!activeWorkspace) return;
    const canvas = {
      nodes: [
        {
          id: 'node_trigger',
          type: 'keyword_match',
          data: { config: { keywords: [data.triggerKeyword], case_sensitive: false } },
          position: { x: 100, y: 100 }
        },
        {
          id: 'node_action',
          type: 'send_message',
          data: { config: { text: data.replyText || 'Auto reply' } },
          position: { x: 300, y: 100 }
        }
      ],
      edges: [
        { id: 'edge_1', source: 'node_trigger', target: 'node_action' }
      ]
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/workflows/?workspace_id=${activeWorkspace.id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: `Rule: ${data.triggerKeyword}`,
          canvas: canvas
        })
      });
      if (res.ok) {
        fetchWorkflows();
      }
    } catch (err) {
      console.error(err);
    }
  };



  const fetchWhatsappStatus = async () => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/status?workspace_id=${activeWorkspace.id}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setBusinessId(data.business_account || '');
        setPhoneNumber(data.phone_number || '');
        setWhatsappStatus(data.connected ? 'CONNECTED' : 'DISCONNECTED');
      } else {
        setWhatsappStatus('DISCONNECTED');
      }
    } catch (err) {
      console.error(err);
      setWhatsappStatus('DISCONNECTED');
    }
  };

  const handleConnectWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setSaveSuccess(false);
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/connect?workspace_id=${activeWorkspace.id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          business_account_id: businessId,
          phone_number_id: phoneId,
          phone_number: phoneNumber,
          access_token: accessToken,
          verify_token: verifyToken,
          app_secret: appSecret
        })
      });
      
      if (res.ok) {
        setSaveSuccess(true);
        setWhatsappStatus('CONNECTED');
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.detail || 'Failed to connect WhatsApp account.');
      }
    } catch (err: any) {
      setError('Network connection failed. Make sure FastAPI server is running.');
    }
  };

  const handleDisconnectWhatsapp = async () => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`${API_BASE}/api/whatsapp/disconnect?workspace_id=${activeWorkspace.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setWhatsappStatus('DISCONNECTED');
        setPhoneId('');
        setBusinessId('');
        setPhoneNumber('');
        setAccessToken('');
        setVerifyToken('acme_production_secure_handshake_token');
        setAppSecret('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // handleSendMessage uses optimistic UI then confirms via WebSocket event
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatText.trim() || !selectedConversationId || !activeWorkspace) return;

    const textToSend = activeChatText.trim();
    setActiveChatText('');

    // 1. Append optimistic message immediately for responsive UI
    const tempId = appendOptimistic(textToSend);

    setIsSendingMessage(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/whatsapp/conversations/${selectedConversationId}/send?workspace_id=${activeWorkspace.id}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ text: textToSend }),
        }
      );
      if (res.ok) {
        const serverMsg = await res.json();
        // 2. Replace optimistic with confirmed server message
        confirmOptimistic(tempId, serverMsg);
        // Note: conversation list update arrives via WebSocket broadcast
      } else {
        const data = await res.json();
        // Remove optimistic on failure
        confirmOptimistic(tempId, { id: tempId, conversation_id: selectedConversationId, meta_message_id: null, direction: 'OUTBOUND', message_type: 'text', text: `[Failed] ${textToSend}`, status: 'failed', timestamp: new Date().toISOString() });
        alert(data.detail || 'Failed to dispatch outbound message to Meta Graph API.');
      }
    } catch (err) {
      console.error(err);
      confirmOptimistic(tempId, { id: tempId, conversation_id: selectedConversationId, meta_message_id: null, direction: 'OUTBOUND', message_type: 'text', text: `[Failed] ${textToSend}`, status: 'failed', timestamp: new Date().toISOString() });
    } finally {
      setIsSendingMessage(false);
    }
  }, [activeChatText, selectedConversationId, activeWorkspace, appendOptimistic, confirmOptimistic]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    setInviteError('');
    try {
      const res = await fetch(`${API_BASE}/api/v1/workspaces/${activeWorkspace.id}/invites`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole
        })
      });
      if (res.ok) {
        setIsInviteModalOpen(false);
        setInviteEmail('');
        // Reload members list
        const loadRes = await fetch(`${API_BASE}/api/v1/workspaces/${activeWorkspace.id}/members`, {
          headers: getAuthHeaders()
        });
        if (loadRes.ok) {
          const list = await loadRes.json();
          setMembers(list.map((m: any) => ({
            id: m.id,
            name: m.user.full_name || 'Anonymous User',
            email: m.user.email,
            role: m.role,
            joinedAt: new Date().toISOString()
          })));
        }
      } else {
        const data = await res.json();
        setInviteError(data.detail || 'Failed to invite workspace member.');
      }
    } catch (err) {
      setInviteError('Network connection failed.');
    }
  };

  useEffect(() => {
    if (currentTab === 'whatsapp') {
      fetchWhatsappStatus();
    }
    // Inbox: No polling needed – WebSocket hooks handle real-time updates automatically
  }, [currentTab]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/auth/login');
  };

  const renderStatus = (status: string) => {
    if (status === 'sent') {
      return <span className="text-[10px] text-slate-400 select-none ml-1">✓</span>;
    } else if (status === 'delivered') {
      return <span className="text-[10px] text-slate-400 select-none ml-1">✓✓</span>;
    } else if (status === 'read') {
      return <span className="text-[10px] text-sky-400 font-bold select-none ml-1">✓✓</span>;
    }
    return null;
  };

  const stats = {
    total: logs.length,
    inbound: logs.filter(l => l.direction === 'INBOUND').length,
    outbound: logs.filter(l => l.direction === 'OUTBOUND').length,
    rulesCount: rules.length,
    successRate: 100
  };

  const isReadOnly = userRole !== 'OWNER' && userRole !== 'ADMIN';

  if (isVerifyingAuth) {
    return (
      <div className="min-h-screen bg-darkBg text-slate-100 flex items-center justify-center">
        <div className="h-8 w-8 rounded-lg bg-indigo-650 animate-pulse" />
      </div>
    );
  }

  if (workspacesList.length === 0 && !activeWorkspace) {
    return (
      <div className="min-h-screen bg-darkBg text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-darkSurface border border-darkBorder rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="h-16 w-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
            <Plus className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Create Your First Workspace</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              OmniChannel requires a workspace to manage team members, WhatsApp Business accounts, visual automation builders, and real-time conversation threads.
            </p>
          </div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const nameInput = form.elements.namedItem('workspaceName') as HTMLInputElement;
            const name = nameInput?.value?.trim();
            if (!name) return;
            const token = localStorage.getItem('auth_token');
            if (!token) return;
            try {
              const res = await fetch(`${API_BASE}/api/v1/workspaces/`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name })
              });
              if (res.ok) {
                const newWS = await res.json();
                setWorkspacesList([newWS]);
                setActiveWorkspace(newWS);
              }
            } catch (err) {
              console.error(err);
            }
          }} className="space-y-4">
            <div>
              <input
                type="text"
                name="workspaceName"
                placeholder="e.g. ABC Electronics"
                className="w-full px-4 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all outline-none"
            >
              Create Workspace
            </button>
          </form>
          <div className="pt-4 border-t border-darkBorder flex justify-center">
            <button
              onClick={handleLogout}
              className="text-xs text-brandRed hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-darkBg text-slate-100">
      {/* Sidebar switcher container */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        workspaces={workspacesList}
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
        userRole={userRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Navigation / Status Header */}
        <header className="px-8 py-5 bg-darkSurface border-b border-darkBorder flex items-center justify-between select-none">
          <div className="flex items-center gap-4 text-left">
            <h2 className="text-sm font-semibold tracking-wide text-white capitalize">
              {currentTab.replace('-', ' ')}
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Meta Cloud Webhook Active
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">Connection: <b className="text-slate-200">v19.0</b></span>
            <button 
              onClick={handleLogout}
              className="text-xs font-semibold text-brandRed hover:bg-brandRed/10 px-3 py-1.5 rounded-lg border border-brandRed/20 transition-all outline-none"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic tabs controller */}
        <div className="p-8 space-y-8">
          {/* TAB 1: OVERVIEW */}
          {currentTab === 'overview' && (
            <>
              {/* Metrics Grid */}
              <MetricsGrid stats={stats} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rules Table */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-white">Recent Automation Rules</h3>
                      <p className="text-xs text-slate-400 mt-1">Quick view of keyword response templates.</p>
                    </div>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow transition-all outline-none"
                    >
                      <Plus className="h-4 w-4" /> Add Rule
                    </button>
                  </div>
                  <RuleTable 
                    rules={rules.slice(0, 3)} 
                    onToggleActive={handleToggleRuleActive} 
                    onDelete={handleDeleteRule} 
                  />
                </div>

                {/* execution logs summary */}
                <div className="bg-darkSurface border border-darkBorder rounded-xl p-6 flex flex-col justify-between">
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-white">Rule Execution Logs</h3>
                    <p className="text-xs text-slate-400 mt-1">Real-time keyword triggers</p>
                    <div className="space-y-4 mt-6">
                      {logs.slice(0, 4).map((log) => (
                        <div key={log.id} className="flex items-start justify-between gap-4 p-3 bg-darkBg/40 border border-darkBorder/40 rounded-lg hover:border-slate-700 transition-colors">
                          <div className="overflow-hidden text-left">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                              log.direction === 'INBOUND' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {log.direction}
                            </span>
                            <p className="text-xs text-slate-300 font-medium truncate mt-2">{log.messageText}</p>
                            <span className="text-[10px] text-slate-500 block mt-1">To/From: {log.senderPhone}</span>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${
                              log.status === 'READ' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {log.status}
                            </span>
                            <span className="text-[9px] text-slate-500 mt-2 font-mono">
                              {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => setCurrentTab('logs')}
                    className="text-xs font-semibold text-brandIndigo hover:text-indigo-400 mt-6 flex items-center gap-1.5 hover:underline outline-none text-left"
                  >
                    View entire message history <Plus className="h-3.5 w-3.5 rotate-45" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 1.5: ANALYTICS */}
          {currentTab === 'analytics' && activeWorkspace && (
            <AnalyticsDashboard activeWorkspace={activeWorkspace} />
          )}

          {/* TAB 2: RULES */}
          {currentTab === 'rules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-white">Keyword Automation Rules</h3>
                  <p className="text-xs text-slate-400 mt-1">Build modular triggers matching received message strings to automatic replies.</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md transition-all outline-none"
                >
                  <Plus className="h-4 w-4" /> Add Automation Rule
                </button>
              </div>
              <RuleTable 
                rules={rules} 
                onToggleActive={handleToggleRuleActive} 
                onDelete={handleDeleteRule} 
              />
            </div>
          )}

          {/* TAB 3: CONTACTS */}
          {currentTab === 'contacts' && (
            <div className="space-y-6">
              <div className="text-left">
                <h3 className="text-sm font-semibold text-white">Contact Directory</h3>
                <p className="text-xs text-slate-400 mt-1">Multi-tenant client profiles updated via webhook signals.</p>
              </div>

              <div className="bg-darkSurface border border-darkBorder rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-darkBorder bg-darkBg/20 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Contact Details</th>
                      <th className="px-6 py-4">Phone Number</th>
                      <th className="px-6 py-4">Workspace Scope</th>
                      <th className="px-6 py-4">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-darkBorder/40 text-xs text-slate-200">
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-100 flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-[10px]">
                            {contact.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          {contact.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-400">+{contact.phone}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                            {activeWorkspace ? activeWorkspace.name : 'Unknown Workspace'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono">
                          {new Date(contact.lastActive).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: WHATSAPP SETUP */}
          {currentTab === 'whatsapp' && (
            <div className="max-w-2xl space-y-6 text-left">
              <div>
                <h3 className="text-sm font-semibold text-white">Meta WhatsApp Integration Setup</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connect your credentials to activate webhooks and live dashboard monitoring.
                </p>
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                whatsappStatus === 'CONNECTED' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    whatsappStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`} />
                  <span className="text-xs font-semibold">
                    Integration Status: {whatsappStatus}
                  </span>
                </div>
                {whatsappStatus === 'CONNECTED' && (
                  <button
                    onClick={handleDisconnectWhatsapp}
                    disabled={isReadOnly}
                    className="text-xs font-semibold text-brandRed hover:bg-brandRed/10 disabled:opacity-40 border border-brandRed/20 px-3 py-1.5 rounded-lg transition-colors outline-none"
                  >
                    Disconnect
                  </button>
                )}
              </div>

              {isReadOnly && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-400 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Your role ({userRole}) only has read-only access. Owners and Admins may connect credentials.
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-brandRed/10 border border-brandRed/20 text-xs font-medium text-brandRed flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="bg-darkSurface border border-darkBorder rounded-xl p-6">
                <form onSubmit={handleConnectWhatsapp} className="space-y-6">
                  {/* Phone ID */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      WhatsApp Phone Number ID
                    </label>
                    <input
                      type="text"
                      value={phoneId}
                      onChange={(e) => setPhoneId(e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-205 focus:outline-none focus:border-brandIndigo disabled:opacity-50"
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-350 uppercase tracking-wider mb-2">
                      WhatsApp Phone Number
                    </label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 15550199999"
                      disabled={isReadOnly}
                      className="w-full px-3 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-205 focus:outline-none focus:border-brandIndigo disabled:opacity-50"
                      required
                    />
                  </div>

                  {/* Account ID */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      WhatsApp Business Account ID (WABA ID)
                    </label>
                    <input
                      type="text"
                      value={businessId}
                      onChange={(e) => setBusinessId(e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-205 focus:outline-none focus:border-brandIndigo disabled:opacity-50"
                      required
                    />
                  </div>

                  {/* Access Token */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      System User Access Token
                    </label>
                    <div className="relative">
                      <input
                        type={showAccessToken ? 'text' : 'password'}
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        disabled={isReadOnly}
                        className="w-full pl-3 pr-10 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-205 font-mono focus:outline-none focus:border-brandIndigo disabled:opacity-50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowAccessToken(!showAccessToken)}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200 outline-none"
                      >
                        {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Verification Token */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Webhook Verification Handshake Token (`hub.verify_token`)
                    </label>
                    <input
                      type="text"
                      value={verifyToken}
                      onChange={(e) => setVerifyToken(e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-3 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-205 font-mono focus:outline-none focus:border-brandIndigo disabled:opacity-50"
                      required
                    />
                  </div>

                  {/* App Secret */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Meta App Secret (HMAC SHA-256 validation)
                    </label>
                    <input
                      type="password"
                      value={appSecret}
                      onChange={(e) => setAppSecret(e.target.value)}
                      placeholder="Enter App Secret"
                      disabled={isReadOnly}
                      className="w-full px-3 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-205 font-mono focus:outline-none focus:border-brandIndigo disabled:opacity-50"
                      required
                    />
                  </div>

                  {/* Save button */}
                  <div className="flex items-center gap-4 pt-4 border-t border-darkBorder">
                    <button
                      type="submit"
                      disabled={isReadOnly}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-505 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg shadow-md transition-all outline-none"
                    >
                      Connect WhatsApp Business Account
                    </button>
                    {saveSuccess && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" /> Connection established and verified successfully!
                      </span>
                    )}
                  </div>
                </form>
              </div>

              {/* Webhook credentials helper */}
              <div className="mt-4 p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl text-left">
                <h4 className="text-xs font-semibold text-slate-200">Webhook Integration Credentials</h4>
                <p className="text-[11px] text-slate-400 mt-1">Configure these parameters inside your Facebook Developer console:</p>
                <div className="mt-3 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between bg-darkBg px-3 py-1.5 rounded border border-darkBorder">
                    <span className="text-slate-400">Callback URL:</span>
                    <span className="text-slate-200">{API_BASE}/webhook/meta</span>
                  </div>
                  <div className="flex items-center justify-between bg-darkBg px-3 py-1.5 rounded border border-darkBorder">
                    <span className="text-slate-400">Verify Token:</span>
                    <span className="text-slate-200">{verifyToken || 'acme_production_secure_handshake_token'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: INBOX – Module 4 Real-Time WebSocket Inbox */}
          {currentTab === 'inbox' && (
            <div className="h-[calc(100vh-140px)] flex border border-white/5 bg-darkSurface rounded-2xl overflow-hidden shadow-2xl">
              {/* Left Panel – Conversation List (WebSocket powered) */}
              <ConversationList
                conversations={conversations}
                selectedId={selectedConversationId}
                onSelect={setSelectedConversationId}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                isLoading={isLoadingConversations}
                error={convError}
                connectionStatus={convSocketStatus}
              />

              {/* Right Panel – Chat Window */}
              <div className="flex-1 flex flex-col bg-darkBg/30 min-w-0">
                {selectedConversationId ? (
                  <>
                    <ChatHeader
                      conversation={conversations.find(c => c.id === selectedConversationId)}
                      connectionStatus={chatSocketStatus}
                    />
                    <MessageList
                      messages={messages}
                      isLoading={isLoadingMessages}
                    />
                    <MessageComposer
                      value={activeChatText}
                      onChange={setActiveChatText}
                      onSend={handleSendMessage}
                      isSending={isSendingMessage}
                      disabled={isReadOnly}
                    />
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600 select-none p-8 gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center">
                      <MessageSquare className="h-7 w-7 text-slate-700" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-500">No conversation selected</p>
                      <p className="text-xs text-slate-600 mt-1">Pick a conversation from the left to start chatting.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: WORKFLOW AUTOMATIONS – Module 5 Automation Engine */}
          {currentTab === 'workflows' && activeWorkspace && (
            <WorkflowBuilder activeWorkspace={activeWorkspace} />
          )}

          {/* TAB 5: LOGS */}
          {currentTab === 'logs' && (
            <div className="space-y-6">
              <div className="text-left">
                <h3 className="text-sm font-semibold text-white">System Message Activity Logs</h3>
                <p className="text-xs text-slate-400 mt-1">Real-time records tracking delivery state metrics and triggers.</p>
              </div>

              <div className="bg-darkSurface border border-darkBorder rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-darkBorder bg-darkBg/20 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Direction</th>
                      <th className="px-6 py-4">Sender Phone</th>
                      <th className="px-6 py-4">Recipient Phone</th>
                      <th className="px-6 py-4">Message Body</th>
                      <th className="px-6 py-4">Webhook Status</th>
                      <th className="px-6 py-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-darkBorder/40 text-xs text-slate-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
                            log.direction === 'INBOUND' ? 'bg-indigo-500/10 text-brandIndigo' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {log.direction}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-400">{log.senderPhone}</td>
                        <td className="px-6 py-4 font-mono text-slate-400">{log.recipientPhone}</td>
                        <td className="px-6 py-4 font-medium max-w-sm truncate text-slate-300">{log.messageText}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            log.status === 'READ' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-emerald-500/15 text-brandGreen'
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${
                              log.status === 'READ' ? 'bg-indigo-400' : 'bg-brandGreen'
                            }`} />
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-505 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: WORKSPACE SETTINGS */}
          {currentTab === 'workspace' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-white">Workspace Members & Settings</h3>
                  <p className="text-xs text-slate-400 mt-1">Manage team members, roles, permissions, and workspace attributes.</p>
                </div>
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  disabled={isReadOnly}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-550 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md transition-all outline-none"
                >
                  <Plus className="h-4 w-4" /> Invite Member
                </button>
              </div>

              {/* Members Table */}
              <div className="bg-darkSurface border border-darkBorder rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-darkBorder bg-darkBg/20 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">User Details</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Workspace Role</th>
                      <th className="px-6 py-4">Joined At</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-darkBorder/40 text-xs text-slate-200">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-100 flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-[10px]">
                            {member.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          {member.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-400">{member.email}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${
                            member.role === 'OWNER' ? 'bg-indigo-500/10 text-brandIndigo' :
                            member.role === 'ADMIN' ? 'bg-emerald-500/10 text-brandGreen' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-505 font-mono">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {member.role !== 'OWNER' && (
                            <button
                              onClick={async () => {
                                // Real delete member REST call
                                const token = localStorage.getItem('auth_token');
                                if (!token || !activeWorkspace) return;
                                try {
                                  // Wait, let's look up member user ID
                                  const res = await fetch(`${API_BASE}/api/v1/workspaces/${activeWorkspace.id}/members/${member.id}`, {
                                    method: 'DELETE',
                                    headers: getAuthHeaders()
                                  });
                                  if (res.ok) {
                                    setMembers(prev => prev.filter(m => m.id !== member.id));
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              disabled={isReadOnly}
                              className="text-xs font-semibold text-brandRed hover:underline disabled:opacity-40 bg-transparent border-none cursor-pointer outline-none"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Rule Modal */}
      <AddRuleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddRule}
      />

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070c]/70 backdrop-blur-sm transition-opacity">
          <div className="bg-darkSurface border border-darkBorder rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden text-left">
            <div className="p-6 border-b border-darkBorder flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Invite Workspace Member</h3>
                <p className="text-[11px] text-slate-400 mt-1">Send an invitation to join this workspace scope.</p>
              </div>
              <button 
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteEmail('');
                  setInviteError('');
                }}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors outline-none"
              >
                <Plus className="h-4 w-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="p-6 space-y-4">
              {inviteError && (
                <div className="p-2 rounded bg-brandRed/10 border border-brandRed/20 text-[10px] text-brandRed font-medium">
                  {inviteError}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-semibold text-slate-350 uppercase tracking-wider mb-2">
                  Teammate Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@acme.com"
                  className="w-full px-3 py-2 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-200 focus:outline-none focus:border-brandIndigo"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-350 uppercase tracking-wider mb-2">
                  Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-darkBg border border-darkBorder rounded-lg text-slate-205 focus:outline-none focus:border-brandIndigo"
                >
                  <option value="MEMBER">MEMBER (Read/Write triggers)</option>
                  <option value="ADMIN">ADMIN (Invite members & setup credentials)</option>
                  <option value="VIEWER">VIEWER (Read-only access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-darkBorder">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/40 rounded-lg outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg outline-none"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
