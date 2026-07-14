'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  MessageSquare, 
  Zap, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Filter,
  RefreshCw,
  ArrowUpRight,
  Play,
  UserCheck,
  Cpu
} from 'lucide-react';
import { useWebSocketConnection } from '../../hooks/useWebSocketConnection';

interface AnalyticsDashboardProps {
  activeWorkspace: any;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

export default function AnalyticsDashboard({ activeWorkspace }: AnalyticsDashboardProps) {
  const [filterType, setFilterType] = useState<string>('last_7_days');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Analytics Metrics State
  const [kpis, setKpis] = useState<any>(null);
  const [msgData, setMsgData] = useState<any>(null);
  const [convData, setConvData] = useState<any>(null);
  const [wfData, setWfData] = useState<any>(null);
  const [perfData, setPerfData] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  // Fetch initial dashboard metrics
  const fetchMetrics = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const wsParam = `workspace_id=${activeWorkspace.id}`;
      const filterParam = `&filter_type=${filterType}${startDate ? `&start_date=${startDate}` : ''}${endDate ? `&end_date=${endDate}` : ''}`;

      // Parallel fetch to avoid waterfall latencies
      const [kpiRes, msgRes, convRes, wfRes, perfRes, liveRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/analytics/overview?${wsParam}`, { headers }),
        fetch(`${API_BASE}/api/v1/analytics/messages?${wsParam}${filterParam}`, { headers }),
        fetch(`${API_BASE}/api/v1/analytics/conversations?${wsParam}${filterParam}`, { headers }),
        fetch(`${API_BASE}/api/v1/analytics/workflows?${wsParam}${filterParam}`, { headers }),
        fetch(`${API_BASE}/api/v1/analytics/performance?${wsParam}${filterParam}`, { headers }),
        fetch(`${API_BASE}/api/v1/analytics/live?${wsParam}`, { headers })
      ]);

      if (!kpiRes.ok || !msgRes.ok || !convRes.ok || !wfRes.ok || !perfRes.ok || !liveRes.ok) {
        throw new Error("Failed to load dashboard metrics");
      }

      setKpis(await kpiRes.json());
      setMsgData(await msgRes.json());
      setConvData(await convRes.json());
      setWfData(await wfRes.json());
      setPerfData(await perfRes.json());
      setLiveEvents(await liveRes.json());
    } catch (err: any) {
      setError(err.message || "Connection failure");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, filterType, startDate, endDate]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // --- WebSocket Connection for real-time live events panel (no polling) ---
  const wsToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const wsUrl = activeWorkspace && wsToken
    ? `ws://localhost:8080/ws/conversations/${activeWorkspace.id}?token=${wsToken}`
    : null;

  useWebSocketConnection(wsUrl, {
    onMessage: (event) => {
      const { type, payload } = event as any;
      
      // Append real-time stream items to the top of the live panel
      const newEvent: any = {
        timestamp: new Date().toISOString(),
        workspace_id: activeWorkspace.id
      };

      if (type === 'message_received') {
        newEvent.event_type = 'new_incoming_message';
        newEvent.description = `Incoming message from customer`;
        newEvent.details = { text: payload.text || 'Media Message' };
        // Trigger quick KPIs update
        fetchMetrics();
      } else if (type === 'message_sent') {
        newEvent.event_type = 'agent_reply';
        newEvent.description = `Outbound message sent to customer`;
        newEvent.details = { text: payload.text || '' };
        fetchMetrics();
      } else if (type === 'conversation_created') {
        newEvent.event_type = 'new_conversation';
        newEvent.description = `New conversation created for customer`;
        fetchMetrics();
      } else if (type === 'workflow_executed') {
        newEvent.event_type = 'workflow_success';
        newEvent.description = `Workflow '${payload.workflow_name || 'Workflow'}' executed SUCCESS`;
        fetchMetrics();
      } else if (type === 'workflow_failed') {
        newEvent.event_type = 'workflow_failed';
        newEvent.description = `Workflow '${payload.workflow_name || 'Workflow'}' FAILED`;
        fetchMetrics();
      } else if (type === 'automation_triggered') {
        newEvent.event_type = 'automation_triggered';
        newEvent.description = `Automation triggered: '${payload.workflow_name || 'Workflow'}'`;
        fetchMetrics();
      } else {
        return;
      }

      setLiveEvents((prev) => [newEvent, ...prev.slice(0, 24)]);
    },
    enabled: !!wsUrl
  });

  if (isLoading && !kpis) {
    return (
      <div className="space-y-6 text-left animate-pulse">
        <div className="h-10 bg-slate-900 border border-slate-800 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-xl p-5"></div>
          ))}
        </div>
      </div>
    );
  }

  // Incoming vs Outgoing pie chart details mapping
  const pieData = msgData ? [
    { name: 'Incoming', value: msgData.incoming_vs_outgoing.incoming },
    { name: 'Outgoing', value: msgData.incoming_vs_outgoing.outgoing }
  ] : [];

  // Automation vs Human replies Donut chart details mapping
  const donutData = msgData ? [
    { name: 'Automation', value: msgData.automation_vs_human.automation },
    { name: 'Human Rep.', value: msgData.automation_vs_human.human }
  ] : [];

  return (
    <div className="space-y-6 text-left pb-12">
      
      {/* Filters and Search Bar Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-darkSurface border border-darkBorder p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Insight Filters</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-darkBg border border-darkBorder px-3 py-1.5 rounded-lg text-xs text-slate-200 focus:outline-none"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {filterType === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-darkBg border border-darkBorder px-3 py-1 text-xs text-slate-200 rounded-lg outline-none"
              />
              <span className="text-slate-500 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-darkBg border border-darkBorder px-3 py-1 text-xs text-slate-200 rounded-lg outline-none"
              />
            </div>
          )}

          <button
            onClick={fetchMetrics}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700 text-slate-400 hover:text-white"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1 */}
          <div className="bg-darkSurface border border-darkBorder p-5 rounded-xl flex flex-col justify-between hover:border-indigo-500/40 transition group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Messages Today</span>
              <MessageSquare size={16} className="text-indigo-400" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white tracking-tight">{kpis.messages_today}</div>
              <p className="text-[10px] text-slate-500 mt-1">Sent / received today</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-darkSurface border border-darkBorder p-5 rounded-xl flex flex-col justify-between hover:border-indigo-500/40 transition group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Messages This Week</span>
              <MessageSquare size={16} className="text-purple-400" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white tracking-tight">{kpis.messages_this_week}</div>
              <p className="text-[10px] text-slate-500 mt-1">Weekly volume sum</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-darkSurface border border-darkBorder p-5 rounded-xl flex flex-col justify-between hover:border-indigo-500/40 transition group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Chats</span>
              <Users size={16} className="text-emerald-400" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white tracking-tight">{kpis.active_conversations}</div>
              <p className="text-[10px] text-slate-500 mt-1">Total open conversations</p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-darkSurface border border-darkBorder p-5 rounded-xl flex flex-col justify-between hover:border-indigo-500/40 transition group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Chats</span>
              <Users size={16} className="text-blue-400" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white tracking-tight">{kpis.total_conversations}</div>
              <p className="text-[10px] text-slate-500 mt-1">Historical chat sessions</p>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-darkSurface border border-darkBorder p-5 rounded-xl flex flex-col justify-between hover:border-indigo-500/40 transition group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Customers</span>
              <Users size={16} className="text-pink-400" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white tracking-tight">{kpis.total_customers}</div>
              <p className="text-[10px] text-slate-500 mt-1">Distinct contact numbers</p>
            </div>
          </div>

          {/* Card 6 */}
          <div className="bg-darkSurface border border-darkBorder p-5 rounded-xl flex flex-col justify-between hover:border-indigo-500/40 transition group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auto Success Rate</span>
              <Zap size={16} className="text-amber-400" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-emerald-400 tracking-tight">{kpis.automation_success_rate}%</div>
              <p className="text-[10px] text-slate-500 mt-1">Success execution status</p>
            </div>
          </div>

          {/* Card 7 */}
          <div className="bg-darkSurface border border-darkBorder p-5 rounded-xl flex flex-col justify-between hover:border-indigo-500/40 transition group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Executions Today</span>
              <Play size={16} className="text-sky-400" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white tracking-tight">{kpis.workflow_executions_today}</div>
              <p className="text-[10px] text-slate-500 mt-1">Active compiler steps run</p>
            </div>
          </div>

          {/* Card 8 */}
          <div className="bg-darkSurface border border-darkBorder p-5 rounded-xl flex flex-col justify-between hover:border-indigo-500/40 transition group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failed Executions</span>
              <AlertTriangle size={16} className="text-rose-400" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-rose-400 tracking-tight">{kpis.failed_executions}</div>
              <p className="text-[10px] text-slate-500 mt-1">Failed automation paths</p>
            </div>
          </div>

          {/* Card 9 */}
          <div className="bg-darkSurface border border-darkBorder p-5 rounded-xl flex flex-col justify-between hover:border-indigo-500/40 transition group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Response Time</span>
              <Clock size={16} className="text-teal-400" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white tracking-tight">{kpis.avg_response_time_seconds}s</div>
              <p className="text-[10px] text-slate-500 mt-1">Inbound reply delay average</p>
            </div>
          </div>

          {/* Card 10 */}
          <div className="bg-darkSurface border border-darkBorder p-5 rounded-xl flex flex-col justify-between hover:border-indigo-500/40 transition group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Chat Duration</span>
              <Clock size={16} className="text-orange-400" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-white tracking-tight">{(kpis.avg_conversation_duration_seconds / 60).toFixed(1)}m</div>
              <p className="text-[10px] text-slate-500 mt-1">Start to archive average</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Messages volume trend */}
        <div className="lg:col-span-2 bg-darkSurface border border-darkBorder p-6 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-6">Daily Messaging Volume</h3>
          <div className="h-72">
            {msgData?.messages_per_day?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={msgData.messages_per_day}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">No messaging volume data for this period.</div>
            )}
          </div>
        </div>

        {/* Messaging Distribution (Pie & Donut) */}
        <div className="bg-darkSurface border border-darkBorder p-6 rounded-xl flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-white mb-4">Messaging Mix</h3>
          
          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Pie Chart: Incoming vs Outgoing */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">Direction</span>
              <div className="h-28 w-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-2 text-[10px] mt-2">
                <span className="text-indigo-400 font-semibold">Incoming</span>
                <span className="text-emerald-400 font-semibold">Outgoing</span>
              </div>
            </div>

            {/* Donut Chart: Automation vs Human */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">Reply Mode</span>
              <div className="h-28 w-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={40}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-2 text-[10px] mt-2">
                <span className="text-amber-400 font-semibold">Auto</span>
                <span className="text-rose-400 font-semibold">Human</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Executions Area Graph */}
        <div className="lg:col-span-2 bg-darkSurface border border-darkBorder p-6 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-6">Workflow Automations Executions Trend</h3>
          <div className="h-72">
            {wfData?.executions_per_day?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={wfData.executions_per_day}>
                  <defs>
                    <linearGradient id="colorExecs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExecs)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">No workflow executions in this time range.</div>
            )}
          </div>
        </div>

        {/* Workflow Ranking (Top 10 executed) */}
        <div className="bg-darkSurface border border-darkBorder p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Top Executed Workflows</h3>
            <div className="space-y-3">
              {wfData?.top_executed_workflows?.length > 0 ? (
                wfData.top_executed_workflows.map((w: any, idx: number) => (
                  <div key={w.workflow_id} className="flex items-center justify-between p-2 bg-darkBg border border-darkBorder rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden text-left">
                      <span className="text-[10px] font-bold text-slate-500">{idx + 1}.</span>
                      <span className="text-xs text-slate-200 font-medium truncate max-w-[130px]">{w.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-purple-400 bg-purple-950/40 px-2 py-0.5 border border-purple-900/50 rounded-full">{w.count} runs</span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-slate-500 text-xs text-center">No workflows executed yet.</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Live Event Panel and Detailed Statistics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Conversation metrics summary */}
        {convData && (
          <div className="bg-darkSurface border border-darkBorder p-6 rounded-xl flex flex-col gap-6">
            <h3 className="text-sm font-semibold text-white">Conversation Detail Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-darkBg border border-darkBorder rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">New Conversations</span>
                <span className="text-lg font-bold text-white block mt-1">{convData.new_conversations}</span>
              </div>
              <div className="p-3 bg-darkBg border border-darkBorder rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Closed Conversations</span>
                <span className="text-lg font-bold text-slate-400 block mt-1">{convData.closed_conversations}</span>
              </div>
              <div className="p-3 bg-darkBg border border-darkBorder rounded-xl col-span-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Longest Conversation</span>
                <span className="text-sm font-bold text-indigo-400 block mt-1">{(convData.longest_conversation_seconds / 3600).toFixed(1)} hours</span>
              </div>
              <div className="p-3 bg-darkBg border border-darkBorder rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Fastest Response</span>
                <span className="text-sm font-bold text-emerald-400 block mt-1">{convData.fastest_response_seconds}s</span>
              </div>
              <div className="p-3 bg-darkBg border border-darkBorder rounded-xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Slowest Response</span>
                <span className="text-sm font-bold text-rose-400 block mt-1">{(convData.slowest_response_seconds / 60).toFixed(1)} mins</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Activity panel driven entirely by WebSockets */}
        <div className="lg:col-span-2 bg-darkSurface border border-darkBorder p-6 rounded-xl flex flex-col justify-between">
          <div className="text-left">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Live Activity Stream</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Real-time connection alerts and execution triggers</p>
              </div>
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-400 px-2 py-0.5 border border-indigo-900/50 bg-indigo-950/20 rounded-full animate-pulse">
                ● Live WebSocket Connection
              </span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {liveEvents.length > 0 ? (
                liveEvents.map((evt: any, i: number) => {
                  const isIncoming = evt.event_type === 'new_incoming_message';
                  const isReply = evt.event_type === 'agent_reply';
                  const isSuccess = evt.event_type === 'workflow_success';
                  const isFail = evt.event_type === 'workflow_failed';

                  return (
                    <div 
                      key={i} 
                      className="flex items-start justify-between gap-4 p-3 bg-darkBg/60 border border-darkBorder/40 rounded-xl hover:border-slate-700 transition"
                    >
                      <div className="flex items-start gap-3 text-left overflow-hidden">
                        <div className="mt-0.5">
                          {isIncoming && <Users size={14} className="text-indigo-400" />}
                          {isReply && <UserCheck size={14} className="text-emerald-400" />}
                          {isSuccess && <Cpu size={14} className="text-purple-400" />}
                          {isFail && <AlertTriangle size={14} className="text-rose-400" />}
                          {!isIncoming && !isReply && !isSuccess && !isFail && <Play size={14} className="text-slate-400" />}
                        </div>
                        <div>
                          <span className={`text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isIncoming ? 'bg-indigo-500/10 text-indigo-400' :
                            isReply ? 'bg-emerald-500/10 text-emerald-400' :
                            isSuccess ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {evt.event_type.replace('_', ' ')}
                          </span>
                          <p className="text-xs text-slate-200 mt-1.5 font-medium">{evt.description}</p>
                          {evt.details?.text && (
                            <p className="text-[10px] text-slate-400 mt-1 italic line-clamp-1">"{evt.details.text}"</p>
                          )}
                        </div>
                      </div>
                      
                      <span className="text-[9px] text-slate-500 shrink-0 font-mono">
                        {new Date(evt.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center text-slate-500 text-xs">No live workspace events recorded yet.</div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
