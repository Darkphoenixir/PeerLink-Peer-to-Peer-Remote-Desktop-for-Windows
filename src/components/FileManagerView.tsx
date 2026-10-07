/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Folder,
  File,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Search,
  ShieldCheck,
  Pause,
  Play,
  HardDrive,
  FileUp,
  CheckCircle,
  MoveRight,
  MoveLeft
} from 'lucide-react';
import { peerLinkStore } from '../services/store';
import { formatBytes, generateBlake3Hash } from '../services/crypto-mock';

interface FileItem {
  name: string;
  size: number;
  type: 'file' | 'folder';
  modified: string;
  blake3?: string;
}

export const FileManagerView: React.FC = () => {
  const [localPath, setLocalPath] = useState('C:\\Users\\Admin\\Downloads\\PeerLink');
  const [remotePath, setRemotePath] = useState('C:\\Users\\RemoteHost\\Documents');
  const [selectedLocal, setSelectedLocal] = useState<string | null>(null);
  const [selectedRemote, setSelectedRemote] = useState<string | null>(null);
  const [speedLimitMbps, setSpeedLimitMbps] = useState(50); // Speed throttle slider

  // Drag-and-drop state between panes
  const [draggedFile, setDraggedFile] = useState<{ item: FileItem; source: 'local' | 'remote' } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<'local' | 'remote' | null>(null);

  // Local files
  const [localFiles, setLocalFiles] = useState<FileItem[]>([
    { name: 'Projects', size: 0, type: 'folder', modified: '2026-10-06 14:12' },
    { name: 'firmware_update_v2.bin', size: 14820000, type: 'file', modified: '2026-10-07 08:30', blake3: 'b3_8f90234a9b8c7e' },
    { name: 'network_traces.pcapng', size: 52140000, type: 'file', modified: '2026-10-07 09:15', blake3: 'b3_3c71a9e208b49f' },
    { name: 'readme_setup.txt', size: 4200, type: 'file', modified: '2026-10-05 11:20', blake3: 'b3_91a0b3e4f7c28d' }
  ]);

  // Remote files
  const [remoteFiles, setRemoteFiles] = useState<FileItem[]>([
    { name: 'Backups', size: 0, type: 'folder', modified: '2026-09-28 09:44' },
    { name: 'database_dump_20261006.sql.zst', size: 182400000, type: 'file', modified: '2026-10-06 22:00', blake3: 'b3_7e201b94c38a12' },
    { name: 'system_telemetry_dump.evtx', size: 8492000, type: 'file', modified: '2026-10-07 09:12', blake3: 'b3_17a4c90e8f231b' },
    { name: 'client_cert.pem', size: 2180, type: 'file', modified: '2026-10-01 16:05', blake3: 'b3_0a4f91b72e8c33' }
  ]);

  const handleStartDrag = (item: FileItem, source: 'local' | 'remote') => {
    setDraggedFile({ item, source });
  };

  const handleDropOnPane = (targetPane: 'local' | 'remote', e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);

    // Check if dragging from opposite pane
    if (draggedFile && draggedFile.source !== targetPane) {
      const file = draggedFile.item;
      if (file.type === 'folder') return;

      const direction = targetPane === 'remote' ? 'upload' : 'download';
      peerLinkStore.fileTransfers.unshift({
        id: `ft_drag_${Date.now()}`,
        name: file.name,
        sizeBytes: file.size,
        transferredBytes: 0,
        direction,
        status: 'transferring',
        blake3Hash: file.blake3 || generateBlake3Hash(file.name),
        speedBps: speedLimitMbps * 1024 * 1024,
        motwApplied: true
      });

      peerLinkStore.addToast(
        'Transfer Initiated',
        `Drag-dropped ${file.name} to ${targetPane === 'remote' ? 'Remote Host' : 'This PC'}.`,
        'success'
      );

      peerLinkStore.addAuditEntry(
        'FILE_TRANSFER',
        'iroh-node-k8p2-9f3m',
        'RemoteHost',
        `Drag & drop ${direction} of ${file.name} (${formatBytes(file.size)}) via iroh-blobs`
      );

      // Add to destination pane
      const newEntry: FileItem = {
        ...file,
        modified: new Date().toISOString().substring(0, 16).replace('T', ' ')
      };

      if (targetPane === 'remote') {
        setRemoteFiles((prev) => [newEntry, ...prev]);
      } else {
        setLocalFiles((prev) => [newEntry, ...prev]);
      }

      setDraggedFile(null);
      return;
    }

    // Check if dropped from external OS
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const extFile = e.dataTransfer.files[0];
      const newEntry: FileItem = {
        name: extFile.name,
        size: extFile.size,
        type: 'file',
        modified: 'Just now',
        blake3: generateBlake3Hash(extFile.name)
      };

      if (targetPane === 'remote') {
        setRemoteFiles((prev) => [newEntry, ...prev]);
        peerLinkStore.addToast('Uploaded to Remote', `Dropped ${extFile.name} onto remote pane.`, 'success');
      } else {
        setLocalFiles((prev) => [newEntry, ...prev]);
        peerLinkStore.addToast('Saved to Local', `Imported ${extFile.name} into local store.`, 'info');
      }
    }
  };

  const handleUpload = () => {
    if (!selectedLocal) return;
    const file = localFiles.find((f) => f.name === selectedLocal);
    if (!file || file.type === 'folder') return;

    peerLinkStore.fileTransfers.unshift({
      id: `ft_${Date.now()}`,
      name: file.name,
      sizeBytes: file.size,
      transferredBytes: 0,
      direction: 'upload',
      status: 'transferring',
      blake3Hash: file.blake3 || generateBlake3Hash(file.name),
      speedBps: speedLimitMbps * 1024 * 1024,
      motwApplied: true
    });

    peerLinkStore.addToast('File Queued', `Sending ${file.name} to remote host.`, 'info');

    // Simulate transfer in remote pane
    setRemoteFiles((prev) => [
      { ...file, modified: new Date().toISOString().substring(0, 16).replace('T', ' ') },
      ...prev
    ]);
  };

  const handleDownload = () => {
    if (!selectedRemote) return;
    const file = remoteFiles.find((f) => f.name === selectedRemote);
    if (!file || file.type === 'folder') return;

    peerLinkStore.fileTransfers.unshift({
      id: `ft_${Date.now()}`,
      name: file.name,
      sizeBytes: file.size,
      transferredBytes: 0,
      direction: 'download',
      status: 'transferring',
      blake3Hash: file.blake3 || generateBlake3Hash(file.name),
      speedBps: speedLimitMbps * 1024 * 1024,
      motwApplied: true
    });

    peerLinkStore.addToast('Download Queued', `Pulling ${file.name} to this PC with MOTW sandbox.`, 'info');

    // Add to local pane
    setLocalFiles((prev) => [
      { ...file, modified: new Date().toISOString().substring(0, 16).replace('T', ' ') },
      ...prev
    ]);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Title & Speed Throttle Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Dual-Pane Resumable Explorer
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Drag files directly between panes or drop from desktop. Transferred via iroh-blobs with BLAKE3 hash checks.
          </p>
        </div>

        {/* Speed limiter to avoid starving video */}
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-3.5 py-2 rounded-xl text-xs">
          <span className="text-neutral-400">Transfer Throttle:</span>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={speedLimitMbps}
            onChange={(e) => setSpeedLimitMbps(Number(e.target.value))}
            className="w-24 accent-emerald-500 cursor-pointer"
          />
          <span className="font-mono text-emerald-400 font-semibold">{speedLimitMbps} MB/s</span>
        </div>
      </div>

      {/* Drag & Drop Hint Banner */}
      <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2 text-neutral-300">
          <FileUp className="w-4 h-4 text-emerald-400" />
          <span>Interactive Drag &amp; Drop: Grab any file below and drag across to the other pane!</span>
        </div>
        <span className="font-mono text-[11px] text-neutral-500">Zone.Identifier:3 (MOTW Protected)</span>
      </div>

      {/* Dual Pane Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT PANE: LOCAL COMPUTER */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverTarget('local');
          }}
          onDragLeave={() => setDragOverTarget(null)}
          onDrop={(e) => handleDropOnPane('local', e)}
          className={`bg-neutral-900 border rounded-xl overflow-hidden flex flex-col transition-all duration-150 ${
            dragOverTarget === 'local'
              ? 'border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-neutral-900/90'
              : 'border-neutral-800'
          }`}
        >
          <div className="px-4 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-white font-medium">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>This PC (Local Machine)</span>
            </div>
            <span className="font-mono text-neutral-500">{localPath}</span>
          </div>

          <div className="flex-1 p-2 min-h-72 max-h-96 overflow-y-auto space-y-1">
            {localFiles.map((file) => (
              <div
                key={file.name}
                draggable={file.type !== 'folder'}
                onDragStart={() => handleStartDrag(file, 'local')}
                onClick={() => setSelectedLocal(file.name)}
                className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-grab active:cursor-grabbing transition-colors ${
                  selectedLocal === file.name
                    ? 'bg-emerald-950/40 border border-emerald-600/40 text-white'
                    : 'hover:bg-neutral-800/60 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {file.type === 'folder' ? (
                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <File className="w-4 h-4 text-neutral-400 shrink-0" />
                  )}
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-500 font-mono text-[11px] shrink-0">
                  <span>{file.size > 0 ? formatBytes(file.size) : '--'}</span>
                  <span>{file.modified.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-neutral-950/60 border-t border-neutral-800 flex justify-between items-center">
            <span className="text-[11px] text-neutral-500 font-mono">
              {localFiles.length} items
            </span>
            <button
              onClick={handleUpload}
              disabled={!selectedLocal}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Send to Remote &rarr;</span>
            </button>
          </div>
        </div>

        {/* RIGHT PANE: REMOTE HOST */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverTarget('remote');
          }}
          onDragLeave={() => setDragOverTarget(null)}
          onDrop={(e) => handleDropOnPane('remote', e)}
          className={`bg-neutral-900 border rounded-xl overflow-hidden flex flex-col transition-all duration-150 ${
            dragOverTarget === 'remote'
              ? 'border-blue-400/80 shadow-[0_0_20px_rgba(59,130,246,0.2)] bg-neutral-900/90'
              : 'border-neutral-800'
          }`}
        >
          <div className="px-4 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-white font-medium">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>Remote Workstation (Host)</span>
            </div>
            <span className="font-mono text-neutral-500">{remotePath}</span>
          </div>

          <div className="flex-1 p-2 min-h-72 max-h-96 overflow-y-auto space-y-1">
            {remoteFiles.map((file) => (
              <div
                key={file.name}
                draggable={file.type !== 'folder'}
                onDragStart={() => handleStartDrag(file, 'remote')}
                onClick={() => setSelectedRemote(file.name)}
                className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-grab active:cursor-grabbing transition-colors ${
                  selectedRemote === file.name
                    ? 'bg-blue-950/40 border border-blue-600/40 text-white'
                    : 'hover:bg-neutral-800/60 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {file.type === 'folder' ? (
                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <File className="w-4 h-4 text-neutral-400 shrink-0" />
                  )}
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-500 font-mono text-[11px] shrink-0">
                  <span>{file.size > 0 ? formatBytes(file.size) : '--'}</span>
                  <span>{file.modified.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-neutral-950/60 border-t border-neutral-800 flex justify-between items-center">
            <span className="text-[11px] text-neutral-500 font-mono">
              {remoteFiles.length} items
            </span>
            <button
              onClick={handleDownload}
              disabled={!selectedRemote}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>&larr; Pull to Local</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Transfer Queue & Integrity Verification Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Cryptographic Transfer Integrity Queue</h2>
          </div>
          <span className="text-xs text-neutral-400">All downloads tagged with Mark-of-the-Web (ZoneId=3)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-neutral-500 border-b border-neutral-800 pb-2">
                <th className="font-medium pb-2">Filename</th>
                <th className="font-medium pb-2">Direction</th>
                <th className="font-medium pb-2">Size</th>
                <th className="font-medium pb-2">BLAKE3 Hash</th>
                <th className="font-medium pb-2">Status</th>
                <th className="font-medium pb-2 text-right">Sandbox MOTW</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
              {peerLinkStore.fileTransfers.map((t) => (
                <tr key={t.id} className="hover:bg-neutral-800/40">
                  <td className="py-2.5 text-white font-sans text-xs">{t.name}</td>
                  <td className="py-2.5">
                    <span className={t.direction === 'upload' ? 'text-amber-400' : 'text-blue-400'}>
                      {t.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 text-neutral-300">{formatBytes(t.sizeBytes)}</td>
                  <td className="py-2.5 text-neutral-400">{t.blake3Hash}</td>
                  <td className="py-2.5 text-emerald-400 capitalize">{t.status}</td>
                  <td className="py-2.5 text-right text-emerald-400 font-sans">
                    Zone.Identifier:3
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
