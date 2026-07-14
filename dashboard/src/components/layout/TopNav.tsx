'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  User, 
  LogOut, 
  Settings, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ExternalLink,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface TopNavProps {
  activeWorkspace: any;
  currentTab: string;
  userRole: string;
  whatsappStatus: 'CONNECTED' | 'DISCONNECTED';
  convSocketStatus: string;
  chatSocketStatus: string;
  onOpenSearch?: () => void;
  onSelectTab: (tab: string) => void;
}

export function TopNav({
  activeWorkspace,
  currentTab,
  userRole,
  whatsappStatus,
  convSocketStatus,
  chatSocketStatus,
  onOpenSearch,
  onSelectTab
}: TopNavProps) {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<{ name: string; email: string }>({
    name: 'Workspace Owner',
    email: 'admin@wa-saas.com'
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decodedPayload = JSON.parse(atob(payloadBase64));
          setUserProfile({
            name: decodedPayload.email ? decodedPayload.email.split('@')[0] : 'Workspace Owner',
            email: decodedPayload.email || 'active-user@saas.com'
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/auth/login');
  };

  const getTabLabel = (id: string) => {
    const labels: Record<string, string> = {
      overview: 'Dashboard Overview',
      inbox: 'Conversation Inbox',
      contacts: 'Contact Directory',
      broadcast: 'Broadcast Messages',
      workflows: 'Visual Workflows',
      rules: 'Automation Rules',
      templates: 'Message Templates',
      campaigns: 'Marketing Campaigns',
      analytics: 'Analytics Suite',
      logs: 'Activity Logs',
      team: 'Team Management',
      whatsapp: 'WhatsApp Integrations',
      billing: 'Enterprise Billing',
      workspace: 'Workspace Settings'
    };
    return labels[id] || id.replace('-', ' ');
  };

  const isSocketConnected = convSocketStatus === 'CONNECTED' || convSocketStatus === 'READY' || chatSocketStatus === 'CONNECTED' || chatSocketStatus === 'READY';

  return (
    <header className="h-16 border-b border-darkBorder bg-darkSurface/90 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between gap-4 select-none">
      {/* Left Breadcrumb Context */}
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="font-semibold text-slate-300 truncate max-w-[140px]">
            {activeWorkspace?.name || 'Workspace'}
          </span>
          <span>/</span>
          <span className="text-indigo-400 font-bold capitalize truncate">
            {getTabLabel(currentTab)}
          </span>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-md mx-auto hidden md:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-darkBg border border-darkBorder/80 hover:border-indigo-500/50 text-slate-400 hover:text-slate-200 text-xs transition-all duration-150 group"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-500 group-hover:text-brandIndigo transition-colors" />
            <span>Search conversations, contacts, workflows...</span>
          </div>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-slate-800 border border-slate-700 rounded text-slate-300">
            <span>⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right Status Badges & Controls */}
      <div className="flex items-center gap-3">
        {/* Live WhatsApp Status Badge */}
        <div onClick={() => onSelectTab('whatsapp')} className="cursor-pointer">
          {whatsappStatus === 'CONNECTED' ? (
            <Badge variant="emerald" size="sm" pulse leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}>
              WhatsApp Connected
            </Badge>
          ) : (
            <Badge variant="amber" size="sm" leftIcon={<AlertTriangle className="h-3.5 w-3.5" />}>
              WhatsApp Offline
            </Badge>
          )}
        </div>

        {/* Real-time WebSocket Status */}
        <div className="hidden sm:block" title={`Conv Socket: ${convSocketStatus} | Chat Socket: ${chatSocketStatus}`}>
          {isSocketConnected ? (
            <Badge variant="indigo" size="sm" pulse leftIcon={<Wifi className="h-3.5 w-3.5" />}>
              Live Sync
            </Badge>
          ) : (
            <Badge variant="slate" size="sm" leftIcon={<WifiOff className="h-3.5 w-3.5" />}>
              Connecting...
            </Badge>
          )}
        </div>

        {/* Notifications Dropdown Trigger */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
            }}
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors relative outline-none"
            title="Notification Center"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brandIndigo ring-2 ring-darkSurface animate-pulse" />
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-darkCard border border-darkBorder rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-darkBorder bg-darkSurface/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">System Notifications</span>
                    <Badge variant="indigo" size="sm">New</Badge>
                  </div>
                  <button onClick={() => setIsNotifOpen(false)} className="text-[10px] text-indigo-400 hover:underline">
                    Mark all read
                  </button>
                </div>
                <div className="divide-y divide-darkBorder/40 max-h-80 overflow-y-auto">
                  <div className="p-3.5 hover:bg-slate-800/30 transition-colors cursor-pointer flex gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 h-fit">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">AI Engine Optimized</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Automated sentiment scoring is active for all incoming messages.
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">Just now</span>
                    </div>
                  </div>
                  <div className="p-3.5 hover:bg-slate-800/30 transition-colors cursor-pointer flex gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 h-fit">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">New Broadcast Template Approved</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Your WhatsApp template `welcome_offer_v2` is now ready for dispatch.
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">2 hours ago</span>
                    </div>
                  </div>
                </div>
                <div className="p-2.5 bg-darkSurface/50 text-center border-t border-darkBorder">
                  <button onClick={() => { setIsNotifOpen(false); onSelectTab('logs'); }} className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
                    View full activity logs →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Help Link */}
        <a
          href="https://developers.facebook.com/docs/whatsapp/cloud-api"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors hidden sm:block"
          title="WhatsApp Cloud API Docs"
        >
          <HelpCircle className="h-4.5 w-4.5" />
        </a>

        {/* Profile Menu Trigger */}
        <div className="relative">
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-darkBg border border-darkBorder hover:border-indigo-500/50 transition-all outline-none"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
              {userProfile.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 capitalize leading-none">
                {userProfile.name}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">
                {userRole}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-darkCard border border-darkBorder rounded-2xl shadow-2xl py-2 z-50"
              >
                <div className="px-4 py-2.5 border-b border-darkBorder/60">
                  <p className="text-xs font-bold text-white capitalize">{userProfile.name}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{userProfile.email}</p>
                  <div className="mt-2">
                    <Badge variant="purple" size="sm">{userRole}</Badge>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onSelectTab('workspace');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    <span>Account & Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onSelectTab('team');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span>Team & Permissions</span>
                  </button>
                </div>
                <div className="border-t border-darkBorder/60 pt-1 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
