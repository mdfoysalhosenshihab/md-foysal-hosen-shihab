import React, { useEffect } from 'react';
import { Bell, Clock, Volume2, CheckCircle2 } from 'lucide-react';
import { soundEffects } from '../services/audioService';

interface AlarmAlertModalProps {
  alertData: {
    type: 'alarm' | 'reminder';
    title: string;
    time: string;
  } | null;
  onDismiss: () => void;
  onSnooze: () => void;
}

export const AlarmAlertModal: React.FC<AlarmAlertModalProps> = ({
  alertData,
  onDismiss,
  onSnooze,
}) => {
  useEffect(() => {
    if (alertData) {
      soundEffects.startAlarmLoop();
    }
    return () => {
      soundEffects.stopAlarmLoop();
    };
  }, [alertData]);

  if (!alertData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/20 p-6 text-center space-y-5 animate-bounce-slow">
        {/* Pulsing Alarm Bell Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-cyan-950 border border-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/40">
          <Bell className="w-10 h-10 text-cyan-400 animate-wiggle" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
          </span>
        </div>

        <div>
          <span className="text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
            {alertData.type === 'alarm' ? '🚨 Alarm Ringing' : '🔔 Scheduled Reminder'}
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-3">
            {alertData.title}
          </h2>
          <p className="text-2xl font-mono font-bold text-cyan-400 mt-1">
            {alertData.time}
          </p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              soundEffects.stopAlarmLoop();
              onSnooze();
            }}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Snooze (5m)</span>
          </button>

          <button
            onClick={() => {
              soundEffects.stopAlarmLoop();
              onDismiss();
            }}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
};
