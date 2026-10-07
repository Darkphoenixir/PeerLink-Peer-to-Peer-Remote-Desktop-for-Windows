/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { HomeView } from './components/HomeView';
import { RemoteDesktopViewer } from './components/RemoteDesktopViewer';
import { FileManagerView } from './components/FileManagerView';
import { TrustedDevicesView } from './components/TrustedDevicesView';
import { AuditLogView } from './components/AuditLogView';
import { NetworkDiagnosticsView } from './components/NetworkDiagnosticsView';
import { SettingsView } from './components/SettingsView';
import { PairingModal } from './components/PairingModal';
import { HostConsentModal } from './components/HostConsentModal';
import { peerLinkStore } from './services/store';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [, setTick] = useState(0); // Trigger re-render on store update
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [initialPairingCode, setInitialPairingCode] = useState<string | undefined>(undefined);

  // Subscribe to store updates
  useEffect(() => {
    const unsub = peerLinkStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  // Global Keyboard listener for Panic Hotkey (Ctrl+Alt+Shift+Pause or Ctrl+Alt+Shift+Q)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.altKey && e.shiftKey && (e.key === 'Pause' || e.key === 'q' || e.key === 'Q'))
      ) {
        e.preventDefault();
        peerLinkStore.triggerPanicStop();
        alert('EMERGENCY PANIC STOP TRIGGERED: Remote session terminated and all inputs released.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartPairing = (code?: string) => {
    setInitialPairingCode(code);
    setShowPairingModal(true);
  };

  const handlePairingSuccess = (peer: { nodeId: string; name: string }) => {
    setShowPairingModal(false);
    peerLinkStore.startSession({
      nodeId: peer.nodeId,
      name: peer.name,
      path: 'direct'
    });
    setCurrentTab('session');
  };

  const activeSession = peerLinkStore.activeSession;
  const pendingConsent = peerLinkStore.pendingConsent;

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 font-sans antialiased overflow-hidden select-none">
      {/* Top Header Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeSession={activeSession}
        onPanicStop={() => peerLinkStore.triggerPanicStop()}
        onQuickConnect={() => handleStartPairing()}
      />

      {/* HOST-SIDE PERSISTENT FLOATING CONTROL PILL (When this PC is being remotely controlled) */}
      {peerLinkStore.hostControlledSession && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-amber-500/80 rounded-xl px-4 py-2 shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-semibold text-white">
              Controlled by {peerLinkStore.hostControlledSession.controllerName}
            </span>
          </div>

          <div className="text-[11px] font-mono text-neutral-400 pl-2 border-l border-neutral-800">
            {Math.floor(peerLinkStore.hostControlledSession.durationSeconds / 60)}:
            {(peerLinkStore.hostControlledSession.durationSeconds % 60).toString().padStart(2, '0')}
          </div>

          <button
            onClick={() => peerLinkStore.toggleHostInputPause()}
            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
              peerLinkStore.hostControlledSession.inputPaused
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {peerLinkStore.hostControlledSession.inputPaused ? 'Resume Input' : 'Pause Remote Input'}
          </button>

          <button
            onClick={() => peerLinkStore.toggleSimulatedHostControlled()}
            className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 rounded text-xs font-semibold cursor-pointer transition-colors"
          >
            Stop Session
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentTab === 'dashboard' && (
          <HomeView
            onStartPairing={handleStartPairing}
            onOpenNetworkDiag={() => setCurrentTab('network')}
          />
        )}

        {currentTab === 'session' && activeSession && (
          <RemoteDesktopViewer
            session={activeSession}
            onDisconnect={() => {
              peerLinkStore.endSession('User clicked disconnect');
              setCurrentTab('dashboard');
            }}
            onPanicStop={() => {
              peerLinkStore.triggerPanicStop();
              setCurrentTab('dashboard');
            }}
          />
        )}

        {currentTab === 'session' && !activeSession && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
              <span className="text-2xl font-mono">--</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">No Active Remote Session</h2>
              <p className="text-xs text-neutral-400">
                Connect to a remote PC from the dashboard or devices list to view the desktop.
              </p>
            </div>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {currentTab === 'devices' && <TrustedDevicesView />}

        {currentTab === 'files' && <FileManagerView />}

        {currentTab === 'audit' && <AuditLogView />}

        {currentTab === 'network' && <NetworkDiagnosticsView />}

        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Pairing Modal */}
      {showPairingModal && (
        <PairingModal
          initialCode={initialPairingCode}
          onClose={() => setShowPairingModal(false)}
          onSuccess={handlePairingSuccess}
        />
      )}

      {/* Host Attended Consent Modal */}
      {pendingConsent && (
        <HostConsentModal
          peerName={pendingConsent.peerName}
          peerNodeId={pendingConsent.peerNodeId}
          onAllow={(perms) => {
            peerLinkStore.pendingConsent = null;
            peerLinkStore.notify();
          }}
          onDeny={() => {
            peerLinkStore.pendingConsent = null;
            peerLinkStore.notify();
          }}
        />
      )}

      {/* FLOATING TOAST NOTIFICATIONS (Windows 11 Fluent Notification Stack) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {peerLinkStore.toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-150 ${
              toast.type === 'success'
                ? 'bg-neutral-900/95 border-emerald-500/60 text-white'
                : toast.type === 'warn'
                ? 'bg-neutral-900/95 border-amber-500/60 text-white'
                : toast.type === 'error'
                ? 'bg-neutral-900/95 border-rose-500/60 text-white'
                : 'bg-neutral-900/95 border-neutral-700 text-white'
            }`}
          >
            <div className="space-y-0.5 flex-1">
              <div className="font-semibold text-white">{toast.title}</div>
              <div className="text-[11px] text-neutral-300 leading-snug">{toast.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
