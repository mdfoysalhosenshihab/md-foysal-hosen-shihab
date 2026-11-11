import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Wifi, 
  WifiOff, 
  Clock, 
  Bell, 
  Settings as SettingsIcon, 
  Languages, 
  Battery, 
  BatteryCharging,
  ShieldCheck
} from 'lucide-react';
import { PCAgentStatus } from '../types';

interface HeaderProps {
  agentStatus: PCAgentStatus;
  onRefreshAgent: () => void;
  onOpenSettings: () => void;
  activeAlarmsCount: number;
  activeRemindersCount: number;
  selectedLanguage: 'auto' | 'bn' | 'en';
  onLanguageChange: (lang: 'auto' | 'bn' | 'en') => void;
  isAiThinking?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  agentStatus,
  onRefreshAgent,
  onOpenSettings,
  activeAlarmsCount,
  activeRemindersCount,
  selectedLanguage,
  onLanguageChange,
  isAiThinking = false,
}) => {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between select-none z-30 sticky top-0">
      {/* Brand & AI Core Status */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-600 shadow-lg shadow-cyan-500/20 ${isAiThinking ? 'animate-pulse ring-2 ring-cyan-400' : ''}`}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          {/* Pulsing indicator orb */}
          <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
            isAiThinking 
              ? 'bg-amber-400 animate-ping' 
              : agentStatus.connected 
                ? 'bg-emerald-400' 
                : 'bg-rose-400'
          }`} />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              Shihab <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">AI</span>
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono">
              v2.5 Fluent
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            বাংলা ও English Desktop Assistant
          </p>
        </div>
      </div>

      {/* Center status items */}
      <div className="hidden md:flex items-center space-x-3">
        {/* Real Clock */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 text-xs">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono font-medium">{time}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{dateStr}</span>
        </div>

        {/* Local PC Windows Agent Status */}
        <button
          onClick={onRefreshAgent}
          title={agentStatus.connected ? `Connected to ${agentStatus.hostname || 'PC'} (${agentStatus.platform || 'Windows'})` : 'Click to reconnect local agent'}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            agentStatus.connected
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/30'
              : 'bg-rose-950/30 border-rose-800/50 text-rose-300 hover:bg-rose-900/30'
          }`}
        >
          {agentStatus.connected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>PC Agent: Online</span>
              {agentStatus.battery && agentStatus.battery.percentage !== null && (
                <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 ml-1">
                  {agentStatus.battery.ac_online ? (
                    <BatteryCharging className="w-3 h-3 text-emerald-300" />
                  ) : (
                    <Battery className="w-3 h-3 text-emerald-300" />
                  )}
                  {agentStatus.battery.percentage}%
                </span>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span>PC Agent: Offline</span>
              <span className="text-[10px] bg-rose-900/60 px-1 rounded text-rose-200">Recheck</span>
            </>
          )}
        </button>

        {/* Active Alarms & Reminders */}
        {(activeAlarmsCount > 0 || activeRemindersCount > 0) && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-indigo-300 text-xs">
            <Bell className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
            <span>{activeAlarmsCount} Alarms</span>
            <span className="text-indigo-600">•</span>
            <span>{activeRemindersCount} Reminders</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        {/* Language selector toggle */}
        <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
          <button
            onClick={() => onLanguageChange('auto')}
            className={`px-2 py-1 rounded transition-all ${
              selectedLanguage === 'auto'
                ? 'bg-cyan-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Auto detect Bengali or English"
          >
            Auto
          </button>
          <button
            onClick={() => onLanguageChange('bn')}
            className={`px-2 py-1 rounded transition-all ${
              selectedLanguage === 'bn'
                ? 'bg-cyan-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="বাংলা মোড"
          >
            বাংলা
          </button>
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-2 py-1 rounded transition-all ${
              selectedLanguage === 'en'
                ? 'bg-cyan-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="English Mode"
          >
            EN
          </button>
        </div>

        {/* Security Shield badge */}
        <div 
          className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs"
          title="Safe Mode: Explicit confirmation required before sensitive PC operations"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px]">Safe Guard</span>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
          title="Assistant & Agent Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
