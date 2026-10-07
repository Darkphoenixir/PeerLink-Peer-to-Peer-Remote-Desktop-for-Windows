/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Maximize2,
  Minimize2,
  Sliders,
  Keyboard,
  Clipboard,
  FolderSync,
  Volume2,
  VolumeX,
  MessageSquare,
  CircleDot,
  Camera,
  EyeOff,
  Eye,
  Activity,
  X,
  Send,
  Play,
  Pause,
  Terminal,
  Cpu,
  FileText,
  Search,
  Check,
  Download,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  MousePointer2,
  PenTool,
  ZoomIn,
  Folder,
  Layers,
  FileUp,
  FileSpreadsheet,
  FileArchive,
  RefreshCw,
  Radio
} from 'lucide-react';
import { ActiveSession, peerLinkStore } from '../services/store';
import { QualityPreset } from '../types/peerlink';
import { formatBytes } from '../services/crypto-mock';

interface RemoteDesktopViewerProps {
  session: ActiveSession;
  onDisconnect: () => void;
  onPanicStop: () => void;
}

export const RemoteDesktopViewer: React.FC<RemoteDesktopViewerProps> = ({
  session,
  onDisconnect,
  onPanicStop
}) => {
  // Top toolbar state
  const [activeDrawer, setActiveDrawer] = useState<'clipboard' | 'files' | 'chat' | 'stats' | 'audio' | null>(null);
  const [showSystemKeysMenu, setShowSystemKeysMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showDisplayMenu, setShowDisplayMenu] = useState(false);
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [showSecurityScreen, setShowSecurityScreen] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [recordedDuration, setRecordedDuration] = useState(0);

  // Drag & drop onto remote desktop
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropProgress, setDropProgress] = useState<{ fileName: string; pct: number } | null>(null);

  // Annotation & Collaboration state
  const [selectedTool, setSelectedTool] = useState<'cursor' | 'laser' | 'pen' | 'magnifier'>('cursor');
  const [laserCoords, setLaserCoords] = useState<{ x: number; y: number } | null>(null);
  const [penStrokes, setPenStrokes] = useState<{ x: number; y: number; color: string }[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number; color: string }[] | null>(null);
  const [magnifierCoords, setMagnifierCoords] = useState<{ x: number; y: number }>({ x: 300, y: 200 });
  const [showDirtyRects, setShowDirtyRects] = useState(false);

  // Chat message input
  const [chatInput, setChatInput] = useState('');
  const [newClipText, setNewClipText] = useState('');

  // Interactive Windows State with Window Dragging & Positions
  const [activeWindow, setActiveWindow] = useState<'taskmgr' | 'terminal' | 'notepad' | 'explorer' | null>('taskmgr');
  const [windowPositions, setWindowPositions] = useState({
    taskmgr: { x: 120, y: 60 },
    terminal: { x: 180, y: 100 },
    notepad: { x: 220, y: 80 },
    explorer: { x: 140, y: 70 }
  });
  const [draggingWindow, setDraggingWindow] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Terminal history
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'Windows PowerShell v7.4.2 [Session 0 Broker Agent Connected]',
    'Copyright (c) Microsoft Corporation. All rights reserved.',
    'Type "help", "ipconfig", "Get-Process", or "clear" to run commands.',
    ''
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [notepadText, setNotepadText] = useState(
    '// PeerLink Host Diagnostics\nStatus: Online\nQUIC Stream Priority: Uni-stream Frame Delivery (High)\nZero-Copy D3D11 Texture -> MF Encoder active.\nDirty-rect latency: 2.1ms\n'
  );

  // Simulated process list in Task Manager
  const [processes, setProcesses] = useState([
    { pid: 1044, name: 'peerlink-agent.exe', cpu: 1.8, mem: 42.4, status: 'Running' },
    { pid: 3218, name: 'dwmapi.exe', cpu: 0.9, mem: 31.2, status: 'Running' },
    { pid: 4892, name: 'chrome.exe', cpu: 6.4, mem: 482.0, status: 'Running' },
    { pid: 7104, name: 'blender.exe', cpu: 14.2, mem: 1240.5, status: 'Running' },
    { pid: 9112, name: 'explorer.exe', cpu: 0.3, mem: 98.6, status: 'Running' }
  ]);

  // Audio spectrum simulation
  const [audioFreqs, setAudioFreqs] = useState<number[]>([30, 45, 60, 80, 55, 40, 70, 90, 65, 50, 35, 20]);

  // Handle window dragging
  const handleMouseDownWindow = (win: 'taskmgr' | 'terminal' | 'notepad' | 'explorer', e: React.MouseEvent) => {
    setActiveWindow(win);
    setDraggingWindow(win);
    dragOffsetRef.current = {
      x: e.clientX - windowPositions[win].x,
      y: e.clientY - windowPositions[win].y
    };
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Laser pointer
    if (selectedTool === 'laser') {
      setLaserCoords({ x, y });
    }

    // Pen drawing
    if (selectedTool === 'pen' && currentStroke) {
      setCurrentStroke((prev) => prev ? [...prev, { x, y, color: '#ef4444' }] : null);
    }

    // Magnifier loupe
    if (selectedTool === 'magnifier') {
      setMagnifierCoords({ x, y });
    }

    // Dragging window
    if (draggingWindow) {
      const newX = Math.max(10, Math.min(rect.width - 400, e.clientX - dragOffsetRef.current.x));
      const newY = Math.max(10, Math.min(rect.height - 250, e.clientY - dragOffsetRef.current.y));
      setWindowPositions((prev) => ({
        ...prev,
        [draggingWindow]: { x: newX, y: newY }
      }));
    }
  };

  const handleMouseUpCanvas = () => {
    setDraggingWindow(null);
    if (currentStroke && currentStroke.length > 0) {
      setPenStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
  };

  const handleMouseDownCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === 'pen') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentStroke([{ x, y, color: '#ef4444' }]);
    }
  };

  // Drag and drop handler from OS or inside app
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    let fileName = 'dropped_archive.zip';
    let fileSize = 14200000;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      fileName = file.name;
      fileSize = file.size;
    }

    // Trigger progressive drop transfer animation
    setDropProgress({ fileName, pct: 15 });
    let p = 15;
    const dropInterval = setInterval(() => {
      p += 25;
      if (p >= 100) {
        clearInterval(dropInterval);
        setDropProgress(null);
        peerLinkStore.dropFileToRemote({ name: fileName, size: fileSize });
      } else {
        setDropProgress({ fileName, pct: p });
      }
    }, 180);
  };

  // Live stats simulation timer
  useEffect(() => {
    const statsInterval = setInterval(() => {
      const currentStats = session.stats;
      const jitteredRtt = Math.max(1, currentStats.rttMs + (Math.random() * 2 - 1));
      const jitteredFps = Math.min(60, Math.max(58, 60 - Math.floor(Math.random() * 3)));
      const jitteredBitrate = Math.max(200, currentStats.bitrateKbps + Math.floor(Math.random() * 120 - 60));

      peerLinkStore.updateStats({
        rttMs: Math.round(jitteredRtt * 10) / 10,
        fps: jitteredFps,
        bitrateKbps: jitteredBitrate,
        dirtyRectsPerSec: Math.floor(Math.random() * 24 + 6),
        totalDataMb: Math.round((currentStats.totalDataMb + 0.05) * 100) / 100
      });

      // Animate audio spectrum when audio active
      if (session.audioActive) {
        setAudioFreqs(Array.from({ length: 12 }, () => Math.floor(Math.random() * 85 + 10)));
      }
    }, 1000);

    return () => clearInterval(statsInterval);
  }, [session.stats, session.audioActive]);

  // Recording timer
  useEffect(() => {
    let recTimer: ReturnType<typeof setInterval>;
    if (session.recordingActive) {
      recTimer = setInterval(() => {
        session.recordingSeconds++;
        peerLinkStore.notify();
      }, 1000);
    }
    return () => clearInterval(recTimer);
  }, [session.recordingActive]);

  // Terminal command executor
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    const newHist = [...terminalHistory, `PS C:\\Users\\Admin> ${cmd}`];

    if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'cls') {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    } else if (cmd.toLowerCase() === 'ipconfig') {
      newHist.push('IPv4 Address. . . . . . . . . . . : 192.168.1.104');
      newHist.push('Subnet Mask . . . . . . . . . . . : 255.255.255.0');
      newHist.push('Default Gateway . . . . . . . . . : 192.168.1.1');
    } else if (cmd.toLowerCase().includes('get-process')) {
      newHist.push('Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id ProcessName');
      newHist.push('-------  ------    -----      -----     ------     -- -----------');
      processes.forEach((p) => {
        newHist.push(`    214      12    ${Math.floor(p.mem * 10)}      ${Math.floor(p.mem * 15)}       ${p.cpu}   ${p.pid} ${p.name}`);
      });
    } else if (cmd.toLowerCase().includes('help')) {
      newHist.push('Available commands: ipconfig, Get-Process, Test-NetConnection, whoami, clear');
    } else if (cmd.toLowerCase() === 'whoami') {
      newHist.push('WORKSTATION\\Administrator (SYSTEM Token via Session 0 Broker)');
    } else {
      newHist.push(`'${cmd}' is recognized as internal diagnostic command.`);
    }

    setTerminalHistory(newHist);
    setTerminalInput('');
  };

  const handleKillProcess = (pid: number) => {
    setProcesses(processes.filter((p) => p.pid !== pid));
    peerLinkStore.addToast('Process Terminated', `Killed PID ${pid} via remote session.`, 'warn');
    peerLinkStore.addAuditEntry(
      'GRANT_MODIFIED',
      session.peerNodeId,
      session.peerName,
      `Terminated process PID ${pid} via remote session.`
    );
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      peerLinkStore.sendChatMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const handleAddClipboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClipText.trim()) {
      peerLinkStore.addClipboard(newClipText.trim());
      peerLinkStore.addToast('Clipboard Synced', 'Pushed new text to remote clipboard.', 'info');
      setNewClipText('');
    }
  };

  const handleTakeScreenshot = () => {
    peerLinkStore.addToast('Snapshot Saved', '2560x1440 D3D11 frame captured to clipboard.', 'success');
    peerLinkStore.addAuditEntry(
      'CLIPBOARD',
      session.peerNodeId,
      session.peerName,
      'Captured remote desktop frame (2560x1440 PNG)'
    );
  };

  const toggleRecording = () => {
    session.recordingActive = !session.recordingActive;
    if (session.recordingActive) {
      session.recordingSeconds = 0;
      peerLinkStore.addToast('Recording Started', 'Capturing remote desktop stream locally.', 'info');
      peerLinkStore.addAuditEntry(
        'ELEVATION',
        session.peerNodeId,
        session.peerName,
        'Session video recording started by controller.'
      );
    } else {
      setRecordedDuration(session.recordingSeconds);
      setShowRecordingModal(true);
      peerLinkStore.addToast('Recording Saved', `Saved ${session.recordingSeconds}s remote session clip. Ready to download.`, 'success');
      peerLinkStore.addAuditEntry(
        'ELEVATION',
        session.peerNodeId,
        session.peerName,
        `Session video recording saved (${session.recordingSeconds}s).`
      );
    }
    peerLinkStore.notify();
  };

  const handleDownloadRecording = () => {
    const dummyBlob = new Blob(['PeerLink Session Recording H.264/AV1 Bitstream'], { type: 'video/webm' });
    const url = URL.createObjectURL(dummyBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peerlink_session_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    peerLinkStore.addToast('Downloaded', 'Video recording saved to Downloads folder.', 'success');
    setShowRecordingModal(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden relative select-none">
      {/* TOP FLOATING PILL TOOLBAR (Windows 11 Fluent with Glass Blur) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
        <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-xl px-3 py-1.5 shadow-2xl flex items-center gap-1.5 text-xs text-neutral-300">
          {/* Peer & Path badge */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white truncate max-w-[130px]">{session.peerName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
              {session.path.toUpperCase()}
            </span>
          </div>

          {/* Display Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDisplayMenu(!showDisplayMenu);
                setShowQualityMenu(false);
                setShowSystemKeysMenu(false);
                setShowToolMenu(false);
              }}
              className="px-2 py-1 hover:bg-neutral-800 rounded flex items-center gap-1 cursor-pointer"
              title="Display Switcher"
            >
              <Monitor className="w-3.5 h-3.5 text-neutral-400" />
              <span>{session.remoteDisplay === 'all' ? 'Dual Displays' : session.remoteDisplay === 'display_1' ? 'Display 1' : 'Display 2'}</span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </button>

            {showDisplayMenu && (
              <div className="absolute top-8 left-0 bg-neutral-900 border border-neutral-700 rounded-lg p-1 w-48 shadow-xl space-y-1">
                <button
                  onClick={() => {
                    session.remoteDisplay = 'display_1';
                    setShowDisplayMenu(false);
                    peerLinkStore.notify();
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer ${
                    session.remoteDisplay === 'display_1' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800/60'
                  }`}
                >
                  <span>Display 1 (2560×1440)</span>
                  {session.remoteDisplay === 'display_1' && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
                <button
                  onClick={() => {
                    session.remoteDisplay = 'display_2';
                    setShowDisplayMenu(false);
                    peerLinkStore.notify();
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer ${
                    session.remoteDisplay === 'display_2' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800/60'
                  }`}
                >
                  <span>Display 2 (1920×1080)</span>
                  {session.remoteDisplay === 'display_2' && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
                <button
                  onClick={() => {
                    session.remoteDisplay = 'all';
                    setShowDisplayMenu(false);
                    peerLinkStore.notify();
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer ${
                    session.remoteDisplay === 'all' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800/60'
                  }`}
                >
                  <span>Dual Displays (Side-by-Side)</span>
                  {session.remoteDisplay === 'all' && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Quality Preset */}
          <div className="relative">
            <button
              onClick={() => {
                setShowQualityMenu(!showQualityMenu);
                setShowDisplayMenu(false);
                setShowSystemKeysMenu(false);
                setShowToolMenu(false);
              }}
              className="px-2 py-1 hover:bg-neutral-800 rounded flex items-center gap-1 cursor-pointer"
              title="Quality Preset"
            >
              <Sliders className="w-3.5 h-3.5 text-neutral-400" />
              <span>{session.qualityPreset}</span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </button>

            {showQualityMenu && (
              <div className="absolute top-8 left-0 bg-neutral-900 border border-neutral-700 rounded-lg p-1 w-36 shadow-xl space-y-1">
                {(['Auto ABR', 'Speed', 'Balanced', 'Quality', 'Data Saver'] as QualityPreset[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      session.qualityPreset = q;
                      setShowQualityMenu(false);
                      peerLinkStore.notify();
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer ${
                      session.qualityPreset === q ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800/60'
                    }`}
                  >
                    <span>{q}</span>
                    {session.qualityPreset === q && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* System Keys Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSystemKeysMenu(!showSystemKeysMenu);
                setShowDisplayMenu(false);
                setShowQualityMenu(false);
                setShowToolMenu(false);
              }}
              className="px-2 py-1 hover:bg-neutral-800 rounded flex items-center gap-1 cursor-pointer"
              title="Forward Windows System Keys"
            >
              <Keyboard className="w-3.5 h-3.5 text-neutral-400" />
              <span>Keys</span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </button>

            {showSystemKeysMenu && (
              <div className="absolute top-8 left-0 bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 w-48 shadow-xl space-y-1">
                <button
                  onClick={() => {
                    setShowSecurityScreen(true);
                    setShowSystemKeysMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-800 text-rose-300 font-medium cursor-pointer"
                >
                  Ctrl + Alt + Del
                </button>
                <button
                  onClick={() => {
                    setShowSystemKeysMenu(false);
                    peerLinkStore.addToast('System Key Sent', 'Forwarded Alt+Tab scancodes to remote window manager.', 'info');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-200 cursor-pointer"
                >
                  Alt + Tab (Switch App)
                </button>
                <button
                  onClick={() => {
                    setShowSystemKeysMenu(false);
                    peerLinkStore.addToast('System Key Sent', 'Forwarded Windows Key scancode.', 'info');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-200 cursor-pointer"
                >
                  Windows Key
                </button>
                <button
                  onClick={() => {
                    setShowSystemKeysMenu(false);
                    setShowSecurityScreen(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-200 cursor-pointer"
                >
                  Win + L (Lock PC)
                </button>
              </div>
            )}
          </div>

          {/* Interactive Tools Dropdown (Laser Pointer, Pen, Magnifier, Dirty Rects) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowToolMenu(!showToolMenu);
                setShowDisplayMenu(false);
                setShowQualityMenu(false);
                setShowSystemKeysMenu(false);
              }}
              className={`px-2 py-1 hover:bg-neutral-800 rounded flex items-center gap-1 cursor-pointer ${
                selectedTool !== 'cursor' || showDirtyRects ? 'text-amber-400 font-semibold' : ''
              }`}
              title="Annotation & Forensic Tools"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tools</span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </button>

            {showToolMenu && (
              <div className="absolute top-8 left-0 bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 w-52 shadow-xl space-y-1">
                <button
                  onClick={() => {
                    setSelectedTool('cursor');
                    setShowToolMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer ${
                    selectedTool === 'cursor' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MousePointer2 className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Default Cursor</span>
                  </div>
                  {selectedTool === 'cursor' && <Check className="w-3 h-3 text-emerald-400" />}
                </button>

                <button
                  onClick={() => {
                    setSelectedTool('laser');
                    setShowToolMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer ${
                    selectedTool === 'laser' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                    <span>Laser Pointer</span>
                  </div>
                  {selectedTool === 'laser' && <Check className="w-3 h-3 text-emerald-400" />}
                </button>

                <button
                  onClick={() => {
                    setSelectedTool('pen');
                    setShowToolMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer ${
                    selectedTool === 'pen' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PenTool className="w-3.5 h-3.5 text-amber-400" />
                    <span>On-Screen Highlighter</span>
                  </div>
                  {selectedTool === 'pen' && <Check className="w-3 h-3 text-emerald-400" />}
                </button>

                <button
                  onClick={() => {
                    setSelectedTool('magnifier');
                    setShowToolMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer ${
                    selectedTool === 'magnifier' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ZoomIn className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pixel Peek 4x Loupe</span>
                  </div>
                  {selectedTool === 'magnifier' && <Check className="w-3 h-3 text-emerald-400" />}
                </button>

                <div className="h-px bg-neutral-800 my-1" />

                <button
                  onClick={() => {
                    setShowDirtyRects(!showDirtyRects);
                    setShowToolMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-200 text-xs flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Show DDA Dirty Rects</span>
                  </div>
                  {showDirtyRects && <Check className="w-3 h-3 text-emerald-400" />}
                </button>

                {penStrokes.length > 0 && (
                  <button
                    onClick={() => {
                      setPenStrokes([]);
                      setShowToolMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-rose-950/60 text-rose-300 text-xs cursor-pointer"
                  >
                    Clear Annotations
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-neutral-800 mx-0.5" />

          {/* Quick Drawer Buttons */}
          <button
            onClick={() => setActiveDrawer(activeDrawer === 'clipboard' ? null : 'clipboard')}
            className={`p-1.5 rounded hover:bg-neutral-800 cursor-pointer ${activeDrawer === 'clipboard' ? 'text-emerald-400 bg-neutral-800' : 'text-neutral-400'}`}
            title="Clipboard Drawer"
          >
            <Clipboard className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'files' ? null : 'files')}
            className={`p-1.5 rounded hover:bg-neutral-800 cursor-pointer ${activeDrawer === 'files' ? 'text-emerald-400 bg-neutral-800' : 'text-neutral-400'}`}
            title="File Transfer Drawer"
          >
            <FolderSync className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              session.audioActive = !session.audioActive;
              if (session.audioActive) {
                setActiveDrawer('audio');
              }
              peerLinkStore.notify();
            }}
            className={`p-1.5 rounded hover:bg-neutral-800 cursor-pointer ${session.audioActive ? 'text-emerald-400' : 'text-neutral-500'}`}
            title="WASAPI Loopback Audio"
          >
            {session.audioActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'chat' ? null : 'chat')}
            className={`p-1.5 rounded hover:bg-neutral-800 cursor-pointer relative ${activeDrawer === 'chat' ? 'text-emerald-400 bg-neutral-800' : 'text-neutral-400'}`}
            title="In-Session Text Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleRecording}
            className={`p-1.5 rounded hover:bg-neutral-800 cursor-pointer ${session.recordingActive ? 'text-rose-400 animate-pulse' : 'text-neutral-400'}`}
            title={session.recordingActive ? `Recording active (${session.recordingSeconds}s)` : 'Record Session'}
          >
            <CircleDot className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleTakeScreenshot}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 cursor-pointer"
            title="Capture Screenshot"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              session.privacyBlankActive = !session.privacyBlankActive;
              peerLinkStore.notify();
            }}
            className={`p-1.5 rounded hover:bg-neutral-800 cursor-pointer ${session.privacyBlankActive ? 'text-amber-400' : 'text-neutral-400'}`}
            title="Privacy Blank Screen (hide host physical monitor)"
          >
            {session.privacyBlankActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setActiveDrawer(activeDrawer === 'stats' ? null : 'stats')}
            className={`p-1.5 rounded hover:bg-neutral-800 cursor-pointer ${activeDrawer === 'stats' ? 'text-emerald-400 bg-neutral-800' : 'text-neutral-400'}`}
            title="Live Stats HUD"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-0.5" />

          {/* Disconnect */}
          <button
            onClick={onDisconnect}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-rose-900/60 text-neutral-200 hover:text-rose-200 rounded text-xs font-medium transition-colors cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT: HIGH-FIDELITY SIMULATED WINDOWS 11 DESKTOP */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
        onMouseDown={handleMouseDownCanvas}
        className={`flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 flex flex-col justify-between ${
          selectedTool === 'laser'
            ? 'cursor-none'
            : selectedTool === 'pen'
            ? 'cursor-crosshair'
            : selectedTool === 'magnifier'
            ? 'cursor-zoom-in'
            : 'cursor-default'
        }`}
      >
        {/* Subtle Desktop Wallpaper Texture */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>

        {/* Settled Progressive Refinement Indicator */}
        <div className="absolute top-16 right-4 z-20 pointer-events-none flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/80 bg-neutral-900/80 px-2 py-1 rounded border border-emerald-500/20 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Settled · 4:4:4 Crisp Text</span>
        </div>

        {/* DRAG-AND-DROP ACTIVE HUD OVERLAY */}
        {isDragOver && (
          <div className="absolute inset-0 bg-emerald-950/70 border-4 border-dashed border-emerald-400/80 z-50 flex flex-col items-center justify-center space-y-3 backdrop-blur-sm pointer-events-none animate-in fade-in duration-100">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 animate-bounce">
              <FileUp className="w-8 h-8" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-white">Drop File to Deliver to Remote Desktop</h2>
              <p className="text-xs text-emerald-300 font-mono">
                Streamed via iroh-blobs with BLAKE3 cryptographic verification & ZoneId=3 MOTW
              </p>
            </div>
          </div>
        )}

        {/* DROP PROGRESS WIDGET */}
        {dropProgress && (
          <div className="absolute bottom-16 right-8 bg-neutral-900/95 border border-emerald-500/60 rounded-xl p-3 shadow-2xl z-40 flex items-center gap-3 animate-in slide-in-from-bottom-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-white truncate max-w-[180px]">
                {dropProgress.fileName}
              </div>
              <div className="w-36 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-150" style={{ width: `${dropProgress.pct}%` }} />
              </div>
            </div>
          </div>
        )}

        {/* DDA DIRTY RECTANGLES DEBUG OVERLAY */}
        {showDirtyRects && (
          <div className="absolute inset-0 pointer-events-none z-30">
            <div className="absolute top-20 left-28 w-96 h-72 border border-emerald-400/60 bg-emerald-500/5 animate-pulse">
              <span className="text-[9px] font-mono text-emerald-400 bg-neutral-900/80 px-1">DDA DirtyRect[0]: 384x288 @ (120,80)</span>
            </div>
            <div className="absolute bottom-24 right-40 w-44 h-24 border border-emerald-400/60 bg-emerald-500/5">
              <span className="text-[9px] font-mono text-emerald-400 bg-neutral-900/80 px-1">DDA DirtyRect[1]: 176x96</span>
            </div>
          </div>
        )}

        {/* ANNOTATION PEN STROKES */}
        <svg className="absolute inset-0 pointer-events-none z-30 w-full h-full">
          {penStrokes.map((stroke, sIdx) => (
            <polyline
              key={sIdx}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={stroke.map((pt) => `${pt.x},${pt.y}`).join(' ')}
            />
          ))}
          {currentStroke && (
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={currentStroke.map((pt) => `${pt.x},${pt.y}`).join(' ')}
            />
          )}
        </svg>

        {/* LASER POINTER GLOWING DOT */}
        {selectedTool === 'laser' && laserCoords && (
          <div
            className="absolute pointer-events-none z-40 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: laserCoords.x, top: laserCoords.y }}
          >
            <div className="w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_15px_#f43f5e] animate-ping opacity-75" />
            <div className="w-2.5 h-2.5 rounded-full bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_#f43f5e]" />
          </div>
        )}

        {/* PIXEL PEEK 4X SUBPIXEL MAGNIFIER LOUPE */}
        {selectedTool === 'magnifier' && (
          <div
            className="absolute pointer-events-none z-40 w-44 h-44 rounded-full border-2 border-emerald-400 bg-neutral-950/90 shadow-[0_0_25px_rgba(16,185,129,0.3)] overflow-hidden transform -translate-x-1/2 -translate-y-1/2 backdrop-blur-sm flex flex-col items-center justify-center"
            style={{ left: magnifierCoords.x, top: magnifierCoords.y }}
          >
            <div className="text-[10px] font-mono text-emerald-400 pb-1">4x Subpixel Peek</div>
            <div className="grid grid-cols-4 gap-1 p-2 bg-neutral-900 border border-neutral-800 rounded">
              <span className="w-3 h-3 bg-red-500 rounded-xs" />
              <span className="w-3 h-3 bg-green-500 rounded-xs" />
              <span className="w-3 h-3 bg-blue-500 rounded-xs" />
              <span className="w-3 h-3 bg-white rounded-xs" />
            </div>
            <div className="text-[9px] font-mono text-neutral-400 mt-1">4:4:4 True RGB</div>
          </div>
        )}

        {/* DESKTOP SURFACE WITH INTERACTIVE ICONS */}
        <div className="flex-1 p-6 relative">
          {/* Desktop Shortcuts Column */}
          <div className="flex flex-col gap-4 w-24">
            <button
              onClick={() => setActiveWindow('taskmgr')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 group cursor-pointer transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-white text-center font-medium drop-shadow-md">
                Task Manager
              </span>
            </button>

            <button
              onClick={() => setActiveWindow('terminal')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 group cursor-pointer transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <Terminal className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-white text-center font-medium drop-shadow-md">
                PowerShell
              </span>
            </button>

            <button
              onClick={() => setActiveWindow('notepad')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 group cursor-pointer transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-white text-center font-medium drop-shadow-md">
                Notepad
              </span>
            </button>

            <button
              onClick={() => setActiveWindow('explorer')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 group cursor-pointer transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <Folder className="w-6 h-6" />
              </div>
              <span className="text-[11px] text-white text-center font-medium drop-shadow-md">
                Files
              </span>
            </button>
          </div>

          {/* REMOTE DESKTOP DELIVERED FILES ICONS (Dynamic from dropFileToRemote) */}
          <div className="absolute top-6 left-32 flex flex-col gap-4">
            {session.remoteDesktopFiles.map((f, idx) => (
              <div
                key={idx}
                onDoubleClick={() => {
                  if (f.name.endsWith('.txt')) {
                    setActiveWindow('notepad');
                  } else {
                    peerLinkStore.addToast('Opening File', `Viewing ${f.name} on remote host.`, 'info');
                  }
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 cursor-pointer max-w-[200px]"
                title={`Double-click to open (${formatBytes(f.size)})`}
              >
                <div className="w-8 h-8 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shrink-0">
                  {f.icon === 'zip' ? <FileArchive className="w-4 h-4 text-amber-400" /> : <FileText className="w-4 h-4 text-blue-400" />}
                </div>
                <div className="truncate">
                  <div className="text-xs text-white truncate font-medium drop-shadow-sm">{f.name}</div>
                  <div className="text-[10px] text-neutral-400 font-mono">{formatBytes(f.size)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ACTIVE WINDOW A: TASK MANAGER (Draggable) */}
          {activeWindow === 'taskmgr' && (
            <div
              style={{ left: `${windowPositions.taskmgr.x}px`, top: `${windowPositions.taskmgr.y}px` }}
              className="absolute w-[560px] bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col z-20 animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Window Title Bar */}
              <div
                onMouseDown={(e) => handleMouseDownWindow('taskmgr', e)}
                className="px-4 py-2.5 bg-neutral-800/90 border-b border-neutral-700 flex items-center justify-between text-xs select-none cursor-move"
              >
                <div className="flex items-center gap-2 text-white font-medium">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Task Manager — Interactive Session</span>
                </div>
                <button
                  onClick={() => setActiveWindow(null)}
                  className="p-1 hover:bg-rose-600 rounded text-neutral-300 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Hardware Telemetry Bar */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-neutral-950/60 border-b border-neutral-800 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-neutral-400">
                    <span>CPU</span>
                    <span className="font-mono text-emerald-400">12% · 4.8 GHz</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[12%]"></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-neutral-400">
                    <span>Memory</span>
                    <span className="font-mono text-blue-400">14.2 / 64 GB</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[22%]"></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-neutral-400">
                    <span>GPU (DDA)</span>
                    <span className="font-mono text-amber-400">3% · HW Encode</span>
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[3%]"></div>
                  </div>
                </div>
              </div>

              {/* Process Table */}
              <div className="p-3 max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-neutral-500 border-b border-neutral-800 pb-2">
                      <th className="font-medium pb-2">Name</th>
                      <th className="font-medium pb-2">PID</th>
                      <th className="font-medium pb-2">CPU</th>
                      <th className="font-medium pb-2">Memory</th>
                      <th className="font-medium pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {processes.map((p) => (
                      <tr key={p.pid} className="hover:bg-neutral-800/50">
                        <td className="py-2 text-white font-mono">{p.name}</td>
                        <td className="py-2 text-neutral-400 font-mono">{p.pid}</td>
                        <td className="py-2 text-neutral-300 font-mono">{p.cpu}%</td>
                        <td className="py-2 text-neutral-300 font-mono">{p.mem} MB</td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => handleKillProcess(p.pid)}
                            className="px-2 py-0.5 bg-neutral-800 hover:bg-rose-900/60 text-neutral-300 hover:text-rose-200 rounded text-[11px] cursor-pointer"
                          >
                            End Process
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACTIVE WINDOW B: POWERSHELL TERMINAL (Draggable) */}
          {activeWindow === 'terminal' && (
            <div
              style={{ left: `${windowPositions.terminal.x}px`, top: `${windowPositions.terminal.y}px` }}
              className="absolute w-[600px] bg-neutral-950 border border-neutral-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col z-20 animate-in fade-in zoom-in-95 duration-100 font-mono"
            >
              <div
                onMouseDown={(e) => handleMouseDownWindow('terminal', e)}
                className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs select-none cursor-move"
              >
                <div className="flex items-center gap-2 text-white font-medium">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <span>PowerShell 7 — Remote ConPTY</span>
                </div>
                <button
                  onClick={() => setActiveWindow(null)}
                  className="p-1 hover:bg-rose-600 rounded text-neutral-300 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 h-64 overflow-y-auto text-xs space-y-1 text-emerald-400 bg-neutral-950">
                {terminalHistory.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">{line}</div>
                ))}
              </div>

              <form onSubmit={handleTerminalSubmit} className="p-2 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2">
                <span className="text-xs text-blue-400 pl-2">PS&gt;</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="Type command..."
                  className="flex-1 bg-transparent text-xs text-white outline-none font-mono"
                  autoFocus
                />
              </form>
            </div>
          )}

          {/* ACTIVE WINDOW C: NOTEPAD (Draggable) */}
          {activeWindow === 'notepad' && (
            <div
              style={{ left: `${windowPositions.notepad.x}px`, top: `${windowPositions.notepad.y}px` }}
              className="absolute w-[500px] bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col z-20 animate-in fade-in zoom-in-95 duration-100"
            >
              <div
                onMouseDown={(e) => handleMouseDownWindow('notepad', e)}
                className="px-4 py-2.5 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between text-xs select-none cursor-move"
              >
                <div className="flex items-center gap-2 text-white font-medium">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Notepad — remote_notes.txt</span>
                </div>
                <button
                  onClick={() => setActiveWindow(null)}
                  className="p-1 hover:bg-rose-600 rounded text-neutral-300 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                value={notepadText}
                onChange={(e) => setNotepadText(e.target.value)}
                className="w-full h-56 bg-neutral-950 p-4 text-xs font-mono text-neutral-200 outline-none resize-none"
              />
            </div>
          )}

          {/* ACTIVE WINDOW D: FILE EXPLORER (Draggable) */}
          {activeWindow === 'explorer' && (
            <div
              style={{ left: `${windowPositions.explorer.x}px`, top: `${windowPositions.explorer.y}px` }}
              className="absolute w-[540px] bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col z-20 animate-in fade-in zoom-in-95 duration-100"
            >
              <div
                onMouseDown={(e) => handleMouseDownWindow('explorer', e)}
                className="px-4 py-2.5 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between text-xs select-none cursor-move"
              >
                <div className="flex items-center gap-2 text-white font-medium">
                  <Folder className="w-4 h-4 text-indigo-400" />
                  <span>File Explorer — C:\Users\Host\Desktop</span>
                </div>
                <button
                  onClick={() => setActiveWindow(null)}
                  className="p-1 hover:bg-rose-600 rounded text-neutral-300 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 bg-neutral-950/60 border-b border-neutral-800 text-xs text-neutral-400 font-mono">
                Location: Desktop (Ready for Drag & Drop)
              </div>

              <div className="p-4 grid grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {session.remoteDesktopFiles.map((f, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (f.name.endsWith('.txt')) {
                        setActiveWindow('notepad');
                      }
                    }}
                    className="p-2.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800/80 flex flex-col items-center gap-1.5 cursor-pointer text-center"
                  >
                    <FileText className="w-6 h-6 text-indigo-400" />
                    <span className="text-xs text-white truncate w-full font-medium">{f.name}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">{formatBytes(f.size)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* WINDOWS 11 TASKBAR */}
        <div className="h-12 bg-neutral-900/90 backdrop-blur-md border-t border-neutral-800 px-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => peerLinkStore.addToast('Start Menu', 'Windows 11 Start menu invoked.', 'info')}
              className="p-2 rounded-lg hover:bg-neutral-800 text-blue-400 cursor-pointer"
              title="Start"
            >
              <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                <div className="bg-blue-400 rounded-xs"></div>
                <div className="bg-blue-400 rounded-xs"></div>
                <div className="bg-blue-400 rounded-xs"></div>
                <div className="bg-blue-400 rounded-xs"></div>
              </div>
            </button>
            <div className="flex items-center gap-1.5 bg-neutral-800/80 px-3 py-1.5 rounded-lg text-xs text-neutral-400 w-44">
              <Search className="w-3.5 h-3.5 text-neutral-500" />
              <span>Search apps, files</span>
            </div>
          </div>

          {/* Centered Taskbar App Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveWindow(activeWindow === 'taskmgr' ? null : 'taskmgr')}
              className={`p-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer ${activeWindow === 'taskmgr' ? 'bg-neutral-800 border-b-2 border-emerald-400' : ''}`}
              title="Task Manager"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={() => setActiveWindow(activeWindow === 'terminal' ? null : 'terminal')}
              className={`p-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer ${activeWindow === 'terminal' ? 'bg-neutral-800 border-b-2 border-blue-400' : ''}`}
              title="PowerShell"
            >
              <Terminal className="w-4 h-4 text-blue-400" />
            </button>
            <button
              onClick={() => setActiveWindow(activeWindow === 'notepad' ? null : 'notepad')}
              className={`p-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer ${activeWindow === 'notepad' ? 'bg-neutral-800 border-b-2 border-amber-400' : ''}`}
              title="Notepad"
            >
              <FileText className="w-4 h-4 text-amber-400" />
            </button>
            <button
              onClick={() => setActiveWindow(activeWindow === 'explorer' ? null : 'explorer')}
              className={`p-2 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer ${activeWindow === 'explorer' ? 'bg-neutral-800 border-b-2 border-indigo-400' : ''}`}
              title="File Explorer"
            >
              <Folder className="w-4 h-4 text-indigo-400" />
            </button>
          </div>

          {/* Clock & Tray */}
          <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
            <span>ENG</span>
            <span>10:24 AM</span>
          </div>
        </div>

        {/* WINDOWS SECURITY OVERLAY (Triggered by Ctrl+Alt+Del) */}
        {showSecurityScreen && (
          <div className="absolute inset-0 bg-blue-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6 text-white select-none">
            <h2 className="text-xl font-bold tracking-tight">Windows Security</h2>
            <div className="flex flex-col gap-2 w-56">
              <button
                onClick={() => {
                  setShowSecurityScreen(false);
                  peerLinkStore.addToast('Workstation Locked', 'Host workstation session secured.', 'info');
                }}
                className="py-2 px-4 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-700/60 rounded text-xs text-left cursor-pointer"
              >
                Lock Workstation
              </button>
              <button
                onClick={() => {
                  setShowSecurityScreen(false);
                  setActiveWindow('taskmgr');
                }}
                className="py-2 px-4 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-700/60 rounded text-xs text-left cursor-pointer"
              >
                Task Manager
              </button>
              <button
                onClick={() => {
                  setShowSecurityScreen(false);
                  onDisconnect();
                }}
                className="py-2 px-4 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-700/60 rounded text-xs text-left cursor-pointer"
              >
                Sign out
              </button>
              <button
                onClick={() => setShowSecurityScreen(false)}
                className="py-2 px-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded text-xs text-center cursor-pointer mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE DRAWERS */}
      {/* 1. CLIPBOARD DRAWER */}
      {activeDrawer === 'clipboard' && (
        <div className="absolute top-14 right-4 w-80 bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-2xl z-40 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Clipboard className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Delayed-Render Clipboard</span>
            </div>
            <button onClick={() => setActiveDrawer(null)} className="text-neutral-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddClipboard} className="space-y-2">
            <input
              type="text"
              value={newClipText}
              onChange={(e) => setNewClipText(e.target.value)}
              placeholder="Push text to remote clipboard..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white outline-none"
            />
            <button
              type="submit"
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium cursor-pointer"
            >
              Push to Remote
            </button>
          </form>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            <span className="text-[11px] font-semibold text-neutral-400">Recent Sync Items</span>
            {session.clipboardHistory.map((clip, i) => (
              <div key={i} className="p-2 bg-neutral-950 rounded border border-neutral-800 text-xs space-y-1">
                <div className="text-neutral-300 font-mono text-[11px] truncate">{clip.text}</div>
                <div className="text-[10px] text-neutral-500 flex justify-between">
                  <span>{clip.source === 'local' ? 'Sent' : 'Received'}</span>
                  <span>{clip.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. RESUMABLE FILES DRAWER */}
      {activeDrawer === 'files' && (
        <div className="absolute top-14 right-4 w-96 bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-2xl z-40 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <FolderSync className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">iroh-blobs File Transfer</span>
            </div>
            <button onClick={() => setActiveDrawer(null)} className="text-neutral-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {peerLinkStore.fileTransfers.map((item) => {
              const pct = Math.floor((item.transferredBytes / item.sizeBytes) * 100);
              return (
                <div key={item.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[200px]">{item.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{pct}%</span>
                  </div>

                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                    <span>{formatBytes(item.transferredBytes)} / {formatBytes(item.sizeBytes)}</span>
                    <span className="text-[10px] text-neutral-500">MOTW ZoneId=3</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. IN-SESSION CHAT DRAWER */}
      {activeDrawer === 'chat' && (
        <div className="absolute top-14 right-4 w-80 bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-2xl z-40 flex flex-col h-96">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">In-Session Secure Chat</span>
            </div>
            <button onClick={() => setActiveDrawer(null)} className="text-neutral-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2">
            {session.chat.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col text-xs ${
                  msg.sender === 'local' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`px-3 py-1.5 rounded-lg max-w-[80%] ${
                    msg.sender === 'local'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-800 text-neutral-200'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-neutral-500 mt-0.5">{msg.timestamp}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-neutral-800">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send message..."
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white outline-none"
            />
            <button
              type="submit"
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* 4. WASAPI AUDIO SPECTRUM VISUALIZER DRAWER */}
      {activeDrawer === 'audio' && (
        <div className="absolute top-14 right-4 w-76 bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-2xl z-40 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">WASAPI Loopback Audio</span>
            </div>
            <button onClick={() => setActiveDrawer(null)} className="text-neutral-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-end justify-between h-16 bg-neutral-950 p-2 rounded-lg border border-neutral-800 gap-1">
              {audioFreqs.map((freq, idx) => (
                <div
                  key={idx}
                  className="w-full bg-emerald-500/80 rounded-xs transition-all duration-150"
                  style={{ height: `${freq}%` }}
                />
              ))}
            </div>

            <div className="flex justify-between text-[11px] font-mono text-neutral-400">
              <span>Opus 32 kbps VBR</span>
              <span className="text-emerald-400">DTX Active (Zero Silent Pkts)</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. LIVE STATS HUD */}
      {activeDrawer === 'stats' && (
        <div className="absolute top-14 right-4 w-72 bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-2xl z-40 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">Live Stream Telemetry</span>
            </div>
            <button onClick={() => setActiveDrawer(null)} className="text-neutral-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-neutral-400">Glass-to-Glass Latency:</span>
              <span className="text-emerald-400 font-semibold">{session.stats.glassToGlassMs} ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Round-Trip Time (RTT):</span>
              <span className="text-white">{session.stats.rttMs} ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Framerate:</span>
              <span className="text-white">{session.stats.fps} FPS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Bitrate:</span>
              <span className="text-white">{session.stats.bitrateKbps} kbps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Packet Loss:</span>
              <span className="text-white">{session.stats.lossPct.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Active Codec:</span>
              <span className="text-emerald-400">{session.stats.codec}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Transport Tier:</span>
              <span className="text-white">{session.stats.path.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Data Transferred:</span>
              <span className="text-white">{session.stats.totalDataMb} MB</span>
            </div>
          </div>
        </div>
      )}

      {/* RECORDING PREVIEW & DOWNLOAD MODAL */}
      {showRecordingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Session Recording Ready</h3>
              </div>
              <button onClick={() => setShowRecordingModal(false)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col items-center justify-center p-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Play className="w-5 h-5 ml-0.5" />
              </div>
              <div className="text-xs font-mono text-neutral-300">
                Duration: {recordedDuration}s · Codec: {session.codec}
              </div>
              <div className="text-[11px] text-neutral-500 font-mono">
                Container: WebM (VP9/AV1) · Resolution: 2560×1440
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRecordingModal(false)}
                className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={handleDownloadRecording}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Recording (.webm)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
