import React from 'react';
import { 
  MessageSquare, 
  Zap, 
  Monitor, 
  Send, 
  ShieldCheck, 
  Volume2, 
  VolumeX,
  Sparkles,
  Terminal,
  Activity
} from 'lucide-react';
import { PCAgentStatus } from '../types';

export type TabType = 'chat' | 'automation' | 'pc_agent' | 'social' | 'audit';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingConfirmationsCount: number;
  alarmsCount: number;
  remindersCount: number;
  agentStatus: PCAgentStatus;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingConfirmationsCount,
  alarmsCount,
  remindersCount,
  agentStatus,
  voiceEnabled,
  onToggleVoice,
}) => {
  const navItems = [
    {
      id: 'chat' as TabType,
      label: 'Assistant Chat',
      labelBn: 'চ্যাট ও ভয়েস',
      icon: MessageSquare,
      badge: null,
      desc: 'Gemini function-enabled conversation',
    },
    {
      id: 'automation' as TabType,
      label: 'Automation Hub',
      labelBn: 'অটোমেশন ও অ্যালার্ম',
      icon: Zap,
      badge: (alarmsCount + remindersCount) > 0 ? (alarmsCount + remindersCount) : null,
      desc: 'Alarms, reminders, scheduled tasks',
    },
    {
      id: 'pc_agent' as TabType,
      label: 'PC Windows Agent',
      labelBn: 'উইন্ডোজ পিসি কন্ট্রোল',
      icon: Monitor,
      badge: agentStatus.connected ? 'ON' : 'OFF',
      badgeColor: agentStatus.connected ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-rose-950 text-rose-400 border-rose-800',
      desc: 'Local Python service & app launcher',
    },
    {
      id: 'social' as TabType,
      label: 'Social Assistant',
      labelBn: 'হোয়াটসঅ্যাপ ও মেসেঞ্জার',
      icon: Send,
      badge: null,
      desc: 'WhatsApp & Messenger message drafting',
    },
    {
      id: 'audit' as TabType,
      label: 'Security & Audit',
      labelBn: 'নিরাপত্তা ও কনফার্মেশন',
      icon: ShieldCheck,
      badge: pendingConfirmationsCount > 0 ? pendingConfirmationsCount : null,
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse',
      desc: 'Execution logs & authorizations',
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] select-none">
      {/* Navigation tabs */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          WORKSPACE
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between group transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 text-white border border-cyan-800/60 shadow-lg shadow-cyan-950/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className={`p-2 rounded-lg transition-colors ${
                  isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 group-hover:text-cyan-400 group-hover:bg-slate-800'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-sm font-medium tracking-tight truncate leading-tight">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-500 group-hover:text-slate-400 truncate font-bengali">
                    {item.labelBn}
                  </div>
                </div>
              </div>

              {item.badge !== null && (
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                  item.badgeColor || (isActive ? 'bg-cyan-900 text-cyan-200 border-cyan-700' : 'bg-slate-800 text-slate-300 border-slate-700')
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom system status card & voice toggle */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {/* PC Agent Quick Health */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Windows Agent
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
              agentStatus.connected
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                : 'bg-rose-950 text-rose-300 border border-rose-800/60'
            }`}>
              {agentStatus.connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 truncate">
            {agentStatus.connected 
              ? `${agentStatus.hostname || 'PC'} (${agentStatus.platform || 'Win32'})`
              : 'Local Python service not found'}
          </p>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
            {agentStatus.connected ? `v${agentStatus.version || '1.2.0'} • Port 5678` : 'Run python shihab_agent.py'}
          </div>
        </div>

        {/* Voice Feedback Toggle */}
        <button
          onClick={onToggleVoice}
          className={`w-full py-2 px-3 rounded-xl flex items-center justify-between text-xs font-medium border transition-colors ${
            voiceEnabled
              ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/30'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
        >
          <span className="flex items-center gap-2">
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            Voice TTS Response
          </span>
          <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
            {voiceEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Developer Attribution & Bengali Flag Accent */}
        <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between px-1">
          <span className="flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
            Shihab AI Engine
          </span>
          <span className="text-slate-400 font-mono">Gemini 3.8</span>
        </div>
      </div>
    </aside>
  );
};
