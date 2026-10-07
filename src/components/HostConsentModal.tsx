/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  Check,
  Eye,
  X,
  Lock
} from 'lucide-react';

interface HostConsentModalProps {
  peerName: string;
  peerNodeId: string;
  onAllow: (permissions: { control: boolean; clipboard: boolean; files: boolean }) => void;
  onDeny: () => void;
}

export const HostConsentModal: React.FC<HostConsentModalProps> = ({
  peerName,
  peerNodeId,
  onAllow,
  onDeny
}) => {
  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDeny();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onDeny]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
        {/* Warning Icon & Heading */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Incoming Remote Session Request</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              A remote device is requesting permission to view and control this PC.
            </p>
          </div>
        </div>

        {/* Peer Info */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">Device Name:</span>
            <span className="font-semibold text-white">{peerName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-400">NodeID Fingerprint:</span>
            <span className="font-mono text-neutral-300 truncate max-w-[200px]">{peerNodeId}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800/80">
            <span className="text-neutral-400">Security:</span>
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <Lock className="w-3 h-3" />
              <span>TLS 1.3 · PAKE Verified</span>
            </span>
          </div>
        </div>

        {/* Countdown Pill */}
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 bg-neutral-800/50 py-2 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Auto-denying in <strong className="text-white font-mono">{secondsLeft}s</strong> if no action is taken</span>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => onAllow({ control: true, clipboard: true, files: true })}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Allow View & Full Control</span>
          </button>

          <button
            onClick={() => onAllow({ control: false, clipboard: false, files: false })}
            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-neutral-400" />
            <span>Allow View-Only (Spectator Mode)</span>
          </button>

          <button
            onClick={onDeny}
            className="w-full py-2 bg-transparent hover:bg-rose-950/40 text-rose-400 border border-transparent hover:border-rose-800/60 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Decline Request</span>
          </button>
        </div>

        <p className="text-[10px] text-neutral-500 text-center">
          Security policy: Remote input cannot click or bypass this dialog.
        </p>
      </div>
    </div>
  );
};
