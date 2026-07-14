'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Lock, 
  Globe, 
  Bell, 
  Database, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Badge } from '../common/Badge';
import { useToast } from '../common/Toast';

export function SettingsTab({ activeWorkspace, isReadOnly = false }: { activeWorkspace?: any; isReadOnly?: boolean }) {
  const toast = useToast();
  const [wsName, setWsName] = useState(activeWorkspace?.name || 'LeadWave Pro Enterprise');
  const [timezone, setTimezone] = useState('America/New_York');
  const [webhookSecret, setWebhookSecret] = useState('whsec_8a92b3c4d5e6f7g8h9i0');
  const [enable2FA, setEnable2FA] = useState(true);
  const [enableEmailAlerts, setEnableEmailAlerts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsSaving(false);
    toast.success('Settings Saved', 'Workspace configuration updated successfully.');
  };

  return (
    <div className="space-y-6 pb-12 select-none max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-darkCard border border-darkBorder p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Settings className="h-5 w-5 text-brandIndigo" /> Workspace Configuration & Security
            </h2>
            <Badge variant="emerald" size="sm" pulse>
              System Online
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage workspace metadata, webhook HMAC signature secrets, timezone locale, and data export audits.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings Card */}
        <Card
          variant="elevated"
          header={
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-400" /> General Workspace Metadata
            </h3>
          }
        >
          <div className="space-y-4">
            <Input
              label="Workspace Display Name"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              required
              disabled={isReadOnly}
            />

            <Select
              label="Default Timezone & Locale"
              value={timezone}
              onChange={setTimezone}
              disabled={isReadOnly}
              options={[
                { value: 'America/New_York', label: 'Eastern Time (US & Canada) (UTC-5)' },
                { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada) (UTC-8)' },
                { value: 'Europe/London', label: 'London / UTC Standard Time (UTC+0)' },
                { value: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai) (UTC+4)' },
              ]}
            />
          </div>
        </Card>

        {/* Security & Notifications */}
        <Card
          variant="elevated"
          header={
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Security & Alert Controls
            </h3>
          }
        >
          <div className="space-y-4 divide-y divide-darkBorder/40">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-bold text-white">Require Two-Factor Authentication (2FA)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Enforce TOTP authenticator verification for all workspace teammates.</p>
              </div>
              <input
                type="checkbox"
                checked={enable2FA}
                onChange={(e) => setEnable2FA(e.target.checked)}
                disabled={isReadOnly}
                className="rounded bg-darkBg border-darkBorder text-brandIndigo focus:ring-0 h-5 w-5 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-xs font-bold text-white">Email Notification Digests</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Receive instant email alerts on failed webhook deliveries or rate limits.</p>
              </div>
              <input
                type="checkbox"
                checked={enableEmailAlerts}
                onChange={(e) => setEnableEmailAlerts(e.target.checked)}
                disabled={isReadOnly}
                className="rounded bg-darkBg border-darkBorder text-brandIndigo focus:ring-0 h-5 w-5 cursor-pointer"
              />
            </div>

            <div className="pt-3">
              <Input
                label="Webhook HMAC Signing Secret (`whsec_`)"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                type="password"
                disabled={isReadOnly}
                helperText="Used by Meta to sign payload headers (`X-Hub-Signature-256`) for authenticity verification."
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            disabled={isReadOnly}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Changes →
          </Button>
        </div>
      </form>

      {/* Dangerous Zone */}
      <Card variant="elevated" className="border-rose-500/30 bg-rose-950/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Danger Zone: Delete Workspace Scope
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Permanently purge this workspace along with all active conversations, rules, contacts, and API connections.
            </p>
          </div>

          <Button
            variant="danger"
            size="md"
            disabled={isReadOnly}
            onClick={() => toast.warning('Delete Workspace', 'Please contact support to purge root enterprise accounts.')}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete Workspace Scope
          </Button>
        </div>
      </Card>
    </div>
  );
}
