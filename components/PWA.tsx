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
        <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shrink-0">
          <span className="text-white font-bold">F</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink">Install Footfall</p>
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
