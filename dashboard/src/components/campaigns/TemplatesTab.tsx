'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Globe, 
  MessageSquare,
  Filter
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { Textarea } from '../common/Textarea';
import { useToast } from '../common/Toast';

interface Template {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  body: string;
  buttons?: string[];
  quality?: 'HIGH' | 'MEDIUM' | 'LOW';
}

const mockTemplates: Template[] = [
  {
    id: 't1',
    name: 'welcome_promo_v2',
    category: 'MARKETING',
    language: 'EN_US',
    status: 'APPROVED',
    body: 'Hello {{1}}! We are thrilled to announce our new Q3 features. Exclusive offer for you: {{2}}. Click below to claim or schedule a live walkthrough.',
    buttons: ['Claim Exclusive Offer', 'Book Walkthrough Call'],
    quality: 'HIGH'
  },
  {
    id: 't2',
    name: 'system_update_notice',
    category: 'UTILITY',
    language: 'EN_US',
    status: 'APPROVED',
    body: 'Hi {{1}}, scheduled maintenance for WhatsApp Cloud API endpoints will occur tonight from 02:00 to 04:00 UTC. Your status: {{2}}.',
    buttons: ['View Status Page'],
    quality: 'HIGH'
  },
  {
    id: 't3',
    name: 'payment_receipt_alert',
    category: 'UTILITY',
    language: 'EN_US',
    status: 'APPROVED',
    body: 'Dear {{1}}, your invoice for {{2}} has been successfully processed. Thank you for your continued partnership.',
    buttons: ['Download Invoice PDF'],
    quality: 'HIGH'
  },
  {
    id: 't4',
    name: 'account_verification_otp',
    category: 'AUTHENTICATION',
    language: 'EN_US',
    status: 'APPROVED',
    body: 'Your LeadWave security verification code is: {{1}}. Do not share this OTP with anyone. Code expires in 10 minutes.',
    buttons: ['Copy Code'],
    quality: 'HIGH'
  },
  {
    id: 't5',
    name: 'summer_discount_blast',
    category: 'MARKETING',
    language: 'ES_ES',
    status: 'PENDING',
    body: '¡Hola {{1}}! Gran descuento de verano disponible por tiempo limitado en todos los planes Enterprise: {{2}}.',
    buttons: ['Ver Descuentos']
  },
  {
    id: 't6',
    name: 'aggressive_sale_pitch',
    category: 'MARKETING',
    language: 'EN_US',
    status: 'REJECTED',
    body: 'BUY NOW! LIMITED TIME ONLY ALL CAPS PROMOTION WITH MULTIPLE EXCLAMATION MARKS!!! CLICK HERE!'
  }
];

