'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { TopNav } from '../../components/layout/TopNav';
import { OverviewTab } from '../../components/dashboard/OverviewTab';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import { ConversationList } from '../../components/inbox/ConversationList';
import { ChatHeader } from '../../components/inbox/ChatHeader';
import { MessageList } from '../../components/inbox/MessageList';
import { MessageComposer } from '../../components/inbox/MessageComposer';
import { CustomerDetailsPanel } from '../../components/inbox/CustomerDetailsPanel';
import { WorkflowBuilder } from '../../components/workflow/WorkflowBuilder';
import { ConnectionWizard } from '../../components/whatsapp/ConnectionWizard';
import { ContactsDirectory } from '../../components/crm/ContactsDirectory';
import { BroadcastTab } from '../../components/campaigns/BroadcastTab';
import { TemplatesTab } from '../../components/campaigns/TemplatesTab';
import { CampaignsTab } from '../../components/campaigns/CampaignsTab';
import { RulesTab } from '../../components/rules/RulesTab';
import { TeamTab } from '../../components/team/TeamTab';
import { BillingTab } from '../../components/billing/BillingTab';
import { SettingsTab } from '../../components/settings/SettingsTab';
import { LogsTab } from '../../components/logs/LogsTab';
import { RuleTable, Rule } from '../../components/RuleTable';
import { AddRuleModal } from '../../components/AddRuleModal';
import { useConversationSocket } from '../../hooks/useConversationSocket';
import { useChatSocket } from '../../hooks/useChatSocket';
import {
  Plus,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldAlert,
  MessageSquare,
  Loader2
} from 'lucide-react';

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
          setMembers(membersList.map((m: any) => ({
            id: m.id,
            name: m.user.full_name || 'Anonymous User',
            email: m.user.email,
            role: m.role,
            joinedAt: new Date().toISOString()
          })));

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
  }, [activeWorkspace, currentTab, fetchWorkflows, fetchLogs]);

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

  const handleConnectWhatsapp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatText.trim() || !selectedConversationId || !activeWorkspace) return;

    const textToSend = activeChatText.trim();
    setActiveChatText('');

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
        confirmOptimistic(tempId, serverMsg);
      } else {
        const data = await res.json();
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

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/auth/login');
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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-brandIndigo animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Loading LeadWave Enterprise Workspace...</span>
        </div>
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
              LeadWave Pro requires a workspace to manage team members, WhatsApp Business accounts, visual automation builders, and real-time conversation threads.
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
                placeholder="e.g. ABC Electronics Enterprise"
                className="w-full px-4 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all outline-none"
            >
              Create Workspace Scope →
            </button>
          </form>
          <div className="pt-4 border-t border-darkBorder flex justify-center">
            <button
              onClick={handleLogout}
              className="text-xs text-brandRed hover:underline font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-darkBg text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Enterprise AppSidebar */}
      <AppSidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        workspaces={workspacesList}
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
        userRole={userRole}
      />

      {/* Main Content & TopNav */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopNav
          activeWorkspace={activeWorkspace}
          currentTab={currentTab}
          userRole={userRole}
          whatsappStatus={whatsappStatus}
          convSocketStatus={convSocketStatus}
          chatSocketStatus={chatSocketStatus}
          onOpenSearch={() => {
            const el = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            if (el) el.focus();
          }}
          onSelectTab={setCurrentTab}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {/* TAB: OVERVIEW */}
          {currentTab === 'overview' && (
            <OverviewTab
              activeWorkspace={activeWorkspace}
              stats={stats}
              whatsappStatus={whatsappStatus}
              onSelectTab={setCurrentTab}
            />
          )}

          {/* TAB: INBOX (3-Column Enterprise CRM) */}
          {currentTab === 'inbox' && (
            <div className="h-[calc(100vh-140px)] flex border border-darkBorder bg-darkSurface rounded-2xl overflow-hidden shadow-2xl">
              {/* Left Panel – Conversation List */}
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

              {/* Center Panel – Chat Window */}
              <div className="flex-1 flex flex-col bg-darkBg/30 min-w-0 border-r border-darkBorder">
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
                    <div className="h-16 w-16 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center shadow-inner">
                      <MessageSquare className="h-7 w-7 text-slate-700" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-400">No conversation selected</p>
                      <p className="text-xs text-slate-500 mt-1">Pick a conversation from the left queue to start real-time messaging.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel – Customer CRM Details Panel */}
              {selectedConversationId && (
                <div className="w-80 hidden xl:block bg-darkCard/90 shrink-0 overflow-y-auto border-l border-darkBorder">
                  <CustomerDetailsPanel
                    conversation={conversations.find(c => c.id === selectedConversationId)}
                    onClose={() => setSelectedConversationId(null)}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB: CONTACTS CRM */}
          {currentTab === 'contacts' && (
            <ContactsDirectory
              contacts={contacts}
              onSelectContact={(phone, id) => {
                setSelectedConversationId(id);
                setCurrentTab('inbox');
              }}
              isReadOnly={isReadOnly}
            />
          )}

          {/* TAB: BROADCAST SENDER */}
          {currentTab === 'broadcast' && (
            <BroadcastTab activeWorkspace={activeWorkspace} isReadOnly={isReadOnly} />
          )}

          {/* TAB: VISUAL WORKFLOWS */}
          {currentTab === 'workflows' && activeWorkspace && (
            <WorkflowBuilder activeWorkspace={activeWorkspace} />
          )}

          {/* TAB: AUTOMATION RULES */}
          {currentTab === 'rules' && (
            <RulesTab
              rules={rules}
              onAddRule={handleAddRule}
              onToggleActive={handleToggleRuleActive}
              onDeleteRule={handleDeleteRule}
              isReadOnly={isReadOnly}
            />
          )}

          {/* TAB: TEMPLATES DIRECTORY */}
          {currentTab === 'templates' && (
            <TemplatesTab isReadOnly={isReadOnly} />
          )}

          {/* TAB: MARKETING CAMPAIGNS */}
          {currentTab === 'campaigns' && (
            <CampaignsTab onOpenBroadcast={() => setCurrentTab('broadcast')} />
          )}

          {/* TAB: ANALYTICS INSIGHTS */}
          {currentTab === 'analytics' && activeWorkspace && (
            <AnalyticsDashboard activeWorkspace={activeWorkspace} />
          )}

          {/* TAB: ACTIVITY LOGS */}
          {currentTab === 'logs' && (
            <LogsTab logs={logs} />
          )}

          {/* TAB: TEAM & ROLES */}
          {currentTab === 'team' && (
            <TeamTab
              members={members}
              onInviteMember={async (email, role) => {
                setInviteEmail(email);
                setInviteRole(role);
                setIsInviteModalOpen(true);
              }}
              onRemoveMember={async (id) => {
                const token = localStorage.getItem('auth_token');
                if (!token || !activeWorkspace) return;
                try {
                  const res = await fetch(`${API_BASE}/api/v1/workspaces/${activeWorkspace.id}/members/${id}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                  });
                  if (res.ok) {
                    setMembers(prev => prev.filter(m => m.id !== id));
                  }
                } catch (err) {
                  console.error(err);
                }
              }}
              isReadOnly={isReadOnly}
              activeWorkspace={activeWorkspace}
            />
          )}

          {/* TAB: WHATSAPP SETUP */}
          {currentTab === 'whatsapp' && (
            <ConnectionWizard
              phoneId={phoneId}
              onPhoneIdChange={setPhoneId}
              businessId={businessId}
              onBusinessIdChange={setBusinessId}
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
              accessToken={accessToken}
              onAccessTokenChange={setAccessToken}
              verifyToken={verifyToken}
              onVerifyTokenChange={setVerifyToken}
              appSecret={appSecret}
              onAppSecretChange={setAppSecret}
              whatsappStatus={whatsappStatus}
              onSave={handleConnectWhatsapp}
              isReadOnly={isReadOnly}
              activeWorkspace={activeWorkspace}
            />
          )}

          {/* TAB: BILLING & QUOTA */}
          {currentTab === 'billing' && (
            <BillingTab isReadOnly={isReadOnly} />
          )}

          {/* TAB: WORKSPACE SETTINGS */}
          {currentTab === 'workspace' && (
            <SettingsTab activeWorkspace={activeWorkspace} isReadOnly={isReadOnly} />
          )}
        </main>
      </div>

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
                <h3 className="text-sm font-semibold text-white">Invite Workspace Teammate</h3>
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
                <div className="p-2.5 rounded-xl bg-brandRed/10 border border-brandRed/20 text-xs text-brandRed font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Teammate Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Workspace Role (RBAC)
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-darkBg border border-darkBorder rounded-xl text-slate-200 focus:outline-none focus:border-brandIndigo"
                >
                  <option value="ADMIN">ADMIN (Full operations, workflows, broadcasts)</option>
                  <option value="MEMBER">MEMBER (Live inbox support agent, CRM)</option>
                  <option value="VIEWER">VIEWER (Read-only analytics & log auditor)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-darkBorder">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 rounded-xl outline-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all outline-none"
                >
                  Send Invitation →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
