/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Server,
  Key,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { directoryService } from '../services/directory-service';
import { generateSAS } from '../services/crypto-mock';
import { peerLinkStore } from '../services/store';

interface PairingModalProps {
  initialCode?: string;
  onClose: () => void;
  onSuccess: (peer: { nodeId: string; name: string }) => void;
}

type PairingStep = 'input' | 'resolving_directory' | 'pake_exchange' | 'sas_verify' | 'permissions';

export const PairingModal: React.FC<PairingModalProps> = ({
  initialCode = '',
  onClose,
  onSuccess
}) => {
  const [code, setCode] = useState(initialCode);
  const [step, setStep] = useState<PairingStep>(initialCode ? 'resolving_directory' : 'input');
  const [error, setError] = useState<string | null>(null);

  // Resolved directory info
  const [resolvedNodeId, setResolvedNodeId] = useState('');
  const [resolvedRelay, setResolvedRelay] = useState('');
  const [splitInfo, setSplitInfo] = useState<{ lookup: string; secret: string } | null>(null);

  // SAS data
  const [sasData, setSasData] = useState<{ words: string[]; emojis: string[] } | null>(null);

  // Initial grant settings
  const [allowControl, setAllowControl] = useState(true);
  const [allowClipboard, setAllowClipboard] = useState(true);
  const [allowFiles, setAllowFiles] = useState(true);
  const [allowAudio, setAllowAudio] = useState(false);

  useEffect(() => {
    if (initialCode) {
      handleStartResolution(initialCode);
    }
  }, [initialCode]);

  const handleStartResolution = (rawCode: string) => {
    setError(null);
    setStep('resolving_directory');

    // Parse 9-digit code
    const parsed = directoryService.parseInputCode(rawCode);
    if (!parsed) {
      // Check if raw NodeID or ticket was passed
      if (rawCode.startsWith('iroh-node-') || rawCode.startsWith('peerlink://')) {
        const id = rawCode.replace('peerlink://pair/', '').split('?')[0];
        setResolvedNodeId(id);
        setResolvedRelay('https://us-east.relay.iroh.network:443');
        proceedToPake(id, '000');
        return;
      }
      setError('Invalid format. Please enter a 9-digit code (e.g. 512-884-391) or NodeID.');
      setStep('input');
      return;
    }

    setSplitInfo({ lookup: parsed.lookupIndex, secret: parsed.pakeSecret });

    // Simulate Cloudflare Worker & DO query
    setTimeout(() => {
      const record = directoryService.lookupHost(parsed.lookupIndex);
      if (!record) {
        // Fallback demo mock if not in local store
        const fallbackId = `iroh-node-k8p2-${parsed.lookupIndex.replace('-', '')}-v1w7`;
        setResolvedNodeId(fallbackId);
        setResolvedRelay('https://us-east.relay.iroh.network:443');
        proceedToPake(fallbackId, parsed.pakeSecret);
      } else {
        setResolvedNodeId(record.nodeId);
        setResolvedRelay(record.relayHint);
        proceedToPake(record.nodeId, parsed.pakeSecret);
      }
    }, 1200);
  };

  const proceedToPake = (nodeId: string, secret: string) => {
    setStep('pake_exchange');

    // Simulate SPAKE2 / CPace channel binding over direct QUIC
    setTimeout(() => {
      // Generate SAS from session exporter
      const sas = generateSAS(`${nodeId}_${secret}`);
      setSasData(sas);
      setStep('sas_verify');
    }, 1400);
  };

  const handleConfirmSAS = () => {
    setStep('permissions');
  };

  const handleFinalConnect = () => {
    // Add to trusted devices if not existing
    const peerName = 'Remote-Workstation-Host';
    onSuccess({
      nodeId: resolvedNodeId,
      name: peerName
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Peer Pairing & Key Exchange</h2>
            <p className="text-xs text-neutral-400">Zero-knowledge direct encrypted link</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Input Code */}
          {step === 'input' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300">
                  Target Host 9-Digit Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 512-884-391"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-base font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="text-xs text-neutral-400 space-y-1 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
                <span className="font-semibold text-neutral-300 block">How it works:</span>
                <p>
                  1. The first 6 digits lookup the host address via Cloudflare Worker DO.
                </p>
                <p>
                  2. The last 3 digits are used exclusively for direct mutual PAKE key confirmation.
                </p>
              </div>

              <button
                onClick={() => handleStartResolution(code)}
                disabled={!code.trim()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Begin Secure Handshake</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Resolving Directory */}
          {step === 'resolving_directory' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">
                  Querying Cloudflare Worker & Durable Object
                </h3>
                <p className="text-xs text-neutral-400">
                  Looking up host NodeID with prefix {splitInfo?.lookup || '...'}. PAKE secret is kept private.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: PAKE Key Exchange */}
          {step === 'pake_exchange' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-white">
                  Executing PAKE Mutual Key Confirmation
                </h3>
                <p className="text-xs text-neutral-400">
                  Validating channel-bound SPAKE2 tokens directly over TLS 1.3 QUIC.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: SAS Verification */}
          {step === 'sas_verify' && sasData && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Verify Short Authentication String (SAS)</h3>
                <p className="text-xs text-neutral-400">
                  Compare these words with the host screen to guarantee zero MITM interception:
                </p>
              </div>

              {/* SAS Words & Emojis */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center space-y-2">
                <div className="text-2xl tracking-widest">{sasData.emojis.join('  ')}</div>
                <div className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
                  {sasData.words.join(' · ')}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Reject / Does Not Match
                </button>
                <button
                  onClick={handleConfirmSAS}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Words Match, Proceed</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Permissions & Connect */}
          {step === 'permissions' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Session Grant Configuration</h3>
                <p className="text-xs text-neutral-400">Select initial capabilities for this session:</p>
              </div>

              <div className="space-y-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <label className="flex items-center justify-between p-2 rounded hover:bg-neutral-900 cursor-pointer">
                  <span className="text-xs text-neutral-200">Remote Mouse & Keyboard Control</span>
                  <input
                    type="checkbox"
                    checked={allowControl}
                    onChange={(e) => setAllowControl(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded hover:bg-neutral-900 cursor-pointer">
                  <span className="text-xs text-neutral-200">Bidirectional Clipboard Sync</span>
                  <input
                    type="checkbox"
                    checked={allowClipboard}
                    onChange={(e) => setAllowClipboard(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded hover:bg-neutral-900 cursor-pointer">
                  <span className="text-xs text-neutral-200">Resumable File Transfer (iroh-blobs)</span>
                  <input
                    type="checkbox"
                    checked={allowFiles}
                    onChange={(e) => setAllowFiles(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded hover:bg-neutral-900 cursor-pointer">
                  <span className="text-xs text-neutral-200">System Audio Stream (WASAPI loopback)</span>
                  <input
                    type="checkbox"
                    checked={allowAudio}
                    onChange={(e) => setAllowAudio(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                </label>
              </div>

              <button
                onClick={handleFinalConnect}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Launch Remote Desktop Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
