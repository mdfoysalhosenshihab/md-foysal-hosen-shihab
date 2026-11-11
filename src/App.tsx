import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { AutomationView } from './components/AutomationView';
import { PCAgentView } from './components/PCAgentView';
import { SocialAssistView } from './components/SocialAssistView';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AlarmAlertModal } from './components/AlarmAlertModal';
import { SettingsModal } from './components/SettingsModal';
import { 
  Message, 
  Alarm, 
  Reminder, 
  ScheduledTask, 
  PCAgentStatus, 
  PCCommandLog, 
  SocialDraft, 
  ConfirmationRequest, 
  AppSettings,
  FunctionCallItem 
} from './types';
import { sendChatMessage } from './services/geminiService';
import { pcAgent } from './services/pcAgentService';
import { soundEffects, ttsService } from './services/audioService';

const DEFAULT_SETTINGS: AppSettings = {
  agentUrl: 'http://localhost:5678',
  agentToken: 'shihab-secret-key-2026',
  preferredLanguage: 'auto',
  enableVoiceResponse: true,
  speechVoiceRate: 1.0,
  requireConfirmationForApps: true,
  requireConfirmationForFiles: true,
  requireConfirmationForSystem: true,
};

const INITIAL_MESSAGE: Message = {
  id: 'msg-welcome',
  role: 'model',
  text: `আসসালামু আলাইকুম! আমি শিহাব এআই (Shihab AI) — আপনার পার্সোনাল এবং উইন্ডোজ পিসি সহকারী।

আমি বাংলা এবং ইংরেজি উভয় ভাষায় কাজ করতে পারি। আপনার জন্য আমি যা করতে পারি:
• ⏰ অ্যালার্ম ও রিমাইন্ডার সেট করা (Voice & Text)
• 💻 উইন্ডোজ অ্যাপ চালু করা (Chrome, Notepad, VS Code ইত্যাদি) ও ফাইল ব্রাউজ করা
• 📱 হোয়াটসঅ্যাপ ওয়েব এবং মেসেঞ্জারে স্মার্ট মেসেজ ড্রাফট করা
• ⚡ অটোমেশন শিডিউল পরিচালনা করা

Hello! I'm Shihab AI, your personal & Windows desktop assistant. How can I assist you today?`,
  timestamp: new Date().toISOString(),
  language: 'bn',
};

