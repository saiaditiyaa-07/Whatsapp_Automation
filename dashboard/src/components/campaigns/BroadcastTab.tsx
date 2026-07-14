'use client';

import React, { useState } from 'react';
import { 
  Radio, 
  Send, 
  Users, 
  FileText, 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Upload, 
  Eye,
  Check
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Textarea } from '../common/Textarea';
import { Badge } from '../common/Badge';
import { useToast } from '../common/Toast';
import { motion } from 'framer-motion';

interface BroadcastTabProps {
  activeWorkspace?: any;
  isReadOnly?: boolean;
}

export function BroadcastTab({ activeWorkspace, isReadOnly = false }: BroadcastTabProps) {
  const toast = useToast();
  const [campaignName, setCampaignName] = useState('Q3 Enterprise Product Launch Blast');
  const [targetSegment, setTargetSegment] = useState('vip_leads');
  const [templateId, setTemplateId] = useState('welcome_promo_v2');
  const [param1, setParam1] = useState('Elena');
  const [param2, setParam2] = useState('25% OFF Enterprise Plan');
  const [sendType, setSendType] = useState<'now' | 'scheduled'>('now');
  const [scheduleDate, setScheduleDate] = useState('2026-07-16T10:00');
  const [isDispatching, setIsDispatching] = useState(false);

  const templateMap: Record<string, { name: string; category: string; body: string; buttons: string[] }> = {
    welcome_promo_v2: {
      name: 'welcome_promo_v2',
      category: 'MARKETING',
      body: 'Hello {{1}}! We are thrilled to announce our new Q3 features. Exclusive offer for you: {{2}}. Click below to claim or schedule a live walkthrough.',
      buttons: ['Claim Exclusive Offer', 'Book Walkthrough Call']
    },
    system_update_notice: {
      name: 'system_update_notice',
      category: 'UTILITY',
      body: 'Hi {{1}}, scheduled maintenance for WhatsApp Cloud API endpoints will occur tonight. Your status: {{2}}.',
      buttons: ['View Status Page']
    },
    payment_receipt_alert: {
      name: 'payment_receipt_alert',
      category: 'UTILITY',
      body: 'Dear {{1}}, your invoice for {{2}} has been successfully processed. Thank you for your continued partnership.',
      buttons: ['Download Invoice PDF']
    }
  };

  const selectedTemplate = templateMap[templateId] || templateMap['welcome_promo_v2'];

  const renderedBody = selectedTemplate.body
    .replace('{{1}}', param1 || '[Name]')
    .replace('{{2}}', param2 || '[Parameter]');

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) {
      toast.error('Validation Error', 'Campaign name is required.');
      return;
    }

    setIsDispatching(true);
    await new Promise((r) => setTimeout(r, 1400));
    setIsDispatching(false);

    if (sendType === 'now') {
      toast.success('Broadcast Blast Dispatched!', `Queued ${targetSegment === 'vip_leads' ? '142' : '480'} messages via WhatsApp Cloud API.`);
    } else {
      toast.success('Broadcast Scheduled', `Scheduled "${campaignName}" for ${new Date(scheduleDate).toLocaleString()}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-darkCard border border-darkBorder p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Radio className="h-5 w-5 text-brandIndigo animate-pulse" /> Bulk WhatsApp Broadcast Sender
            </h2>
            <Badge variant="emerald" size="sm" pulse>High Throughput API</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch compliant WhatsApp Cloud API template blasts to targeted CRM segments with variable personalization.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Badge variant="indigo" size="md">Meta Tier 2 Rate Limit (10k/day)</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: BROADCAST SETUP FORM */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleDispatch} className="space-y-6">
            <Card
              variant="elevated"
              header={
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" /> 1. Campaign & Audience Targeting
                </h3>
              }
            >
              <div className="space-y-4">
                <Input
                  label="Broadcast Campaign Title"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Q3 New Feature Announcement"
                  required
                  disabled={isReadOnly}
                />

                <Select
                  label="Target CRM Audience Segment"
                  value={targetSegment}
                  onChange={setTargetSegment}
                  disabled={isReadOnly}
                  options={[
                    { value: 'vip_leads', label: 'VIP Leads & Tier 1 Accounts (142 contacts)' },
                    { value: 'all_opted_in', label: 'All Active Opted-In Customers (480 contacts)' },
                    { value: 'recent_inquiries', label: 'Recent Inquiries last 7 days (64 contacts)' },
                    { value: 'custom_csv', label: 'Custom CSV File Upload (Target List)' },
                  ]}
                />

                {targetSegment === 'custom_csv' && (
                  <div className="p-4 rounded-xl border-2 border-dashed border-darkBorder bg-darkBg/50 text-center space-y-2">
                    <Upload className="h-6 w-6 text-indigo-400 mx-auto" />
                    <p className="text-xs font-semibold text-white">Drop your contacts CSV or click to browse</p>
                    <p className="text-[10px] text-slate-400">Must contain columns: `phone`, `name`, `custom_variable_1`</p>
                  </div>
                )}
              </div>
            </Card>

            <Card
              variant="elevated"
              header={
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" /> 2. Template Selection & Personalization
                </h3>
              }
            >
              <div className="space-y-4">
                <Select
                  label="Meta Approved Template"
                  value={templateId}
                  onChange={setTemplateId}
                  disabled={isReadOnly}
                  options={[
                    { value: 'welcome_promo_v2', label: '[MARKETING] welcome_promo_v2 (EN_US)' },
                    { value: 'system_update_notice', label: '[UTILITY] system_update_notice (EN_US)' },
                    { value: 'payment_receipt_alert', label: '[UTILITY] payment_receipt_alert (EN_US)' },
                  ]}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Input
                    label="Variable {{1}} (Customer Name / Fallback)"
                    value={param1}
                    onChange={(e) => setParam1(e.target.value)}
                    placeholder="e.g. Elena"
                    disabled={isReadOnly}
                  />
                  <Input
                    label="Variable {{2}} (Custom Offer / Detail)"
                    value={param2}
                    onChange={(e) => setParam2(e.target.value)}
                    placeholder="e.g. 25% OFF Plan"
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </Card>

            <Card
              variant="elevated"
              header={
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-cyan-400" /> 3. Dispatch Schedule
                </h3>
              }
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label
                    onClick={() => setSendType('now')}
                    className={`flex-1 p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                      sendType === 'now' ? 'bg-indigo-500/15 border-brandIndigo text-white' : 'bg-darkBg border-darkBorder text-slate-400'
                    }`}
                  >
                    <input type="radio" checked={sendType === 'now'} onChange={() => setSendType('now')} className="text-brandIndigo" />
                    <div>
                      <p className="text-xs font-bold">Dispatch Immediately</p>
                      <p className="text-[10px] text-slate-400">Queue blast to begin right now</p>
                    </div>
                  </label>

                  <label
                    onClick={() => setSendType('scheduled')}
                    className={`flex-1 p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                      sendType === 'scheduled' ? 'bg-indigo-500/15 border-brandIndigo text-white' : 'bg-darkBg border-darkBorder text-slate-400'
                    }`}
                  >
                    <input type="radio" checked={sendType === 'scheduled'} onChange={() => setSendType('scheduled')} className="text-brandIndigo" />
                    <div>
                      <p className="text-xs font-bold">Schedule for Later</p>
                      <p className="text-[10px] text-slate-400">Pick exact date & time zone</p>
                    </div>
                  </label>
                </div>

                {sendType === 'scheduled' && (
                  <Input
                    type="datetime-local"
                    label="Scheduled Dispatch Time"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
              </div>
            </Card>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isDispatching}
              disabled={isReadOnly}
              leftIcon={<Send className="h-4 w-4" />}
              className="shadow-xl shadow-indigo-500/30"
            >
              {sendType === 'now' ? 'Dispatch Broadcast Blast Now →' : 'Confirm & Schedule Broadcast →'}
            </Button>
          </form>
        </div>

        {/* RIGHT COLUMN: LIVE DEVICE PREVIEW */}
        <div className="lg:col-span-5 sticky top-24">
          <Card variant="elevated" className="bg-gradient-to-b from-darkCard to-darkSurface p-6">
            <div className="flex items-center justify-between pb-4 border-b border-darkBorder mb-6">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-emerald-400" /> WhatsApp Live Mobile Preview
              </span>
              <Badge variant="slate" size="sm">iOS / Android OLED</Badge>
            </div>

            {/* Mock Phone Frame */}
            <div className="max-w-[320px] mx-auto rounded-[36px] bg-[#090b10] border-4 border-slate-700 p-4 shadow-2xl shadow-black relative overflow-hidden">
              {/* Phone Header */}
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80 mb-3">
                <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                  WA
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Your Brand Name</p>
                  <p className="text-[9px] text-emerald-400">Verified Business Account</p>
                </div>
              </div>

              {/* Chat Canvas inside Phone */}
              <div className="min-h-[280px] flex flex-col justify-end pb-2 space-y-3">
                <div className="bg-[#005c4b] text-white rounded-2xl rounded-tr-sm p-3.5 shadow-md text-xs relative max-w-[92%] ml-auto">
                  <p className="leading-relaxed whitespace-pre-wrap break-words">{renderedBody}</p>
                  <div className="flex items-center justify-end gap-1 mt-2 text-[9px] text-emerald-200/80 font-mono">
                    <span>10:42 AM</span>
                    <Check className="h-3 w-3" />
                  </div>
                </div>

                {/* Interactive Template Buttons Preview */}
                <div className="space-y-1.5 pt-1">
                  {selectedTemplate.buttons.map((btnText, idx) => (
                    <div
                      key={idx}
                      className="w-full bg-[#1f2c34] hover:bg-[#2a3942] text-sky-400 text-center font-semibold text-xs py-2 rounded-xl border border-slate-700/50 transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <span>{btnText}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Home indicator bar */}
              <div className="w-24 h-1 bg-slate-700 mx-auto rounded-full mt-4" />
            </div>

            <div className="mt-6 p-4 rounded-xl bg-darkBg border border-darkBorder/80 text-center">
              <p className="text-[11px] text-slate-400">
                ⚡ Template <strong className="text-white">{selectedTemplate.name}</strong> is pre-approved by Meta with <strong className="text-emerald-400">High Quality</strong> tier rating.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
