'use client';

import React, { useState } from 'react';
import { 
  UserPlus, 
  Users, 
  ShieldCheck, 
  Mail, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Key, 
  Search, 
  AlertCircle
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';
import { useToast } from '../common/Toast';

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  status: 'ACTIVE' | 'PENDING';
}

interface TeamTabProps {
  members?: WorkspaceMember[];
  onInviteMember?: (email: string, role: string) => Promise<void> | void;
  onRemoveMember?: (id: string) => Promise<void> | void;
  isReadOnly?: boolean;
  activeWorkspace?: any;
}

const defaultMembers: WorkspaceMember[] = [
  { id: 'm1', name: 'Sai Aditiyaa', email: 'sai@leadwave.pro', role: 'OWNER', joinedAt: '2026-07-01T10:00:00Z', status: 'ACTIVE' },
  { id: 'm2', name: 'Elena Rostova', email: 'elena@leadwave.pro', role: 'ADMIN', joinedAt: '2026-07-04T14:30:00Z', status: 'ACTIVE' },
  { id: 'm3', name: 'Marcus Chen', email: 'marcus@leadwave.pro', role: 'MEMBER', joinedAt: '2026-07-08T09:15:00Z', status: 'ACTIVE' },
  { id: 'm4', name: 'Alex Rivera', email: 'alex@leadwave.pro', role: 'VIEWER', joinedAt: '2026-07-12T16:45:00Z', status: 'PENDING' },
];

export function TeamTab({
  members = defaultMembers,
  onInviteMember,
  onRemoveMember,
  isReadOnly = false,
  activeWorkspace
}: TeamTabProps) {
  const toast = useToast();
  const [memberList, setMemberList] = useState<WorkspaceMember[]>(members.length > 0 ? members : defaultMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);

  const filteredMembers = memberList.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error('Validation Error', 'Enter a valid teammate email address.');
      return;
    }

    setIsInviting(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsInviting(false);

    if (onInviteMember) {
      await onInviteMember(inviteEmail, inviteRole);
    } else {
      const created: WorkspaceMember = {
        id: `m_${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail.trim(),
        role: inviteRole,
        joinedAt: new Date().toISOString(),
        status: 'PENDING'
      };
      setMemberList([...memberList, created]);
      toast.success('Invitation Sent', `Sent workspace invitation to ${created.email}`);
    }

    setIsInviteOpen(false);
    setInviteEmail('');
  };

  const handleRemove = async (id: string, name: string) => {
    if (onRemoveMember) {
      await onRemoveMember(id);
    } else {
      setMemberList(memberList.filter(m => m.id !== id));
      toast.warning('Teammate Removed', `Revoked workspace access for ${name}.`);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-darkCard border border-darkBorder p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-brandIndigo" /> Workspace Team & Role Management
            </h2>
            <Badge variant="indigo" size="sm">
              {memberList.length} Teammates
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Invite agents, assign granular RBAC roles (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`), and control WhatsApp inbox access.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="success"
            size="md"
            disabled={isReadOnly}
            onClick={() => setIsInviteOpen(true)}
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Invite Member
          </Button>
        </div>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder">
          <Badge variant="purple" size="sm" className="mb-2">OWNER</Badge>
          <p className="text-xs font-bold text-white">Full Superuser</p>
          <p className="text-[11px] text-slate-400 mt-1">Manages billing, API credentials, rules, and all workspace members.</p>
        </Card>
        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder">
          <Badge variant="emerald" size="sm" className="mb-2">ADMIN</Badge>
          <p className="text-xs font-bold text-white">Operations Head</p>
          <p className="text-[11px] text-slate-400 mt-1">Can create workflows, broadcasts, rules, and invite team members.</p>
        </Card>
        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder">
          <Badge variant="indigo" size="sm" className="mb-2">MEMBER</Badge>
          <p className="text-xs font-bold text-white">Support Agent</p>
          <p className="text-[11px] text-slate-400 mt-1">Can chat in live inbox, view CRM profiles, and send template replies.</p>
        </Card>
        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder">
          <Badge variant="slate" size="sm" className="mb-2">VIEWER</Badge>
          <p className="text-xs font-bold text-white">Read-Only Auditor</p>
          <p className="text-[11px] text-slate-400 mt-1">View-only access across analytics, logs, and message histories.</p>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-darkCard border border-darkBorder p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search member name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-darkBg border border-darkBorder rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo transition-all"
          />
        </div>
      </div>

      {/* Members Table */}
      <Card variant="elevated" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-darkBg/80 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-darkBorder">
                <th className="py-3.5 px-6">Teammate Profile</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Workspace Role</th>
                <th className="py-3.5 px-4">Invitation Status</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder/40 text-xs text-slate-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-bold text-white">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-xs shadow-md capitalize">
                        {member.name.slice(0, 2)}
                      </div>
                      <span className="text-sm font-extrabold text-white capitalize">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-300">{member.email}</td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={
                        member.role === 'OWNER' ? 'purple' :
                        member.role === 'ADMIN' ? 'emerald' :
                        member.role === 'MEMBER' ? 'indigo' : 'slate'
                      }
                      size="sm"
                    >
                      {member.role}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={member.status === 'ACTIVE' ? 'emerald' : 'amber'} size="sm" pulse={member.status === 'PENDING'}>
                      {member.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-400">
                    {new Date(member.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {member.role !== 'OWNER' && (
                      <button
                        onClick={() => handleRemove(member.id, member.name)}
                        disabled={isReadOnly}
                        className="text-xs font-semibold text-brandRed hover:underline p-1.5 rounded hover:bg-rose-950/20 transition-colors outline-none"
                        title="Remove member from workspace"
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
      </Card>

      {/* INVITE MEMBER MODAL */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Teammate to Workspace"
        subtitle="An invitation email with a secure link will be sent to the colleague's inbox."
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="md" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isInviting}
              onClick={handleInvite}
              leftIcon={<UserPlus className="h-4 w-4" />}
            >
              Send Invitation →
            </Button>
          </div>
        }
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Teammate Email Address"
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <Select
            label="Assigned Workspace Role (RBAC)"
            value={inviteRole}
            onChange={(val) => setInviteRole(val as any)}
            options={[
              { value: 'ADMIN', label: 'ADMIN (Full operations, workflows, broadcasts)' },
              { value: 'MEMBER', label: 'MEMBER (Inbox support agent, contact CRM)' },
              { value: 'VIEWER', label: 'VIEWER (Read-only analytics & log auditor)' },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
}
