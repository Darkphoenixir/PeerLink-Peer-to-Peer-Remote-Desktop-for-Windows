/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DeviceGrant,
  AuditBlock,
  FileTransferItem,
  LiveStats,
  ShortCodeSplit,
  ChatMessage,
  CodecType,
  ConnectionTier,
  QualityPreset
} from '../types/peerlink';
import {
  generateNodeId,
  generateSplitShortCode,
  generateBlake3Hash,
  formatBytes
} from './crypto-mock';
import { directoryService } from './directory-service';

export interface AppSettings {
  serviceInstalled: boolean;
  unattendedAllowed: boolean;
  lockOnDisconnect: boolean;
  blockLocalInputOnConnect: boolean;
  panicHotkey: string;
  workerDirectoryEnabled: boolean;
  workerUrl: string;
  preferredCodec: CodecType;
  enable444CrispText: boolean;
  maxFpsCap: number;
  dataSaverCapKbps: number;
  relayMode: 'default' | 'custom' | 'off';
  customRelayUrl: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
  timestamp: number;
}

export interface ActiveSession {
  id: string;
  role: 'controller' | 'host';
  peerNodeId: string;
  peerName: string;
  path: ConnectionTier;
  codec: CodecType;
  startTime: number;
  stats: LiveStats;
  remoteDisplay: 'display_1' | 'display_2' | 'all';
  remoteScale: 'fit' | 'fill' | 'pixel_perfect';
  qualityPreset: QualityPreset;
  privacyBlankActive: boolean;
  audioActive: boolean;
  recordingActive: boolean;
  recordingSeconds: number;
  chat: ChatMessage[];
  clipboardHistory: { text: string; time: string; source: 'local' | 'remote' }[];
  annotationTool: 'cursor' | 'laser' | 'pen' | 'magnifier';
  dirtyRectsVisualizer: boolean;
  magnifierZoom: number;
  audioVisualizerActive: boolean;
  remoteDesktopFiles: { name: string; size: number; icon: string; modified: string }[];
}

// Initial mock trusted devices
const INITIAL_DEVICES: DeviceGrant[] = [
  {
    id: 'dev-1',
    nodeId: 'iroh-node-k8p2-9f3m-v1w7-z4b6',
    name: 'Workstation-Office-Pro',
    ip: '192.168.1.104',
    os: 'Windows 11 Pro 24H2',
    lastSeen: 'Just now',
    isOnline: true,
    createdAt: '2026-09-18',
    expiryDays: 90,
    permissions: {
      VIEW: true,
      CONTROL: true,
      CLIPBOARD_READ: true,
      CLIPBOARD_WRITE: true,
      FILES_SEND: true,
      FILES_RECEIVE: true,
      FILES_BROWSE: true,
      AUDIO: true,
      ELEVATED: true,
      POWER: true,
      RECORD: false,
      UNATTENDED: true
    }
  },
  {
    id: 'dev-2',
    nodeId: 'iroh-node-m3q1-8x5t-l7p9-c2k8',
    name: 'Field-ThinkPad-X1',
    ip: '203.0.113.88',
    os: 'Windows 11 Enterprise',
    lastSeen: '2 hours ago',
    isOnline: false,
    createdAt: '2026-10-01',
    expiryDays: 30,
    permissions: {
      VIEW: true,
      CONTROL: true,
      CLIPBOARD_READ: true,
      CLIPBOARD_WRITE: true,
      FILES_SEND: true,
      FILES_RECEIVE: false,
      FILES_BROWSE: false,
      AUDIO: false,
      ELEVATED: false,
      POWER: false,
      RECORD: false,
      UNATTENDED: false
    }
  }
];

