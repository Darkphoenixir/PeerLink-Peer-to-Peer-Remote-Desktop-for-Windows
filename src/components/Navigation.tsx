/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Monitor,
  Shield,
  FolderSync,
  FileText,
  Activity,
  Settings,
  OctagonAlert,
  Radio,
  Cast,
  BookOpen
} from 'lucide-react';
import { ActiveSession } from '../services/store';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeSession: ActiveSession | null;
  onPanicStop: () => void;
  onQuickConnect: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  activeSession,
  onPanicStop,
  onQuickConnect
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Cast },
    ...(activeSession
      ? [{ id: 'session', label: 'Remote Session', icon: Monitor, badge: 'Live' }]
      : []),
    { id: 'devices', label: 'Devices', icon: Shield },
    { id: 'files', label: 'File Manager', icon: FolderSync },
    { id: 'audit', label: 'Audit Log', icon: FileText },
    { id: 'network', label: 'Network & Directory', icon: Activity },
    { id: 'docs', label: 'Docs & Gallery', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="h-14 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white block leading-none">
              PeerLink
            </span>
            <span className="text-[10px] text-neutral-400 font-mono block tracking-wider mt-0.5">
              P2P QUIC · v1.0
            </span>
          </div>
        </button>

        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 ml-3 pl-3 border-l border-neutral-800 text-xs text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Broker & Net Active</span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer relative ${
                isActive
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/60'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {activeSession ? (
          <button
            onClick={onPanicStop}
            title="Emergency Panic Stop (Ctrl+Alt+Shift+Pause): Instantly disconnect and unhook inputs"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 border border-rose-600/40 text-rose-300 hover:bg-rose-900/60 hover:border-rose-500 rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            <OctagonAlert className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Panic Stop</span>
          </button>
        ) : (
          <button
            onClick={onQuickConnect}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Cast className="w-3.5 h-3.5" />
            <span>Connect to PC</span>
          </button>
        )}
      </div>
    </header>
  );
};
