import React, { useState } from 'react';
import { 
  Monitor, 
  Terminal, 
  Folder, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Play, 
  Lock, 
  FolderOpen, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  HardDrive, 
  Battery, 
  BatteryCharging,
  ShieldCheck,
  Code2
} from 'lucide-react';
import { PCAgentStatus, PCCommandLog } from '../types';
import { pcAgent } from '../services/pcAgentService';
import { soundEffects } from '../services/audioService';

interface PCAgentViewProps {
  agentStatus: PCAgentStatus;
  onRefreshAgent: () => Promise<void>;
  commandLogs: PCCommandLog[];
  onClearLogs: () => void;
  onRequestConfirmation: (
    title: string,
    description: string,
    severity: 'low' | 'medium' | 'high',
    actionType: string,
    payload: any,
    callback: () => Promise<void>
  ) => void;
}

export const PCAgentView: React.FC<PCAgentViewProps> = ({
  agentStatus,
  onRefreshAgent,
  commandLogs,
  onClearLogs,
  onRequestConfirmation,
}) => {
  const [activeTab, setActiveTab] = useState<'launcher' | 'files' | 'setup' | 'logs'>('launcher');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // File explorer state
  const [filePath, setFilePath] = useState('Documents');
  const [fileList, setFileList] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshAgent();
    setIsRefreshing(false);
  };

  const handleStartAgent = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/pc-agent/start', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        soundEffects.playSuccess();
        setActionNotice({
          type: 'success',
          message: 'Local Agent is now ONLINE and ready for commands!',
        });
        await onRefreshAgent();
      } else {
        setActionNotice({
          type: 'error',
          message: data.message || 'Could not start agent service.',
        });
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLaunchApp = (appName: string, label: string) => {
    if (!agentStatus.connected) {
      setActionNotice({
        type: 'error',
        message: 'Cannot launch: Local Python Windows agent is offline. Run `python shihab_agent.py` on your Windows PC first.',
      });
      return;
    }

    onRequestConfirmation(
      `Launch ${label}?`,
      `Shihab AI will send an authorized command to launch '${appName}' on your Windows machine via the local Python agent.`,
      'medium',
      'launch_app',
      { appName },
      async () => {
        setActionNotice(null);
        const res = await pcAgent.launchApplication(appName);
        if (res.success) {
          soundEffects.playSuccess();
          setActionNotice({
            type: 'success',
            message: `Successfully launched ${label} on Windows! (PID: ${res.pid})`,
          });
        } else {
          setActionNotice({
            type: 'error',
            message: `Failed to launch ${label}: ${res.error || res.message}`,
          });
        }
      }
    );
  };

  const handleSystemLock = () => {
    if (!agentStatus.connected) {
      setActionNotice({
        type: 'error',
        message: 'Local agent is offline. Workstation lock cannot be performed without local service.',
      });
      return;
    }

    onRequestConfirmation(
      'Lock Windows Workstation?',
      'This will immediately lock your Windows PC session (equivalent to Win+L).',
      'high',
      'system_lock',
      { action: 'lock' },
      async () => {
        const res = await pcAgent.systemAction('lock');
        if (res.success) {
          soundEffects.playSuccess();
          setActionNotice({ type: 'success', message: 'Workstation locked successfully.' });
        } else {
          setActionNotice({ type: 'error', message: res.error || 'Failed to lock workstation' });
        }
      }
    );
  };

  const handleBrowseFiles = async (targetPath = filePath) => {
    if (!agentStatus.connected) {
      setFileError('Agent is offline. Start python shihab_agent.py on your Windows PC to browse local files.');
      return;
    }
    setIsLoadingFiles(true);
    setFileError(null);
    try {
      const res = await pcAgent.listFiles(targetPath);
      if (res.success) {
        setFileList(res.items || []);
        if (res.path) setFilePath(res.path);
      } else {
        setFileError(res.error || 'Failed to list directory contents');
      }
    } catch (e: any) {
      setFileError(e.message);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleOpenExplorer = async (targetPath = filePath) => {
    if (!agentStatus.connected) {
      setActionNotice({
        type: 'error',
        message: 'Local agent is offline. Explorer cannot be opened.',
      });
      return;
    }
    const res = await pcAgent.openInExplorer(targetPath);
    if (res.success) {
      soundEffects.playSuccess();
      setActionNotice({ type: 'success', message: `Opened ${targetPath} in Windows Explorer!` });
    } else {
      setActionNotice({ type: 'error', message: res.error || 'Failed to open in Explorer' });
    }
  };

  const handleDownloadScript = () => {
    window.open('/api/agent-script', '_blank');
  };

  const handleCopyScript = async () => {
    try {
      const res = await fetch('/api/agent-script');
      const text = await res.text();
      navigator.clipboard.writeText(text);
      setCopiedScript(true);
      soundEffects.playSuccess();
      setTimeout(() => setCopiedScript(false), 2500);
    } catch (e) {
      alert('Could not copy agent script.');
    }
  };

  const commonApps = [
    { id: 'notepad', label: 'Notepad', icon: '📝', desc: 'Windows Text Editor' },
    { id: 'calc', label: 'Calculator', icon: '🧮', desc: 'Windows Calculator' },
    { id: 'chrome', label: 'Google Chrome', icon: '🌐', desc: 'Web Browser' },
    { id: 'edge', label: 'Microsoft Edge', icon: '🌍', desc: 'Default Windows Browser' },
    { id: 'code', label: 'VS Code', icon: '💻', desc: 'Visual Studio Code' },
    { id: 'explorer', label: 'File Explorer', icon: '📁', desc: 'Windows File Explorer' },
    { id: 'taskmgr', label: 'Task Manager', icon: '📊', desc: 'Process & Performance Monitor' },
    { id: 'cmd', label: 'Command Prompt', icon: '⬛', desc: 'cmd.exe Terminal' },
    { id: 'powershell', label: 'PowerShell', icon: '🟦', desc: 'PowerShell Console' },
    { id: 'settings', label: 'Windows Settings', icon: '⚙️', desc: 'System Configuration' },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Monitor className="w-6 h-6 text-cyan-400" />
              Windows PC Local Agent Hub
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Direct, secure bridge to your Windows PC via local Python service. No simulation or fake claims.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {!agentStatus.connected && (
              <button
                onClick={handleStartAgent}
                disabled={isRefreshing}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Bring Online</span>
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Recheck Connection</span>
            </button>
          </div>
        </div>

        {/* Live Status & Hardware Telemetry Banner */}
        <div className={`p-5 rounded-2xl border transition-all ${
          agentStatus.connected
            ? 'bg-emerald-950/20 border-emerald-800/60 shadow-lg shadow-emerald-950/20'
            : 'bg-rose-950/20 border-rose-800/50 shadow-lg shadow-rose-950/20'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className={`p-3 rounded-xl ${
                agentStatus.connected ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'
              }`}>
                {agentStatus.connected ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {agentStatus.connected ? 'Local Python Agent is ACTIVE' : 'Local Agent NOT CONNECTED'}
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    agentStatus.connected
                      ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
                      : 'bg-rose-900/80 text-rose-200 border border-rose-700'
                  }`}>
                    {agentStatus.connected ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-1">
                  {agentStatus.connected
                    ? `Host: ${agentStatus.hostname || 'Windows PC'} • User: ${agentStatus.user || 'Admin'} • Python ${agentStatus.python_version || '3.x'} (${agentStatus.platform || 'Windows'})`
                    : 'Targeting http://localhost:5678. Click Bring Online or run `python shihab_agent.py` on your Windows PC.'}
                </p>
              </div>
            </div>

            {/* Quick System specs */}
            {agentStatus.connected ? (
              <div className="flex items-center gap-4 text-xs font-mono bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>{agentStatus.cpu_count || 4} Cores</span>
                </div>

                {agentStatus.battery && agentStatus.battery.percentage !== null && (
                  <div className="flex items-center gap-1.5 text-slate-300 border-l border-slate-700 pl-4">
                    {agentStatus.battery.ac_online ? (
                      <BatteryCharging className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Battery className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>{agentStatus.battery.percentage}% {agentStatus.battery.ac_online ? '(AC)' : ''}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartAgent}
                  disabled={isRefreshing}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Bring Agent Online</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className={`p-4 rounded-xl flex items-center justify-between text-xs animate-in fade-in ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800'
              : 'bg-rose-950/80 text-rose-200 border border-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{actionNotice.message}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-slate-400 hover:text-white ml-2 text-sm"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setActiveTab('launcher')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'launcher'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>App Launcher</span>
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'files'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>File Explorer</span>
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'setup'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Download Agent Script</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'logs'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Execution Audit ({commandLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: HONEST APP LAUNCHER */}
        {activeTab === 'launcher' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Verified Windows Applications</h2>
                <p className="text-xs text-slate-400">
                  {agentStatus.connected
                    ? 'Clicking prompts user authorization before sending real execution command to the Python agent.'
                    : 'Apps are locked when the agent is offline to prevent fake execution claims.'}
                </p>
              </div>

              {agentStatus.connected && (
                <button
                  onClick={handleSystemLock}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-medium flex items-center gap-2 transition-colors"
                  title="Lock workstation (Win+L)"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Lock PC Workstation</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {commonApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleLaunchApp(app.id, app.label)}
                  disabled={!agentStatus.connected}
                  className={`p-4 rounded-2xl border text-left flex items-start space-x-3.5 transition-all group ${
                    agentStatus.connected
                      ? 'bg-slate-900/90 border-slate-800 hover:border-cyan-700 hover:bg-slate-800/80 shadow-sm cursor-pointer'
                      : 'bg-slate-950/40 border-slate-900 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="text-2xl p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 group-hover:scale-105 transition-transform">
                    {app.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-sm group-hover:text-cyan-300 transition-colors">
                        {app.label}
                      </span>
                      {agentStatus.connected ? (
                        <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{app.desc}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">cmd: {app.id}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: FILE EXPLORER */}
        {activeTab === 'files' && (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">Local Windows File Manager</h2>
              <p className="text-xs text-slate-400">
                Browse directories or launch Windows Explorer paths on your PC through the agent.
              </p>
            </div>

            {/* Quick folder shortcuts */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400">Shortcuts:</span>
              {['Documents', 'Downloads', 'Desktop', 'C:\\'].map((shortcut) => (
                <button
                  key={shortcut}
                  onClick={() => {
                    setFilePath(shortcut);
                    handleBrowseFiles(shortcut);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700"
                >
                  {shortcut}
                </button>
              ))}
            </div>

            {/* Path Input Form */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="Path (e.g. Documents, C:\Users\...)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleBrowseFiles(filePath)}
                disabled={isLoadingFiles}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{isLoadingFiles ? 'Loading...' : 'Browse'}</span>
              </button>
              <button
                onClick={() => handleOpenExplorer(filePath)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors shrink-0"
                title="Open in Windows File Explorer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open in Explorer</span>
              </button>
            </div>

            {/* Error banner */}
            {fileError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Files List */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 max-h-80 overflow-y-auto">
              {fileList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  {agentStatus.connected
                    ? 'Enter a directory path and click Browse to view files.'
                    : 'Agent is offline. Connect local Python agent to view local Windows files.'}
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {fileList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 px-4 flex items-center justify-between text-xs hover:bg-slate-900/60 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {item.isDirectory ? (
                          <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="text-slate-200 font-mono truncate">{item.name}</span>
                      </div>

                      <div className="flex items-center space-x-4 text-slate-500 font-mono text-[11px] shrink-0">
                        <span>{item.isDirectory ? '<DIR>' : `${Math.round(item.size / 1024)} KB`}</span>
                        <span className="hidden sm:inline">
                          {item.modified ? new Date(item.modified).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DOWNLOAD & SETUP INSTRUCTIONS */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-semibold text-white">Shihab AI Windows Agent Script</h2>
                  <p className="text-xs text-slate-400">
                    Pure Python standard library script. Zero pip dependencies needed.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyScript}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copied to Clipboard' : 'Copy Python Code'}</span>
                  </button>

                  <button
                    onClick={handleDownloadScript}
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download shihab_agent.py</span>
                  </button>
                </div>
              </div>

              {/* 3 Step Setup Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="font-semibold text-slate-200">Save the Agent File</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Download or save <code className="text-cyan-300 font-mono">shihab_agent.py</code> anywhere on your Windows PC (e.g., Desktop or Documents).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="font-semibold text-slate-200">Run in Terminal</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Open PowerShell or Command Prompt and run:
                  </p>
                  <pre className="p-2 bg-slate-900 rounded font-mono text-[10px] text-emerald-300 overflow-x-auto">
                    python shihab_agent.py
                  </pre>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h4 className="font-semibold text-slate-200">Automatic Sync</h4>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    The agent listens on <code className="text-cyan-300 font-mono">localhost:5678</code>. Shihab AI detects it immediately with live telemetry!
                  </p>
                </div>
              </div>

              {/* Security Policy Notice */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Security Guarantee:</strong> The service requires a secret Bearer token (<code className="font-mono text-indigo-200">shihab-secret-key-2026</code>) on all execution requests. Applications and commands require explicit user confirmation before execution.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Local Windows Execution Audit Log</h2>
                <p className="text-xs text-slate-400">
                  Every real action executed through the local agent is recorded with timestamp and PID.
                </p>
              </div>

              {commandLogs.length > 0 && (
                <button
                  onClick={onClearLogs}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition-colors"
                >
                  Clear Logs
                </button>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 max-h-96 overflow-y-auto">
              {commandLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No execution logs yet. Actions taken on your Windows PC will be recorded here.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60 font-mono text-xs">
                  {commandLogs.map((log) => (
                    <div key={log.id} className="p-3 px-4 flex items-center justify-between hover:bg-slate-900/40">
                      <div className="flex items-center space-x-3 min-w-0">
                        {log.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="font-bold text-slate-200 uppercase">{log.action}: </span>
                          <span className="text-cyan-300">{log.target}</span>
                          {log.pid && <span className="text-slate-400 text-[11px] ml-2">(PID: {log.pid})</span>}
                          {log.error && <span className="text-rose-400 text-[11px] ml-2">- {log.error}</span>}
                        </div>
                      </div>

                      <span className="text-slate-500 text-[10px] shrink-0 ml-4">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
