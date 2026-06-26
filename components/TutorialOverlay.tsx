"use client";

import { RefObject, useEffect, useMemo, useState } from "react";

type TutorialRefs = {
  bunkCard: RefObject<HTMLElement | null>;
  attendanceSection: RefObject<HTMLElement | null>;
  markButtons: RefObject<HTMLElement | null>;
  holidayBtn: RefObject<HTMLElement | null>;
  editTimetable: RefObject<HTMLElement | null>;
};

export default function TutorialOverlay({
  step,
  firstName,
  onNext,
  onSkip,
  refs,
}: {
  step: number;
  firstName: string;
  onNext: () => void;
  onSkip: () => void;
  refs: TutorialRefs;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const targetRef = useMemo(() => {
    if (step === 2) return refs.attendanceSection;
    if (step === 3) return refs.markButtons;
    if (step === 4) return refs.bunkCard;
    if (step === 5) return refs.holidayBtn;
    if (step === 6) return refs.editTimetable;
    return null;
  }, [step, refs]);

  useEffect(() => {
    if (!targetRef?.current) {
      setRect(null);
      return;
    }
    function updateRect() {
      const node = targetRef?.current;
      if (!node) return;
      node.scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(() => setRect(node.getBoundingClientRect()), 180);
    }
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [targetRef, step]);

  if (step === 0) {
    return (
      <FullScreen
        emoji="🎓"
        title={`You're all set, ${firstName}!`}
        text="Let's do a 30-second tour so you know exactly what to do every day."
        action="Start tour →"
        onAction={onNext}
        onSkip={onSkip}
      />
    );
  }

  if (step === 1) {
    return (
      <FullScreen
        emoji="👀"
        title="Two ways to vibe"
        text={"🔥 Vibe — drop your current mood or move in text. \"anyone for chai at 4pm?\" or \"DBMS grind rn 💀\" — your whole campus sees it, gone in 24h.\n\n📸 Story — post a photo or video, just like insta. Your college sees it, poof after 24h."}
        action="Got it →"
        onAction={onNext}
        onSkip={onSkip}
      />
    );
  }

  if (step >= 7) {
    return (
      <FullScreen
        emoji="🎉"
        title="You're ready!"
        text="Come back every day, mark your classes, and never stress about attendance again."
        action="Let's go →"
        onAction={onNext}
      />
    );
  }

  const messages: Record<number, string> = {
    2: "Mark every class here, every day. Takes 10 seconds.",
    3: "P = you went ✅  B = you bunked 😬  ✕ = cancelled 🚫",
    4: "This updates live. It'll tell you exactly when it's safe to bunk.",
    5: "Holiday? Tap this - marks every class cancelled in one go.",
    6: "Set your weekly schedule here once. We auto-fill every day.",
  };
  const pad = 10;
  const r = rect
    ? {
        top: Math.max(0, rect.top - pad),
        left: Math.max(0, rect.left - pad),
        width: Math.min(window.innerWidth, rect.width + pad * 2),
        height: rect.height + pad * 2,
      }
    : { top: window.innerHeight * 0.35, left: 24, width: window.innerWidth - 48, height: 120 };
  const bubbleTop = r.top + r.height + 14 < window.innerHeight - 170;
  const bubbleStyle = bubbleTop
    ? { top: r.top + r.height + 14, left: 16, right: 16 }
    : { bottom: Math.max(16, window.innerHeight - r.top + 14), left: 16, right: 16 };

  return (
    <div className="fixed inset-0 z-[120] pointer-events-none">
      <div className="absolute left-0 right-0 bg-black/70" style={{ top: 0, height: r.top }} />
      <div className="absolute left-0 right-0 bg-black/70" style={{ top: r.top + r.height, bottom: 0 }} />
      <div className="absolute bg-black/70" style={{ top: r.top, left: 0, width: r.left, height: r.height }} />
      <div className="absolute bg-black/70" style={{ top: r.top, left: r.left + r.width, right: 0, height: r.height }} />
      <div
        className="absolute rounded-2xl border border-brand-500/40"
        style={{
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          boxShadow: "0 0 0 1px rgba(15,143,111,0.25), 0 0 34px rgba(15,143,111,0.45)",
        }}
      />
      <div className="absolute pointer-events-auto rounded-2xl bg-white/[0.06] border border-white/[0.12] backdrop-blur-xl p-4 shadow-2xl shadow-black/60" style={bubbleStyle}>
        <p className="text-sm font-semibold text-ink leading-relaxed">{messages[step]}</p>
        <div className="flex items-center justify-between mt-4">
          <button type="button" onClick={onSkip} className="text-xs font-semibold text-ink-mute active:scale-[0.97] transition-all">Skip tour</button>
          <button type="button" onClick={onNext} className="px-4 py-2 rounded-full bg-brand-500 text-white text-xs font-bold active:scale-[0.97] transition-all">Next →</button>
        </div>
      </div>
    </div>
  );
}

function FullScreen({
  emoji,
  title,
  text,
  action,
  onAction,
  onSkip,
}: {
  emoji: string;
  title: string;
  text: string;
  action: string;
  onAction: () => void;
  onSkip?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center px-6 text-center animate-fade-in">
      <div className="max-w-sm">
        <div className="text-6xl mb-5">{emoji}</div>
        <h2 className="text-2xl font-black text-ink mb-3">{title}</h2>
        <p className="text-sm text-ink-mute leading-relaxed mb-7">{text}</p>
        <button type="button" onClick={onAction} className="w-full h-12 rounded-2xl bg-brand-500 text-white text-sm font-bold active:scale-[0.97] transition-all">
          {action}
        </button>
        {onSkip && (
          <button type="button" onClick={onSkip} className="mt-4 text-xs font-semibold text-ink-mute active:scale-[0.97] transition-all">
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
}
