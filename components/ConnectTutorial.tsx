"use client";

import { RefObject, useEffect, useState } from "react";

type ConnectTutorialRefs = {
  vibeInput: RefObject<HTMLElement | null>;
  storyBtn: RefObject<HTMLElement | null>;
};

export default function ConnectTutorial({
  refs,
  onDone,
}: {
  refs: ConnectTutorialRefs;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const targetRef = step === 0 ? refs.vibeInput : refs.storyBtn;

  useEffect(() => {
    const node = targetRef?.current;
    if (!node) { setRect(null); return; }
    function update() {
      const n = targetRef?.current;
      if (!n) return;
      n.scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(() => setRect(n.getBoundingClientRect()), 180);
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [targetRef, step]);

  const messages = [
    { title: "Drop a vibe 🔥", body: "Type what you're up to — \"chai at 4pm?\" or \"DBMS grind rn 💀\". Your whole campus sees it. Gone in 24h." },
    { title: "Post a story 📸", body: "Tap your circle to post a photo or video. Just like Instagram — your college sees it, disappears after 24h." },
  ];

  const pad = 12;
  const r = rect
    ? {
        top: Math.max(0, rect.top - pad),
        left: Math.max(0, rect.left - pad),
        width: Math.min(window.innerWidth, rect.width + pad * 2),
        height: rect.height + pad * 2,
      }
    : { top: window.innerHeight * 0.4, left: 24, width: window.innerWidth - 48, height: 80 };

  const bubbleBelow = r.top + r.height + 14 < window.innerHeight - 180;
  const bubbleStyle = bubbleBelow
    ? { top: r.top + r.height + 14, left: 16, right: 16 }
    : { bottom: Math.max(16, window.innerHeight - r.top + 14), left: 16, right: 16 };

  const isLast = step === 1;
  const msg = messages[step];

  return (
    <div className="fixed inset-0 z-[120] pointer-events-none">
      {/* 4-strip overlay */}
      <div className="absolute left-0 right-0 bg-black/75" style={{ top: 0, height: r.top }} />
      <div className="absolute left-0 right-0 bg-black/75" style={{ top: r.top + r.height, bottom: 0 }} />
      <div className="absolute bg-black/75" style={{ top: r.top, left: 0, width: r.left, height: r.height }} />
      <div className="absolute bg-black/75" style={{ top: r.top, left: r.left + r.width, right: 0, height: r.height }} />
      {/* Glowing cutout border */}
      <div
        className="absolute rounded-2xl border border-brand-500/40"
        style={{
          top: r.top, left: r.left, width: r.width, height: r.height,
          boxShadow: "0 0 0 1px rgba(15,143,111,0.25), 0 0 34px rgba(15,143,111,0.45)",
        }}
      />
      {/* Bubble */}
      <div className="absolute pointer-events-auto rounded-2xl bg-white/[0.06] border border-white/[0.12] backdrop-blur-xl p-4 shadow-2xl shadow-black/60" style={bubbleStyle}>
        <p className="text-sm font-bold text-ink mb-1">{msg.title}</p>
        <p className="text-sm text-ink-mute leading-relaxed">{msg.body}</p>
        <div className="flex items-center justify-between mt-4">
          <button type="button" onClick={() => { localStorage.setItem("cmpus_connect_tutorial_done", "1"); onDone(); }}
            className="text-xs font-semibold text-ink-mute active:scale-[0.97] transition-all">
            Skip
          </button>
          <button type="button"
            onClick={() => {
              if (isLast) { localStorage.setItem("cmpus_connect_tutorial_done", "1"); onDone(); }
              else setStep(s => s + 1);
            }}
            className="px-4 py-2 rounded-full bg-brand-500 text-white text-xs font-bold active:scale-[0.97] transition-all">
            {isLast ? "Got it 🎉" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
