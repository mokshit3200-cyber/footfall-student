"use client";

import { useEffect, useState } from "react";
import { XIcon } from "./icons";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "footfall-install-dismissed";

export default function PWA() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    function onBIP(e: Event) {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      // only show if not dismissed before and not already installed
      const dismissed = localStorage.getItem(DISMISS_KEY);
      const standalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      if (!dismissed && !standalone) {
        setTimeout(() => setShow(true), 3000);
      }
    }

    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setShow(false);
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-[88px] inset-x-0 z-50 mx-auto max-w-[440px] px-4 animate-fade-up">
      <div className="card p-3.5 flex items-center gap-3 shadow-lg">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-white/10 overflow-hidden" style={{ backgroundColor: "#1A1D1B" }}>
          <img src="/brand/mark-white.png" alt="Cmpus" className="w-7 h-7 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink">Install Cmpus</p>
          <p className="text-[11px] text-ink-mute">
            Add to your home screen for one-tap access
          </p>
        </div>
        <button
          onClick={install}
          className="btn-primary py-2 px-4 text-sm shrink-0"
        >
          Install
        </button>
        <button onClick={dismiss} className="text-ink-mute shrink-0">
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Push notification stubs — real VAPID key not yet configured.
// When ready: generate a keypair with web-push, set NEXT_PUBLIC_VAPID_PUBLIC_KEY env var,
// and replace these stubs with the real subscription logic.

export async function subscribeUserToPush(_userId: string): Promise<boolean> {
  if (process.env.NODE_ENV === "development") console.warn("Push notifications not yet configured (VAPID key missing).");
  return false;
}

export async function unsubscribeUserFromPush(_userId: string): Promise<void> {
  // no-op until push is configured
}
