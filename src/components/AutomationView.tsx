import React, { useState } from 'react';
import { 
  Bell, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Play, 
  AlertCircle, 
  Tag, 
  CalendarCheck, 
  Volume2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Alarm, Reminder, ScheduledTask, PCAgentStatus } from '../types';
import { soundEffects } from '../services/audioService';

interface AutomationViewProps {
  alarms: Alarm[];
  reminders: Reminder[];
  tasks: ScheduledTask[];
  onAddAlarm: (alarm: Omit<Alarm, 'id' | 'created'>) => void;
  onToggleAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'created' | 'completed'>) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onAddTask: (task: Omit<ScheduledTask, 'id'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onRunTaskNow: (task: ScheduledTask) => Promise<void>;
  agentStatus: PCAgentStatus;
}

export const AutomationView: React.FC<AutomationViewProps> = ({
  alarms,
  reminders,
  tasks,
  onAddAlarm,
  onToggleAlarm,
  onDeleteAlarm,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onRunTaskNow,
  agentStatus,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'alarms' | 'reminders' | 'tasks'>('alarms');

  // New alarm form state
  const [alarmTime, setAlarmTime] = useState('07:30');
  const [alarmLabel, setAlarmLabel] = useState('Morning Wakeup');
  const [alarmRepeat, setAlarmRepeat] = useState(true);

  // New reminder form state
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [reminderPriority, setReminderPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [reminderCategory, setReminderCategory] = useState<'work' | 'personal' | 'health' | 'finance' | 'general'>('work');

  // New task form state
  const [taskName, setTaskName] = useState('');
  const [taskSchedule, setTaskSchedule] = useState('Daily at 09:00');
  const [taskAction, setTaskAction] = useState<'app_launch' | 'system_lock' | 'backup_files' | 'whatsapp_draft' | 'custom'>('app_launch');
  const [taskPayload, setTaskPayload] = useState('chrome');

  const handleCreateAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alarmTime) return;
    onAddAlarm({
      time: alarmTime,
      label: alarmLabel.trim() || 'Alarm',
      enabled: true,
      repeatDaily: alarmRepeat,
    });
    setAlarmLabel('');
    soundEffects.playSuccess();
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) return;
    onAddReminder({
      title: reminderTitle.trim(),
      datetime: reminderDateTime || new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      priority: reminderPriority,
      category: reminderCategory,
    });
    setReminderTitle('');
    soundEffects.playReminder();
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    onAddTask({
      name: taskName.trim(),
      schedule: taskSchedule,
      actionType: taskAction,
      payload: taskPayload,
      status: 'active',
    });
    setTaskName('');
    soundEffects.playSuccess();
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-cyan-400" />
              Automation & Scheduling Hub
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time alarms, intelligent reminders, and scheduled Windows PC workflows.
            </p>
          </div>

          {/* Sub tabs */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setActiveSubTab('alarms')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeSubTab === 'alarms'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Alarms ({alarms.filter(a => a.enabled).length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('reminders')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeSubTab === 'reminders'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Reminders ({reminders.filter(r => !r.completed).length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('tasks')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeSubTab === 'tasks'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Scheduled Tasks ({tasks.length})</span>
            </button>
          </div>
        </div>

        {/* ALARMS TAB */}
        {activeSubTab === 'alarms' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Alarm Form */}
            <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Add New Alarm
              </h2>

              <form onSubmit={handleCreateAlarm} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Alarm Time (24h)
                  </label>
                  <input
                    type="time"
                    value={alarmTime}
                    onChange={(e) => setAlarmTime(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-lg font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Label / Description
                  </label>
                  <input
                    type="text"
                    value={alarmLabel}
                    onChange={(e) => setAlarmLabel(e.target.value)}
                    placeholder="e.g. Wake up, Meeting prep"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 py-1">
                  <span>Repeat daily</span>
                  <input
                    type="checkbox"
                    checked={alarmRepeat}
                    onChange={(e) => setAlarmRepeat(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-950 border-slate-800"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Set Alarm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.startAlarmLoop();
                      setTimeout(() => soundEffects.stopAlarmLoop(), 2500);
                    }}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                    title="Test alarm sound"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Alarms List */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Configured Alarms ({alarms.length})</span>
                <span className="font-mono text-cyan-400">Audio Synth Alert Ready</span>
              </div>

              {alarms.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-500 text-sm">
                  <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p>No alarms configured yet.</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Say <span className="text-cyan-400">"Set an alarm for 7 AM"</span> or add one above.
                  </p>
                </div>
              ) : (
                alarms.map((alarm) => (
                  <div
                    key={alarm.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      alarm.enabled
                        ? 'bg-slate-900/90 border-slate-800 shadow-sm'
                        : 'bg-slate-950/60 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${
                        alarm.enabled ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60' : 'bg-slate-900 text-slate-600'
                      }`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-2xl font-mono font-bold text-white tracking-tight">
                            {alarm.time}
                          </span>
                          {alarm.repeatDaily && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              DAILY
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-0.5">
                          {alarm.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Toggle button */}
                      <button
                        onClick={() => onToggleAlarm(alarm.id)}
                        className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                          alarm.enabled ? 'bg-cyan-600' : 'bg-slate-800'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          alarm.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>

                      <button
                        onClick={() => onDeleteAlarm(alarm.id)}
                        className="p-2 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete alarm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* REMINDERS TAB */}
        {activeSubTab === 'reminders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Reminder Form */}
            <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Add Reminder
              </h2>

              <form onSubmit={handleCreateReminder} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Reminder Title
                  </label>
                  <input
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    placeholder="e.g. Call client regarding contract"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={reminderDateTime}
                    onChange={(e) => setReminderDateTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Priority
                    </label>
                    <select
                      value={reminderPriority}
                      onChange={(e) => setReminderPriority(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Category
                    </label>
                    <select
                      value={reminderCategory}
                      onChange={(e) => setReminderCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none capitalize"
                    >
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                      <option value="health">Health</option>
                      <option value="finance">Finance</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Create Reminder</span>
                </button>
              </form>
            </div>

            {/* Reminders List */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Active Reminders ({reminders.filter(r => !r.completed).length})</span>
                <span>Completed: {reminders.filter(r => r.completed).length}</span>
              </div>

              {reminders.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-slate-500 text-sm">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p>No reminders recorded yet.</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Ask Shihab AI: <span className="text-indigo-400">"Remind me to submit project at 5 PM"</span>
                  </p>
                </div>
              ) : (
                reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      reminder.completed
                        ? 'bg-slate-950/40 border-slate-900 opacity-50'
                        : 'bg-slate-900/90 border-slate-800 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <button
                        onClick={() => onToggleReminder(reminder.id)}
                        className="text-slate-500 hover:text-cyan-400 transition-colors shrink-0"
                      >
                        {reminder.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          reminder.completed ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}>
                          {reminder.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <span className="font-mono text-[11px]">{reminder.datetime}</span>
                          <span>•</span>
                          <span className="capitalize text-slate-400">{reminder.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                        reminder.priority === 'high'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : reminder.priority === 'medium'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                      }`}>
                        {reminder.priority}
                      </span>

                      <button
                        onClick={() => onDeleteReminder(reminder.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SCHEDULED TASKS TAB */}
        {activeSubTab === 'tasks' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Task creation form */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Create Automated Task
                </h2>

                <form onSubmit={handleCreateTask} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Task Name
                    </label>
                    <input
                      type="text"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      placeholder="e.g. Daily Dev Launch"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Schedule Trigger
                    </label>
                    <input
                      type="text"
                      value={taskSchedule}
                      onChange={(e) => setTaskSchedule(e.target.value)}
                      placeholder="e.g. Daily at 09:00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Action Type
                    </label>
                    <select
                      value={taskAction}
                      onChange={(e) => setTaskAction(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="app_launch">Launch Windows App</option>
                      <option value="system_lock">Lock Workstation</option>
                      <option value="backup_files">Inspect Documents Path</option>
                      <option value="whatsapp_draft">Prepare Daily WhatsApp Update</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Payload / Parameters
                    </label>
                    <input
                      type="text"
                      value={taskPayload}
                      onChange={(e) => setTaskPayload(e.target.value)}
                      placeholder="e.g. code, notepad, or Documents"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Task Automation</span>
                  </button>
                </form>
              </div>

              {/* Pre-configured Workflows & Active List */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Registered Automations ({tasks.length})</span>
                  <span className={`text-[11px] ${agentStatus.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {agentStatus.connected ? 'PC Bridge Online' : 'PC Bridge Disconnected'}
                  </span>
                </div>

                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-sm">{task.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {task.schedule}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Action: <code className="text-slate-300 font-mono">{task.actionType}</code></span>
                        <span>•</span>
                        <span>Payload: <code className="text-slate-300 font-mono">{task.payload}</code></span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onRunTaskNow(task)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 flex items-center gap-1.5 text-xs transition-colors"
                        title="Execute this automation task now"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Run Now</span>
                      </button>

                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-2 rounded-lg hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
