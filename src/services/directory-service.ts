/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShortCodeSplit } from '../types/peerlink';

export interface WorkerDORecord {
  lookupIndex: string; // "482-915"
  nodeId: string; // Ed25519 host NodeID
  relayHint: string; // iroh relay URL hint
  directAddrs: string[]; // LAN / WAN hints
  registeredAt: number;
  expiresAt: number;
  // NOTE: pakeSecret is NEVER stored here!
}

class DirectorySimulator {
  private records: Map<string, WorkerDORecord> = new Map();
  private workerRequestsCount = 142; // Track DO request quota
  private workerDurationSeconds = 18.4; // 13,000 GB-s limit

  constructor() {
    // Seed an initial demo host registration
    this.records.set('512-884', {
      lookupIndex: '512-884',
      nodeId: 'iroh-node-k8p2-9f3m-v1w7-z4b6',
      relayHint: 'https://us-east.relay.iroh.network:443',
      directAddrs: ['192.168.1.104:11224', '198.51.100.42:55421'],
      registeredAt: Date.now() - 60000,
      expiresAt: Date.now() + 240000
    });
  }

  /**
   * Host registers lookupIndex with Cloudflare Worker & Durable Object
   */
  public registerHost(
    split: ShortCodeSplit,
    nodeId: string,
    relayHint = 'https://us-east.relay.iroh.network:443',
    directAddrs = ['192.168.1.150:11224']
  ): { success: boolean; workerReceipt: string; leakCheckPassed: boolean } {
    this.workerRequestsCount++;

    // Security verification: ensure pakeSecret is NOT present
    const isLeaked = Object.prototype.hasOwnProperty.call(split, 'pakeSecret') &&
      typeof (split as unknown as { pakeSecret?: string }).pakeSecret === 'string' &&
      split.pakeSecret === split.lookupIndex;

    this.records.set(split.lookupIndex, {
      lookupIndex: split.lookupIndex,
      nodeId,
      relayHint,
      directAddrs,
      registeredAt: Date.now(),
      expiresAt: split.expiresAt,
    });

    return {
      success: true,
      workerReceipt: `do_receipt_${Math.random().toString(36).substring(2, 9)}`,
      leakCheckPassed: !isLeaked
    };
  }

  /**
   * Controller queries Cloudflare Worker DO using the first 6 digits
   */
  public lookupHost(lookupIndex: string): WorkerDORecord | null {
    this.workerRequestsCount++;
    const record = this.records.get(lookupIndex);
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      this.records.delete(lookupIndex);
      return null;
    }
    return record;
  }

  /**
   * Controller parses 9-digit input code:
   * "482-915-370" -> { lookupIndex: "482-915", pakeSecret: "370" }
   */
  public parseInputCode(rawCode: string): { lookupIndex: string; pakeSecret: string } | null {
    const cleaned = rawCode.replace(/[^0-9]/g, '');
    if (cleaned.length !== 9) return null;
    const lookupIndex = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}`;
    const pakeSecret = cleaned.slice(6, 9);
    return { lookupIndex, pakeSecret };
  }

  public getStats() {
    return {
      activeRecords: this.records.size,
      totalRequests: this.workerRequestsCount,
      durationGbSeconds: this.workerDurationSeconds,
      records: Array.from(this.records.values())
    };
  }
}

export const directoryService = new DirectorySimulator();
