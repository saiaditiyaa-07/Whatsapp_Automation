'use client';

import React, { useState } from 'react';
import { 
  Sliders, 
  Zap, 
  Plus, 
  Search, 
  FileText, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  MessageSquare,
  HelpCircle,
  Play
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { Rule, RuleTable } from '../RuleTable';
import { AddRuleModal } from '../AddRuleModal';

interface RulesTabProps {
  rules?: Rule[];
  onAddRule?: (data: { triggerKeyword: string; replyText: string | null; templateId: string | null }) => Promise<void> | void;
  onToggleActive?: (id: string) => Promise<void> | void;
  onDeleteRule?: (id: string) => Promise<void> | void;
  isReadOnly?: boolean;
}

const defaultRules: Rule[] = [
  {
    id: 'r_1',
    triggerKeyword: 'pricing',
    replyText: 'Hello! Here is our enterprise pricing brochure: https://leadwave.pro/pricing. Feel free to ask if you need a custom quote!',
    templateId: null,
    isActive: true,
    createdAt: '2026-07-10T12:00:00Z'
  },
  {
    id: 'r_2',
    triggerKeyword: 'support',
    replyText: null,
    templateId: 'system_update_notice',
    isActive: true,
    createdAt: '2026-07-11T14:30:00Z'
  },
  {
    id: 'r_3',
    triggerKeyword: 'demo',
    replyText: 'Awesome! You can schedule a 1-on-1 walkthrough with our solutions architect directly at: https://calendly.com/leadwave-demo',
    templateId: null,
    isActive: true,
    createdAt: '2026-07-12T09:15:00Z'
  },
  {
    id: 'r_4',
    triggerKeyword: 'help',
    replyText: 'Our AI assistant is checking your account. If this is urgent, reply with URGENT to connect with a senior support engineer.',
    templateId: null,
    isActive: false,
    createdAt: '2026-07-13T16:45:00Z'
  }
];

export function RulesTab({
  rules = defaultRules,
  onAddRule,
  onToggleActive,
  onDeleteRule,
  isReadOnly = false
}: RulesTabProps) {
  const toast = useToast();
  const [ruleList, setRuleList] = useState<Rule[]>(rules.length > 0 ? rules : defaultRules);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Simulation tester state
  const [testInput, setTestInput] = useState('');
  const [simResult, setSimResult] = useState<string | null>(null);

  const filteredRules = ruleList.filter((r) =>
    r.triggerKeyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.replyText || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.templateId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = async (id: string) => {
    if (onToggleActive) {
      await onToggleActive(id);
    } else {
      setRuleList(ruleList.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
      toast.info('Rule Status Updated', 'Keyword trigger state toggled.');
    }
  };

  const handleDelete = async (id: string) => {
    if (onDeleteRule) {
      await onDeleteRule(id);
    } else {
      setRuleList(ruleList.filter(r => r.id !== id));
      toast.warning('Rule Deleted', 'Keyword trigger removed from automation set.');
    }
  };

  const handleCreate = async (data: { triggerKeyword: string; replyText: string | null; templateId: string | null }) => {
    if (onAddRule) {
      await onAddRule(data);
    } else {
      const newR: Rule = {
        id: `r_${Date.now()}`,
        triggerKeyword: data.triggerKeyword.toLowerCase(),
        replyText: data.replyText,
        templateId: data.templateId,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      setRuleList([newR, ...ruleList]);
      toast.success('Rule Created', `Keyword "${newR.triggerKeyword}" active.`);
    }
  };

  const runSimulation = () => {
    if (!testInput.trim()) return;
    const match = ruleList.find(r => r.isActive && testInput.toLowerCase().includes(r.triggerKeyword.toLowerCase()));
    if (match) {
      setSimResult(`✅ Matched Rule [keyword: "${match.triggerKeyword}"] → ${match.templateId ? `Send Template "${match.templateId}"` : `Reply: "${match.replyText}"`}`);
      toast.success('Trigger Matched', `Rule "${match.triggerKeyword}" fired.`);
    } else {
      setSimResult(`❌ No active rule matched "${testInput}". Message will route to default AI/Human Inbox.`);
      toast.info('No Match', 'No keyword trigger found in test string.');
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-darkCard border border-darkBorder p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Sliders className="h-5 w-5 text-brandIndigo" /> Automated Keyword Rules & Triggers
            </h2>
            <Badge variant="indigo" size="sm">
              {ruleList.length} Rules
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Instantly intercept customer WhatsApp messages matching exact keywords to fire templates or instant text replies.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="success"
            size="md"
            disabled={isReadOnly}
            onClick={() => setIsAddOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create New Rule
          </Button>
        </div>
      </div>

      {/* Simulator Box */}
      <Card
        variant="elevated"
        header={
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Play className="h-4 w-4 text-emerald-400" /> Live Rule Simulator & Sandbox
          </h3>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            Type any mock incoming customer message below to test if your active rules trigger exactly as expected:
          </p>
          <div className="flex items-center gap-2">
            <Input
              placeholder="e.g. Hi, what are your pricing options for 100 agents?"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSimulation()}
            />
            <Button variant="primary" size="md" onClick={runSimulation} leftIcon={<Play className="h-3.5 w-3.5" />}>
              Test Trigger
            </Button>
          </div>
          {simResult && (
            <div className={`p-3 rounded-xl border text-xs font-mono ${
              simResult.startsWith('✅') ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}>
              {simResult}
            </div>
          )}
        </div>
      </Card>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-darkCard border border-darkBorder p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search keyword trigger or reply text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-darkBg border border-darkBorder rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo transition-all"
          />
        </div>
        <Badge variant="purple" size="sm">Regex & Exact Case-Insensitive</Badge>
      </div>

      {/* Rules Table Component */}
      <RuleTable
        rules={filteredRules}
        onToggleActive={handleToggle}
        onDelete={handleDelete}
      />

      {/* Add Rule Modal */}
      <AddRuleModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
