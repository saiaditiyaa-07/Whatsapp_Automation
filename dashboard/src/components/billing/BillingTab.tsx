'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Zap, 
  Sparkles, 
  ArrowUpRight, 
  Download, 
  ShieldCheck, 
  AlertCircle, 
  TrendingUp,
  Clock
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useToast } from '../common/Toast';

export function BillingTab({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const toast = useToast();
  const [currentPlan, setCurrentPlan] = useState<'Growth Pro' | 'Enterprise Unlimited'>('Growth Pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const handleUpgrade = (tier: string) => {
    toast.success('Subscription Updated', `Upgraded workspace plan to ${tier}. Invoice dispatched to email.`);
  };

  const downloadInvoice = (id: string) => {
    toast.info('Downloading Invoice PDF', `Invoice #${id} download started.`);
  };

  return (
    <div className="space-y-6 pb-12 select-none max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-darkCard border border-darkBorder p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brandIndigo" /> Workspace Billing, Plans & Quota
            </h2>
            <Badge variant="emerald" size="sm" pulse>
              Active Plan: {currentPlan}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitor Meta Cloud API conversation usage limits, manage payment methods, and scale enterprise automation throughput.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Badge variant="indigo" size="md">Annual Discount (-20% Applied)</Badge>
        </div>
      </div>

      {/* Quota & Usage Card */}
      <Card
        variant="elevated"
        header={
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" /> Current Monthly API Quota & Usage
            </span>
            <span className="text-xs font-mono text-slate-400">Resets in 18 days (August 1, 2026)</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">WhatsApp Cloud API Conversations</span>
              <span className="text-white font-mono">6,842 / 10,000</span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: '68.4%' }} />
            </div>
            <p className="text-[10px] text-slate-400">68.4% of your monthly tier quota utilized</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">AI Automation Nodes Executed</span>
              <span className="text-white font-mono">14,290 / 25,000</span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" style={{ width: '57.1%' }} />
            </div>
            <p className="text-[10px] text-slate-400">57.1% of AI trigger evaluations consumed</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Workspace Teammate Seats</span>
              <span className="text-white font-mono">4 / 15 seats</span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: '26.6%' }} />
            </div>
            <p className="text-[10px] text-slate-400">11 seats still available on your Growth plan</p>
          </div>
        </div>
      </Card>

      {/* Subscription Plans Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly Billing</span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="w-12 h-6 rounded-full bg-indigo-600 p-1 flex items-center transition-all outline-none"
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${billingCycle === 'annual' ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-xs font-bold flex items-center gap-1 ${billingCycle === 'annual' ? 'text-white' : 'text-slate-400'}`}>
            <span>Annual Billing</span>
            <Badge variant="emerald" size="sm">Save 20%</Badge>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter Plan */}
          <Card variant="elevated" className="flex flex-col justify-between border-darkBorder">
            <div>
              <h3 className="text-base font-extrabold text-white">Starter Growth</h3>
              <p className="text-xs text-slate-400 mt-1">Perfect for small teams beginning WhatsApp automation.</p>
              <div className="my-5">
                <span className="text-3xl font-black text-white">{billingCycle === 'annual' ? '$79' : '$99'}</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> 2,500 monthly conversations</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> 3 team agent seats</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Standard visual workflow builder</li>
                <li className="flex items-center gap-2 text-slate-500"><CheckCircle2 className="h-4 w-4 text-slate-600 shrink-0" /> Dedicated SLA support</li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-darkBorder">
              <Button variant="outline" fullWidth size="md" onClick={() => handleUpgrade('Starter Growth')}>
                Downgrade to Starter
              </Button>
            </div>
          </Card>

          {/* Growth Pro Plan */}
          <Card variant="elevated" className="flex flex-col justify-between border-brandIndigo ring-2 ring-brandIndigo/40 relative">
            <span className="absolute -top-3 right-6 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider shadow-lg">
              Most Popular
            </span>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>Growth Pro</span>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-400 mt-1">Ideal for high-volume B2B sales and automated CRM routing.</p>
              <div className="my-5">
                <span className="text-3xl font-black text-white">{billingCycle === 'annual' ? '$199' : '$249'}</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> 10,000 monthly conversations</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> 15 team agent seats</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> AI keyword rule simulator & canvas</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Webhook API real-time sync</li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-darkBorder">
              <Button variant="primary" fullWidth size="md" disabled>
                Current Active Plan
              </Button>
            </div>
          </Card>

          {/* Enterprise Unlimited */}
          <Card variant="elevated" className="flex flex-col justify-between border-darkBorder">
            <div>
              <h3 className="text-base font-extrabold text-white">Enterprise Scale</h3>
              <p className="text-xs text-slate-400 mt-1">Custom infrastructure for massive enterprise broadcast throughput.</p>
              <div className="my-5">
                <span className="text-3xl font-black text-white">{billingCycle === 'annual' ? '$499' : '$599'}</span>
                <span className="text-xs text-slate-400"> / month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Unlimited API conversation quota</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Unlimited agent seats & RBAC</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Custom AI node models & routing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> 24/7 dedicated solutions architect</li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-darkBorder">
              <Button variant="success" fullWidth size="md" onClick={() => handleUpgrade('Enterprise Scale')}>
                Upgrade to Enterprise →
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Billing History Table */}
      <Card
        variant="elevated"
        header={
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" /> Invoice & Payment History
          </h3>
        }
        padding="none"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-darkBg/80 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-darkBorder">
                <th className="py-3.5 px-6">Invoice Number</th>
                <th className="py-3.5 px-4">Billing Date</th>
                <th className="py-3.5 px-4">Plan & Period</th>
                <th className="py-3.5 px-4">Amount Paid</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-6 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder/40 text-xs text-slate-200 font-mono">
              {[
                { id: 'INV-2026-0701', date: 'Jul 01, 2026', plan: 'Growth Pro (Annual)', amount: '$199.00', status: 'PAID' },
                { id: 'INV-2026-0601', date: 'Jun 01, 2026', plan: 'Growth Pro (Annual)', amount: '$199.00', status: 'PAID' },
                { id: 'INV-2026-0501', date: 'May 01, 2026', plan: 'Starter Growth (Monthly)', amount: '$99.00', status: 'PAID' },
              ].map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors font-sans">
                  <td className="py-3.5 px-6 font-bold text-white font-mono">{inv.id}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">{inv.date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{inv.plan}</td>
                  <td className="py-3.5 px-4 font-bold text-white font-mono">{inv.amount}</td>
                  <td className="py-3.5 px-4">
                    <Badge variant="emerald" size="sm">PAID</Badge>
                  </td>
                  <td className="py-3.5 px-6 text-right font-sans">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadInvoice(inv.id)}
                      leftIcon={<Download className="h-3.5 w-3.5" />}
                    >
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
