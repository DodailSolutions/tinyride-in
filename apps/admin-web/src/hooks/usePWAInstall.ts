'use client';

/**
 * usePWAInstall — Shared hook for PWA install prompt management.
 *
 * Rules:
 * - Captures `beforeinstallprompt` and stores it in a ref (not state) so it
 *   survives re-renders without risk of stale closure.
 * - Shows the banner automatically unless the user dismissed it within the
 *   last 30 days (rolling window — not a permanent suppression).
 * - On "Install Now": calls `.prompt()`, awaits `userChoice`, hides banner.
 * - On "Not now": records timestamp in localStorage, hides banner.
 * - Handles `appinstalled` event to hide banner if OS installs the app.
 * - Returns `canInstall` (true once the event fires) for gating UI.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'tinyride_pwa_dismissed_at';
const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    return Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

export function usePWAInstall() {
  // Ref: survives re-renders, no risk of stale closure
  const promptRef = useRef<any>(null);

  const [canInstall, setCanInstall] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstall = (e: Event) => {
      // MUST call preventDefault() to suppress Chrome's native mini-infobar
      e.preventDefault();
      promptRef.current = e;
      setCanInstall(true);

      // Only auto-show if not recently dismissed
      if (!isDismissedRecently()) {
        // Small delay so the page paint completes first
        setTimeout(() => setShowBanner(true), 2000);
      }
    };

    const handleAppInstalled = () => {
      promptRef.current = null;
      setCanInstall(false);
      setShowBanner(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = promptRef.current;
    if (!prompt) return;

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        // Clean up — browser won't fire the event again this session
        promptRef.current = null;
        setCanInstall(false);
      }
    } catch {
      // Browser may throw if prompt() is called at a bad time; ignore
    }
    // Always hide banner after the native dialog (accepted or dismissed)
    setShowBanner(false);
  }, []);

  const dismiss = useCallback(() => {
    setShowBanner(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
  }, []);

  /**
   * Manually re-show the banner (e.g. from a "Install App" menu item).
   * Only works if the deferred prompt is still available.
   */
  const showPrompt = useCallback(() => {
    if (promptRef.current) {
      setShowBanner(true);
    }
  }, []);

  return { canInstall, showBanner, install, dismiss, showPrompt };
}
