"use client";

import { XIcon } from "./icons";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-[440px] animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 bg-black/95 rounded-t-[32px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-fade-up max-h-[88vh] overflow-y-auto no-scrollbar border-t border-white/[0.08] shadow-2xl shadow-brand-500/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center text-ink-soft"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Ring({
  pct,
  size = 120,
  stroke = 10,
  color = "#7c3aed",
  track = "#262629",
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease", filter: `drop-shadow(0 0 6px ${color}aa)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3 mt-7">
      <h2 className="text-[15px] font-bold text-ink">{title}</h2>
      {action && (
        <button
          onClick={onAction}
          className="text-brand-300 text-sm font-semibold active:scale-95 transition"
        >
          {action}
        </button>
      )}
    </div>
  );
}

export function statusColor(status: "safe" | "warning" | "danger") {
  if (status === "danger") return { fg: "#ef4444", bg: "rgba(239,68,68,0.16)", label: "Below target" };
  if (status === "warning") return { fg: "#f59e0b", bg: "rgba(245,158,11,0.16)", label: "On the edge" };
  return { fg: "#7c3aed", bg: "rgba(124,58,237,0.20)", label: "Safe" };
}

export function triggerConfetti() {
  if (typeof window === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const colors = ["#7c3aed", "#3b82f6", "#f59e0b", "#ec4899", "#10b981"];
  const particles: any[] = [];

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height + 20,
      vx: (Math.random() - 0.5) * 15,
      vy: -Math.random() * 15 - 10,
      r: Math.random() * 4 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    });
  }

  function update() {
    if (!canvas.parentNode) return;
    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    let active = false;
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.rotationSpeed;

      if (p.y < canvas.height + 50) {
        active = true;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        ctx!.restore();
      }
    });

    if (active) {
      requestAnimationFrame(update);
    } else {
      document.body.removeChild(canvas);
    }
  }

  update();
}

function getAudioContext(): AudioContext {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  return new AudioContextClass();
}

export function playTick() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("footfall-student-demo-v1") || localStorage.getItem("footfall-student-data-v1");
    if (raw && JSON.parse(raw)?.profile?.soundEnabled === false) return;
  } catch {}

  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  } catch {}
}

export function playPop() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("footfall-student-demo-v1") || localStorage.getItem("footfall-student-data-v1");
    if (raw && JSON.parse(raw)?.profile?.soundEnabled === false) return;
  } catch {}

  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch {}
}

export function playChime() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("footfall-student-demo-v1") || localStorage.getItem("footfall-student-data-v1");
    if (raw && JSON.parse(raw)?.profile?.soundEnabled === false) return;
  } catch {}

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.04, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(523.25, now, 0.2); // C5
    playNote(659.25, now + 0.08, 0.25); // E5
  } catch {}
}

import { MouseEvent, useRef, useState } from "react";

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(124, 58, 237, 0.08)",
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      className={`relative overflow-hidden ${className}`}
    >
      {isFocused && (
        <div
          className="pointer-events-none absolute -inset-px rounded-[inherit] transition duration-300"
          style={{
            background: `radial-gradient(350px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 80%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}
