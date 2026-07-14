'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  MessageSquare, 
  Zap, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Sparkles, 
  Radio, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  Play, 
  FileText, 
  ExternalLink,
  Wifi,
  AlertTriangle,
  Send
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface OverviewTabProps {
  activeWorkspace: any;
  stats: {
    total: number;
    inbound: number;
    outbound: number;
    rulesCount: number;
    successRate: number;
  };
  whatsappStatus: 'CONNECTED' | 'DISCONNECTED';
  onSelectTab: (tab: string) => void;
  recentConversations?: any[];
}

// Sample data for overview charts
const overviewChartData = [
  { day: 'Mon', sent: 1240, received: 980, revenue: 3400 },
  { day: 'Tue', sent: 1480, received: 1120, revenue: 4100 },
  { day: 'Wed', sent: 1890, received: 1540, revenue: 5600 },
  { day: 'Thu', sent: 1650, received: 1390, revenue: 4900 },
  { day: 'Fri', sent: 2150, received: 1820, revenue: 6800 },
  { day: 'Sat', sent: 2680, received: 2210, revenue: 8400 },
  { day: 'Sun', sent: 3120, received: 2540, revenue: 9800 },
];

const recentBroadcasts = [
  { id: 'b1', name: 'Q3 Product Launch Blast', target: 'VIP Leads (1,420)', delivered: '98.4%', read: '86.2%', status: 'Completed', time: '2 hours ago' },
  { id: 'b2', name: 'Weekend Flash Sale 25% Off', target: 'All Active Contacts (8,900)', delivered: '99.1%', read: '91.5%', status: 'Completed', time: 'Yesterday' },
  { id: 'b3', name: 'Onboarding Follow-up Series', target: 'New Users (310)', delivered: '97.8%', read: '82.0%', status: 'Sending', time: 'In progress' },
];

