/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  Laptop,
  Check,
  X,
  Trash2,
  Lock,
  Clock,
  Key,
  AlertTriangle,
  Sliders
} from 'lucide-react';
import { peerLinkStore } from '../services/store';
import { DeviceGrant, PermissionKey } from '../types/peerlink';

export const TrustedDevicesView: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceGrant | null>(
    peerLinkStore.trustedDevices[0] || null
  );

  const permissionLabels: Record<PermissionKey, { title: string; desc: string; danger?: boolean }> = {
    VIEW: { title: 'Screen View', desc: 'Allows streaming host desktop display' },
    CONTROL: { title: 'Mouse & Keyboard Injection', desc: 'Allows sending mouse clicks and keyboard scancodes' },
    CLIPBOARD_READ: { title: 'Read Host Clipboard', desc: 'Allows peer to copy content from host clipboard' },
    CLIPBOARD_WRITE: { title: 'Write Host Clipboard', desc: 'Allows peer to paste content onto host clipboard' },
    FILES_SEND: { title: 'Upload Files to Host', desc: 'Allows sending files to downloads sandbox' },
    FILES_RECEIVE: { title: 'Download Files from Host', desc: 'Allows pulling approved files from host' },
    FILES_BROWSE: { title: 'Browse Remote Filesystem', desc: 'Allows navigating directories via remote explorer' },
    AUDIO: { title: 'System Audio Loopback', desc: 'Streams WASAPI audio output from host' },
    ELEVATED: { title: 'Interact with UAC & Secure Desktop', desc: 'Requires SYSTEM Broker service', danger: true },
    POWER: { title: 'Reboot & Auto-Reconnect', desc: 'Allows restarting machine and reconnecting pre-login', danger: true },
    RECORD: { title: 'Session Screen Recording', desc: 'Permits capturing video audit of remote session' },
    UNATTENDED: { title: 'Unattended Access (No Prompt)', desc: 'Connects directly without waiting for click', danger: true }
  };

  const handleToggle = (permKey: PermissionKey) => {
    if (!selectedDevice) return;
    peerLinkStore.toggleDevicePermission(selectedDevice.id, permKey);
  };

  const handleRevoke = (devId: string) => {
    if (confirm('Revoke all credentials for this device? It will be removed from your trust store.')) {
      peerLinkStore.revokeDevice(devId);
      setSelectedDevice(peerLinkStore.trustedDevices[0] || null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-neutral-800">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Device Trust Store & Grants
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Cryptographically authenticated peers (Ed25519). All permissions follow default-deny and are enforced in the low-privilege Net broker.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DEVICE LIST */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
            Paired Devices ({peerLinkStore.trustedDevices.length})
          </span>

          <div className="space-y-2">
            {peerLinkStore.trustedDevices.map((dev) => {
              const isSelected = selectedDevice?.id === dev.id;
              return (
                <div
                  key={dev.id}
                  onClick={() => setSelectedDevice(dev)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-neutral-900 border-emerald-500/60 shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{dev.name}</span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              dev.isOnline ? 'bg-emerald-400' : 'bg-neutral-600'
                            }`}
                          />
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                          {dev.os}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span>IP: {dev.ip}</span>
                    <span>Last: {dev.lastSeen}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PERMISSIONS MATRIX INSPECTOR */}
        {selectedDevice ? (
          <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Grant Policy for {selectedDevice.name}</span>
                </h2>
                <div className="text-xs text-neutral-400 font-mono mt-1">
                  NodeID: {selectedDevice.nodeId}
                </div>
              </div>

              <button
                onClick={() => handleRevoke(selectedDevice.id)}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Revoke Device</span>
              </button>
            </div>

            {/* Grant Expiry Info */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-neutral-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>
                  Grant Validity: <strong>{selectedDevice.expiryDays || 90} Days</strong> (Re-approval required after expiration)
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">
                Created: {selectedDevice.createdAt}
              </span>
            </div>

            {/* Permission Toggles Grid */}
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
                Granular Capabilities
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Object.keys(permissionLabels) as PermissionKey[]).map((key) => {
                  const meta = permissionLabels[key];
                  const isEnabled = !!selectedDevice.permissions[key];

                  return (
                    <div
                      key={key}
                      onClick={() => handleToggle(key)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer flex items-start justify-between gap-3 transition-colors ${
                        isEnabled
                          ? 'bg-neutral-950 border-neutral-700/80'
                          : 'bg-neutral-950/40 border-neutral-800/60 opacity-60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{meta.title}</span>
                          {meta.danger && (
                            <span className="text-[9px] px-1 py-0.2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded">
                              Elevated
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-snug">{meta.desc}</p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                          isEnabled
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'bg-neutral-800 border-neutral-700 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-xs text-neutral-400">
            Select a device from the list to view and configure its permissions.
          </div>
        )}
      </div>
    </div>
  );
};
