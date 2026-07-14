import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  Users, 
  Key, 
  FileSpreadsheet, 
  Settings,
  ChevronDown,
  MessageSquare,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  workspaces: any[];
  activeWorkspace: any;
  setActiveWorkspace: (w: any) => void;
  userRole: string;
}

export function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  workspaces, 
  activeWorkspace, 
  setActiveWorkspace,
  userRole 
}: SidebarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string }>({
    name: 'User',
    email: 'user@wa-saas.com'
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        // Use sub or fallback to placeholders.
        // If we want more info, we can read it. Let's use email and name placeholders or decoded details.
        setUserProfile({
          name: decodedPayload.email ? decodedPayload.email.split('@')[0] : 'Workspace Owner',
          email: decodedPayload.email || 'active-user@saas.com'
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const navItems = [
    { id: 'overview', name: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'analytics', name: 'Analytics Insights', icon: BarChart3 },
    { id: 'inbox', name: 'Conversation Inbox', icon: MessageSquare },
    { id: 'workflows', name: 'Workflow Automations', icon: Zap },
    { id: 'rules', name: 'Automation Rules', icon: Zap },
    { id: 'contacts', name: 'Contact Directory', icon: Users },
    { id: 'whatsapp', name: 'WhatsApp Setup', icon: Key },
    { id: 'logs', name: 'Message Activity Logs', icon: FileSpreadsheet },
    { id: 'workspace', name: 'Workspace Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-darkSurface border-r border-darkBorder flex flex-col h-screen sticky top-0 select-none z-10">
      {/* Workspace Switcher / Brand Header */}
      <div className="p-6 border-b border-darkBorder flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
            W
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white">WA-SaaS Platform</h1>
            <span className="text-xs text-slate-400">System Architect Engine</span>
          </div>
        </div>

        {/* Workspace Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between px-3 py-2 bg-darkBg border border-darkBorder rounded-lg cursor-pointer hover:border-brandIndigo/50 transition-colors"
          >
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Workspace</span>
              <span className="text-xs font-semibold text-slate-200 truncate max-w-[150px]">
                {activeWorkspace ? activeWorkspace.name : 'No Active Workspace'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>

          {dropdownOpen && workspaces.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-darkSurface border border-darkBorder rounded-lg shadow-xl overflow-hidden z-20">
              {workspaces.map((w) => (
                <div
                  key={w.id}
                  onClick={() => {
                    setActiveWorkspace(w);
                    setDropdownOpen(false);
                  }}
                  className={`px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer truncate ${
                    activeWorkspace && activeWorkspace.id === w.id ? 'bg-indigo-650/20 text-indigo-400 font-semibold' : ''
                  }`}
                >
                  {w.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium transition-all duration-150 outline-none ${
                isActive
                  ? 'bg-indigo-500/10 text-brandIndigo border-l-2 border-brandIndigo pl-3.5'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-brandIndigo' : 'text-slate-400'}`} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-darkBorder flex items-center gap-3 bg-darkBg/30">
        <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-slate-200 capitalize">
          {userProfile.name.slice(0, 2)}
        </div>
        <div className="flex-1 overflow-hidden text-left">
          <p className="text-xs font-medium text-slate-200 truncate capitalize">{userProfile.name} ({userRole})</p>
          <p className="text-[10px] text-slate-400 truncate">{userProfile.email}</p>
        </div>
        <button onClick={() => setCurrentTab('workspace')} className="text-slate-400 hover:text-white transition-colors">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
