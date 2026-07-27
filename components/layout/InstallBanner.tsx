'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'splitkaro_install_dismissed';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Don't show if previously dismissed
    if (typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY)) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      promptRef.current = event;
      setDeferredPrompt(event);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
    promptRef.current = null;
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDeferredPrompt(null);
    promptRef.current = null;
    localStorage.setItem(DISMISS_KEY, '1');
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleDismiss}
        aria-hidden="true"
      />
      {/* Sheet */}
      <div className="relative z-10 w-full max-w-[600px] bg-card border-t-2 border-x-2 border-ink rounded-t-2xl shadow-[0px_-2px_0px_0px_rgba(26,26,26,1)] p-6 animate-[slideUp_250ms_ease-out]">
        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-surface-3" />
        </div>

        <div className="flex items-center gap-4 mb-5">
          {/* App icon */}
          <div className="w-14 h-14 rounded-2xl border-2 border-ink bg-[#aa3000] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] flex items-center justify-center shrink-0">
            <span className="text-white font-bold font-['Syne'] text-xl">S</span>
          </div>
          <div>
            <h3 className="text-lg font-bold font-['Space_Grotesk'] text-ink">
              Install SplitKaro
            </h3>
            <p className="text-sm text-ink-muted font-['DM_Sans']">
              Add to home screen for the best experience
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" size="md" onClick={handleDismiss} className="flex-1">
            Not now
          </Button>
          <Button variant="primary" size="md" onClick={handleInstall} icon="install_mobile" className="flex-1">
            Install
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
