/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Download,
  Filter,
  CheckCircle,
  AlertTriangle,
  Lock,
  ArrowRight
} from 'lucide-react';
import { peerLinkStore } from '../services/store';
import { verifyHashChain } from '../services/crypto-mock';
import { AuditBlock } from '../types/peerlink';

export const AuditLogView: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('ALL');

  const auditBlocks = peerLinkStore.auditLog;
  const verification = verifyHashChain(auditBlocks);

  const filteredBlocks = filterType === 'ALL'
    ? auditBlocks
    : auditBlocks.filter((b) => b.eventType === filterType);

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditBlocks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `peerlink_audit_chain_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Title & Cryptographic Verification Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Tamper-Evident Audit Trail
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Hash-chained append-only security log. Every block binds the hash of the predecessor to guarantee cryptographic immutability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {verification.isValid ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/60 border border-emerald-600/40 rounded-lg text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Chain Intact · {auditBlocks.length} Blocks Verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-950/60 border border-rose-600/40 rounded-lg text-xs font-semibold text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>TAMPER DETECTED at Block #{verification.brokenIndex}</span>
            </div>
          )}

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        {['ALL', 'CONNECT', 'DISCONNECT', 'FILE_TRANSFER', 'CLIPBOARD', 'GRANT_MODIFIED', 'PANIC_STOP', 'ELEVATION'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterType(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filterType === cat
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Audit Blocks Timeline / List */}
      <div className="space-y-3">
        {filteredBlocks.map((block) => {
          const isPanic = block.eventType === 'PANIC_STOP';
          const isConnect = block.eventType === 'CONNECT';

          return (
            <div
              key={block.blockIndex}
              className={`p-4 rounded-xl border text-xs space-y-3 transition-colors ${
                isPanic
                  ? 'bg-rose-950/20 border-rose-800/40'
                  : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono px-2 py-0.5 bg-neutral-950 border border-neutral-800 text-neutral-400 rounded text-[11px]">
                    Block #{block.blockIndex}
                  </span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                      isPanic
                        ? 'bg-rose-500/20 text-rose-400'
                        : isConnect
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {block.eventType}
                  </span>
                  <span className="font-medium text-white">{block.peerName}</span>
                </div>

                <span className="font-mono text-neutral-500 text-[11px]">
                  {block.timestamp}
                </span>
              </div>

              <p className="text-neutral-300 leading-relaxed font-sans">{block.details}</p>

              {/* Cryptographic Hash Chain Proof Bar */}
              <div className="pt-2 border-t border-neutral-800/60 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[10px] font-mono text-neutral-500">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-neutral-400">Prev Hash:</span>
                  <span className="truncate max-w-[180px]">{block.previousHash}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowRight className="w-3 h-3 text-neutral-600 hidden md:block" />
                  <span className="text-neutral-400">Current Hash:</span>
                  <span className="text-emerald-400/90 truncate max-w-[200px]">{block.currentHash}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
