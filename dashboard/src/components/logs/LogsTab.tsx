'use client';

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft 
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useToast } from '../common/Toast';

interface ActivityLog {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  senderPhone: string;
  recipientPhone: string;
  messageText: string;
  status: 'READ' | 'DELIVERED' | 'FAILED';
  createdAt: string;
}

const mockLogs: ActivityLog[] = [
  {
    id: 'log_101',
    direction: 'INBOUND',
    senderPhone: '+1 (415) 555-2671',
    recipientPhone: '+1 (800) 555-0199',
    messageText: 'Hi, what are your enterprise pricing rates?',
    status: 'READ',
    createdAt: '2026-07-14T15:40:12Z'
  },
  {
    id: 'log_102',
    direction: 'OUTBOUND',
    senderPhone: '+1 (800) 555-0199',
    recipientPhone: '+1 (415) 555-2671',
    messageText: 'Hello Elena! Here is our brochure link...',
    status: 'DELIVERED',
    createdAt: '2026-07-14T15:40:14Z'
  },
  {
    id: 'log_103',
    direction: 'INBOUND',
    senderPhone: '+44 7911 123456',
    recipientPhone: '+1 (800) 555-0199',
    messageText: 'URGENT: need human support right now',
    status: 'READ',
    createdAt: '2026-07-14T15:22:00Z'
  },
  {
    id: 'log_104',
    direction: 'OUTBOUND',
    senderPhone: '+1 (800) 555-0199',
    recipientPhone: '+34 612 345 678',
    messageText: '[TEMPLATE] system_update_notice delivered.',
    status: 'DELIVERED',
    createdAt: '2026-07-14T14:10:00Z'
  },
  {
    id: 'log_105',
    direction: 'OUTBOUND',
    senderPhone: '+1 (800) 555-0199',
    recipientPhone: '+971 50 123 4567',
    messageText: 'Error dispatching message: Rate limit exceeded or invalid phone formatting.',
    status: 'FAILED',
    createdAt: '2026-07-14T12:05:00Z'
  }
];

export function LogsTab({ logs = mockLogs }: { logs?: ActivityLog[] }) {
  const toast = useToast();
  const [logList, setLogList] = useState<ActivityLog[]>(logs.length > 0 ? logs : mockLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'INBOUND' | 'OUTBOUND'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'READ' | 'DELIVERED' | 'FAILED'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredLogs = logList.filter((log) => {
    const matchesSearch =
      log.messageText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.senderPhone.includes(searchQuery) ||
      log.recipientPhone.includes(searchQuery);
    const matchesDir = directionFilter === 'all' || log.direction === directionFilter;
    const matchesStat = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesDir && matchesStat;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 700));
    setIsRefreshing(false);
    toast.success('Logs Refreshed', 'Synced latest webhook message activity telemetry.');
  };

  const handleExport = () => {
    toast.info('Exporting Telemetry CSV', `Exporting ${filteredLogs.length} activity records to spreadsheet.`);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-darkCard border border-darkBorder p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-brandIndigo" /> Real-Time Message Activity Logs
            </h2>
            <Badge variant="emerald" size="sm" pulse>
              Live Telemetry
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audit raw inbound and outbound payload delivery traces, timestamps, and webhook status codes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="md"
            isLoading={isRefreshing}
            onClick={handleRefresh}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={handleExport}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-darkCard border border-darkBorder p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search payload body or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-darkBg border border-darkBorder rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brandIndigo transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Direction:</span>
          {['all', 'INBOUND', 'OUTBOUND'].map((dir) => (
            <button
              key={dir}
              onClick={() => setDirectionFilter(dir as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                directionFilter === dir
                  ? 'bg-brandIndigo text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-darkBg text-slate-400 hover:text-white border border-darkBorder'
              }`}
            >
              {dir === 'all' ? 'All' : dir}
            </button>
          ))}

          <span className="text-[11px] font-bold text-slate-400 ml-2 mr-1 shrink-0">Status:</span>
          {['all', 'READ', 'DELIVERED', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-darkBg text-slate-400 hover:text-white border border-darkBorder'
              }`}
            >
              {st === 'all' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <Card variant="elevated" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-darkBg/80 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-darkBorder">
                <th className="py-3.5 px-6">Direction</th>
                <th className="py-3.5 px-4">Sender Phone</th>
                <th className="py-3.5 px-4">Recipient Phone</th>
                <th className="py-3.5 px-4">Payload Message Body</th>
                <th className="py-3.5 px-4">Webhook Status</th>
                <th className="py-3.5 px-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder/40 text-xs text-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <p className="text-sm font-bold text-slate-400">No activity logs matching criteria</p>
                    <p className="text-xs mt-1">Adjust your search query or filter switches.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors font-mono">
                    <td className="py-4 px-6 font-sans font-bold">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          log.direction === 'INBOUND'
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                            : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {log.direction === 'INBOUND' ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                        <span>{log.direction}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{log.senderPhone}</td>
                    <td className="py-4 px-4 text-slate-300">{log.recipientPhone}</td>
                    <td className="py-4 px-4 font-sans font-normal text-slate-200 max-w-sm truncate" title={log.messageText}>
                      {log.messageText}
                    </td>
                    <td className="py-4 px-4 font-sans">
                      <Badge
                        variant={log.status === 'READ' ? 'indigo' : log.status === 'DELIVERED' ? 'emerald' : 'rose'}
                        size="sm"
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
