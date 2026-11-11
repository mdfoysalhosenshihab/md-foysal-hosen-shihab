import React, { useState } from 'react';
import { Settings, Shield, Globe, Cpu, Key, Volume2, RotateCcw, X, Check } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    const defaults: AppSettings = {
      agentUrl: 'http://localhost:5678',
      agentToken: 'shihab-secret-key-2026',
      preferredLanguage: 'auto',
      enableVoiceResponse: true,
      speechVoiceRate: 1.0,
      requireConfirmationForApps: true,
      requireConfirmationForFiles: true,
      requireConfirmationForSystem: true,
    };
    setFormData(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Shihab AI Settings & Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Section 1: Local PC Agent Bridge */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              Windows Agent Connection
            </h3>

            <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Local Agent Endpoint URL
                </label>
                <input
                  type="text"
                  value={formData.agentUrl}
                  onChange={(e) => setFormData({ ...formData, agentUrl: e.target.value })}
                  placeholder="http://localhost:5678"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The local HTTP port where <code className="text-slate-400">shihab_agent.py</code> is listening (default: http://localhost:5678).
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  Agent Bearer Secret Token
                </label>
                <input
                  type="text"
                  value={formData.agentToken}
                  onChange={(e) => setFormData({ ...formData, agentToken: e.target.value })}
                  placeholder="shihab-secret-key-2026"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Prevents unauthorized command execution from other processes.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Security & Confirmation Policy */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              User Authorization Policy
            </h3>

            <div className="space-y-2 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <label className="flex items-center justify-between text-slate-300 py-1 cursor-pointer">
                <span>Require confirmation before launching Windows apps</span>
                <input
                  type="checkbox"
                  checked={formData.requireConfirmationForApps}
                  onChange={(e) => setFormData({ ...formData, requireConfirmationForApps: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300 py-1 cursor-pointer border-t border-slate-900">
                <span>Require confirmation before reading or opening file paths</span>
                <input
                  type="checkbox"
                  checked={formData.requireConfirmationForFiles}
                  onChange={(e) => setFormData({ ...formData, requireConfirmationForFiles: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300 py-1 cursor-pointer border-t border-slate-900">
                <span>Require confirmation for system lock / volume actions</span>
                <input
                  type="checkbox"
                  checked={formData.requireConfirmationForSystem}
                  onChange={(e) => setFormData({ ...formData, requireConfirmationForSystem: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                />
              </label>
            </div>
          </div>

          {/* Section 3: Speech & Language */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              Language & Voice Preferences
            </h3>

            <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Default Language Mode
                </label>
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="auto">Auto-Detect (বাংলা or English based on prompt)</option>
                  <option value="bn">Always Prefer বাংলা (Bengali)</option>
                  <option value="en">Always Prefer English</option>
                </select>
              </div>

              <label className="flex items-center justify-between text-slate-300 py-1 cursor-pointer">
                <span>Enable Audio Voice Responses (TTS)</span>
                <input
                  type="checkbox"
                  checked={formData.enableVoiceResponse}
                  onChange={(e) => setFormData({ ...formData, enableVoiceResponse: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                />
              </label>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
              >
                {savedNotice ? <Check className="w-4 h-4 text-emerald-300" /> : null}
                <span>{savedNotice ? 'Saved!' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
