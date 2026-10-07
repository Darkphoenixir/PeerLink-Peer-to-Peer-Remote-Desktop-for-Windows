/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Globe,
  Wifi,
  Laptop,
  ArrowRight,
  Server,
  Lock,
  ExternalLink,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { peerLinkStore } from '../services/store';
import { ShortCodeSplit } from '../types/peerlink';
import { formatBytes } from '../services/crypto-mock';

interface HomeViewProps {
  onStartPairing: (initialCode?: string) => void;
  onOpenNetworkDiag: () => void;
  onOpenDocs: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartPairing,
  onOpenNetworkDiag,
  onOpenDocs
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [targetCode, setTargetCode] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  const localNodeId = peerLinkStore.localNodeId;
  const splitCode = peerLinkStore.localSplitCode;

  const handleCopyId = () => {
    navigator.clipboard.writeText(localNodeId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(splitCode.fullCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyTicket = () => {
    const ticket = `peerlink://pair/${localNodeId}?code=${splitCode.fullCode}&relay=iroh.network`;
    navigator.clipboard.writeText(ticket);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  const handleRegenerateCode = () => {
    peerLinkStore.regenerateHostCode();
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetCode.trim()) {
      onStartPairing(targetCode.trim());
    }
  };

  // Simulated LAN peers found via mDNS
  const lanPeers = [
    {
      name: 'Studio-Rig-RTX4090',
      ip: '192.168.1.104',
      nodeId: 'iroh-node-k8p2-9f3m-v1w7-z4b6',
      rtt: '1.8 ms',
      code: '512-884-391'
    },
    {
      name: 'Server-Backup-Win11',
      ip: '192.168.1.220',
      nodeId: 'iroh-node-b7n4-2x8q-w9m3-p1z5',
      rtt: '2.4 ms',
      code: '891-204-712'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Top Banner / Hero Explanation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Peer-to-Peer Remote Workspace
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Direct end-to-end encrypted QUIC session. Zero corporate servers carrying video.
            Optional Cloudflare Worker directory handles 9-digit short-code discovery with zero-knowledge PAKE key exchange.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-xs font-medium text-emerald-400 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Docs &amp; Showcase</span>
          </button>

          <button
            onClick={onOpenNetworkDiag}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 text-xs font-medium text-neutral-300 transition-colors cursor-pointer"
          >
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>Architecture &amp; Relay</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Share this PC */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Share This PC</h2>
                  <p className="text-xs text-neutral-400">Allow a trusted device to connect</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ready for pairing</span>
              </div>
            </div>

            {/* 9-Digit Split Code Section */}
            <div className="bg-neutral-950 border border-neutral-800/80 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  9-Digit Session Code
                </span>
                <button
                  onClick={handleRegenerateCode}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                  title="Regenerate code"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 bg-neutral-900 px-4 py-3 rounded border border-neutral-800">
                <div className="font-mono text-2xl font-bold tracking-widest text-emerald-400 tabular-nums">
                  {splitCode.fullCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Zero-Knowledge Untrusted Worker Split Explanation */}
              <div className="text-[11px] leading-relaxed text-neutral-400 bg-neutral-900/40 p-2.5 rounded border border-neutral-800/60 space-y-1">
                <div className="flex items-center gap-1.5 text-neutral-300 font-semibold">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Zero-Knowledge Split Protection:</span>
                </div>
                <p>
                  <span className="text-emerald-400 font-mono font-medium">{splitCode.lookupIndex}</span> (first 6 digits) is sent to the Cloudflare Worker & DO directory for address lookup.
                </p>
                <p>
                  <span className="text-amber-400 font-mono font-medium">{splitCode.pakeSecret}</span> (last 3 digits) is <strong className="text-neutral-200">never sent to any server</strong> and is used strictly for mutual PAKE key confirmation over direct QUIC.
                </p>
              </div>
            </div>

            {/* Permanent Node ID */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-neutral-400">Direct Cryptographic NodeID (Ed25519)</span>
              <div className="flex items-center justify-between gap-2 bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-800 text-xs font-mono text-neutral-300">
                <span className="truncate">{localNodeId}</span>
                <button
                  onClick={handleCopyId}
                  className="text-neutral-400 hover:text-white shrink-0 p-1 cursor-pointer"
                  title="Copy NodeID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-5 mt-5 border-t border-neutral-800">
            <button
              onClick={handleCopyTicket}
              className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700/80 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedTicket ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Invite Ticket URL</span>
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700/80 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Show QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR</span>
            </button>

            <button
              onClick={() => peerLinkStore.toggleSimulatedHostControlled()}
              className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Test the host-side floating control pill"
            >
              <span>{peerLinkStore.hostControlledSession ? 'Exit Host Mode' : 'Host View'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Connect to a PC */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Connect to Remote PC</h2>
                  <p className="text-xs text-neutral-400">Control an authorized workstation</p>
                </div>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleConnectSubmit} className="space-y-3">
              <label className="block text-xs font-medium text-neutral-400">
                Enter 9-Digit Code, Invite Ticket, or NodeID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={targetCode}
                  onChange={(e) => setTargetCode(e.target.value)}
                  placeholder="e.g. 512-884-391 or paste ticket"
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60"
                />
                <button
                  type="submit"
                  disabled={!targetCode.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Connect</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* LAN Discovery Sub-Section */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-neutral-300">Local LAN Discovery (mDNS)</span>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono">2 devices visible</span>
              </div>

              <div className="space-y-2">
                {lanPeers.map((peer) => (
                  <div
                    key={peer.nodeId}
                    className="flex items-center justify-between p-3 bg-neutral-950/80 hover:bg-neutral-950 border border-neutral-800/80 rounded-lg text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-white">{peer.name}</div>
                      <div className="text-neutral-500 font-mono text-[11px] flex items-center gap-2 mt-0.5">
                        <span>{peer.ip}</span>
                        <span>·</span>
                        <span>{peer.rtt}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onStartPairing(peer.code)}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 text-xs text-neutral-500 text-center">
            Connections are protected by TLS 1.3 and require host authorization.
          </div>
        </div>
      </div>

      {/* Quick Test Payloads (for Drag & Drop Testing) */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-300">Quick Test Payloads (iroh-blobs)</span>
          <span className="text-[11px] text-neutral-500 font-mono">Drag or click to test transfers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: 'gpu_hotfix_v522.msi', size: 48200000, desc: 'Hardware display patch' },
            { name: 'audit_telemetry.evtx', size: 12400000, desc: 'Windows event log dump' },
            { name: 'firmware_build_x64.bin', size: 8400000, desc: 'Signed UEFI package' }
          ].map((item, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', item.name);
              }}
              onClick={() => {
                peerLinkStore.dropFileToRemote({ name: item.name, size: item.size });
                peerLinkStore.addToast('Payload Prepared', `Queued ${item.name} for transfer testing.`, 'info');
              }}
              className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 cursor-grab active:cursor-grabbing text-xs flex items-center justify-between transition-colors"
            >
              <div>
                <div className="font-medium text-white truncate max-w-[160px]">{item.name}</div>
                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{item.desc}</div>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono px-1.5 py-0.5 rounded bg-emerald-500/10">
                {formatBytes(item.size)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Devices Quick Strip */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-300">Recent Trusted Sessions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {peerLinkStore.trustedDevices.map((dev) => (
            <div
              key={dev.id}
              className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>{dev.name}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        dev.isOnline ? 'bg-emerald-400' : 'bg-neutral-600'
                      }`}
                      title={dev.isOnline ? 'Online' : 'Offline'}
                    />
                  </div>
                  <div className="text-xs text-neutral-500 font-mono mt-0.5">
                    {dev.os} · {dev.ip}
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  peerLinkStore.startSession({
                    nodeId: dev.nodeId,
                    name: dev.name,
                    path: 'direct'
                  })
                }
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Launch Session
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center">
            <h3 className="text-base font-bold text-white">Scan to Connect</h3>
            <p className="text-xs text-neutral-400">
              Open PeerLink on your mobile or second laptop to pair instantly.
            </p>

            <div className="p-4 bg-white rounded-xl inline-block mx-auto shadow-md">
              {/* High quality SVG QR representation */}
              <div className="w-48 h-48 bg-neutral-950 flex flex-col items-center justify-center p-2 rounded">
                <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-white rounded">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                          ? 'bg-neutral-950'
                          : 'bg-neutral-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-emerald-400">
              {splitCode.fullCode}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