export function OverviewTab({
  activeWorkspace,
  stats,
  whatsappStatus,
  onSelectTab,
  recentConversations = []
}: OverviewTabProps) {
  const [greeting, setGreeting] = useState('Welcome back');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const kpis = [
    {
      title: 'Total Messages Processed',
      value: (stats.total || 34820).toLocaleString(),
      change: '+18.4%',
      isPositive: true,
      icon: MessageSquare,
      color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
    },
    {
      title: 'Inbound Customer Traffic',
      value: (stats.inbound || 16420).toLocaleString(),
      change: '+24.1%',
      isPositive: true,
      icon: ArrowDownLeft,
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    },
    {
      title: 'Automated Bot Replies',
      value: (stats.outbound || 18400).toLocaleString(),
      change: '+14.2%',
      isPositive: true,
      icon: Zap,
      color: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    },
    {
      title: 'Delivery Success Rate',
      value: `${stats.successRate || 99.4}%`,
      change: '+0.6%',
      isPositive: true,
      icon: ShieldCheck,
      color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Section & Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/80 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl shadow-indigo-950/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 mb-3">
              <Badge variant="indigo" size="sm" pulse leftIcon={<Sparkles className="h-3.5 w-3.5 text-amber-400" />}>
                AI Engine Active v2.4
              </Badge>
              <Badge variant={whatsappStatus === 'CONNECTED' ? 'emerald' : 'amber'} size="sm">
                {whatsappStatus === 'CONNECTED' ? 'WhatsApp API Online' : 'WhatsApp Needs Connection'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {greeting}, <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">{activeWorkspace?.name || 'SaaS Workspace'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Your automated WhatsApp communication suite is running smoothly. Over <span className="font-semibold text-white">99.4%</span> of messages were delivered instantly over the past 30 days with automated AI sentiment analysis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Send className="h-4 w-4" />}
              onClick={() => onSelectTab('broadcast')}
            >
              New Broadcast
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Zap className="h-4 w-4 text-purple-400" />}
              onClick={() => onSelectTab('workflows')}
            >
              Build Workflow
            </Button>
          </div>
        </div>

        {/* Quick Health Bar inside Hero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-indigo-500/20">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">Workspace Health</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="h-4 w-4" /> 100% Operational
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">Active Triggers</span>
            <span className="text-sm font-bold text-white mt-0.5">
              {stats.rulesCount || 14} Rules Enabled
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">Avg Response Time</span>
            <span className="text-sm font-bold text-cyan-400 flex items-center gap-1 mt-0.5">
              <Clock className="h-3.5 w-3.5" /> 1.2 Seconds
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">Monthly Quota</span>
            <span className="text-sm font-bold text-indigo-300 mt-0.5">
              34.8k / 100k Credits
            </span>
          </div>
        </div>
      </div>

      {/* 2. AI Insights Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-darkCard via-indigo-950/30 to-darkCard border-indigo-500/30 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0">
                <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">AI Conversation Intelligence Summary</h3>
                  <Badge variant="purple" size="sm">Real-Time</Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Our LLM sentiment analysis flagged <span className="font-semibold text-emerald-400">94.2% positive customer sentiment</span> this week. Top customer intent detected: <span className="text-indigo-300 font-semibold">"Pricing inquiries"</span> and <span className="text-indigo-300 font-semibold">"Product support"</span>. We recommend adding a visual workflow branching for pricing FAQs to boost conversion by ~15%.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Zap className="h-3.5 w-3.5 text-indigo-400" />}
              onClick={() => onSelectTab('workflows')}
              className="shrink-0"
            >
              Deploy Recommended Flow
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* 3. KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
            >
              <Card variant="elevated" className="h-full flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.title}</span>
                  <div className={`p-2.5 rounded-xl border ${item.color}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{item.value}</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {item.change}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">vs. previous 30 days benchmark</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* 4. Charts Section (Messages & Revenue Overview + Delivery Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Traffic & Message Volume</h3>
              <p className="text-xs text-slate-400 mt-0.5">Hourly and daily breakdown of inbound vs outbound messages</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Outbound Bot
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold ml-3">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Inbound User
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overviewChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#24304f" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#24304f', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSent)" />
                <Area type="monotone" dataKey="received" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReceived)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Automation & Quick Actions Summary */}
        <Card variant="elevated" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white tracking-tight">Automation Engine</h3>
              <Badge variant="indigo" size="sm">Active</Badge>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Summary of your automation rules and active visual flows handling incoming traffic.
            </p>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-darkSurface border border-darkBorder/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-brandIndigo">
                    <Zap className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Visual Workflows</p>
                    <p className="text-[11px] text-slate-400">Multi-step AI & branching flows</p>
                  </div>
                </div>
                <span className="text-sm font-black text-white">4 Active</span>
              </div>

              <div className="p-3.5 rounded-xl bg-darkSurface border border-darkBorder/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <MessageSquare className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Keyword Rules</p>
                    <p className="text-[11px] text-slate-400">Trigger exact/fuzzy keyword matches</p>
                  </div>
                </div>
                <span className="text-sm font-black text-white">{stats.rulesCount || 14} Active</span>
              </div>

              <div className="p-3.5 rounded-xl bg-darkSurface border border-darkBorder/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">WhatsApp Templates</p>
                    <p className="text-[11px] text-slate-400">Meta approved broadcast templates</p>
                  </div>
                </div>
                <span className="text-sm font-black text-white">12 Approved</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-darkBorder/60">
            <Button
              variant="outline"
              fullWidth
              size="sm"
              onClick={() => onSelectTab('rules')}
            >
              Manage All Rules & Flows →
            </Button>
          </div>
        </Card>
      </div>

      {/* 5. Recent Broadcasts & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          variant="elevated"
          header={
            <>
              <div>
                <h3 className="text-sm font-bold text-white">Recent Marketing Broadcasts</h3>
                <p className="text-xs text-slate-400">Performance metrics for your latest campaign blasts</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onSelectTab('campaigns')}>View All</Button>
            </>
          }
          padding="none"
        >
          <div className="divide-y divide-darkBorder/60">
            {recentBroadcasts.map((b) => (
              <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{b.name}</span>
                    <Badge variant={b.status === 'Completed' ? 'emerald' : 'indigo'} size="sm" pulse={b.status === 'Sending'}>
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Target: <span className="text-slate-300 font-medium">{b.target}</span> • {b.time}</p>
                </div>

                <div className="flex items-center gap-6 text-right shrink-0">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Delivered</span>
                    <span className="text-xs font-bold text-emerald-400">{b.delivered}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Read Rate</span>
                    <span className="text-xs font-bold text-indigo-300">{b.read}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          variant="elevated"
          header={
            <>
              <div>
                <h3 className="text-sm font-bold text-white">Live Customer Conversations</h3>
                <p className="text-xs text-slate-400">Recent incoming messages and bot resolutions</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onSelectTab('inbox')}>Open Inbox →</Button>
            </>
          }
          padding="none"
        >
          <div className="divide-y divide-darkBorder/60">
            {[
              { name: 'Sarah Jenkins', phone: '+1 (555) 382-9102', text: 'Hi! Can I get more details on the enterprise annual plan?', tag: 'VIP Lead', time: '3 mins ago', bot: true },
              { name: 'Marcus Brody', phone: '+44 7911 123456', text: 'Thanks, the automated receipt download worked great.', tag: 'Customer', time: '14 mins ago', bot: true },
              { name: 'Elena Rostova', phone: '+34 612 345 678', text: 'I need to speak to a human support agent please.', tag: 'Support', time: '28 mins ago', bot: false },
              { name: 'David Kim', phone: '+82 10 1234 5678', text: 'Is your API compatible with custom webhooks?', tag: 'Developer', time: '1 hour ago', bot: true },
            ].map((conv, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-800/20 transition-colors cursor-pointer" onClick={() => onSelectTab('inbox')}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200 shrink-0">
                    {conv.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{conv.name}</span>
                      <Badge variant="slate" size="sm">{conv.tag}</Badge>
                      {conv.bot && <Badge variant="purple" size="sm">Bot Resolved</Badge>}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{conv.text}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0">{conv.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