// Initial audit chain
const INITIAL_AUDIT: AuditBlock[] = [
  {
    blockIndex: 0,
    timestamp: '2026-10-07 09:12:04',
    eventType: 'CONNECT',
    peerNodeId: 'iroh-node-k8p2-9f3m-v1w7-z4b6',
    peerName: 'Workstation-Office-Pro',
    details: 'QUIC session established via direct UDP hole punching (QNT)',
    previousHash: '00000000000000000000000000000000',
    currentHash: 'b3_a89f210d7e4c3b2a19f048d21c83a'
  },
  {
    blockIndex: 1,
    timestamp: '2026-10-07 09:14:30',
    eventType: 'FILE_TRANSFER',
    peerNodeId: 'iroh-node-k8p2-9f3m-v1w7-z4b6',
    peerName: 'Workstation-Office-Pro',
    details: 'Pulled blob diagnostics_report.zip (14.2 MB) with BLAKE3 verification + ZoneId=3 MOTW',
    previousHash: 'b3_a89f210d7e4c3b2a19f048d21c83a',
    currentHash: 'b3_c17d842e99f102e3b4782910a34b9'
  },
  {
    blockIndex: 2,
    timestamp: '2026-10-07 09:28:15',
    eventType: 'DISCONNECT',
    peerNodeId: 'iroh-node-k8p2-9f3m-v1w7-z4b6',
    peerName: 'Workstation-Office-Pro',
    details: 'Session ended gracefully. Virtual keys unpressed. Screen locked.',
    previousHash: 'b3_c17d842e99f102e3b4782910a34b9',
    currentHash: 'b3_f9024c81a293847e0912bc87123aa'
  }
];

class PeerLinkStore {
  // Host identity
  public localNodeId: string = generateNodeId();
  public localHostName: string = 'DESKTOP-DEV94X';
  public localSplitCode: ShortCodeSplit = generateSplitShortCode();

  // Settings
  public settings: AppSettings = {
    serviceInstalled: true,
    unattendedAllowed: true,
    lockOnDisconnect: false,
    blockLocalInputOnConnect: false,
    panicHotkey: 'Ctrl+Alt+Shift+Pause',
    workerDirectoryEnabled: true,
    workerUrl: 'https://peerlink-directory.workers.dev',
    preferredCodec: 'AV1 (HW)',
    enable444CrispText: true,
    maxFpsCap: 60,
    dataSaverCapKbps: 400,
    relayMode: 'default',
    customRelayUrl: ''
  };

  // State collections
  public trustedDevices: DeviceGrant[] = [...INITIAL_DEVICES];
  public auditLog: AuditBlock[] = [...INITIAL_AUDIT];
  public fileTransfers: FileTransferItem[] = [
    {
      id: 'ft-1',
      name: 'system_telemetry_dump.evtx',
      sizeBytes: 8492000,
      transferredBytes: 8492000,
      direction: 'download',
      status: 'completed',
      blake3Hash: 'b3_8f90234a9b8c7e',
      speedBps: 0,
      motwApplied: true
    },
    {
      id: 'ft-2',
      name: 'driver_hotfix_v2.msi',
      sizeBytes: 68157440,
      transferredBytes: 42100000,
      direction: 'upload',
      status: 'transferring',
      blake3Hash: 'b3_17a4c90e8f231b',
      speedBps: 4850000,
      motwApplied: true
    }
  ];

  // Active remote session (null if not connected)
  public activeSession: ActiveSession | null = null;

  // Global Toast Notifications
  public toasts: ToastMessage[] = [];

