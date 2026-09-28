'use client';

import React from 'react';
import { X } from 'lucide-react';

interface PWAInstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

/**
 * PWAInstallBanner — reusable install prompt banner.
 *
 * Placed at the bottom of the screen, slides up when visible.
 * Works on both the landing page and the parent dashboard.
 */
export default function PWAInstallBanner({ onInstall, onDismiss }: PWAInstallBannerProps) {
  return (
    <div
      role="dialog"
      aria-label="Install TinyRide app"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50
                 bg-slate-900/96 text-white p-4 rounded-2xl shadow-2xl
                 backdrop-blur-md border border-slate-700/60
                 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3">
        {/* App icon */}
        <img
          src="/icons/icon-192x192.png"
          alt="TinyRide"
          className="w-11 h-11 rounded-xl shadow-sm shrink-0"
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">Install TinyRide</p>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            Add to home screen for instant ride tracking, even offline.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={onInstall}
              className="px-4 py-1.5 bg-[#006B2F] hover:bg-[#005525] text-white
                         rounded-lg text-xs font-semibold shadow-sm
                         transition-all active:scale-95 min-h-[34px]"
            >
              Install Now
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-1.5 text-slate-400 hover:text-white
                         text-xs font-medium transition-colors min-h-[34px]"
            >
              Not now
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close install banner"
          className="shrink-0 text-slate-500 hover:text-white transition-colors p-1 -mr-1 -mt-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
