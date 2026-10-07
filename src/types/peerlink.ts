/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ConnectionTier = 'lan' | 'direct' | 'relay';

export type NATType = 'Full Cone' | 'Restricted Cone' | 'Port Restricted' | 'Symmetric (CGNAT)';

export type CodecType = 'AV1 (HW)' | 'HEVC (HW)' | 'H.264 (HW)' | 'OpenH264 (SW)';

export type QualityPreset = 'Auto ABR' | 'Speed' | 'Balanced' | 'Quality' | 'Data Saver';

export interface LadderLevel {
  level: number;
  scalePct: number;
  fps: number;
  targetKbps: number;
  description: string;
}

export type PermissionKey =
  | 'VIEW'
  | 'CONTROL'
  | 'CLIPBOARD_READ'
  | 'CLIPBOARD_WRITE'
  | 'FILES_SEND'
  | 'FILES_RECEIVE'
  | 'FILES_BROWSE'
  | 'AUDIO'
  | 'ELEVATED'
  | 'POWER'
  | 'RECORD'
  | 'UNATTENDED';

export interface DeviceGrant {
  id: string;
  nodeId: string;
  name: string;
  ip: string;
  os: string;
  lastSeen: string;
  isOnline: boolean;
  permissions: Record<PermissionKey, boolean>;
  expiryDays?: number;
  createdAt: string;
}

export interface ShortCodeSplit {
  fullCode: string; // e.g. "482-915-370"
  lookupIndex: string; // e.g. "482-915" (first 6 digits - sent to Cloudflare Worker/DO)
  pakeSecret: string; // e.g. "370" (last 3 digits - NEVER sent to Worker, only used in PAKE)
  expiresAt: number;
}

export interface PairingSession {
  nodeId: string;
  deviceName: string;
  codeSplit: ShortCodeSplit;
  method: 'ticket' | 'short_code' | 'lan';
  ticketUrl?: string;
  sasWords: string[];
  sasEmoji: string[];
  step: 'ready' | 'connecting' | 'pake_exchange' | 'sas_verify' | 'approval' | 'paired' | 'rejected';
}

export interface LiveStats {
  rttMs: number;
  glassToGlassMs: number;
  fps: number;
  bitrateKbps: number;
  lossPct: number;
  jitterMs: number;
  codec: CodecType;
  path: ConnectionTier;
  ladderLevel: number;
  dirtyRectsPerSec: number;
  totalDataMb: number;
  dataSaverActive: boolean;
  progressiveRefinementActive: boolean;
}

export interface FileTransferItem {
  id: string;
  name: string;
  sizeBytes: number;
  transferredBytes: number;
  direction: 'upload' | 'download';
  status: 'pending' | 'transferring' | 'paused' | 'completed' | 'cancelled';
  blake3Hash: string;
  speedBps: number;
  motwApplied: boolean; // Mark-of-the-Web ZoneId=3 applied
}

export interface AuditBlock {
  blockIndex: number;
  timestamp: string;
  eventType: 'CONNECT' | 'DISCONNECT' | 'GRANT_MODIFIED' | 'FILE_TRANSFER' | 'CLIPBOARD' | 'PANIC_STOP' | 'ELEVATION';
  peerNodeId: string;
  peerName: string;
  details: string;
  previousHash: string;
  currentHash: string;
}

export interface ChatMessage {
  id: string;
  sender: 'local' | 'remote';
  text: string;
  timestamp: string;
}
