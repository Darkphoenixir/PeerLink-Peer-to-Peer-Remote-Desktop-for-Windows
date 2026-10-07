/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShortCodeSplit, AuditBlock } from '../types/peerlink';

// Wordlist for SAS (Short Authentication String)
const SAS_WORDS = [
  'anchor', 'beacon', 'cobalt', 'delta', 'falcon', 'glacier', 'harbor',
  'indigo', 'jupiter', 'keystone', 'lotus', 'monarch', 'nebula', 'oasis',
  'phoenix', 'quartz', 'radiant', 'sapphire', 'timber', 'utopia', 'vortex',
  'whisper', 'zenith', 'aurora', 'cascade', 'dynamo', 'ember', 'granite'
];

const SAS_EMOJIS = ['🚀', '🛡️', '⚡', '💎', '🔑', '🧭', '🌊', '🌲', '🪐', '🦊', '🦅', '🎯'];

/**
 * Generate a random mock Ed25519 NodeID (iroh format)
 */
export function generateNodeId(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 32; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return `iroh-node-${s.slice(0, 8)}-${s.slice(8, 16)}-${s.slice(16, 24)}`;
}

/**
 * Generate a 9-digit split short code for untrusted Cloudflare Worker + Durable Object directory
 * Split:
 * - lookupIndex: First 6 digits (sent to Worker/DO for host discovery)
 * - pakeSecret: Last 3 digits (NEVER sent to Worker, used exclusively in direct PAKE exchange)
 */
export function generateSplitShortCode(): ShortCodeSplit {
  const d = () => Math.floor(Math.random() * 10);
  const part1 = `${d()}${d()}${d()}-${d()}${d()}${d()}`;
  const part2 = `${d()}${d()}${d()}`;
  const full = `${part1}-${part2}`;

  return {
    fullCode: full,
    lookupIndex: part1,
    pakeSecret: part2,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
  };
}

/**
 * Generate 4 SAS verification words and emojis
 */
export function generateSAS(seed: string): { words: string[]; emojis: string[] } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const h = Math.abs(hash);

  const words = [
    SAS_WORDS[h % SAS_WORDS.length],
    SAS_WORDS[(h >> 3) % SAS_WORDS.length],
    SAS_WORDS[(h >> 6) % SAS_WORDS.length],
    SAS_WORDS[(h >> 9) % SAS_WORDS.length],
  ];

  const emojis = [
    SAS_EMOJIS[h % SAS_EMOJIS.length],
    SAS_EMOJIS[(h >> 4) % SAS_EMOJIS.length],
    SAS_EMOJIS[(h >> 8) % SAS_EMOJIS.length],
  ];

  return { words, emojis };
}

/**
 * Generate a mock BLAKE3 hash string
 */
export function generateBlake3Hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0');
  const dummy = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 65536).toString(16).padStart(4, '0')
  ).join('');
  return `b3_${hex}${dummy}`.slice(0, 35);
}

/**
 * Cryptographic Hash Chain Verifier for Audit Logs
 */
export function verifyHashChain(blocks: AuditBlock[]): { isValid: boolean; brokenIndex?: number } {
  if (blocks.length === 0) return { isValid: true };

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (i > 0) {
      const prevBlock = blocks[i - 1];
      if (block.previousHash !== prevBlock.currentHash) {
        return { isValid: false, brokenIndex: i };
      }
    }
  }

  return { isValid: true };
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
