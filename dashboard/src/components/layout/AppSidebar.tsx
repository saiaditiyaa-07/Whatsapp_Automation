'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Radio, 
  Zap, 
  Sliders, 
  FileText, 
  Megaphone, 
  BarChart3, 
  FileSpreadsheet, 
  UserPlus, 
  Key, 
  CreditCard, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Badge } from '../common/Badge';

interface AppSidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  workspaces: any[];
  activeWorkspace: any;
  setActiveWorkspace: (w: any) => void;
  userRole: string;
  onCreateWorkspace?: () => void;
}

export function AppSidebar({
  currentTab,
  setCurrentTab,
  workspaces,
  activeWorkspace,
  setActiveWorkspace,
  userRole,
  onCreateWorkspace
}: AppSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);

  const navigationGroups = [
    {
      group: 'Core',
      items: [
        { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
        { id: 'inbox', name: 'Inbox', icon: MessageSquare, badge: 'Live' },
        { id: 'contacts', name: 'Contacts CRM', icon: Users },
      ]
    },
    {
      group: 'Automation & Campaigns',
      items: [
        { id: 'broadcast', name: 'Broadcast Sender', icon: Radio },
        { id: 'workflows', name: 'Visual Workflows', icon: Zap, badge: 'AI' },
        { id: 'rules', name: 'Keyword Rules', icon: Sliders },
        { id: 'templates', name: 'Templates Directory', icon: FileText },
        { id: 'campaigns', name: 'Marketing Campaigns', icon: Megaphone },
      ]
    },
    {
      group: 'Analytics & Logs',
      items: [
        { id: 'analytics', name: 'Analytics Insights', icon: BarChart3 },
        { id: 'logs', name: 'Activity Logs', icon: FileSpreadsheet },
      ]
    },
    {
      group: 'Organization',
      items: [
        { id: 'team', name: 'Team & Roles', icon: UserPlus },
        { id: 'whatsapp', name: 'WhatsApp Setup', icon: Key },
        { id: 'billing', name: 'Billing & Quota', icon: CreditCard },
        { id: 'workspace', name: 'Settings', icon: Settings },
      ]
    }
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 260 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="bg-darkSurface border-r border-darkBorder flex flex-col h-screen sticky top-0 select-none z-40 overflow-hidden shrink-0"
    >
      {/* Top Brand & Workspace Selector Header */}
      <div className="p-4 border-b border-darkBorder flex flex-col gap-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-500/30 shrink-0">
              W
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <h1 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                  LeadWave Pro <Sparkles className="h-3 w-3 text-amber-400" />
                </h1>
                <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase block">
                  Enterprise B2B
                </span>
              </motion.div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors outline-none shrink-0"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Workspace Switcher Card */}
        {!isCollapsed && (
          <div className="relative mt-1">
            <div
              onClick={() => setIsWsDropdownOpen(!isWsDropdownOpen)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-darkBg border border-darkBorder/80 hover:border-indigo-500/50 cursor-pointer transition-all duration-150 group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-7 w-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                  {activeWorkspace ? activeWorkspace.name.slice(0, 1).toUpperCase() : 'W'}
                </div>
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Workspace</span>
                  <span className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                    {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
                  </span>
                </div>
              </div>
              <ChevronDown className={clsx('h-4 w-4 text-slate-400 transition-transform duration-150 shrink-0', isWsDropdownOpen && 'rotate-180 text-brandIndigo')} />
            </div>

            <AnimatePresence>
              {isWsDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-darkCard border border-darkBorder rounded-xl shadow-2xl overflow-hidden z-50 py-1.5"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-darkBorder/60">
                    Switch Workspace
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-darkBorder/30">
                    {workspaces.map((w) => {
                      const isActive = activeWorkspace && activeWorkspace.id === w.id;
                      return (
                        <div
                          key={w.id}
                          onClick={() => {
                            setActiveWorkspace(w);
                            setIsWsDropdownOpen(false);
                          }}
                          className={clsx(
                            'flex items-center justify-between px-3 py-2.5 text-xs transition-colors cursor-pointer',
                            isActive
                              ? 'bg-indigo-500/15 text-indigo-300 font-semibold pl-3 border-l-2 border-brandIndigo'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                          )}
                        >
                          <span className="truncate">{w.name}</span>
                          {isActive && <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                  {onCreateWorkspace && (
                    <div className="p-1.5 border-t border-darkBorder/60 bg-darkSurface/50">
                      <button
                        onClick={() => {
                          setIsWsDropdownOpen(false);
                          onCreateWorkspace();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-semibold text-xs transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Create New Workspace
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
        {navigationGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed ? (
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                {group.group}
              </h3>
            ) : (
              <div className="w-8 h-px bg-darkBorder mx-auto my-3" />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  title={isCollapsed ? item.name : undefined}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 outline-none relative group',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/20 to-indigo-600/5 text-indigo-300 shadow-sm border-l-2 border-brandIndigo'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  )}
                >
                  <Icon
                    className={clsx(
                      'h-4.5 w-4.5 shrink-0 transition-transform duration-150 group-hover:scale-110',
                      isActive ? 'text-brandIndigo' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 truncate text-left">{item.name}</span>
                      {item.badge && (
                        <span
                          className={clsx(
                            'px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider',
                            item.badge === 'Live'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer System Status Card */}
      <div className="p-3 border-t border-darkBorder bg-darkBg/60">
        {!isCollapsed ? (
          <div className="p-3 rounded-xl bg-darkCard/80 border border-darkBorder/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate">System Healthy</p>
                <p className="text-[10px] text-slate-500 truncate">v2.4.0 • 99.9% uptime</p>
              </div>
            </div>
            <Badge variant="slate" size="sm">Pro</Badge>
          </div>
        ) : (
          <div className="flex justify-center py-2" title="System Healthy (99.9% uptime)">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
