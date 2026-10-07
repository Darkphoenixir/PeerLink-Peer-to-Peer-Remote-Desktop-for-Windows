/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Wifi,
  Video,
  Database,
  Lock,
  Save,
  Check,
  Server,
  Layers
} from 'lucide-react';
import { peerLinkStore } from '../services/store';
import { CodecType } from '../types/peerlink';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState({ ...peerLinkStore.settings });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    peerLinkStore.settings = { ...settings };
    peerLinkStore.addAuditEntry(
      'GRANT_MODIFIED',
      peerLinkStore.localNodeId,
      'LocalHost',
      'Updated system settings & network configuration'
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Settings</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Configure security policies, hardware video pipeline, and network directory parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Saved' : 'Save Changes'}</span>
        </button>
      </div>

      {/* SECTION 1: SECURITY & SESSIONS */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Security & Access Policies</span>
        </h2>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-neutral-800 cursor-pointer">
            <div className="space-y-0.5">
              <span className="font-semibold text-white">Lock Host on Disconnect</span>
              <p className="text-neutral-400">Automatically locks the controlled PC screen when a session terminates.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.lockOnDisconnect}
              onChange={(e) => setSettings({ ...settings, lockOnDisconnect: e.target.checked })}
              className="accent-emerald-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-neutral-800 cursor-pointer">
            <div className="space-y-0.5">
              <span className="font-semibold text-white">Block Local Physical Input During Session</span>
              <p className="text-neutral-400">Pauses local keyboard & mouse to prevent input conflicts.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.blockLocalInputOnConnect}
              onChange={(e) => setSettings({ ...settings, blockLocalInputOnConnect: e.target.checked })}
              className="accent-emerald-500 rounded"
            />
          </label>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-white">Emergency Panic Hotkey</span>
              <p className="text-neutral-400">Instantly severs the session and unhooks input.</p>
            </div>
            <input
              type="text"
              value={settings.panicHotkey}
              onChange={(e) => setSettings({ ...settings, panicHotkey: e.target.value })}
              className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded font-mono text-white text-xs w-48 text-right outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: NETWORK & CLOUDFLARE WORKER DIRECTORY */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>Cloudflare Worker Directory & iroh Relays</span>
        </h2>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-neutral-800 cursor-pointer">
            <div className="space-y-0.5">
              <span className="font-semibold text-white">Enable Cloudflare Worker + DO Short-Code Directory</span>
              <p className="text-neutral-400">Allows using 9-digit split short codes instead of 52-character NodeIDs.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.workerDirectoryEnabled}
              onChange={(e) => setSettings({ ...settings, workerDirectoryEnabled: e.target.checked })}
              className="accent-emerald-500 rounded"
            />
          </label>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1.5">
            <span className="font-semibold text-white block">Worker Endpoint URL</span>
            <input
              type="text"
              value={settings.workerUrl}
              onChange={(e) => setSettings({ ...settings, workerUrl: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 rounded font-mono text-white text-xs outline-none"
            />
            <span className="text-[11px] text-neutral-500">
              Free tier: 100k requests/day, 13,000 GB-s duration. Only lookup index is transmitted.
            </span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-white">Relay Mode</span>
              <p className="text-neutral-400">Fallback when direct UDP hole punching is blocked by symmetric NAT.</p>
            </div>
            <select
              value={settings.relayMode}
              onChange={(e) => setSettings({ ...settings, relayMode: e.target.value as any })}
              className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded text-white text-xs outline-none cursor-pointer"
            >
              <option value="default">Default Public iroh Relays</option>
              <option value="custom">Self-Hosted iroh-relay</option>
              <option value="off">Off (Strict Direct Only)</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 3: VIDEO ENCODING & HARDWARE PIPELINE */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Video className="w-4 h-4 text-emerald-400" />
          <span>Hardware Video Pipeline</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-white">Preferred Codec</span>
              <p className="text-neutral-400">Media Foundation zero-copy hardware encoder backend.</p>
            </div>
            <select
              value={settings.preferredCodec}
              onChange={(e) => setSettings({ ...settings, preferredCodec: e.target.value as CodecType })}
              className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded text-white text-xs outline-none cursor-pointer font-mono"
            >
              <option value="AV1 (HW)">AV1 (Hardware - NVENC/AMF/oneVPL)</option>
              <option value="HEVC (HW)">HEVC / H.265 (Hardware)</option>
              <option value="H.264 (HW)">H.264 (Hardware - Universal)</option>
              <option value="OpenH264 (SW)">OpenH264 (Software Fallback)</option>
            </select>
          </div>

          <label className="flex items-center justify-between p-3 bg-neutral-950 rounded-lg border border-neutral-800 cursor-pointer">
            <div className="space-y-0.5">
              <span className="font-semibold text-white">Chroma 4:4:4 Crisp Text Refinement</span>
              <p className="text-neutral-400">Refines static text regions with uncompressed sub-sampling when motion stops.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enable444CrispText}
              onChange={(e) => setSettings({ ...settings, enable444CrispText: e.target.checked })}
              className="accent-emerald-500 rounded"
            />
          </label>
        </div>
      </div>

      {/* SECTION 4: THREE-PROCESS ARCHITECTURE & SESSION 0 ISOLATION */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Three-Process Privilege Separation & Session 0</h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">Security Gate Passed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
            <div className="font-mono text-emerald-400 font-semibold">1. Broker Service</div>
            <div className="text-white text-[11px]">peerlink.exe --service</div>
            <p className="text-neutral-400 text-[11px] leading-snug">
              Runs in Session 0 (SYSTEM). <strong>Zero network sockets</strong>. Spawns and monitors Net &amp; Agent processes.
            </p>
          </div>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
            <div className="font-mono text-blue-400 font-semibold">2. Net Process</div>
            <div className="text-white text-[11px]">peerlink.exe --net</div>
            <p className="text-neutral-400 text-[11px] leading-snug">
              Low-privilege restricted token. Owns iroh QUIC endpoint &amp; TLS 1.3 handshakes. If attacked, SYSTEM is safe.
            </p>
          </div>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
            <div className="font-mono text-amber-400 font-semibold">3. Agent Process</div>
            <div className="text-white text-[11px]">peerlink.exe --agent</div>
            <p className="text-neutral-400 text-[11px] leading-snug">
              Runs in interactive session. Attached to input desktop (Default, Winlogon, UAC secure desktop).
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 5: ARCHITECTURE & LICENSING COMPLIANCE */}
      <div className="p-4 bg-neutral-900/60 rounded-xl border border-neutral-800 text-xs text-neutral-400 space-y-2">
        <span className="font-semibold text-neutral-200 block">Open Architecture & Compliance</span>
        <p>
          PeerLink uses iroh 1.x (Apache 2.0 / MIT), OpenH264 (BSD), and BLAKE3. No GPL or AGPL libraries are bundled.
          All crypto keys are sealed at rest via Windows DPAPI (machine scope).
        </p>
      </div>
    </div>
  );
};
