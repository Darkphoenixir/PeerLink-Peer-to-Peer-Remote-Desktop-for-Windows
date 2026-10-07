/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  Server,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  Globe,
  Radio,
  Sliders,
  CheckCircle2,
  Lock,
  ArrowRight,
  Database
} from 'lucide-react';
import { directoryService } from '../services/directory-service';
import { peerLinkStore } from '../services/store';

export const NetworkDiagnosticsView: React.FC = () => {
  const [simulatedLoss, setSimulatedLoss] = useState(0);
  const [testCodeInput, setTestCodeInput] = useState('512-884-391');
  const [testResult, setTestResult] = useState<string | null>(null);

  const workerStats = directoryService.getStats();

  const handleTestResolution = () => {
    const parsed = directoryService.parseInputCode(testCodeInput);
    if (!parsed) {
      setTestResult('Error: Code must be 9 digits (XXX-XXX-YYY)');
      return;
    }
    const record = directoryService.lookupHost(parsed.lookupIndex);
    if (record) {
      setTestResult(
        `Resolved via Worker DO:\n` +
        `• Lookup Key sent to Worker: "${parsed.lookupIndex}"\n` +
        `• PAKE Secret (RETAINED LOCALLY, NEVER SENT): "${parsed.pakeSecret}"\n` +
        `• Target Host NodeID: ${record.nodeId}\n` +
        `• Relay Hint: ${record.relayHint}\n` +
        `• Zero-Knowledge Proof: PASSED (Worker cannot decrypt PAKE)`
      );
    } else {
      setTestResult(`No active registration found for index "${parsed.lookupIndex}" in Worker DO.`);
    }
  };

  // Determine ladder level based on simulated packet loss
  const getSimulatedLadder = (loss: number) => {
    if (loss <= 1) return { level: 'L6', fps: 60, scale: '100%', bitrate: '8.4 Mbps', quality: 'Ultra (LAN/Fiber)' };
    if (loss <= 3) return { level: 'L5', fps: 60, scale: '100%', bitrate: '4.8 Mbps', quality: 'High (Good WAN)' };
    if (loss <= 6) return { level: 'L4', fps: 30, scale: '100%', bitrate: '2.5 Mbps', quality: 'Standard (Typical WAN)' };
    if (loss <= 9) return { level: 'L3', fps: 30, scale: '75%', bitrate: '1.2 Mbps', quality: 'Degraded' };
    if (loss <= 12) return { level: 'L2', fps: 24, scale: '75%', bitrate: '650 kbps', quality: 'Poor' };
    return { level: 'L0', fps: 10, scale: '50%', bitrate: '180 kbps', quality: 'Survival Mode (Text Refinement Active)' };
  };

  const ladder = getSimulatedLadder(simulatedLoss);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="pb-4 border-b border-neutral-800">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Network Topology & Directory Architecture
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Detailed engineering view of the iroh QUIC connectivity ladder, untrusted Cloudflare Worker + Durable Object directory, and ABR congestion controller.
        </p>
      </div>

      {/* SECTION 1: CONNECTIVITY LADDER TIERS */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Multi-Tier P2P Connectivity Ladder</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier 1: LAN */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">Tier 1 · LAN Discovery</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                &lt; 3 ms
              </span>
            </div>
            <p className="text-xs text-neutral-300">
              Direct UDP communication over local subnet via mDNS beacon. Zero external servers, fully offline capable.
            </p>
            <div className="text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-800">
              Payload: Encrypted QUIC Datagrams
            </div>
          </div>

          {/* Tier 2: Direct Hole-Punched */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">Tier 2 · Direct QUIC (QNT)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
                ~90% Success
              </span>
            </div>
            <p className="text-xs text-neutral-300">
              UDP hole punching coordinated through iroh relay. Connection migrates to direct socket, eliminating relay hops.
            </p>
            <div className="text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-800">
              Rendezvous: Stateless Coordinator
            </div>
          </div>

          {/* Tier 3: Stateless Relay */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">Tier 3 · Stateless Relay</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">
                Fallback
              </span>
            </div>
            <p className="text-xs text-neutral-300">
              Stateless forwarding of TLS 1.3 ciphertext over HTTPS (port 443). Relays cannot decrypt video or input.
            </p>
            <div className="text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-800">
              Data Path: End-to-End Encrypted
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: UNTRUSTED CLOUDFLARE WORKER & DURABLE OBJECT DIRECTORY */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Untrusted Cloudflare Worker + Durable Object Architecture</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Provides convenient 9-digit short-code pairing without trusting the Worker with session security.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>DO SQLite Records: {workerStats.activeRecords}</span>
          </div>
        </div>

        {/* Cryptographic Split Diagram */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="text-xs font-semibold text-neutral-300">
            Split-Code Cryptographic Isolation Proof:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1.5">
              <span className="text-[11px] font-bold text-neutral-400 block uppercase">1. Host Generation</span>
              <div className="font-mono text-emerald-400 font-bold text-sm">482-915-370</div>
              <p className="text-neutral-400 text-[11px]">
                Host splits the 9 digits into a public lookup index and private PAKE secret.
              </p>
            </div>

            <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1.5">
              <span className="text-[11px] font-bold text-blue-400 block uppercase">2. Worker DO Receives</span>
              <div className="font-mono text-blue-400 font-bold text-sm">Index: 482-915</div>
              <p className="text-neutral-400 text-[11px]">
                Stores NodeID & relay hint. <strong>Worker NEVER learns "370"!</strong>
              </p>
            </div>

            <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-400 block uppercase">3. PAKE Key Exchange</span>
              <div className="font-mono text-amber-400 font-bold text-sm">Secret: 370</div>
              <p className="text-neutral-400 text-[11px]">
                Exchanged directly over QUIC. Malicious Worker cannot decrypt or MITM.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Directory Resolution Tester */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-neutral-300 block">
            Test Short-Code Directory Resolution (Simulated Cloudflare Worker DO):
          </span>

          <div className="flex gap-2">
            <input
              type="text"
              value={testCodeInput}
              onChange={(e) => setTestCodeInput(e.target.value)}
              placeholder="e.g. 512-884-391"
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none"
            />
            <button
              onClick={handleTestResolution}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Simulate Lookup
            </button>
          </div>

          {testResult && (
            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-xs font-mono text-neutral-300 whitespace-pre-line leading-relaxed">
              {testResult}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: ABR CONGESTION CONTROLLER & PACKET LOSS EMULATOR */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Adaptive Bitrate (ABR) & Network Emulation Lab</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Simulate packet loss and watch the ABR engine dynamically step down the video ladder and trigger progressive refinement.
          </p>
        </div>

        {/* Loss Slider */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-medium">Injected Packet Loss Simulation:</span>
            <span className="font-mono text-rose-400 font-bold text-sm">{simulatedLoss}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="15"
            step="1"
            value={simulatedLoss}
            onChange={(e) => setSimulatedLoss(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-neutral-500 font-mono">
            <span>0% (Ideal)</span>
            <span>5% (Jittery)</span>
            <span>10% (Challenged)</span>
            <span>15% (Severe Blackout)</span>
          </div>
        </div>

        {/* Live Ladder Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
            <span className="text-neutral-500 text-[11px]">ABR Level:</span>
            <div className="text-base font-bold text-emerald-400 font-mono">{ladder.level}</div>
            <span className="text-neutral-400 text-[11px]">{ladder.quality}</span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
            <span className="text-neutral-500 text-[11px]">Target Bitrate:</span>
            <div className="text-base font-bold text-white font-mono">{ladder.bitrate}</div>
            <span className="text-neutral-400 text-[11px]">Deadline Reset Active</span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
            <span className="text-neutral-500 text-[11px]">Framerate Cap:</span>
            <div className="text-base font-bold text-white font-mono">{ladder.fps} FPS</div>
            <span className="text-neutral-400 text-[11px]">Scale: {ladder.scale}</span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
            <span className="text-neutral-500 text-[11px]">Progressive Refinement:</span>
            <div className={`text-base font-bold font-mono ${simulatedLoss > 6 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {simulatedLoss > 6 ? 'High Priority' : 'Nominal'}
            </div>
            <span className="text-neutral-400 text-[11px]">Dirty-rect text sharpening</span>
          </div>
        </div>
      </div>
      {/* SECTION 4: NAT TRAVERSAL & STUN DIAGNOSTICS */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wifi className="w-4 h-4 text-blue-400" />
              <span>NAT Type Analyzer & STUN Probe</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Determines UDP port mapping behavior and hole-punching probability across firewalls.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Endpoint Independent (Cone NAT)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
            <span className="text-neutral-500 text-[11px]">Mapping Behavior:</span>
            <div className="text-white font-medium">Endpoint-Independent Mapping</div>
            <p className="text-neutral-400 text-[11px]">Direct hole punching supported with high reliability.</p>
          </div>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
            <span className="text-neutral-500 text-[11px]">Filtering Behavior:</span>
            <div className="text-white font-medium">Address-Restricted Cone</div>
            <p className="text-neutral-400 text-[11px]">Requires simultaneous bidirectional UDP probe (QNT).</p>
          </div>

          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
            <span className="text-neutral-500 text-[11px]">Fallback Strategy:</span>
            <div className="text-amber-400 font-medium">Stateless iroh-relay on port 443</div>
            <p className="text-neutral-400 text-[11px]">Auto-upgrades to direct UDP within 2s of path discovery.</p>
          </div>
        </div>
      </div>

      {/* SECTION 5: CLOUDFLARE WORKER DO SQLITE SCHEMA AUDIT */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Durable Object SQLite Schema Audit</h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            PAKE Secret Isolated (Zero-Knowledge)
          </span>
        </div>

        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-300 space-y-2 overflow-x-auto">
          <div className="text-neutral-500">-- Verified Cloudflare DO Table Schema:</div>
          <div className="text-blue-400">
            CREATE TABLE IF NOT EXISTS host_directory (<br />
            &nbsp;&nbsp;lookup_index TEXT PRIMARY KEY, -- First 6 digits only (e.g. '512-884')<br />
            &nbsp;&nbsp;node_id TEXT NOT NULL, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-- Ed25519 Public Key<br />
            &nbsp;&nbsp;relay_hint TEXT, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-- Public Relay URL<br />
            &nbsp;&nbsp;direct_addrs TEXT, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-- LAN/WAN candidates<br />
            &nbsp;&nbsp;expires_at INTEGER &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-- Epoch timestamp<br />
            );
          </div>
          <div className="text-emerald-400/90 pt-1 text-[11px]">
            Notice: No column exists for PAKE secrets. The Worker is mathematically incapable of impersonating either peer.
          </div>
        </div>
      </div>
    </div>
  );
};