export default function App() {
  // Navigation & Settings
  const [currentTab, setCurrentTab] = useState<TabType>('chat');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('shihab_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Chat conversation
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('shihab_chat_history');
      return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
    } catch {
      return [INITIAL_MESSAGE];
    }
  });
  const [isThinking, setIsThinking] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<'bn-BD' | 'en-US'>('bn-BD');

  // Alarms, Reminders, and Automation
  const [alarms, setAlarms] = useState<Alarm[]>(() => {
    try {
      const saved = localStorage.getItem('shihab_alarms');
      return saved ? JSON.parse(saved) : [
        { id: 'alarm-1', label: 'Morning Wakeup', time: '07:00', enabled: true, repeatDaily: true, created: new Date().toISOString() },
        { id: 'alarm-2', label: 'Daily Review', time: '18:30', enabled: false, repeatDaily: true, created: new Date().toISOString() },
      ];
    } catch {
      return [];
    }
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const saved = localStorage.getItem('shihab_reminders');
      return saved ? JSON.parse(saved) : [
        { id: 'rem-1', title: 'Review quarterly client deliverables', datetime: 'Today at 5:00 PM', priority: 'high', category: 'work', completed: false, created: new Date().toISOString() },
        { id: 'rem-2', title: 'Submit weekly timesheet and report', datetime: 'Tomorrow at 10:00 AM', priority: 'medium', category: 'work', completed: false, created: new Date().toISOString() },
      ];
    } catch {
      return [];
    }
  });

  const [tasks, setTasks] = useState<ScheduledTask[]>(() => {
    try {
      const saved = localStorage.getItem('shihab_tasks');
      return saved ? JSON.parse(saved) : [
        { id: 'task-1', name: 'Work Workspace Launch', schedule: 'Weekdays at 09:00 AM', actionType: 'app_launch', payload: 'chrome', status: 'active' },
        { id: 'task-2', name: 'Workstation Auto-Lock', schedule: 'Daily at 08:00 PM', actionType: 'system_lock', payload: 'lock', status: 'active' },
      ];
    } catch {
      return [];
    }
  });

  // Social Drafts
  const [savedDrafts, setSavedDrafts] = useState<SocialDraft[]>(() => {
    try {
      const saved = localStorage.getItem('shihab_social_drafts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // PC Windows Agent Status & Audit Logs
  const [agentStatus, setAgentStatus] = useState<PCAgentStatus>({
    connected: false,
    lastChecked: null,
  });
  const [commandLogs, setCommandLogs] = useState<PCCommandLog[]>(() => pcAgent.getLogs());

  // Modals & Action authorization
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequest | null>(null);
  const [activeAlertModal, setActiveAlertModal] = useState<{ type: 'alarm' | 'reminder'; title: string; time: string } | null>(null);

  // Triggered tracker to avoid firing same alarm/reminder repeatedly in same minute
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());

  // Save states persistently
  useEffect(() => {
    try {
      localStorage.setItem('shihab_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('shihab_alarms', JSON.stringify(alarms));
    } catch {}
  }, [alarms]);

  useEffect(() => {
    try {
      localStorage.setItem('shihab_reminders', JSON.stringify(reminders));
    } catch {}
  }, [reminders]);

  useEffect(() => {
    try {
      localStorage.setItem('shihab_tasks', JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('shihab_social_drafts', JSON.stringify(savedDrafts));
    } catch {}
  }, [savedDrafts]);

  useEffect(() => {
    try {
      localStorage.setItem('shihab_settings', JSON.stringify(settings));
    } catch {}
    pcAgent.updateConfig(settings.agentUrl, settings.agentToken);
  }, [settings]);

  // Check PC Agent connection
  const checkAgentHealth = useCallback(async () => {
    let status = await pcAgent.checkHealth();
    if (!status.connected) {
      try {
        await fetch('/api/pc-agent/start', { method: 'POST' });
        status = await pcAgent.checkHealth();
      } catch {
        // keep current status
      }
    }
    setAgentStatus(status);
  }, []);

  // Poll agent status on mount and periodic interval
  useEffect(() => {
    checkAgentHealth();
    const interval = setInterval(checkAgentHealth, 12000);
    return () => clearInterval(interval);
  }, [checkAgentHealth]);

  // Background timer to monitor alarms and reminders
  useEffect(() => {
    const checkTimer = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const dateKey = `${now.toDateString()}_${currentTimeStr}`;

      // Check Alarms
      for (const alarm of alarms) {
        if (!alarm.enabled) continue;
        const triggerKey = `alarm_${alarm.id}_${dateKey}`;
        if (alarm.time === currentTimeStr && !triggeredAlarmsRef.current.has(triggerKey)) {
          triggeredAlarmsRef.current.add(triggerKey);
          setActiveAlertModal({
            type: 'alarm',
            title: alarm.label,
            time: alarm.time,
          });
          break;
        }
      }

      // Check Reminders (matches ISO time if within 60 seconds)
      for (const reminder of reminders) {
        if (reminder.completed) continue;
        const reminderTime = new Date(reminder.datetime).getTime();
        const triggerKey = `rem_${reminder.id}_${dateKey}`;
        if (!isNaN(reminderTime) && Math.abs(now.getTime() - reminderTime) < 45000 && !triggeredAlarmsRef.current.has(triggerKey)) {
          triggeredAlarmsRef.current.add(triggerKey);
          setActiveAlertModal({
            type: 'reminder',
            title: reminder.title,
            time: currentTimeStr,
          });
          soundEffects.playReminder();
          break;
        }
      }
    };

    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [alarms, reminders]);

  // Handle User Confirmation execution
  const handleExecuteConfirmedAction = async () => {
    if (!pendingConfirmation) return;
    const { actionType, payload } = pendingConfirmation;
    setPendingConfirmation(null);

    if (actionType === 'launch_app') {
      const res = await pcAgent.launchApplication(payload.appName, payload.arguments);
      setCommandLogs(pcAgent.getLogs());
      if (res.success) {
        soundEffects.playSuccess();
      }
    } else if (actionType === 'system_lock') {
      const res = await pcAgent.systemAction('lock');
      setCommandLogs(pcAgent.getLogs());
      if (res.success) {
        soundEffects.playSuccess();
      }
    }
  };

  // Execute a function call produced by Gemini
  const executeFunctionCall = async (call: FunctionCallItem, messageId: string) => {
    const { name, args } = call;

    // Helper to update call state inside message
    const updateCallStatus = (
      status: 'executing' | 'completed' | 'failed' | 'rejected',
      result?: any,
      error?: string
    ) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId || !m.functionCalls) return m;
          return {
            ...m,
            functionCalls: m.functionCalls.map((fc) =>
              fc.id === call.id
                ? { ...fc, status, result, error, executionTimestamp: new Date().toISOString() }
                : fc
            ),
          };
        })
      );
    };

    updateCallStatus('executing');

    try {
      if (name === 'manage_alarm') {
        const timeVal = args.time || '07:30';
        const labelVal = args.label || 'Alarm';
        const newAlarm: Alarm = {
          id: `alarm-${Date.now()}`,
          label: labelVal,
          time: timeVal.includes(':') ? timeVal.slice(0, 5) : timeVal,
          enabled: true,
          repeatDaily: true,
          created: new Date().toISOString(),
        };
        setAlarms((prev) => [...prev, newAlarm]);
        soundEffects.playSuccess();
        updateCallStatus('completed', { message: `Scheduled alarm for ${timeVal}` });
      } else if (name === 'manage_reminder') {
        const newReminder: Reminder = {
          id: `rem-${Date.now()}`,
          title: args.title || 'Reminder',
          datetime: args.datetime || 'Today',
          priority: args.priority || 'medium',
          category: args.category || 'general',
          completed: false,
          created: new Date().toISOString(),
        };
        setReminders((prev) => [...prev, newReminder]);
        soundEffects.playReminder();
        updateCallStatus('completed', { message: `Created reminder '${args.title}'` });
      } else if (name === 'schedule_task') {
        const newTask: ScheduledTask = {
          id: `task-${Date.now()}`,
          name: args.name || 'Automated Task',
          schedule: args.schedule || 'Daily',
          actionType: args.actionType || 'app_launch',
          payload: args.payload || '',
          status: 'active',
        };
        setTasks((prev) => [...prev, newTask]);
        soundEffects.playSuccess();
        updateCallStatus('completed', { message: `Scheduled task '${args.name}'` });
      } else if (name === 'pc_launch_application') {
        if (!agentStatus.connected) {
          updateCallStatus('failed', null, 'Local PC Agent is offline. Run python shihab_agent.py on your Windows PC.');
          return;
        }
        const res = await pcAgent.launchApplication(args.appName, args.arguments);
        setCommandLogs(pcAgent.getLogs());
        if (res.success) {
          soundEffects.playSuccess();
          updateCallStatus('completed', res);
        } else {
          updateCallStatus('failed', null, res.error || res.message);
        }
      } else if (name === 'pc_file_manager') {
        if (!agentStatus.connected) {
          updateCallStatus('failed', null, 'Local PC Agent is offline.');
          return;
        }
        if (args.operation === 'open_explorer') {
          const res = await pcAgent.openInExplorer(args.path);
          if (res.success) {
            updateCallStatus('completed', res);
          } else {
            updateCallStatus('failed', null, res.error);
          }
        } else {
          const res = await pcAgent.listFiles(args.path);
          if (res.success) {
            updateCallStatus('completed', { message: `Found ${res.items?.length || 0} items in ${res.path}`, items: res.items });
          } else {
            updateCallStatus('failed', null, res.error);
          }
        }
      } else if (name === 'pc_system_control') {
        if (!agentStatus.connected) {
          updateCallStatus('failed', null, 'Local PC Agent is offline.');
          return;
        }
        const res = await pcAgent.systemAction(args.action);
        setCommandLogs(pcAgent.getLogs());
        if (res.success) {
          soundEffects.playSuccess();
          updateCallStatus('completed', res);
        } else {
          updateCallStatus('failed', null, res.error);
        }
      } else if (name === 'draft_social_message') {
        updateCallStatus('completed', { message: 'Message drafted ready for WhatsApp Web / Messenger' });
      }
    } catch (err: any) {
      updateCallStatus('failed', null, err.message);
    }
  };

  const rejectFunctionCall = (call: FunctionCallItem, messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || !m.functionCalls) return m;
        return {
          ...m,
          functionCalls: m.functionCalls.map((fc) =>
            fc.id === call.id ? { ...fc, status: 'rejected' } : fc
          ),
        };
      })
    );
  };

  // Send message to Shihab AI
  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      language: /[\u0980-\u09FF]/.test(text) ? 'bn' : 'en',
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    try {
      // Build conversation history for multi-turn memory
      const history = messages.slice(-6).map((m) => ({
        role: m.role as 'user' | 'model',
        text: m.text,
      }));

      const response = await sendChatMessage({
        message: text,
        history,
        userLanguage: settings.preferredLanguage,
        pcAgentOnline: agentStatus.connected,
      });

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: response.text,
        timestamp: response.timestamp,
        language: response.language,
        functionCalls: response.functionCalls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      soundEffects.playSuccess();

      // Automatically execute non-sensitive tools (like alarms, reminders, social drafts)
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'manage_alarm' || fc.name === 'manage_reminder' || fc.name === 'draft_social_message') {
            await executeFunctionCall(fc, assistantMessage.id);
          } else if (
            (fc.name === 'pc_launch_application' && !settings.requireConfirmationForApps) ||
            (fc.name === 'pc_file_manager' && !settings.requireConfirmationForFiles)
          ) {
            await executeFunctionCall(fc, assistantMessage.id);
          }
        }
      }

      // Voice response
      if (settings.enableVoiceResponse && response.text) {
        ttsService.speak(response.text, response.language, settings.speechVoiceRate);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: `দুঃখিত, একটি সমস্যা হয়েছে: ${err?.message || 'Gemini API call failed'}. অনুগ্রহ করে পুনরায় চেষ্টা করুন।`,
        timestamp: new Date().toISOString(),
        language: 'bn',
        status: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Header Bar */}
      <Header
        agentStatus={agentStatus}
        onRefreshAgent={checkAgentHealth}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeAlarmsCount={alarms.filter((a) => a.enabled).length}
        activeRemindersCount={reminders.filter((r) => !r.completed).length}
        selectedLanguage={settings.preferredLanguage}
        onLanguageChange={(lang) => setSettings((s) => ({ ...s, preferredLanguage: lang }))}
        isAiThinking={isThinking}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingConfirmationsCount={pendingConfirmation ? 1 : 0}
          alarmsCount={alarms.filter((a) => a.enabled).length}
          remindersCount={reminders.filter((r) => !r.completed).length}
          agentStatus={agentStatus}
          voiceEnabled={settings.enableVoiceResponse}
          onToggleVoice={() => setSettings((s) => ({ ...s, enableVoiceResponse: !s.enableVoiceResponse }))}
        />

        {/* Tab Views */}
        <main className="flex-1 flex overflow-hidden">
          {currentTab === 'chat' && (
            <ChatView
              messages={messages}
              onSendMessage={handleSendMessage}
              isThinking={isThinking}
              onClearHistory={() => setMessages([INITIAL_MESSAGE])}
              agentStatus={agentStatus}
              onExecuteFunctionCall={executeFunctionCall}
              onRejectFunctionCall={rejectFunctionCall}
              voiceLanguage={voiceLanguage}
              onChangeVoiceLanguage={setVoiceLanguage}
            />
          )}

          {currentTab === 'automation' && (
            <AutomationView
              alarms={alarms}
              reminders={reminders}
              tasks={tasks}
              onAddAlarm={(newAlarm) => setAlarms((p) => [...p, { id: `alarm-${Date.now()}`, ...newAlarm, created: new Date().toISOString() }])}
              onToggleAlarm={(id) => setAlarms((p) => p.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a))}
              onDeleteAlarm={(id) => setAlarms((p) => p.filter((a) => a.id !== id))}
              onAddReminder={(newRem) => setReminders((p) => [...p, { id: `rem-${Date.now()}`, ...newRem, completed: false, created: new Date().toISOString() }])}
              onToggleReminder={(id) => setReminders((p) => p.map((r) => r.id === id ? { ...r, completed: !r.completed } : r))}
              onDeleteReminder={(id) => setReminders((p) => p.filter((r) => r.id !== id))}
              onAddTask={(newTask) => setTasks((p) => [...p, { id: `task-${Date.now()}`, ...newTask }])}
              onToggleTask={(id) => setTasks((p) => p.map((t) => t.id === id ? { ...t, status: t.status === 'active' ? 'paused' : 'active' } : t))}
              onDeleteTask={(id) => setTasks((p) => p.filter((t) => t.id !== id))}
              onRunTaskNow={async (task) => {
                if (task.actionType === 'app_launch') {
                  const res = await pcAgent.launchApplication(task.payload);
                  setCommandLogs(pcAgent.getLogs());
                  if (res.success) soundEffects.playSuccess();
                  alert(res.message);
                } else if (task.actionType === 'system_lock') {
                  const res = await pcAgent.systemAction('lock');
                  setCommandLogs(pcAgent.getLogs());
                  if (res.success) soundEffects.playSuccess();
                  alert(res.message);
                } else {
                  alert(`Task '${task.name}' triggered successfully.`);
                }
              }}
              agentStatus={agentStatus}
            />
          )}

          {currentTab === 'pc_agent' && (
            <PCAgentView
              agentStatus={agentStatus}
              onRefreshAgent={checkAgentHealth}
              commandLogs={commandLogs}
              onClearLogs={() => {
                pcAgent.clearLogs();
                setCommandLogs([]);
              }}
              onRequestConfirmation={(title, description, severity, actionType, payload, callback) => {
                setPendingConfirmation({
                  id: `req-${Date.now()}`,
                  title,
                  description,
                  severity,
                  actionType,
                  payload,
                });
              }}
            />
          )}

          {currentTab === 'social' && (
            <SocialAssistView
              onAskAiToDraft={handleSendMessage}
              savedDrafts={savedDrafts}
              onSaveDraft={(draft) => setSavedDrafts((prev) => [draft, ...prev])}
              onDeleteDraft={(id) => setSavedDrafts((prev) => prev.filter((d) => d.id !== id))}
            />
          )}

          {currentTab === 'audit' && (
            <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-950">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="pb-4 border-b border-slate-800">
                  <h1 className="text-2xl font-bold text-white tracking-tight">Security & Command Audit</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Complete verification record of all local PC commands executed through Shihab AI.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">Local PC Python Service</h3>
                    <p className="text-xs text-slate-400">
                      Endpoint: <code className="text-cyan-300 font-mono">{settings.agentUrl}</code>
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                    agentStatus.connected ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {agentStatus.connected ? 'AUTHENTICATED' : 'NOT CONNECTED'}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    Recent Command Logs ({commandLogs.length})
                  </h3>
                  {commandLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 rounded-xl bg-slate-900/40 border border-dashed border-slate-800">
                      No commands executed yet.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-800 bg-slate-900 divide-y divide-slate-800/80 font-mono text-xs">
                      {commandLogs.map((log) => (
                        <div key={log.id} className="p-3.5 flex items-center justify-between">
                          <div>
                            <span className={`font-bold mr-2 ${log.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                              [{log.action}]
                            </span>
                            <span className="text-slate-200">{log.target}</span>
                            {log.pid && <span className="text-slate-400 ml-2">(PID: {log.pid})</span>}
                            {log.error && <span className="text-rose-400 ml-2">- {log.error}</span>}
                          </div>
                          <span className="text-slate-500 text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sensitive Action Confirmation Modal */}
      <ConfirmationModal
        request={pendingConfirmation}
        onConfirm={handleExecuteConfirmedAction}
        onCancel={() => setPendingConfirmation(null)}
      />

      {/* Real Audio Alarm & Reminder Notification Modal */}
      <AlarmAlertModal
        alertData={activeAlertModal}
        onDismiss={() => setActiveAlertModal(null)}
        onSnooze={() => {
          setActiveAlertModal(null);
          // Set snooze reminder for 5 minutes later
          const snoozeTime = new Date(Date.now() + 5 * 60000);
          const hh = String(snoozeTime.getHours()).padStart(2, '0');
          const mm = String(snoozeTime.getMinutes()).padStart(2, '0');
          setAlarms((prev) => [
            ...prev,
            {
              id: `alarm-snooze-${Date.now()}`,
              label: `Snooze: ${activeAlertModal?.title || 'Alarm'}`,
              time: `${hh}:${mm}`,
              enabled: true,
              repeatDaily: false,
              created: new Date().toISOString(),
            },
          ]);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
      />
    </div>
  );
}
