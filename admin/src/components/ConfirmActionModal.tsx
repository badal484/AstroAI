'use client';

import { useState } from 'react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  riskLevel?: 'danger' | 'warning' | 'financial';
  confirmText?: string;
  requireReason?: boolean;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

export function ConfirmActionModal({
  isOpen,
  title,
  description,
  riskLevel = 'warning',
  confirmText = 'Confirm Action',
  requireReason = true,
  onConfirm,
  onClose,
}: ConfirmActionModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requireReason && reason.trim().length < 3) {
      setError('Please provide a mandatory administrative reason (minimum 3 characters).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to execute action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const badgeColor =
    riskLevel === 'danger'
      ? 'bg-red-950 text-red-400 border-red-800'
      : riskLevel === 'financial'
        ? 'bg-amber-950 text-amber-400 border-amber-800'
        : 'bg-yellow-950 text-yellow-400 border-yellow-800';

  const btnColor =
    riskLevel === 'danger'
      ? 'bg-red-600 hover:bg-red-500'
      : riskLevel === 'financial'
        ? 'bg-amber-600 hover:bg-amber-500'
        : 'bg-indigo-600 hover:bg-indigo-500';

  return (
    <div
      data-testid="confirm-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeColor}`}>
              {riskLevel.toUpperCase()} ACTION
            </span>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-slate-400 hover:text-slate-200 transition text-lg"
            >
              ✕
            </button>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-300 mb-5 leading-relaxed">{description}</p>

          {requireReason && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Administrative Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                data-testid="confirm-modal-reason-input"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this action is being taken (logged in immutable audit trail)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          )}

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="confirm-modal-submit-btn"
              onClick={handleConfirm}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition shadow-lg flex items-center gap-2 ${btnColor} ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
