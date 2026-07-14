'use client';

import React, { useState } from 'react';
import { 
  Megaphone, 
  Send, 
  Users, 
  CheckCircle2, 
  Eye, 
  MousePointerClick, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Plus, 
  Filter, 
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useToast } from '../common/Toast';

interface Campaign {
  id: string;
  name: string;
  template: string;
  audience: string;
  sent: number;
  delivered: number;
  read: number;
  clicks: number;
  status: 'COMPLETED' | 'RUNNING' | 'SCHEDULED';
  createdAt: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: 'cmp_1',
    name: 'Q3 Enterprise Launch Promo Blast',
    template: 'welcome_promo_v2',
    audience: 'VIP Leads & Tier 1 (142 contacts)',
    sent: 142,
    delivered: 140,
    read: 134,
    clicks: 48,
    status: 'COMPLETED',
    createdAt: '2026-07-14T10:00:00Z'
  },
  {
    id: 'cmp_2',
    name: 'Weekly System Status Notification',
    template: 'system_update_notice',
    audience: 'All Opted-In Customers (480 contacts)',
    sent: 480,
    delivered: 478,
    read: 442,
    clicks: 189,
    status: 'COMPLETED',
    createdAt: '2026-07-12T14:30:00Z'
  },
  {
    id: 'cmp_3',
    name: 'Mid-July Walkthrough Follow-up',
    template: 'welcome_promo_v2',
    audience: 'Recent Inquiries (64 contacts)',
    sent: 64,
    delivered: 62,
    read: 45,
    clicks: 19,
    status: 'RUNNING',
    createdAt: '2026-07-14T15:15:00Z'
  },
  {
    id: 'cmp_4',
    name: 'August Partner Renewal Reminders',
    template: 'payment_receipt_alert',
    audience: 'VIP Leads & Tier 1 (142 contacts)',
    sent: 0,
    delivered: 0,
    read: 0,
    clicks: 0,
    status: 'SCHEDULED',
    createdAt: '2026-07-18T09:00:00Z'
  }
];

export function CampaignsTab({ onOpenBroadcast }: { onOpenBroadcast?: () => void }) {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = campaigns.filter(c => filterStatus === 'all' || c.status === filterStatus);

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-darkCard border border-darkBorder p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-brandIndigo" /> Marketing & Broadcast Campaigns
            </h2>
            <Badge variant="indigo" size="sm">
              {campaigns.length} Campaigns
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track real-time delivery performance, open/read conversion telemetry, and link clicks across all your WhatsApp blasts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (onOpenBroadcast) onOpenBroadcast();
              else toast.info('New Campaign', 'Navigate to the Broadcast tab to dispatch a new blast.');
            }}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Launch New Campaign
          </Button>
        </div>
      </div>

      {/* High-level KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dispatched</p>
            <p className="text-lg font-black text-white">686 msgs</p>
          </div>
        </Card>

        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivery Rate</p>
            <p className="text-lg font-black text-white">99.1%</p>
          </div>
        </Card>

        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Read Conversion</p>
            <p className="text-lg font-black text-white">91.3%</p>
          </div>
        </Card>

        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <MousePointerClick className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Link CTR</p>
            <p className="text-lg font-black text-white">37.4%</p>
          </div>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card variant="elevated" padding="none">
        <div className="p-4 border-b border-darkBorder flex items-center justify-between bg-darkSurface/50">
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" /> Campaign Execution Telemetry
          </span>

          <div className="flex items-center gap-1.5">
            {['all', 'RUNNING', 'COMPLETED', 'SCHEDULED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all capitalize ${
                  filterStatus === st
                    ? 'bg-brandIndigo text-white'
                    : 'bg-darkBg text-slate-400 hover:text-white border border-darkBorder'
                }`}
              >
                {st === 'all' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-darkBg/80 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-darkBorder">
                <th className="py-3.5 px-6">Campaign Name & Template</th>
                <th className="py-3.5 px-4">Target Audience</th>
                <th className="py-3.5 px-4 text-center">Sent / Dlvd</th>
                <th className="py-3.5 px-4 text-center">Read Rate</th>
                <th className="py-3.5 px-4 text-center">Link Clicks</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder/40 text-xs text-slate-200">
              {filtered.map((cmp) => {
                const readPct = cmp.sent > 0 ? Math.round((cmp.read / cmp.sent) * 100) : 0;
                const clickPct = cmp.read > 0 ? Math.round((cmp.clicks / cmp.read) * 100) : 0;

                return (
                  <tr key={cmp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-white">
                      <div>
                        <p className="text-sm font-extrabold text-white">{cmp.name}</p>
                        <p className="text-[11px] text-indigo-400 font-mono mt-0.5">Template: {cmp.template}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-300 font-medium">{cmp.audience}</td>
                    <td className="py-4 px-4 text-center font-mono">
                      {cmp.status === 'SCHEDULED' ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <span><strong className="text-white">{cmp.sent}</strong> / {cmp.delivered}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center font-mono">
                      {cmp.status === 'SCHEDULED' ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <span className="font-bold text-sky-400">{readPct}% ({cmp.read})</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center font-mono">
                      {cmp.status === 'SCHEDULED' ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <span className="font-bold text-purple-400">{clickPct}% ({cmp.clicks})</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={cmp.status === 'COMPLETED' ? 'emerald' : cmp.status === 'RUNNING' ? 'indigo' : 'amber'}
                        size="sm"
                        pulse={cmp.status === 'RUNNING'}
                      >
                        {cmp.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => toast.info('Analytics Report', `Opening drill-down analytics for ${cmp.name}...`)}
                      >
                        Report <ChevronRight className="h-3.5 w-3.5 ml-1 inline" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