export function TemplatesTab({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Template Modal state
  const [newTplName, setNewTplName] = useState('');
  const [newTplCategory, setNewTplCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [newTplBody, setNewTplBody] = useState('Hello {{1}}, thank you for reaching out regarding {{2}}.');

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.body.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim()) {
      toast.error('Validation Error', 'Template name is required (lowercase, underscores only).');
      return;
    }

    const newTpl: Template = {
      id: `t_${Date.now()}`,
      name: newTplName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      category: newTplCategory,
      language: 'EN_US',
      status: 'PENDING',
      body: newTplBody,
      buttons: ['Visit Website']
    };

    setTemplates([newTpl, ...templates]);
    setIsModalOpen(false);
    setNewTplName('');
    toast.success('Template Submitted to Meta', `Submitted "${newTpl.name}" for Meta Cloud API verification review.`);
  };

  const copyTemplateName = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.info('Template Name Copied', `${name} copied to clipboard.`);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-darkCard border border-darkBorder p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-brandIndigo" /> WhatsApp Message Templates Directory
            </h2>
            <Badge variant="indigo" size="sm">
              {templates.length} Templates
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse, test, and submit WhatsApp Cloud API structured templates approved by Meta for outbound broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="success"
            size="md"
            disabled={isReadOnly}
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Submit New Template to Meta
          </Button>
        </div>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approved & Live</p>
            <p className="text-lg font-black text-white">{templates.filter(t => t.status === 'APPROVED').length}</p>
          </div>
        </Card>

        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Review</p>
            <p className="text-lg font-black text-white">{templates.filter(t => t.status === 'PENDING').length}</p>
          </div>
        </Card>

        <Card variant="elevated" padding="sm" className="bg-darkSurface/80 border-darkBorder flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rejected by Meta</p>
            <p className="text-lg font-black text-white">{templates.filter(t => t.status === 'REJECTED').length}</p>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-darkCard border border-darkBorder p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search template name or message text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-darkBg border border-darkBorder rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['all', 'MARKETING', 'UTILITY', 'AUTHENTICATION'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                categoryFilter === cat
                  ? 'bg-brandIndigo text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-darkBg text-slate-400 hover:text-white border border-darkBorder'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => (
          <Card
            key={tpl.id}
            variant="elevated"
            className="flex flex-col justify-between hover:border-indigo-500/50 transition-all group relative"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-darkBorder/60 mb-3">
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white font-mono truncate">{tpl.name}</h3>
                    <button onClick={() => copyTemplateName(tpl.name)} className="text-slate-500 hover:text-white p-0.5" title="Copy ID">
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={tpl.category === 'MARKETING' ? 'purple' : tpl.category === 'UTILITY' ? 'cyan' : 'amber'} size="sm">
                      {tpl.category}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-semibold">{tpl.language}</span>
                  </div>
                </div>

                <Badge
                  variant={tpl.status === 'APPROVED' ? 'emerald' : tpl.status === 'PENDING' ? 'amber' : 'rose'}
                  size="sm"
                  pulse={tpl.status === 'PENDING'}
                >
                  {tpl.status}
                </Badge>
              </div>

              {/* Message Body Preview */}
              <div className="p-3 rounded-xl bg-darkBg border border-darkBorder/80 text-xs text-slate-300 font-sans leading-relaxed relative min-h-[96px]">
                <p className="whitespace-pre-wrap">{tpl.body}</p>
                {tpl.quality && (
                  <span className="absolute bottom-2 right-2 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    ★ {tpl.quality} Quality
                  </span>
                )}
              </div>

              {/* Button Samples */}
              {tpl.buttons && tpl.buttons.length > 0 && (
                <div className="space-y-1 mt-3">
                  {tpl.buttons.map((btn, idx) => (
                    <div
                      key={idx}
                      className="w-full text-center py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 truncate"
                    >
                      {btn}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-darkBorder/60 mt-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">ID: {tpl.id}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast.info('Previewing Template', `Selected template ${tpl.name} for broadcast setup.`)}
              >
                Use in Broadcast →
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* CREATE TEMPLATE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Meta Cloud API Template Verification"
        subtitle="Meta reviews new structured message templates within 2 to 24 hours for spam compliance."
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="md" onClick={handleCreateTemplate} leftIcon={<Sparkles className="h-4 w-4" />}>
              Submit to Meta Verification →
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <Input
            label="Template Unique Name (Lowercase & Underscores)"
            placeholder="e.g. q3_discount_announcement"
            value={newTplName}
            onChange={(e) => setNewTplName(e.target.value)}
            required
            helperText="Cannot contain uppercase or spaces. Use {{1}}, {{2}} for dynamic variables."
          />
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Template Category</label>
            <select
              value={newTplCategory}
              onChange={(e) => setNewTplCategory(e.target.value as any)}
              className="w-full bg-darkBg border border-darkBorder rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brandIndigo"
            >
              <option value="MARKETING">MARKETING (Promotions, Discounts, News)</option>
              <option value="UTILITY">UTILITY (Receipts, Account Alerts, Updates)</option>
              <option value="AUTHENTICATION">AUTHENTICATION (One-Time Passwords / OTP)</option>
            </select>
          </div>
          <Textarea
            label="Template Body with Variables"
            value={newTplBody}
            onChange={(e) => setNewTplBody(e.target.value)}
            placeholder="Hello {{1}}, we have a special update for your account: {{2}}..."
            required
          />
        </form>
      </Modal>
    </div>
  );
}
