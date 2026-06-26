"use client";

import { INTENTS } from "@/lib/intents";
import { SignalIcon, CheckIcon } from "./icons";

// A shared vibe is sent as a chat message whose content is this prefix
// followed by a JSON payload. Both chat renderers (Connect + Messages)
// detect it and render the card below instead of plain text — so a shared
// vibe arrives like an Instagram post share, not a sentence.
export const VIBE_PREFIX = "[[VIBE]]";

export interface SharedVibe {
  user_id?: string | null;
  name: string;
  username?: string;
  avatar_url?: string | null;
  college?: string;
  year?: number | null;
  verified?: boolean;
  intent: string;
  content: string;
}

export function encodeVibeShare(sig: any): string {
  const p = sig.profiles ?? sig;
  const payload: SharedVibe = {
    user_id: sig.user_id ?? p.id ?? null,
    name: p.name || "Someone",
    username: p.username || "",
    avatar_url: p.avatar_url || null,
    college: p.college || "",
    year: p.year ?? null,
    verified: !!p.verified,
    intent: sig.intent || "free",
    content: sig.content || "",
  };
  return VIBE_PREFIX + JSON.stringify(payload);
}

export function parseVibeShare(content: string): SharedVibe | null {
  if (!content || !content.startsWith(VIBE_PREFIX)) return null;
  try {
    return JSON.parse(content.slice(VIBE_PREFIX.length)) as SharedVibe;
  } catch {
    return null;
  }
}

export default function SharedVibeCard({
  vibe,
  onOpenProfile,
}: {
  vibe: SharedVibe;
  onOpenProfile?: (vibe: SharedVibe) => void;
}) {
  const intent = INTENTS.find((i) => i.id === vibe.intent) || INTENTS[0];
  const Icon = intent.icon;
  const initials = (vibe.name || "?")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onOpenProfile?.(vibe)}
      className="w-[240px] max-w-full text-left rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0f0f11] active:scale-[0.98] transition shadow-xl shadow-black/40"
    >
      {/* Accent strip in the intent colour */}
      <div className="h-0.5 w-full" style={{ backgroundColor: intent.color }} />

      <div className="p-3.5 space-y-2.5">
        {/* Sharer label */}
        <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-ink-mute">
          <SignalIcon className="w-3 h-3 text-brand-400" />
          <span>Shared a vibe</span>
        </div>

        {/* Person */}
        <div className="flex items-center gap-2.5">
          <img
            src={vibe.avatar_url && (vibe.avatar_url.startsWith("http") || vibe.avatar_url.startsWith("data:")) ? vibe.avatar_url : "/default_avatar.png"}
            alt={vibe.name}
            className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-ink truncate">{vibe.name}</span>
              {vibe.verified && (
                <span className="inline-flex items-center justify-center w-3 h-3 bg-brand-500 text-white rounded-full shrink-0">
                  <CheckIcon className="w-2 h-2" />
                </span>
              )}
            </div>
            <span
              className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold border"
              style={{ color: intent.color, borderColor: intent.color + "55" }}
            >
              <Icon className="w-2.5 h-2.5" />
              {intent.label}
            </span>
          </div>
        </div>

        {/* Vibe text */}
        <p className="text-[13px] text-ink font-semibold leading-snug">
          &ldquo;{vibe.content}&rdquo;
        </p>
        <p className="text-[9px] text-ink-mute mt-1.5">Tap to view profile →</p>
      </div>
    </button>
  );
}
