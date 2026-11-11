import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ConfirmationRequest } from '../types';

interface ConfirmationModalProps {
  request: ConfirmationRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  request,
  onConfirm,
  onCancel,
}) => {
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
        <div className="flex items-start space-x-3.5">
          <div className={`p-3 rounded-xl shrink-0 ${
            request.severity === 'high'
              ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
              : 'bg-amber-950/80 text-amber-400 border border-amber-800'
          }`}>
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                {request.title}
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                request.severity === 'high' ? 'bg-rose-950 text-rose-300' : 'bg-amber-950 text-amber-300'
              }`}>
                {request.severity} RISK
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {request.description}
            </p>
          </div>
        </div>

        {/* Action Details Card */}
        {request.payload && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-1">
            <div className="text-[11px] text-slate-500 uppercase font-sans font-semibold">
              Action Payload:
            </div>
            <pre className="text-[11px] text-cyan-300 overflow-x-auto">
              {JSON.stringify(request.payload, null, 2)}
            </pre>
          </div>
        )}

        {/* Policy Notice */}
        <p className="text-[11px] text-slate-400 leading-tight">
          🔒 <strong>Shihab AI Safety Guard:</strong> You have full control. Sensitive PC actions are never performed in the background without explicit verification.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel / Reject
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white text-xs font-medium shadow-lg transition-all flex items-center gap-1.5 ${
              request.severity === 'high'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Authorize & Execute</span>
          </button>
        </div>
      </div>
    </div>
  );
};
