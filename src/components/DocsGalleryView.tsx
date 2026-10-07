/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  ExternalLink,
  Download,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  GitBranch,
  Github
} from 'lucide-react';
import { peerLinkStore } from '../services/store';

// Generated image assets
import heroBanner from '../assets/images/peerlink_hero_banner_1791378917354.jpg';
import uiScreenshot from '../assets/images/peerlink_ui_screenshot_1791378927528.jpg';
import pairingMockup from '../assets/images/peerlink_pairing_mockup_1791378938422.jpg';
import fileManagerPreview from '../assets/images/peerlink_filemanager_preview_1791378950390.jpg';

export const DocsGalleryView: React.FC = () => {
  const [copiedReadme, setCopiedReadme] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const galleryItems = [
    {
      title: 'Cinematic Product Hero Showcase',
      description: 'Encrypted peer-to-peer QUIC stream connecting dual Windows 11 workstations.',
      src: heroBanner,
      tag: '16:9 Banner'
    },
    {
      title: 'Interactive Remote Desktop Viewer',
      description: 'Windows 11 remote desktop session with floating Fluent pill toolbar, live telemetry HUD (60 FPS, 14ms latency), and interactive desktop apps.',
      src: uiScreenshot,
      tag: 'UI Screenshot'
    },
    {
      title: 'Zero-Knowledge 9-Digit Split Pairing Screen',
      description: 'Untrusted Cloudflare Worker + Durable Object short-code lookup with PAKE mutual channel confirmation.',
      src: pairingMockup,
      tag: 'Security Interface'
    },
    {
      title: 'Dual-Pane Resumable File Explorer (iroh-blobs)',
      description: 'Local and remote panes with BLAKE3 cryptographic hash verification and Mark-of-the-Web sandbox tagging.',
      src: fileManagerPreview,
      tag: 'File Manager'
    }
  ];

  const handleCopyReadme = async () => {
    try {
      const resp = await fetch('/README.md');
      const text = await resp.text();
      navigator.clipboard.writeText(text);
      setCopiedReadme(true);
      peerLinkStore.addToast('README Copied', 'Full GitHub README.md markdown copied to clipboard!', 'success');
      setTimeout(() => setCopiedReadme(false), 2500);
    } catch {
      peerLinkStore.addToast('README Read Error', 'README.md is saved in your project root.', 'info');
    }
  };

  const handleDownloadAsset = (src: string, filename: string) => {
    const a = document.createElement('a');
    a.href = src;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    peerLinkStore.addToast('Asset Downloaded', `Saved ${filename} to your device.`, 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
            <Github className="w-3.5 h-3.5" />
            <span>Darkphoenixir / PeerLink-Peer-to-Peer-Remote-Desktop-for-Windows</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Repository Showcase & Documentation
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Production-grade assets, screenshots, and formatted markdown ready for your GitHub repository.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Darkphoenixir/PeerLink-Peer-to-Peer-Remote-Desktop-for-Windows"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <Github className="w-4 h-4" />
            <span>Open on GitHub</span>
            <ExternalLink className="w-3 h-3 text-neutral-400" />
          </a>

          <button
            onClick={handleCopyReadme}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            {copiedReadme ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedReadme ? 'Copied README' : 'Copy README.md'}</span>
          </button>
        </div>
      </div>

      {/* Visual Asset Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>Application Visual Assets & Screenshots</span>
          </h2>
          <span className="text-xs text-neutral-400 font-mono">4 high-resolution captures</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {galleryItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg flex flex-col group"
            >
              <div
                onClick={() => setSelectedImage(item.src)}
                className="relative aspect-video bg-neutral-950 overflow-hidden cursor-zoom-in"
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-950/80 border border-neutral-700 text-neutral-300 backdrop-blur-sm">
                  {item.tag}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-500">2560 × 1440 · High-DPI</span>
                  <button
                    onClick={() => handleDownloadAsset(item.src, `peerlink_asset_${idx + 1}.jpg`)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GitHub Repository Quick Sync Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <GitBranch className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-white">How to Sync to your GitHub Repository</h3>
            <p className="text-xs text-neutral-400">Push the completed codebase and screenshots directly to your repo.</p>
          </div>
        </div>

        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 font-mono text-xs text-neutral-300 space-y-2">
          <div className="text-neutral-500"># In your local clone or directory:</div>
          <div className="text-emerald-400">
            git remote add origin https://github.com/Darkphoenixir/PeerLink-Peer-to-Peer-Remote-Desktop-for-Windows.git
          </div>
          <div className="text-white">git add .</div>
          <div className="text-white">git commit -m &quot;feat: PeerLink v1.0 complete release with screenshots and documentation&quot;</div>
          <div className="text-blue-400">git push -u origin main</div>
        </div>
      </div>

      {/* Fullscreen Image Preview Lightbox */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6 cursor-zoom-out"
        >
          <div className="max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden border border-neutral-700 shadow-2xl">
            <img
              src={selectedImage}
              alt="Asset Preview"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