  public addToast(title: string, message: string, type: ToastMessage['type'] = 'info') {
    const toast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random()}`,
      title,
      message,
      type,
      timestamp: Date.now()
    };
    this.toasts.push(toast);
    this.notify();
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== toast.id);
      this.notify();
    }, 4000);
  }

  // Pending incoming attended consent prompt
  public pendingConsent: {
    peerNodeId: string;
    peerName: string;
    permissions: Record<string, boolean>;
    remainingSeconds: number;
  } | null = null;

  // Active Host-Side Controlled Session (When remote peer is controlling this PC)
  public hostControlledSession: {
    controllerName: string;
    durationSeconds: number;
    inputPaused: boolean;
  } | null = null;

  public toggleSimulatedHostControlled() {
    if (this.hostControlledSession) {
      this.hostControlledSession = null;
      this.addToast('Host Session Ended', 'Host control mode closed.', 'info');
    } else {
      this.hostControlledSession = {
        controllerName: 'Field-ThinkPad-X1',
        durationSeconds: 142,
        inputPaused: false
      };
      this.addToast('Host Mode Active', 'This PC is now being remotely controlled by Field-ThinkPad-X1.', 'warn');
    }
    this.notify();
  }

  public toggleHostInputPause() {
    if (this.hostControlledSession) {
      this.hostControlledSession.inputPaused = !this.hostControlledSession.inputPaused;
      this.addToast(
        this.hostControlledSession.inputPaused ? 'Remote Input Paused' : 'Remote Input Resumed',
        this.hostControlledSession.inputPaused ? 'Remote controller keyboard and mouse are temporarily suspended.' : 'Remote control active.',
        'info'
      );
      this.notify();
    }
  }

  // Subscriptions for reactivity
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Register local host into Directory Simulator automatically
    directoryService.registerHost(this.localSplitCode, this.localNodeId);
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public notify() {
    this.listeners.forEach((cb) => cb());
  }

  public regenerateHostCode() {
    this.localSplitCode = generateSplitShortCode();
    directoryService.registerHost(this.localSplitCode, this.localNodeId);
    this.notify();
  }

  public addAuditEntry(eventType: AuditBlock['eventType'], peerNodeId: string, peerName: string, details: string) {
    const prevHash = this.auditLog.length > 0 ? this.auditLog[this.auditLog.length - 1].currentHash : '00000000000000000000000000000000';
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newHash = generateBlake3Hash(`${prevHash}_${timestamp}_${details}`);

    this.auditLog.push({
      blockIndex: this.auditLog.length,
      timestamp,
      eventType,
      peerNodeId,
      peerName,
      details,
      previousHash: prevHash,
      currentHash: newHash
    });
    this.notify();
  }

  public startSession(peer: { nodeId: string; name: string; path?: ConnectionTier }) {
    const initialStats: LiveStats = {
      rttMs: peer.path === 'lan' ? 2 : peer.path === 'relay' ? 44 : 14,
      glassToGlassMs: peer.path === 'lan' ? 28 : peer.path === 'relay' ? 62 : 36,
      fps: 60,
      bitrateKbps: 3200,
      lossPct: 0.0,
      jitterMs: 1.2,
      codec: this.settings.preferredCodec,
      path: peer.path || 'direct',
      ladderLevel: 5,
      dirtyRectsPerSec: 18,
      totalDataMb: 4.8,
      dataSaverActive: false,
      progressiveRefinementActive: false
    };

    this.activeSession = {
      id: `sess_${Date.now()}`,
      role: 'controller',
      peerNodeId: peer.nodeId,
      peerName: peer.name,
      path: peer.path || 'direct',
      codec: this.settings.preferredCodec,
      startTime: Date.now(),
      stats: initialStats,
      remoteDisplay: 'display_1',
      remoteScale: 'fit',
      qualityPreset: 'Auto ABR',
      privacyBlankActive: false,
      audioActive: false,
      recordingActive: false,
      recordingSeconds: 0,
      chat: [
        {
          id: 'c1',
          sender: 'remote',
          text: `Connected to ${peer.name}. System ready.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      clipboardHistory: [
        {
          text: 'https://docs.microsoft.com/windows-hardware/drivers/display/',
          time: '10:04 AM',
          source: 'remote'
        }
      ],
      annotationTool: 'cursor',
      dirtyRectsVisualizer: false,
      magnifierZoom: 4,
      audioVisualizerActive: false,
      remoteDesktopFiles: [
        { name: 'Architecture_Plan_v1.pdf', size: 2450000, icon: 'pdf', modified: 'Today 09:20' },
        { name: 'release_build_x64.zip', size: 18400000, icon: 'zip', modified: 'Yesterday 17:40' },
        { name: 'system_info.txt', size: 12400, icon: 'txt', modified: 'Oct 05' }
      ]
    };

    this.addToast('Connection Established', `Connected to ${peer.name} via ${peer.path || 'direct'} QUIC.`, 'success');

    this.addAuditEntry(
      'CONNECT',
      peer.nodeId,
      peer.name,
      `QUIC handshake verified via Ed25519. Connected on tier: ${peer.path || 'direct'}`
    );
    this.notify();
  }

  public dropFileToRemote(file: { name: string; size: number }) {
    if (!this.activeSession) return;
    const b3Hash = generateBlake3Hash(file.name);
    
    // Add to transfers
    this.fileTransfers.unshift({
      id: `ft_drop_${Date.now()}`,
      name: file.name,
      sizeBytes: file.size,
      transferredBytes: file.size,
      direction: 'upload',
      status: 'completed',
      blake3Hash: b3Hash,
      speedBps: 84000000,
      motwApplied: true
    });

    // Add to remote desktop files
    this.activeSession.remoteDesktopFiles.unshift({
      name: file.name,
      size: file.size,
      icon: file.name.endsWith('.zip') ? 'zip' : file.name.endsWith('.pdf') ? 'pdf' : 'file',
      modified: 'Just now'
    });

    this.addToast('File Delivered', `Pushed ${file.name} to remote desktop via iroh-blobs with BLAKE3 verification.`, 'success');

    this.addAuditEntry(
      'FILE_TRANSFER',
      this.activeSession.peerNodeId,
      this.activeSession.peerName,
      `Drag & Drop file delivered: ${file.name} (${formatBytes(file.size)}) via iroh-blobs (ZoneId=3 MOTW applied)`
    );
    this.notify();
  }

  public endSession(reason = 'User terminated') {
    if (!this.activeSession) return;
    const peerName = this.activeSession.peerName;
    const peerNode = this.activeSession.peerNodeId;
    this.activeSession = null;

    this.addAuditEntry(
      'DISCONNECT',
      peerNode,
      peerName,
      `Session terminated (${reason}). Releasing all virtual keys/modifiers.`
    );
    this.notify();
  }

  public triggerPanicStop() {
    if (!this.activeSession) return;
    const peerName = this.activeSession.peerName;
    const peerNode = this.activeSession.peerNodeId;
    this.activeSession = null;

    this.addAuditEntry(
      'PANIC_STOP',
      peerNode,
      peerName,
      'EMERGENCY PANIC HOTKEY INVOKED: Connection severed instantly, input unhooked, display restored.'
    );
    this.notify();
  }

  public updateStats(partial: Partial<LiveStats>) {
    if (this.activeSession) {
      this.activeSession.stats = { ...this.activeSession.stats, ...partial };
      this.notify();
    }
  }

  public sendChatMessage(text: string) {
    if (!this.activeSession || !text.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.activeSession.chat.push({
      id: `chat_${Date.now()}`,
      sender: 'local',
      text,
      timestamp: time
    });
    this.notify();

    // Auto-respond for realistic interactive experience
    setTimeout(() => {
      if (this.activeSession) {
        this.activeSession.chat.push({
          id: `chat_r_${Date.now()}`,
          sender: 'remote',
          text: `Acknowledged: "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.notify();
      }
    }, 1200);
  }

  public addClipboard(text: string) {
    if (!this.activeSession) return;
    this.activeSession.clipboardHistory.unshift({
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'local'
    });
    this.addAuditEntry('CLIPBOARD', this.activeSession.peerNodeId, this.activeSession.peerName, `Synchronized text (${text.length} chars)`);
    this.notify();
  }

  public toggleDevicePermission(deviceId: string, permKey: string) {
    const dev = this.trustedDevices.find((d) => d.id === deviceId);
    if (dev) {
      const k = permKey as keyof typeof dev.permissions;
      dev.permissions[k] = !dev.permissions[k];
      this.addAuditEntry('GRANT_MODIFIED', dev.nodeId, dev.name, `Updated permission: ${permKey} -> ${dev.permissions[k]}`);
      this.notify();
    }
  }

  public revokeDevice(deviceId: string) {
    const dev = this.trustedDevices.find((d) => d.id === deviceId);
    if (dev) {
      this.trustedDevices = this.trustedDevices.filter((d) => d.id !== deviceId);
      this.addAuditEntry('GRANT_MODIFIED', dev.nodeId, dev.name, 'Revoked all credentials and removed from trust store.');
      this.notify();
    }
  }
}

export const peerLinkStore = new PeerLinkStore();
