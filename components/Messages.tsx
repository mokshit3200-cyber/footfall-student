"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isDemo } from "@/lib/config";
import { INTENTS } from "@/lib/intents";
import {
  CheckIcon,
  EditIcon,
  SignalIcon,
  UserIcon,
  UserPlusIcon,
  SearchIcon,
  BellOffIcon,
  BellIcon,
  LockIcon,
  PaletteIcon,
  ClockIcon,
  SmileIcon,
  UsersIcon,
  ImageIcon,
  LinkIcon,
  FileIcon,
  BanIcon,
  AlertIcon,
  ShieldIcon,
  XIcon,
  ArrowLeftIcon,
  ChatIcon,
  DotsIcon,
  SendIcon,
  PinIcon,
  ChevronRight,
  PlusIcon,
  PaperclipIcon,
  TrashIcon,
  MailIcon,
  CoffeeIcon,
  BookIcon,
  HelpIcon,
  UsersGroupIcon,
  ConfettiIcon,
  TagIcon,
  CampusIcon,
  GlobeIcon,
  HandRaiseIcon
} from "./icons";

// ── TYPES & INTERFACES ────────────────────────────────────────────────────────
interface Peer {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  verified: boolean;
  is_online?: boolean;
  college?: string;
  course?: string;
  year?: number;
  signal?: string | null;
}

interface Convo {
  group_id: string;
  type: "dm" | "group";
  group_name?: string;
  peer?: Peer;
  members?: { id: string; name: string; username: string; avatar_url: string | null }[];
  last_message: string;
  last_at: string;
  unread: number;
  is_pinned?: boolean;
  is_muted?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  reactions?: { emoji: string; from: string }[];
  reply_to?: { sender_name: string; content: string } | null;
}

// ── THEME CONSTANTS ──────────────────────────────────────────────────────────
const THEMES = [
  { id: "default", name: "Default Emerald", color: "#0F8F6F", bgClass: "bg-[#0F8F6F]", dotColor: "bg-[#0F8F6F]" },
  { id: "ocean", name: "Ocean Blue", color: "#0ea5e9", bgClass: "bg-[#0ea5e9]", dotColor: "bg-[#0ea5e9]" },
  { id: "sunset", name: "Sunset Pink", color: "#f43f5e", bgClass: "bg-[#f43f5e]", dotColor: "bg-[#f43f5e]" },
  { id: "purple", name: "Royal Purple", color: "#8b5cf6", bgClass: "bg-[#8b5cf6]", dotColor: "bg-[#8b5cf6]" },
  { id: "mono", name: "Graphite Mono", color: "#3f3f46", bgClass: "bg-[#3f3f46]", dotColor: "bg-[#3f3f46]" },
  { id: "rose", name: "Rose Garden", color: "#db2777", bgClass: "bg-[#db2777]", dotColor: "bg-[#db2777]" },
] as const;



// ── DEMO CONSTANTS (as const) ─────────────────────────────────────────────────
const DEMO_CONVOS = [
  { 
    group_id: "dg1", 
    type: "dm", 
    peer: { 
      id: "dp1", 
      name: "Arjun Sharma", 
      username: "arjun_s", 
      avatar_url: null, 
      verified: true, 
      is_online: true, 
      college: "IIIT Hyderabad", 
      course: "B.Tech CSE", 
      year: 2, 
      signal: "DBMS grind rn 📚" 
    }, 
    last_message: "bro study group at 6?", 
    last_at: new Date(Date.now() - 900000).toISOString(), 
    unread: 2 
  },
  { 
    group_id: "dg2", 
    type: "group", 
    group_name: "Hackathon Squad", 
    members: [
      { id: "dp3", name: "Rohan Mehta", username: "rohanm", avatar_url: null },
      { id: "dp5", name: "Karan Patel", username: "karanp", avatar_url: null }
    ], 
    last_message: "when are we submitting?", 
    last_at: new Date(Date.now() - 3600000).toISOString(), 
    unread: 0 
  },
  { 
    group_id: "dg3", 
    type: "dm", 
    peer: { 
      id: "dp2", 
      name: "Priya Nair", 
      username: "priya.n", 
      avatar_url: null, 
      verified: false, 
      is_online: false, 
      college: "IIIT Hyderabad", 
      course: "B.Tech ECE", 
      year: 3, 
      signal: "anyone for chai at 4pm? ☕" 
    }, 
    last_message: "You: chai run tomorrow?", 
    last_at: new Date(Date.now() - 86400000).toISOString(), 
    unread: 0 
  },
] as const;

const DEMO_MESSAGES = {
  dg1: [
    { id: "m1", sender_id: "dp1", content: "hey! you free this evening?", created_at: new Date(Date.now() - 1800000).toISOString(), reactions: [] },
    { id: "m2", sender_id: "me", content: "yeah what's up", created_at: new Date(Date.now() - 1700000).toISOString(), reactions: [] },
    { id: "m3", sender_id: "dp1", content: "bro study group at 6?", created_at: new Date(Date.now() - 900000).toISOString(), reactions: [{ emoji: "❤️", from: "me" }] },
  ],
  dg2: [
    { id: "m4", sender_id: "dp3", content: "ok so who's doing the frontend?", created_at: new Date(Date.now() - 7200000).toISOString(), reactions: [] },
    { id: "m5", sender_id: "dp5", content: "I'll handle it", created_at: new Date(Date.now() - 7100000).toISOString(), reactions: [] },
    { id: "m6", sender_id: "me", content: "nice, I'll do the ML part", created_at: new Date(Date.now() - 7000000).toISOString(), reactions: [] },
    { id: "m7", sender_id: "dp3", content: "when are we submitting?", created_at: new Date(Date.now() - 3600000).toISOString(), reactions: [] },
  ],
  dg3: [
    { id: "m8", sender_id: "me", content: "chai run tomorrow?", created_at: new Date(Date.now() - 86400000).toISOString(), reactions: [] },
  ],
} as const;

const DEMO_FREQUENCY = [
  { id: "dp1", name: "Arjun", signal: "DBMS grind rn 📚", avatar_url: null, status: "study" },
  { id: "dp2", name: "Priya", signal: "anyone for chai at 4pm? ☕", avatar_url: null, status: "free" },
  { id: "dp5", name: "Karan", signal: "anyone explain OS scheduling? exam tomorrow 🙏", avatar_url: null, status: "help" },
] as const;

const DEMO_SEARCH_PEOPLE = [
  { id: "dp1", name: "Arjun Sharma", username: "arjun_s", avatar_url: null },
  { id: "dp2", name: "Priya Nair", username: "priya.n", avatar_url: null },
  { id: "dp3", name: "Rohan Mehta", username: "rohanm", avatar_url: null },
  { id: "dp4", name: "Sneha Rao", username: "sneha.r", avatar_url: null },
  { id: "dp5", name: "Karan Patel", username: "karanp", avatar_url: null },
] as const;

// ── UTILS ────────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) {
    return new Date(iso).toLocaleDateString([], { weekday: "short" });
  }
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function shouldShowTimeDivider(prev: string, curr: string): boolean {
  const diff = new Date(curr).getTime() - new Date(prev).getTime();
  return diff > 5 * 60 * 1000;
}

function formatDividerTime(isoString: string): string {
  const d = new Date(isoString);
  const today = new Date();
  const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today ${timeStr}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${timeStr}`;
}

function parseMessageContent(rawContent: string): { replyQuote: { sender_name: string; content: string } | null; cleanContent: string } {
  const replyRegex = /^> \[Reply to ([^\]]+)\]:\s*([\s\S]+?)\n\n([\s\S]*)$/;
  const match = rawContent.match(replyRegex);
  if (match) {
    return {
      replyQuote: { sender_name: match[1], content: match[2] },
      cleanContent: match[3],
    };
  }
  return { replyQuote: null, cleanContent: rawContent };
}

// ── NoteBubble — Instagram-style readable note above a Frequency avatar ───────
function NoteBubble({ text, placeholder }: { text?: string | null; placeholder?: string }) {
  const real = !!(text && text.trim());
  const content = real ? text!.trim() : placeholder || "";
  if (!content) {
    // keep vertical rhythm so avatars stay aligned even with no note
    return <div className="h-[30px] shrink-0" aria-hidden />;
  }
  return (
    <div className="flex flex-col items-center shrink-0">
      <div
        className={`max-w-[76px] px-2.5 py-1 rounded-2xl text-[9.5px] leading-snug text-center ${
          real ? "bg-[#262626] text-ink" : "bg-white/[0.04] text-ink-mute border border-dashed border-white/15"
        }`}
        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}
      >
        {content}
      </div>
      {/* tail */}
      <div className={`w-1.5 h-1.5 rounded-full mt-[2px] ${real ? "bg-[#262626]" : "bg-white/[0.06]"}`} />
      <div className={`w-1 h-1 rounded-full mt-[1px] ${real ? "bg-[#262626]" : "bg-white/[0.06]"}`} />
    </div>
  );
}

function getExpiresAt(duration: "1h" | "4h" | "today"): Date {
  const now = new Date();
  if (duration === "1h") {
    return new Date(now.getTime() + 60 * 60 * 1000);
  } else if (duration === "4h") {
    return new Date(now.getTime() + 4 * 60 * 60 * 1000);
  } else {
    // today = end of day (23:59:59)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return endOfDay;
  }
}

// ── SignalEditorSheet — Bottom Sheet Broadcast Composer ───────────────────
function SignalEditorSheet({
  open,
  initialText,
  initialIntent,
  initialReach,
  onClose,
  onSave,
  onClear,
  profile,
  demo,
}: {
  open: boolean;
  initialText: string;
  initialIntent: string | null;
  initialReach: "campus" | "all";
  onClose: () => void;
  onSave: (text: string, intent: string, reach: "campus" | "all", duration: "1h" | "4h" | "today") => void;
  onClear: () => void;
  profile: any;
  demo: boolean;
}) {
  const [broadcastInput, setBroadcastInput] = useState(initialText);
  const [broadcastIntent, setBroadcastIntent] = useState<string>(initialIntent || "free");
  const [broadcastReach, setBroadcastReach] = useState<"campus" | "all">(initialReach);
  const [broadcastDuration, setBroadcastDuration] = useState<"1h" | "4h" | "today">("4h");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setBroadcastInput(initialText);
      setBroadcastIntent(initialIntent || "free");
      setBroadcastReach(initialReach);
      setBroadcastDuration("4h");
    }
  }, [open, initialText, initialIntent, initialReach]);

  // Lock reach selector to campus if free intent is selected
  useEffect(() => {
    if (broadcastIntent === "free") {
      setBroadcastReach("campus");
    }
  }, [broadcastIntent]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-fade-in flex items-end">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 pb-8 max-h-[90vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between mb-5 border-b border-white/[0.05] pb-3 select-none">
          <h2 className="font-bold text-base text-ink flex items-center gap-2">
            <SignalIcon className="w-5 h-5 text-brand-400 animate-pulse" />
            <span>What's your vibe?</span>
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-white"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="mb-5 select-none">
          <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wider block mb-2">Live Card Preview</label>
          {(() => {
            const intentInfo = INTENTS.find(i => i.id === broadcastIntent) || INTENTS[0];
            const PreviewIcon = intentInfo.icon;
            const initials = (profile?.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div className="w-full bg-[#141416] border border-white/[0.08] rounded-3xl p-5 relative text-left text-white">
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.name} className="w-10 h-10 rounded-full object-cover border border-white/10" style={{ borderColor: intentInfo.color }} />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-brand-500/20 text-brand-300 border-2" style={{ borderColor: intentInfo.color }}>
                        {initials}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-500 rounded-full border-2 border-black flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <span className="font-bold text-ink text-sm truncate">{profile?.name || "Me"}</span>
                      {profile?.verified && (
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px]">
                          <CheckIcon className="w-2.5 h-2.5" />
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border" style={{ borderColor: `${intentInfo.color}30`, color: intentInfo.color, backgroundColor: `${intentInfo.color}10` }}>
                        <PreviewIcon className="w-3 h-3" />
                        <span>{intentInfo.label}</span>
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-ink leading-relaxed break-words">
                      {broadcastInput.trim() ? `"${broadcastInput}"` : `"What's your vibe right now?"`}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-ink-mute mt-2">
                      <p>{profile?.course || "Student"} · Y{profile?.year || 1}</p>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5 opacity-60" />
                        <span>{broadcastDuration === "1h" ? "1h left" : broadcastDuration === "4h" ? "4h left" : "today"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Note input */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wide">Your vibe</label>
            <span className={`text-[10px] ${broadcastInput.length >= 80 ? "text-red-400 font-bold" : "text-ink-mute"}`}>
              {broadcastInput.length}/80
            </span>
          </div>
          <textarea
            maxLength={80}
            placeholder="What are you up to? e.g. DBMS grind in library, anyone free?"
            value={broadcastInput}
            onChange={(e) => setBroadcastInput(e.target.value)}
            rows={2}
            className="input w-full text-sm resize-none rounded-2xl bg-[#161618] border border-white/[0.08] p-3 text-white placeholder-white/30 focus:border-brand-500/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Intent Picker */}
        <div className="mb-5">
          <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wide block mb-2.5">Choose Intent</label>
          <div className="grid grid-cols-3 gap-2">
            {INTENTS.map((intent) => {
              const Icon = intent.icon;
              const active = broadcastIntent === intent.id;
              return (
                <button
                  key={intent.id}
                  type="button"
                  onClick={() => setBroadcastIntent(intent.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-200 active:scale-95 ${
                    active
                      ? "text-white font-bold border-transparent"
                      : "border-white/[0.06] bg-white/[0.02] text-ink-mute hover:bg-white/[0.04]"
                  }`}
                  style={active ? { backgroundColor: intent.color } : {}}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-[10px] truncate max-w-full">{intent.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reach segmented picker */}
        <div className="mb-5">
          <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wide block mb-2">Reach</label>
          {broadcastIntent === "free" ? (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3 flex items-center justify-between text-xs text-ink-soft select-none">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <CampusIcon className="w-4 h-4" />
                <span>My Campus (Locked)</span>
              </span>
              <span className="text-[10px] text-ink-mute">"Free now" is inherently local</span>
            </div>
          ) : (
            <div className="flex bg-white/[0.03] border border-white/[0.05] rounded-2xl p-1">
              {(["campus", "all"] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setBroadcastReach(r)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                    broadcastReach === r
                      ? "bg-brand-500 text-white shadow-md"
                      : "text-ink-soft hover:bg-white/[0.02]"
                  }`}
                >
                  {r === "campus" ? (
                    <>
                      <CampusIcon className="w-3.5 h-3.5" />
                      <span>My Campus</span>
                    </>
                  ) : (
                    <>
                      <GlobeIcon className="w-3.5 h-3.5" />
                      <span>All Campuses</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Duration picker */}
        <div className="mb-6">
          <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wide block mb-2">Duration</label>
          <div className="flex bg-white/[0.03] border border-white/[0.05] rounded-2xl p-1">
            {(["1h", "4h", "today"] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setBroadcastDuration(d)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                  broadcastDuration === d
                    ? "bg-brand-500 text-white shadow-md"
                    : "text-ink-soft hover:bg-white/[0.02]"
                }`}
              >
                <ClockIcon className="w-3.5 h-3.5" />
                <span>{d === "1h" ? "1 Hour" : d === "4h" ? "4 Hours" : "Today"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {initialText && (
            <button
              type="button"
              onClick={() => {
                onClear();
                onClose();
              }}
              className="flex-1 h-12 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold active:scale-95 transition-all flex items-center justify-center"
            >
              Clear Signal
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`h-12 rounded-2xl bg-white/[0.06] text-ink-soft hover:bg-white/10 active:scale-95 transition-all text-xs font-bold ${initialText ? "px-6" : "flex-1"}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(broadcastInput, broadcastIntent, broadcastReach, broadcastDuration);
            }}
            disabled={saving || !broadcastInput.trim()}
            className="flex-[2] h-12 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 active:scale-95 transition-all text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-brand-500/15"
          >
            {saving ? "Broadcasting…" : (
              <>
                <span>Broadcast vibe</span>
                <SignalIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function Messages({
  onChatOpen,
  onSwitchTab,
}: {
  onChatOpen?: (open: boolean) => void;
  onSwitchTab?: (tab: string) => void;
}) {
  const { user, profile } = useAuth();
  const demo = isDemo();

  // Convo List States
  const [convos, setConvos] = useState<any[]>([]);
  const [loading, setLoading] = useState(!demo);
  const [search, setSearch] = useState("");
  const [selectedConvo, setSelectedConvo] = useState<any | null>(null);

  // Active DM State
  const [activeDmId, setActiveDmId] = useState<string | null>(null);
  const [activePeer, setActivePeer] = useState<any | null>(null);
  const [activeGroupMembers, setActiveGroupMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [replyToMsg, setReplyToMsg] = useState<any | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Chat Info Polish States
  const [activeThemeBgClass, setActiveThemeBgClass] = useState("bg-brand-500");
  const [disappearingMode, setDisappearingMode] = useState("off");
  const [nicknameTrigger, setNicknameTrigger] = useState(0);

  const getNickname = (userId: string, defaultName: string, groupId: string | null) => {
    const _ = nicknameTrigger;
    if (!groupId) return defaultName;
    return localStorage.getItem(`chat_nickname_${groupId}_${userId}`) || defaultName;
  };

  // Frequency Strip State
  const [mySignal, setMySignal] = useState("");
  const [myStatus, setMyStatus] = useState<string | null>(null); // maps to intent
  const [mySignalReach, setMySignalReach] = useState<"campus" | "all">("campus");
  const [editSignalOpen, setEditSignalOpen] = useState(false);
  const [signals, setSignals] = useState<any[]>([]);

  // Composer sheet states inside Messages
  const [broadcastInput, setBroadcastInput] = useState("");
  const [broadcastIntent, setBroadcastIntent] = useState<string>("free");
  const [broadcastReach, setBroadcastReach] = useState<"campus" | "all">("campus");
  const [broadcastDuration, setBroadcastDuration] = useState<"1h" | "4h" | "today">("4h");
  const [saving, setSaving] = useState(false);

  // Message Requests UI State
  const [viewRequestsScreen, setViewRequestsScreen] = useState(false);

  // Sheets Open State
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<any | null>(null);
  const [chatInfoOpen, setChatInfoOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [actionsConvo, setActionsConvo] = useState<any | null>(null);

  // Compose State
  const [people, setPeople] = useState<any[]>([]);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<any[]>([]);
  const [groupName, setGroupName] = useState("");

  // ── Load Signals & Conversations ───────────────────────────────────────────
  useEffect(() => {
    if (demo) {
      // Load base demo convos
      const baseConvos = [...DEMO_CONVOS];
      
      // Load demo requests that we want to seed (unless they are already acted upon in localStorage)
      const seedRequestsDone = localStorage.getItem("demo_requests_seeded");
      if (!seedRequestsDone) {
        const demoRequests = [
          {
            group_id: "dg-req-1",
            type: "dm",
            peer: {
              id: "dp_req1",
              name: "Sneha Rao",
              username: "sneha.r",
              avatar_url: null,
              verified: true,
              is_online: true,
              college: "BITS Pilani Hyd",
              course: "MBA",
              year: 2
            },
            last_message: "✋ raised a hand on vibe: 'selling keychron k2'",
            last_at: new Date(Date.now() - 600000).toISOString(),
            unread: 1,
            request_status: "pending",
            requested_by: "dp_req1",
            origin_signal_note: "selling brand new mechanical keyboard, keychron k2, ping if interested!"
          },
          {
            group_id: "dg-req-2",
            type: "dm",
            peer: {
              id: "dp_req2",
              name: "Rohan Mehta",
              username: "rohanm",
              avatar_url: null,
              verified: false,
              is_online: false,
              college: "Osmania University",
              course: "B.Com",
              year: 1
            },
            last_message: "hey, can you help with coding?",
            last_at: new Date(Date.now() - 1800000).toISOString(),
            unread: 1,
            request_status: "pending",
            requested_by: "dp_req2",
            origin_signal_note: "anyone explain OS scheduling? exam tomorrow 🙏"
          }
        ];
        
        // Put in localStorage groups
        const curGroups = JSON.parse(localStorage.getItem("demo_groups") || "[]");
        const merged = [...curGroups];
        for (const req of demoRequests) {
          if (!merged.some(g => g.group_id === req.group_id)) {
            merged.push(req);
          }
        }
        localStorage.setItem("demo_groups", JSON.stringify(merged));
        localStorage.setItem("demo_requests_seeded", "true");
      }
      
      const localGroups = JSON.parse(localStorage.getItem("demo_groups") || "[]");
      
      // Merge localGroups into baseConvos (localGroups overrides baseConvos)
      const mergedList = [...baseConvos];
      for (const lg of localGroups) {
        const idx = mergedList.findIndex(c => c.group_id === lg.group_id);
        if (idx !== -1) {
          mergedList[idx] = lg;
        } else {
          mergedList.unshift(lg); // new local groups at top
        }
      }
      
      setConvos(mergedList);
      setSignals([...DEMO_FREQUENCY]);
      setMySignal("");
      setLoading(false);
      return;
    }
    if (!user) return;
    loadConvos();
    loadLiveSignals();
  }, [user]);

  async function loadConvos() {
    setLoading(true);
    try {
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user!.id);

      if (!memberships?.length) {
        setConvos([]);
        setLoading(false);
        return;
      }
      const groupIds = memberships.map((m: any) => m.group_id);

      const { data: allMembers } = await supabase
        .from("group_members")
        .select("group_id, user_id, role, joined_at, profiles(id, name, username, avatar_url, verified, college, course, year, bio, links)")
        .in("group_id", groupIds);

      const { data: lastMsgs } = await supabase
        .from("messages")
        .select("group_id, content, created_at, sender_id")
        .in("group_id", groupIds)
        .order("created_at", { ascending: false });

      const { data: groupsInfo } = await supabase
        .from("groups")
        .select("id, name, type, avatar, request_status, requested_by, origin_signal_id, signals(content)")
        .in("id", groupIds);

      const lastByGroup: Record<string, any> = {};
      for (const m of lastMsgs ?? []) {
        if (!lastByGroup[m.group_id]) lastByGroup[m.group_id] = m;
      }

      const groupsMap = Object.fromEntries((groupsInfo ?? []).map(g => [g.id, g]));

      // Group by group_id
      const membersByGroup: Record<string, any[]> = {};
      for (const m of allMembers ?? []) {
        if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = [];
        membersByGroup[m.group_id].push(m);
      }

      const list = Object.keys(membersByGroup).map((gid) => {
        const groupInfo = groupsMap[gid];
        const groupMembers = membersByGroup[gid];
        const isGroup = groupInfo?.type === "group";
        
        const signalObj = (groupInfo?.signals as any);
        const signalContent = Array.isArray(signalObj) ? signalObj[0]?.content : signalObj?.content;

        if (isGroup) {
          const others = groupMembers.filter(m => m.user_id !== user!.id).map(m => m.profiles);
          return {
            group_id: gid,
            type: "group",
            group_name: groupInfo.name || "Group Chat",
            members: others,
            last_message: lastByGroup[gid]?.content ?? "",
            last_at: lastByGroup[gid]?.created_at ?? groupInfo.created_at ?? new Date().toISOString(),
            unread: 0,
            request_status: groupInfo?.request_status ?? "accepted",
            requested_by: groupInfo?.requested_by,
          };
        } else {
          const peer = groupMembers.find(m => m.user_id !== user!.id)?.profiles;
          return {
            group_id: gid,
            type: "dm",
            peer: peer,
            last_message: lastByGroup[gid]?.content ?? "",
            last_at: lastByGroup[gid]?.created_at ?? new Date().toISOString(),
            unread: 0,
            request_status: groupInfo?.request_status ?? "accepted",
            requested_by: groupInfo?.requested_by,
            origin_signal_id: groupInfo?.origin_signal_id,
            origin_signal_note: signalContent || null,
          };
        }
      }).sort((a: any, b: any) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());

      setConvos(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadLiveSignals() {
    if (!profile?.college) return;
    try {
      const { data } = await supabase
        .from("signals")
        .select("*, profiles!signals_user_id_fkey(id,name,username,avatar_url,verified,college,course,year)")
        .gt("expires_at", new Date().toISOString())
        .eq("reach", "campus")
        .neq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);

      const signalsList = (data ?? []).map((s: any) => {
        const p = s.profiles;
        return {
          id: s.id,
          user_id: s.user_id,
          name: p?.name?.split(" ")[0] || "Student",
          signal: s.content,
          intent: s.intent,
          avatar_url: p?.avatar_url,
          peer: p,
          status: s.intent // Map sig.status to s.intent for top strip ring helper
        };
      });

      // load my own current signal
      const me = await supabase
        .from("signals")
        .select("content, intent, reach")
        .eq("user_id", user!.id)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (me.data) {
        setMySignal(me.data.content);
        setMyStatus(me.data.intent);
        setMySignalReach(me.data.reach as "campus" | "all");
      } else {
        setMySignal("");
        setMyStatus(null);
        setMySignalReach("campus");
      }

      setSignals(signalsList);
    } catch (err) {
      console.error(err);
    }
  }

  // ── Unified Broadcast Composer handlers ──────────────────────────────────────
  async function handleSaveSignal(txt: string, intent: string, reach: "campus" | "all", duration: "1h" | "4h" | "today") {
    const text = txt.trim();
    if (!text) return;
    setSaving(true);
    
    const expiresAt = getExpiresAt(duration);
    
    if (demo) {
      setMySignal(text);
      setMyStatus(intent);
      setMySignalReach(reach);
      setEditSignalOpen(false);
      setSaving(false);
      return;
    }
    
    const expiresAtIso = expiresAt.toISOString();
    await supabase.from("signals").upsert({ 
      user_id: user!.id, 
      content: text, 
      intent: intent,
      reach: reach,
      expires_at: expiresAtIso 
    }, { onConflict: "user_id" });
    
    setMySignal(text);
    setMyStatus(intent);
    setMySignalReach(reach);
    
    setEditSignalOpen(false);
    setSaving(false);
    
    loadLiveSignals();
  }

  async function handleClearSignal() {
    if (demo) {
      setMySignal("");
      setMyStatus(null);
      setMySignalReach("campus");
      setEditSignalOpen(false);
      return;
    }
    await supabase.from("signals").delete().eq("user_id", user!.id);
    setMySignal("");
    setMyStatus(null);
    setMySignalReach("campus");
    setEditSignalOpen(false);
    loadLiveSignals();
  }

  // ── Message Requests Handlers ────────────────────────────────────────────────
  async function handleAcceptRequest(groupId: string) {
    if (demo) {
      const updated = convos.map(c => {
        if (c.group_id === groupId) {
          return { ...c, request_status: "accepted" as const };
        }
        return c;
      });
      setConvos(updated);
      
      const localGroups = JSON.parse(localStorage.getItem("demo_groups") || "[]");
      localStorage.setItem("demo_groups", JSON.stringify(localGroups.map((g: any) => {
        if (g.group_id === groupId) {
          return { ...g, request_status: "accepted" };
        }
        return g;
      })));
      return;
    }
    
    try {
      const { error } = await supabase
        .from("groups")
        .update({ request_status: "accepted" })
        .eq("id", groupId);
      if (error) {
        alert("Error accepting request: " + error.message);
      } else {
        loadConvos();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeclineRequest(groupId: string) {
    if (demo) {
      setConvos(prev => prev.filter(c => c.group_id !== groupId));
      
      const localGroups = JSON.parse(localStorage.getItem("demo_groups") || "[]");
      localStorage.setItem("demo_groups", JSON.stringify(localGroups.filter((g: any) => g.group_id !== groupId)));
      return;
    }
    
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user!.id);
      if (error) {
        alert("Error declining request: " + error.message);
      } else {
        loadConvos();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleBlockRequest(groupId: string) {
    const blocked = JSON.parse(localStorage.getItem("blocked_groups") || "[]");
    if (!blocked.includes(groupId)) {
      blocked.push(groupId);
      localStorage.setItem("blocked_groups", JSON.stringify(blocked));
    }
    setConvos(prev => prev.filter(c => c.group_id !== groupId));
  }

  // ── Open Chat View ─────────────────────────────────────────────────────────
  function handleOpenChat(convo: any) {
    setSelectedConvo(convo);
    setActiveDmId(convo.group_id);
    onChatOpen?.(true);

    if (convo.type === "dm") {
      setActivePeer(convo.peer);
      setActiveGroupMembers([]);
    } else {
      setActivePeer(null);
      setActiveGroupMembers(convo.members || []);
    }

    // Load Chat Settings from LocalStorage
    const savedTheme = localStorage.getItem(`chat_theme_${convo.group_id}`);
    const foundTheme = THEMES.find(t => t.id === savedTheme);
    setActiveThemeBgClass(foundTheme ? foundTheme.bgClass : "bg-brand-500");

    const savedDisappearing = localStorage.getItem(`chat_disappearing_${convo.group_id}`) || "off";
    setDisappearingMode(savedDisappearing);

    if (demo) {
      const localMsgs = JSON.parse(localStorage.getItem(`demo_messages_${convo.group_id}`) || "null");
      const baseMsgs = DEMO_MESSAGES[convo.group_id as keyof typeof DEMO_MESSAGES] ?? [];
      const finalMsgs = localMsgs || baseMsgs.map(m => ({
        id: m.id,
        sender_id: m.sender_id,
        content: m.content,
        created_at: m.created_at,
        reactions: m.reactions ? [...m.reactions] as { emoji: string; from: string }[] : [],
        reply_to: null
      }));
      setMessages(finalMsgs);
      
      if (!localMsgs && baseMsgs.length > 0) {
        localStorage.setItem(`demo_messages_${convo.group_id}`, JSON.stringify(finalMsgs));
      }
      
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 50);
      return;
    }

    setMsgLoading(true);
    supabase.from("messages")
      .select("*")
      .eq("group_id", convo.group_id)
      .order("created_at")
      .then(({ data }) => {
        setMessages(data ?? []);
        setMsgLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });
  }

  // ── Realtime Message Setup ─────────────────────────────────────────────────
  useEffect(() => {
    if (!activeDmId || demo) return;

    const channel = supabase
      .channel(`msgs-${activeDmId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${activeDmId}` }, (payload) => {
        setMessages((prev) => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as Message];
        });
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeDmId]);

  // ── Send Message ───────────────────────────────────────────────────────────
  async function handleSend() {
    if (!msgInput.trim() || !activeDmId) return;
    const content = msgInput.trim();
    setMsgInput("");

    let finalContent = content;
    if (replyToMsg) {
      const senderName = replyToMsg.sender_id === "me" || replyToMsg.sender_id === user?.id 
        ? getNickname("me", "You", activeDmId) 
        : (activePeer ? getNickname(activePeer.id, activePeer.name, activeDmId) : "Student");
      finalContent = `> [Reply to ${senderName}]: ${replyToMsg.content}\n\n${content}`;
      setReplyToMsg(null);
    }

    if (demo) {
      const fakeMsg: Message = {
        id: `m-fake-${Date.now()}`,
        sender_id: "me",
        content: finalContent,
        created_at: new Date().toISOString(),
        reactions: [],
      };
      
      const savedMsgs = JSON.parse(localStorage.getItem(`demo_messages_${activeDmId}`) || "[]");
      const updatedMsgs = [...savedMsgs, fakeMsg];
      localStorage.setItem(`demo_messages_${activeDmId}`, JSON.stringify(updatedMsgs));
      
      setMessages(updatedMsgs);
      
      const updatedConvos = convos.map(c => {
        if (c.group_id === activeDmId) {
          return { ...c, last_message: `You: ${content}`, last_at: new Date().toISOString() };
        }
        return c;
      });
      setConvos(updatedConvos);
      
      const localGroups = JSON.parse(localStorage.getItem("demo_groups") || "[]");
      localStorage.setItem("demo_groups", JSON.stringify(localGroups.map((g: any) => {
        if (g.group_id === activeDmId) {
          return { ...g, last_message: `You: ${content}`, last_at: new Date().toISOString() };
        }
        return g;
      })));

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      return;
    }

    // Insert to Supabase
    try {
      const { data } = await supabase
        .from("messages")
        .insert({
          group_id: activeDmId,
          sender_id: user!.id,
          content: finalContent,
          type: "text",
        })
        .select();

      if (data?.[0]) {
        setMessages(prev => prev.some(m => m.id === data[0].id) ? prev : [...prev, data[0]]);
        loadConvos(); // Refresh convo list last message
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ── Reaction Handler ───────────────────────────────────────────────────────
  function handleToggleReaction(msgId: string, emoji: string) {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const reactions = m.reactions || [];
      const exists = reactions.some(r => r.emoji === emoji && r.from === "me");
      const updated = exists
        ? reactions.filter(r => !(r.emoji === emoji && r.from === "me"))
        : [...reactions, { emoji, from: "me" }];
      return { ...m, reactions: updated };
    }));
  }

  // ── Compose Fetch Users ───────────────────────────────────────────────────
  useEffect(() => {
    if (!composeOpen) return;
    if (demo) {
      setPeople([...DEMO_SEARCH_PEOPLE]);
      return;
    }
    if (!profile?.college) return;
    supabase
      .from("profiles")
      .select("id, name, username, avatar_url, verified, college, course, year, bio, links")
      .eq("college", profile.college)
      .neq("id", user!.id)
      .limit(30)
      .then(({ data }) => {
        if (data) setPeople(data);
      });
  }, [composeOpen]);

  // Filter Compose users
  const filteredComposePeople = people.filter(p => {
    const q = peopleSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.username || "").toLowerCase().includes(q);
  });

  // ── Create Conversation Group/DM ───────────────────────────────────────────
  async function handleCreateChat() {
    if (selectedPeople.length === 0) return;

    if (demo) {
      const isGroup = selectedPeople.length >= 2;
      const newGroupId = `dg-fake-${Date.now()}`;
      const fakeConvo = isGroup
        ? {
            group_id: newGroupId,
            type: "group" as const,
            group_name: groupName.trim() || selectedPeople.map(p => p.name.split(" ")[0]).join(", "),
            members: selectedPeople,
            last_message: "Chat created",
            last_at: new Date().toISOString(),
            unread: 0,
          }
        : {
            group_id: newGroupId,
            type: "dm" as const,
            peer: selectedPeople[0],
            last_message: "Chat created",
            last_at: new Date().toISOString(),
            unread: 0,
          };

      setConvos(prev => [fakeConvo, ...prev]);
      setComposeOpen(false);
      setSelectedPeople([]);
      setGroupName("");
      handleOpenChat(fakeConvo);
      return;
    }

    // Live mode chat creation
    try {
      const isGroup = selectedPeople.length >= 2;
      if (!isGroup) {
        // RPC DM helper or regular inserts
        const classmate = selectedPeople[0];
        const { data: newGroupId, error } = await supabase.rpc("create_dm", { other_user_id: classmate.id });
        if (error) {
          alert("Error creating DM: " + error.message);
        } else if (newGroupId) {
          // Query follows table for robust mutual follow check
          const [{ data: outFollow }, { data: inFollow }] = await Promise.all([
            supabase.from("follows").select("status").eq("follower_id", user!.id).eq("following_id", classmate.id).maybeSingle(),
            supabase.from("follows").select("status").eq("following_id", user!.id).eq("follower_id", classmate.id).maybeSingle()
          ]);
          const isMutual = outFollow?.status === "accepted" && inFollow?.status === "accepted";
          const requestStatus = isMutual ? 'accepted' : 'pending';

          await supabase.from("groups").update({
            request_status: requestStatus,
            requested_by: user!.id
          }).eq("id", newGroupId);

          setComposeOpen(false);
          setSelectedPeople([]);
          loadConvos().then(() => {
            const created = {
              group_id: newGroupId,
              type: "dm" as const,
              peer: classmate,
              last_message: "",
              last_at: new Date().toISOString(),
              unread: 0,
            };
            handleOpenChat(created);
          });
        }
      } else {
        // Group creation
        const { data: group, error: gpErr } = await supabase
          .from("groups")
          .insert({
            name: groupName.trim() || selectedPeople.map(p => p.name.split(" ")[0]).join(", "),
            type: "group",
            college: profile?.college,
            created_by: user!.id,
          })
          .select()
          .single();

        if (gpErr || !group) {
          alert("Error creating group");
          return;
        }

        // Add memberships
        const memberships = [
          { group_id: group.id, user_id: user!.id, role: "admin" },
          ...selectedPeople.map(p => ({ group_id: group.id, user_id: p.id, role: "member" }))
        ];

        const { error: memErr } = await supabase.from("group_members").insert(memberships);
        if (memErr) {
          console.error(memErr);
        }

        setComposeOpen(false);
        setSelectedPeople([]);
        setGroupName("");
        loadConvos().then(() => {
          const created = {
            group_id: group.id,
            type: "group" as const,
            group_name: group.name,
            members: selectedPeople,
            last_message: "",
            last_at: new Date().toISOString(),
            unread: 0,
          };
          handleOpenChat(created);
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  const mainConvos = convos.filter(c => {
    const blockedList = JSON.parse(localStorage.getItem("blocked_groups") || "[]");
    if (blockedList.includes(c.group_id)) return false;

    // Filter out pending requests that you didn't initiate
    if (c.request_status === 'pending' && c.requested_by !== (user?.id || "me")) {
      return false;
    }
    return true;
  });

  const incomingRequests = convos.filter(c => {
    const blockedList = JSON.parse(localStorage.getItem("blocked_groups") || "[]");
    if (blockedList.includes(c.group_id)) return false;

    return c.request_status === 'pending' && c.requested_by !== (user?.id || "me");
  });

  const filteredConvos = mainConvos.filter(c => {
    const q = search.toLowerCase();
    if (c.type === "dm") {
      const peerDisplayName = c.peer ? getNickname(c.peer.id, c.peer.name, c.group_id) : "";
      return peerDisplayName.toLowerCase().includes(q) || (c.peer?.username || "").toLowerCase().includes(q);
    }
    return (c.group_name || "").toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-2xl mx-auto border-x border-white/[0.04]">
      {/* SCREEN 1 — INBOX (default view) */}
      {!activeDmId && !viewRequestsScreen && (
        <div className="flex flex-col flex-1 pb-28 pt-8 px-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-ink">Messages</h1>
            <button
              onClick={() => setComposeOpen(true)}
              className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center transition active:scale-95 shrink-0"
            >
              <EditIcon className="w-5 h-5 text-ink" />
            </button>
          </div>

          {/* Frequency signals horizontal row */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pt-2 pb-3.5 mb-2 shrink-0 border-b border-white/[0.04]" style={{ scrollbarWidth: "none" }}>
            {/* My signal */}
            {(() => {
              const myIntentInfo = INTENTS.find(i => i.id === myStatus) || null;
              const ringStyle = myIntentInfo
                ? { boxShadow: `0 0 0 2px #000, 0 0 0 4px ${myIntentInfo.color}` }
                : undefined;
              return (
                <div className="flex flex-col items-center gap-1.5 shrink-0 w-[76px]">
                  {/* Note bubble */}
                  <NoteBubble text={mySignal} placeholder="Set a vibe" />
                  {/* Avatar */}
                  <button
                    onClick={() => {
                      setBroadcastInput(mySignal ?? "");
                      setBroadcastIntent(myStatus ?? "free");
                      setBroadcastReach(mySignalReach);
                      setBroadcastDuration("4h");
                      setEditSignalOpen(true);
                    }}
                    className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition shrink-0"
                    style={ringStyle}
                  >
                    <div className="w-full h-full rounded-full bg-white/[0.05] border border-white/[0.12] flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Me" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-[15px] font-bold text-brand-300">
                          {profile?.name?.[0]?.toUpperCase() || "?"}
                        </span>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-brand-500 rounded-full border-2 border-black flex items-center justify-center text-white">
                      <PlusIcon className="w-2.5 h-2.5" />
                    </span>
                  </button>
                  {/* Status label */}
                  <span className={`text-[10px] font-semibold text-center leading-tight ${myIntentInfo ? "" : "text-ink-mute"}`} style={myIntentInfo ? { color: myIntentInfo.color } : {}}>
                    {myIntentInfo ? myIntentInfo.label : "You"}
                  </span>
                </div>
              );
            })()}

            {/* Other signals */}
            {signals.map((sig) => {
              const intentInfo = INTENTS.find(i => i.id === sig.status) || INTENTS[0];
              const ringStyle = { boxShadow: `0 0 0 2px #000, 0 0 0 4px ${intentInfo.color}` };
              return (
                <button
                  key={sig.id}
                  onClick={() => {
                    setProfileUser(sig.peer || sig);
                    setProfileSheetOpen(true);
                  }}
                  className="flex flex-col items-center gap-1.5 shrink-0 w-[76px] active:scale-95 transition"
                >
                  {/* Note bubble */}
                  <NoteBubble text={sig.signal} />
                  {/* Avatar with status ring */}
                  <div
                    className="relative w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                    style={ringStyle}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                      {sig.avatar_url ? (
                        <img src={sig.avatar_url} alt={sig.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-base">
                          {sig.name[0]}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Name + status */}
                  <span className="text-[10px] font-semibold text-ink-soft truncate max-w-[72px] text-center leading-tight">
                    {sig.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative mb-5 mt-2">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              <SearchIcon className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-transparent focus:border-white/10 rounded-full py-2.5 pl-10 pr-4 text-xs text-ink focus:outline-none transition"
            />
          </div>

          {/* Message Requests Row Entry Point */}
          {incomingRequests.length > 0 && (
            <button
              onClick={() => setViewRequestsScreen(true)}
              className="w-full flex items-center justify-between py-3 px-4 mb-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/15 active:scale-[0.98] transition-all select-none"
            >
              <div className="flex items-center gap-2">
                <MailIcon className="w-4 h-4 text-brand-400" />
                <span className="text-sm font-bold text-ink">Message Requests</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-extrabold">
                  {incomingRequests.length}
                </span>
                <ChevronRight className="w-4 h-4 text-ink-mute" />
              </div>
            </button>
          )}

          {/* Convos list */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40 flex-1">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center flex-grow opacity-60">
              <div className="w-12 h-12 bg-white/[0.04] border border-white/[0.08] rounded-full flex items-center justify-center mb-3">
                <ChatIcon className="w-6 h-6 text-brand-300" />
              </div>
              <h3 className="font-bold text-sm text-ink mb-1">Your Messages</h3>
              <p className="text-xs text-ink-mute mb-4 max-w-[200px]">Send a message to a friend on campus.</p>
              <button
                onClick={() => setComposeOpen(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white rounded-full px-5 py-2 text-xs font-bold transition active:scale-95"
              >
                Send Message
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {filteredConvos.map((c) => {
                const isGroup = c.type === "group";
                const unread = c.unread > 0;
                
                // Initials helper for peer
                const peerName = isGroup 
                  ? c.group_name 
                  : (c.peer ? getNickname(c.peer.id, c.peer.name, c.group_id) : "Student");
                const initials = (peerName || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

                // Gesture Longpress simulation helper
                let pressTimer: any;
                const startPress = () => {
                  pressTimer = setTimeout(() => {
                    setActionsConvo(c);
                  }, 500);
                };
                const cancelPress = () => clearTimeout(pressTimer);

                return (
                  <button
                    key={c.group_id}
                    onClick={() => handleOpenChat(c)}
                    onTouchStart={startPress}
                    onTouchEnd={cancelPress}
                    onTouchMove={cancelPress}
                    onMouseDown={startPress}
                    onMouseUp={cancelPress}
                    onMouseLeave={cancelPress}
                    className="w-full flex items-center gap-3.5 py-4 hover:bg-white/[0.02] active:bg-white/[0.04] transition text-left"
                  >
                    {/* Avatars */}
                    <div className="relative shrink-0 select-none">
                      {isGroup ? (
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          {/* Stacked avatars */}
                          <div className="absolute -top-0.5 -left-0.5 w-8 h-8 rounded-full bg-brand-500/20 text-brand-300 border border-black flex items-center justify-center text-[10px] font-bold">
                            {c.members?.[0]?.name[0] || "G"}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 border border-black flex items-center justify-center text-[10px] font-bold">
                            {c.members?.[1]?.name[0] || "S"}
                          </div>
                        </div>
                      ) : (
                        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
                          unread ? "ring-2 ring-brand-500 ring-offset-1 ring-offset-black" : ""
                        }`}>
                          {c.peer?.avatar_url ? (
                            <img src={c.peer.avatar_url} alt={c.peer.name} className="w-full h-full rounded-full object-cover border border-white/10" />
                          ) : (
                            <div className="w-full h-full rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center text-xs font-bold">
                              {initials}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Metadata preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-sm truncate ${unread ? "text-ink font-bold" : "text-ink-soft font-medium"}`}>
                          {peerName}
                        </span>
                        {!isGroup && c.peer?.verified && (
                          <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full p-0.5 text-[7px] shrink-0">
                            <CheckIcon className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${unread ? "text-ink font-semibold" : "text-ink-mute"}`}>
                        {c.request_status === "pending" ? (
                          <span className="text-brand-300 font-medium">[Request Sent] </span>
                        ) : null}
                        {c.last_message ? c.last_message : "Start the conversation"}
                      </p>
                    </div>

                    {/* Timestamp & unread badge */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0 self-start mt-1">
                      <span className="text-[10px] text-ink-mute">
                        {c.last_at ? timeAgo(c.last_at) : ""}
                      </span>
                      {unread && (
                        <span className="w-2 h-2 bg-brand-500 rounded-full animate-ping shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SCREEN 3 — MESSAGE REQUESTS SCREEN */}
      {!activeDmId && viewRequestsScreen && (
        <div className="flex flex-col flex-1 pb-28 pt-8 px-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setViewRequestsScreen(false)}
              className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center transition active:scale-95 text-white"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-ink">Message Requests</h1>
          </div>

          {/* Incoming Requests List */}
          {incomingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center flex-grow opacity-60">
              <div className="w-12 h-12 bg-white/[0.04] border border-white/[0.08] rounded-full flex items-center justify-center mb-3">
                <MailIcon className="w-6 h-6 text-brand-300" />
              </div>
              <h3 className="font-bold text-sm text-ink mb-1">No Message Requests</h3>
              <p className="text-xs text-ink-mute max-w-[200px]">You have no pending requests.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {incomingRequests.map((c) => {
                const classmate = c.peer;
                if (!classmate) return null;
                const initials = (classmate.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

                return (
                  <div
                    key={c.group_id}
                    className="bg-[#121214] border border-white/[0.06] rounded-3xl p-5 flex flex-col gap-4"
                  >
                    {/* Header: Classmate info */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 border border-white/[0.08]">
                        {classmate.avatar_url ? (
                          <img src={classmate.avatar_url} alt={classmate.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-ink text-sm truncate">{classmate.name}</span>
                          {classmate.verified && (
                            <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px]">
                              <CheckIcon className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <span className="text-[10px] font-medium text-brand-300 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full">
                            {classmate.college || "Campus"}
                          </span>
                        </div>
                        <p className="text-xs text-ink-mute truncate">
                          {classmate.course || "Student"} {classmate.year ? `· Y${classmate.year}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Context Card: Signal Response */}
                    {c.origin_signal_note && (
                      <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-3.5 text-xs text-ink leading-relaxed">
                        <span className="text-brand-300 font-bold block mb-1">
                          ✋ responding to your vibe:
                        </span>
                        <span className="italic text-ink-soft">
                          "{c.origin_signal_note}"
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeclineRequest(c.group_id)}
                        className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-red-500/10 hover:text-red-400 text-xs font-bold transition active:scale-95 text-ink-soft border border-white/[0.04]"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleBlockRequest(c.group_id)}
                        className="flex-1 py-2.5 rounded-xl bg-white/[0.05] hover:bg-red-500/20 hover:text-red-500 text-xs font-bold transition active:scale-95 text-ink-soft border border-white/[0.04]"
                      >
                        Block
                      </button>
                      <button
                        onClick={() => {
                          handleAcceptRequest(c.group_id);
                          setViewRequestsScreen(false);
                          handleOpenChat(c);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition active:scale-95 shadow-md shadow-brand-500/15"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SCREEN 2 — CHAT SCREEN */}
      {activeDmId && (
        <div className="flex flex-col h-screen max-h-screen bg-black text-white overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] shrink-0 bg-[#0c0c0e]/90 backdrop-blur-md sticky top-0 z-40 select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => {
                  setActiveDmId(null);
                  setActivePeer(null);
                  onChatOpen?.(false);
                }}
                className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/10 active:scale-90 transition flex items-center justify-center shrink-0 text-white"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>

              <div
                onClick={() => { if (activeDmId) setChatInfoOpen(true); }}
                className="flex items-center gap-2.5 cursor-pointer min-w-0"
              >
                {/* Avatars */}
                {activePeer ? (
                  <div className="relative">
                    {activePeer.avatar_url ? (
                      <img src={activePeer.avatar_url} alt={activePeer.name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-xs">
                        {activePeer.name.split(" ")[0][0]}
                      </div>
                    )}
                    {activePeer.is_online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-brand-500 border-2 border-black rounded-full" />
                    )}
                  </div>
                ) : (
                  <div className="relative w-9 h-9 flex items-center justify-center">
                    <div className="absolute -top-0.5 -left-0.5 w-6 h-6 rounded-full bg-brand-500/20 text-brand-300 border border-black flex items-center justify-center text-[9px] font-bold">
                      {activeGroupMembers[0]?.name[0] || "G"}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-black flex items-center justify-center text-[9px] font-bold">
                      {activeGroupMembers[1]?.name[0] || "S"}
                    </div>
                  </div>
                )}

                {/* Subtitle */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-ink text-sm truncate">
                      {activePeer ? getNickname(activePeer.id, activePeer.name, activeDmId) : selectedConvo?.group_name}
                    </span>
                    {activePeer?.verified && (
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full p-0.5 text-[7px]" title="Verified">
                        <CheckIcon className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-brand-300 font-medium truncate">
                    {activePeer ? `@${activePeer.username}` : `${activeGroupMembers.length + 1} members`}
                  </p>
                </div>
              </div>
            </div>

            {/* Header options */}
            <div className="flex items-center gap-2.5 shrink-0 text-ink-soft">
              <button
                onClick={() => { if (activeDmId) setChatInfoOpen(true); }}
                className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/10 active:scale-95 transition flex items-center justify-center"
              >
                <DotsIcon className="w-5 h-5 text-ink-soft hover:text-ink transition-colors" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div
            style={{ touchAction: "pan-y" }}
            className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 bg-black flex flex-col"
          >
            {disappearingMode !== "off" && (
              <div className="w-full flex justify-center py-2 shrink-0">
                <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-fade-in select-none">
                  <ClockIcon className="w-3.5 h-3.5" />
                  <span>Disappearing messages: {disappearingMode === "24h" ? "24 hours" : disappearingMode === "7d" ? "7 days" : "90 days"}</span>
                </span>
              </div>
            )}

            {msgLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2 opacity-50">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-ink-mute">Loading DMs...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                <ChatIcon className="w-12 h-12 text-white/10 mb-3" />
                <p className="text-xs font-bold text-ink">No messages yet</p>
                <p className="text-[10px] text-ink-mute mt-1">Start chatting by typing a message below.</p>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                {messages.map((m, idx) => {
                  const mine = m.sender_id === "me" || m.sender_id === user?.id;
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
                  
                  // sender grouping checks
                  const isLastInCluster = !nextMsg || nextMsg.sender_id !== m.sender_id;
                  const isFirstInCluster = !prevMsg || prevMsg.sender_id !== m.sender_id;
                  const showTimeDivider = prevMsg && shouldShowTimeDivider(prevMsg.created_at, m.created_at);

                  // reaction toggler callback
                  const onMsgReact = (emoji: string) => handleToggleReaction(m.id, emoji);

                  // parse message contents
                  const { replyQuote, cleanContent } = parseMessageContent(m.content);

                  return (
                    <div key={m.id} className={`flex flex-col w-full ${mine ? "items-end" : "items-start"}`}>
                      {/* 5 min Gap Time Divider */}
                      {showTimeDivider && (
                        <div className="w-full flex justify-center py-2.5 my-2">
                          <span className="bg-white/[0.04] border border-white/[0.06] text-ink-mute text-[10px] font-medium px-3 py-1 rounded-full select-none">
                            {formatDividerTime(m.created_at)}
                          </span>
                        </div>
                      )}

                      {/* Message Bubble Cluster container */}
                      <div className="flex items-end gap-2.5 max-w-[80%] relative">
                        {/* Member Stack Header label */}
                        {!mine && isFirstInCluster && !activePeer && (
                          <span className="absolute -top-3.5 left-10 text-[9px] text-brand-300 font-bold leading-none select-none">
                            {getNickname(m.sender_id, activeGroupMembers.find(gm => gm.id === m.sender_id)?.name || "Member", activeDmId)}
                          </span>
                        )}

                        {/* Received message peer initials avatar circle */}
                        {!mine && (
                          <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                            {isLastInCluster && (
                              activePeer?.avatar_url ? (
                                <img src={activePeer.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center text-[10px] font-bold">
                                  {(activePeer?.name || "G")[0]}
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {/* Interactive Swipe components */}
                        <SwipeMessageBubble
                          msg={{ ...m, reply_to: replyQuote, content: cleanContent }}
                          mine={mine}
                          themeBgClass={activeThemeBgClass}
                          disappearingMode={disappearingMode}
                          onReply={() => setReplyToMsg(m)}
                          onReact={onMsgReact}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Swipe quote preview inside input box */}
          {replyToMsg && (
            <div className="px-4 py-2 border-t border-white/[0.06] bg-[#0c0c0e] flex items-center justify-between z-10 shrink-0">
              <div className="border-l-2 border-brand-300 pl-2.5 py-0.5 min-w-0">
                <p className="text-[10.5px] font-bold text-brand-300 truncate">
                  Replying to {replyToMsg.sender_id === "me" || replyToMsg.sender_id === user?.id ? getNickname("me", "You", activeDmId) : (activePeer ? getNickname(activePeer.id, activePeer.name, activeDmId) : "Student")}
                </p>
                <p className="text-xs text-ink-mute truncate">{parseMessageContent(replyToMsg.content).cleanContent}</p>
              </div>
              <button
                onClick={() => setReplyToMsg(null)}
                className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition shrink-0"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Input bar */}
          <div className="px-3.5 pt-2.5 border-t border-white/[0.07] bg-[#0c0c0e]/95 shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
            <div className="flex gap-2.5 items-center">
              {/* Attachment */}
              <button className="w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/10 flex items-center justify-center shrink-0 text-ink-soft active:scale-95 transition">
                <PaperclipIcon className="w-5 h-5" />
              </button>

              {/* Text bar */}
              <div className="flex-1 bg-[#1a1a1a] rounded-full px-4 min-h-[40px] flex items-center gap-2">
                <textarea
                  placeholder="Message…"
                  rows={1}
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="bg-transparent text-sm text-white placeholder-white/40 focus:outline-none flex-grow resize-none max-h-24 py-2 leading-snug"
                />

                {msgInput.trim() && (
                  <button
                    onClick={handleSend}
                    className="w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center shrink-0 active:scale-95 transition text-white -mr-1.5"
                  >
                    <SendIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2.5 — CHAT INFO (full screen, Instagram-style) */}
      {chatInfoOpen && activeDmId && (
        <ChatInfoScreen
          peer={activePeer}
          convo={convos.find(c => c.group_id === activeDmId) ?? null}
          messages={messages}
          onBack={() => setChatInfoOpen(false)}
          onSwitchTab={onSwitchTab}
          onViewProfile={(p) => {
            setChatInfoOpen(false);
            setProfileUser(p);
            setProfileSheetOpen(true);
          }}
          onCreateGroup={() => {
            setChatInfoOpen(false);
            if (activePeer) setSelectedPeople([activePeer]);
            setComposeOpen(true);
          }}
          onUpdateSettings={() => {
            const savedTheme = localStorage.getItem(`chat_theme_${activeDmId}`);
            const foundTheme = THEMES.find(t => t.id === savedTheme);
            setActiveThemeBgClass(foundTheme ? foundTheme.bgClass : "bg-brand-500");

            const savedDisappearing = localStorage.getItem(`chat_disappearing_${activeDmId}`) || "off";
            setDisappearingMode(savedDisappearing);
            
            setNicknameTrigger(prev => prev + 1);
          }}
          onBlock={() => {
            const blocked = JSON.parse(localStorage.getItem("blocked_groups") || "[]");
            if (!blocked.includes(activeDmId)) {
              blocked.push(activeDmId);
              localStorage.setItem("blocked_groups", JSON.stringify(blocked));
            }
            setChatInfoOpen(false);
            setActiveDmId(null);
            setActivePeer(null);
            onChatOpen?.(false);
            setConvos(prev => prev.filter(c => c.group_id !== activeDmId));
          }}
        />
      )}

      {/* SCREEN 3 — PROFILE SHEET (bottom sheet) */}
      <DraggableProfileSheet
        open={profileSheetOpen}
        onClose={() => setProfileSheetOpen(false)}
        peer={profileUser}
        onSwitchTab={onSwitchTab}
        onStartChat={(peer) => {
          setProfileSheetOpen(false);
          // find convo
          const exist = convos.find(c => c.type === "dm" && c.peer?.id === peer.id);
          if (exist) {
            handleOpenChat(exist);
          } else {
            // create fake
            const fakeConvo = {
              group_id: `dg-fake-${Date.now()}`,
              type: "dm" as const,
              peer: peer,
              last_message: "Chat created",
              last_at: new Date().toISOString(),
              unread: 0,
            };
            setConvos(prev => [fakeConvo, ...prev]);
            handleOpenChat(fakeConvo);
          }
        }}
      />

      {/* SCREEN 4 — NEW MESSAGE / GROUP CREATION */}
      {composeOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity animate-fade-in">
          <div className="absolute inset-0" onClick={() => setComposeOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 max-h-[85vh] overflow-y-auto z-10 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.05] pb-3">
              <h2 className="font-bold text-base text-ink">New Message</h2>
              <button
                onClick={() => setComposeOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-white"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Selected friend chips list */}
            {selectedPeople.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3.5">
                {selectedPeople.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/15 text-brand-300 text-xs font-semibold">
                    <span>{p.name.split(" ")[0]}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPeople(prev => prev.filter(x => x.id !== p.id))}
                      className="hover:text-white transition flex items-center justify-center"
                    >
                      <XIcon className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search filter input */}
            <input
              type="text"
              placeholder="Search people..."
              value={peopleSearch}
              onChange={(e) => setPeopleSearch(e.target.value)}
              className="input text-xs py-2.5 mb-4"
            />

            {/* Friends rows checkboxes */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 max-h-[40vh]">
              {filteredComposePeople.map((p) => {
                const checked = selectedPeople.some(x => x.id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (checked) {
                        setSelectedPeople(prev => prev.filter(x => x.id !== p.id));
                      } else {
                        setSelectedPeople(prev => [...prev, p]);
                      }
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.02] active:bg-white/[0.04] transition cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-xs">
                          {p.name.split(" ")[0][0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-ink">{p.name}</p>
                        {p.username && <p className="text-xs text-brand-300">@{p.username}</p>}
                      </div>
                    </div>
                    
                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition shrink-0 ${
                      checked ? "bg-brand-500 border-brand-500 text-white" : "border-white/20"
                    }`}>
                      {checked && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional Group Title */}
            {selectedPeople.length >= 2 && (
              <div className="mt-4">
                <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wide block mb-1">Group Name (optional)</label>
                <input
                  type="text"
                  placeholder="E.g. Hackathon Squad"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="input text-xs py-2.5"
                />
              </div>
            )}

            {/* Compose next button trigger */}
            <button
              onClick={handleCreateChat}
              disabled={selectedPeople.length === 0}
              className="btn-primary w-full py-3 mt-6 disabled:opacity-40"
            >
              {selectedPeople.length >= 2 ? "Create Group Chat" : "Create Chat"}
            </button>
          </div>
        </div>
      )}

      {/* Signal editor bottom sheet (note + availability status) */}
      <SignalEditorSheet
        open={editSignalOpen}
        initialText={mySignal}
        initialIntent={myStatus}
        initialReach={mySignalReach}
        onClose={() => setEditSignalOpen(false)}
        onSave={handleSaveSignal}
        onClear={handleClearSignal}
        profile={profile}
        demo={demo}
      />

      {/* Convo Row actions sheet */}
      {actionsConvo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-fade-in">
          <div className="absolute inset-0" onClick={() => setActionsConvo(null)} />
          <div className="absolute bottom-0 inset-x-0 bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 max-h-[85vh] z-10">
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.05] pb-3">
              <h2 className="font-bold text-base text-ink">Options</h2>
              <button
                onClick={() => setActionsConvo(null)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-white"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <button
                onClick={() => setActionsConvo(null)}
                className="w-full inline-flex items-center gap-3 py-3.5 px-4 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] active:scale-[0.98] transition text-sm font-bold text-ink text-left"
              >
                <PinIcon className="w-4 h-4 text-ink-soft" />
                Pin Conversation
              </button>
              <button
                onClick={() => setActionsConvo(null)}
                className="w-full inline-flex items-center gap-3 py-3.5 px-4 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] active:scale-[0.98] transition text-sm font-bold text-ink text-left"
              >
                <BellOffIcon className="w-4 h-4 text-ink-soft" />
                Mute Notifications
              </button>
              <button
                onClick={() => setActionsConvo(null)}
                className="w-full inline-flex items-center gap-3 py-3.5 px-4 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] active:scale-[0.98] transition text-sm font-bold text-ink text-left"
              >
                <MailIcon className="w-4 h-4 text-ink-soft" />
                Mark as Unread
              </button>
              <button
                onClick={() => {
                  setConvos(prev => prev.filter(c => c.group_id !== actionsConvo.group_id));
                  setActionsConvo(null);
                }}
                className="w-full inline-flex items-center gap-3 py-3.5 px-4 rounded-xl hover:bg-red-500/10 active:bg-red-500/20 active:scale-[0.98] transition text-sm font-bold text-red-400 text-left"
              >
                <TrashIcon className="w-4 h-4 text-red-400" />
                Delete Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SUBCOMPONENTS ────────────────────────────────────────────────────────────

// 1. SwipeMessageBubble
function SwipeMessageBubble({
  msg,
  mine,
  themeBgClass,
  disappearingMode,
  onReply,
  onReact,
}: {
  msg: any;
  mine: boolean;
  themeBgClass?: string;
  disappearingMode?: string;
  onReply: () => void;
  onReact: (emoji: string) => void;
}) {
  const [dragX, setDragX] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);

  // Swipe gesture touchstart
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = true;

    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      setShowReactionsMenu(true);
    }, 500);
  };

  // Swipe gesture touchmove
  const handleTouchMove = (e: React.TouchEvent) => {
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;

    if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
      }
    }

    if (!isSwiping.current) return;

    if (Math.abs(diffX) > Math.abs(diffY) && diffX > 0) {
      setDragX(Math.min(diffX, 70));
    }
  };

  // Swipe gesture touchend
  const handleTouchEnd = () => {
    isSwiping.current = false;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (dragX >= 60) {
      onReply();
    }
    setDragX(0);
  };

  // Mouse click listeners for desktop
  const handleMouseDown = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      setShowReactionsMenu(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  function renderContent(content: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-brand-300 hover:text-brand-200 break-all"
            onClick={(ev) => ev.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  }

  return (
    <div className="relative flex flex-col min-w-0">
      {/* Reactions floating overlay row */}
      {showReactionsMenu && (
        <div
          className={`absolute -top-12 z-50 bg-[#1e1e1e] border border-white/15 rounded-full px-3 py-1.5 flex gap-2.5 shadow-2xl animate-fade-in ${
            mine ? "right-0" : "left-0"
          }`}
        >
          {["❤️", "😂", "😮", "😢", "😡", "👍"].map((emoji) => (
            <button
              key={emoji}
              onClick={(e) => {
                e.stopPropagation();
                onReact(emoji);
                setShowReactionsMenu(false);
              }}
              className="text-lg hover:scale-125 active:scale-95 transition"
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setShowReactionsMenu(false)}
            className="flex items-center justify-center hover:text-white transition shrink-0 pl-1"
          >
            <XIcon className="w-3 h-3 text-white/50 hover:text-white" />
          </button>
        </div>
      )}

      {/* Bubble */}
      <div
        ref={bubbleRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragX === 0 ? "transform 0.2s ease-out" : "none",
        }}
        className={`relative group max-w-full w-fit rounded-2xl px-4 py-2.5 text-xs md:text-sm ${
          mine
            ? `${themeBgClass || "bg-brand-500"} text-white rounded-tr-none`
            : "bg-[#1e1e1e] border border-white/[0.06] text-ink rounded-tl-none"
        }`}
      >
        {/* Swipe Reply curved arrow */}
        {dragX > 0 && (
          <div
            style={{ left: `-${dragX}px`, opacity: dragX / 60 }}
            className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white text-xs pointer-events-none"
          >
            ↩
          </div>
        )}

        {/* Quoted message inside bubble */}
        {msg.reply_to && (
          <div className="mb-2 p-2 rounded bg-black/40 text-[10px] text-white/70 border-l-2 border-brand-300">
            <p className="font-bold">{msg.reply_to.sender_name}</p>
            <p className="truncate">{msg.reply_to.content}</p>
          </div>
        )}

        {/* Message content text */}
        <p className="leading-relaxed break-words">{renderContent(msg.content)}</p>

        {/* Timestamp */}
        <span className="text-[9.5px] text-white/50 mt-1 text-right select-none flex items-center justify-end gap-1 whitespace-nowrap">
          {disappearingMode && disappearingMode !== "off" && (
            <ClockIcon className="w-3 h-3 opacity-60 text-white shrink-0" />
          )}
          <span>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </span>

        {/* Render reactions on bottom-right edge */}
        {msg.reactions && msg.reactions.length > 0 && (
          <div className="absolute -bottom-2.5 right-2.5 bg-[#1a1a1a] border border-white/10 rounded-full px-2 py-0.5 flex gap-0.5 shadow z-10 scale-[0.85]">
            {msg.reactions.map((r: any, idx: number) => (
              <span key={idx} title={`Reacted by ${r.from}`}>
                {r.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 2. ChatInfoScreen
function ChatInfoScreen({
  peer,
  convo,
  messages,
  onBack,
  onSwitchTab,
  onViewProfile,
  onCreateGroup,
  onUpdateSettings,
  onBlock,
}: {
  peer: any;
  convo: any;
  messages: Message[];
  onBack: () => void;
  onSwitchTab?: (tab: string) => void;
  onViewProfile: (peer: any) => void;
  onCreateGroup: () => void;
  onUpdateSettings: () => void;
  onBlock: () => void;
}) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"media" | "links" | "files">("media");
  const [muted, setMuted] = useState(false);

  // Sub-screens/sheets state
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [disappearingPickerOpen, setDisappearingPickerOpen] = useState(false);
  const [nicknamesOpen, setNicknamesOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const isGroup = convo?.type === "group";
  const rawDisplayName = isGroup ? convo?.group_name : peer?.name;

  // Nickname lookup
  const getNickname = (userId: string, defaultName: string) => {
    if (!convo) return defaultName;
    return localStorage.getItem(`chat_nickname_${convo.group_id}_${userId}`) || defaultName;
  };

  const displayName = isGroup ? convo?.group_name : (peer ? getNickname(peer.id, peer.name) : "Student");

  const subtitle = isGroup
    ? `${(convo?.members?.length ?? 0) + 1} members`
    : peer?.username ? `@${peer.username}` : null;

  const initials = (displayName || "?")
    .trim()
    .split(/\s+/)
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Load local settings
  const savedTheme = convo ? localStorage.getItem(`chat_theme_${convo.group_id}`) : null;
  const currentTheme = THEMES.find(t => t.id === savedTheme) || THEMES[0];

  const disappearingVal = convo ? (localStorage.getItem(`chat_disappearing_${convo.group_id}`) || "off") : "off";
  const disappearingLabel = disappearingVal === "off" ? "Off" : disappearingVal === "24h" ? "24 hours" : disappearingVal === "7d" ? "7 days" : "90 days";

  // Scan links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links: { url: string; domain: string }[] = [];
  messages.forEach(m => {
    const found = m.content.match(urlRegex);
    if (found) {
      found.forEach(url => {
        try {
          const domain = new URL(url).hostname;
          if (!links.some(l => l.url === url)) {
            links.push({ url, domain });
          }
        } catch {
          if (!links.some(l => l.url === url)) {
            links.push({ url, domain: "link" });
          }
        }
      });
    }
  });
  const linksToShow = [...links].reverse();

  // Count shared media
  const mediaCount = messages.filter(m => m.content.startsWith("http") || m.content.includes("img")).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleReport = (reason: string) => {
    setReportSheetOpen(false);
    showToast(`Reported for "${reason}". Thanks, we'll review this.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white">
      {/* Top nav bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] shrink-0 bg-[#0c0c0e]/95 backdrop-blur-md sticky top-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/10 active:scale-90 transition flex items-center justify-center shrink-0 text-white"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <span className="font-bold text-sm text-ink">Chat Info</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
        {/* Avatar + Name hero */}
        <div className="flex flex-col items-center pt-8 pb-6 px-6">
          {/* Avatar */}
          <div className="relative mb-4">
            {isGroup ? (
              <div className="relative w-24 h-24">
                <div className="absolute -top-1 -left-1 w-16 h-16 rounded-full bg-brand-500/20 text-brand-300 border-2 border-black flex items-center justify-center text-lg font-bold">
                  {convo?.members?.[0]?.name[0] || "G"}
                </div>
                <div className="absolute -bottom-1 -right-1 w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-300 border-2 border-black flex items-center justify-center text-lg font-bold">
                  {convo?.members?.[1]?.name[0] || "S"}
                </div>
              </div>
            ) : peer?.avatar_url ? (
              <img
                src={peer.avatar_url}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-3xl">
                {initials}
              </div>
            )}
            {!isGroup && peer?.is_online && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-brand-500 border-2 border-black rounded-full" />
            )}
          </div>

          {/* Name */}
          <h2 className="font-extrabold text-lg text-ink text-center leading-tight">{displayName}</h2>
          {subtitle && <p className="text-xs text-brand-300 font-semibold mt-0.5">{subtitle}</p>}
          {!isGroup && peer?.college && (
            <p className="text-[11px] text-ink-mute mt-1 text-center">
              {peer.college} {peer.course ? `• ${peer.course}` : ""}
            </p>
          )}
          {!isGroup && peer?.signal && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-[11px] text-brand-300 font-semibold">
              <SignalIcon className="w-3.5 h-3.5 text-brand-300" />
              <span>{peer.signal}</span>
            </div>
          )}
        </div>

        {/* 4 Action icon buttons row */}
        <div className="flex justify-around px-2 py-2 border-y border-white/[0.06] mb-2 select-none">
          {[
            isGroup
              ? { icon: <UsersIcon className="w-5 h-5" />, label: "Members", action: () => showToast(`${(convo?.members?.length ?? 0) + 1} members in this group`) }
              : { icon: <UserIcon className="w-5 h-5" />, label: "Profile", action: () => { if (peer) onViewProfile(peer); } },
            { icon: <SearchIcon className="w-5 h-5" />, label: "Search", action: () => showToast("Search features coming soon") },
            { icon: muted ? <BellOffIcon className="w-5 h-5" /> : <BellIcon className="w-5 h-5" />, label: muted ? "Unmute" : "Mute", action: () => { setMuted(v => !v); showToast(muted ? "Unmuted notifications" : "Muted notifications"); } },
            { icon: <LockIcon className="w-5 h-5" />, label: "Privacy", action: () => setPrivacyOpen(true) },
          ].map(({ icon, label, action }, idx) => (
            <button
              key={idx}
              onClick={action}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl hover:bg-white/[0.04] active:scale-95 transition text-ink-mute hover:text-white"
            >
              <span className="flex items-center justify-center h-5">{icon}</span>
              <span className="text-[10px] font-semibold text-ink-mute">{label}</span>
            </button>
          ))}
        </div>

        {/* Members list (groups only) */}
        {isGroup && (
          <div className="px-4 mt-1 mb-1 select-none">
            <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wide px-1 mb-1.5">
              {(convo?.members?.length ?? 0) + 1} members
            </p>
            <div className="space-y-0.5">
              {/* You */}
              <div className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                  {(profile?.name?.[0] || "Y").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink truncate">You</p>
                </div>
                <span className="text-[10px] font-semibold text-brand-300">Admin</span>
              </div>
              {/* Other members */}
              {(convo?.members ?? []).map((m: any) => (
                <div key={m.id} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/[0.06] text-ink-soft flex items-center justify-center font-bold text-xs shrink-0">
                      {(m.name?.[0] || "?").toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{m.name}</p>
                    {m.username && <p className="text-[11px] text-ink-mute truncate">@{m.username}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings rows */}
        <div className="px-4 mt-1 space-y-0.5 select-none">
          {/* Theme */}
          <button
            onClick={() => setThemePickerOpen(true)}
            className="w-full flex items-center gap-3.5 px-3 py-4 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] transition text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
              <PaletteIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">Theme</p>
              <p className="text-[11px] text-ink-mute">{currentTheme.name}</p>
            </div>
            <div className={`w-4 h-4 rounded-full ${currentTheme.dotColor} border-2 border-white/10 shrink-0`} />
          </button>

          {/* Disappearing messages */}
          <button
            onClick={() => setDisappearingPickerOpen(true)}
            className="w-full flex items-center gap-3.5 px-3 py-4 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] transition text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
              <ClockIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">Disappearing messages</p>
              <p className="text-[11px] text-ink-mute">{disappearingLabel}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-mute shrink-0" />
          </button>

          {/* Privacy and safety */}
          <button
            onClick={() => setPrivacyOpen(true)}
            className="w-full flex items-center gap-3.5 px-3 py-4 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] transition text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
              <LockIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">Privacy and safety</p>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-mute shrink-0" />
          </button>

          {/* Nicknames (DM only) */}
          {!isGroup && (
            <button
              onClick={() => setNicknamesOpen(true)}
              className="w-full flex items-center gap-3.5 px-3 py-4 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] transition text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-brand-500 flex items-center justify-center shrink-0">
                <SmileIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink">Nicknames</p>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-mute shrink-0" />
            </button>
          )}

          {/* Create / add to group */}
          <button
            onClick={() => { onBack(); onCreateGroup(); }}
            className="w-full flex items-center gap-3.5 px-3 py-4 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] transition text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-brand-500 flex items-center justify-center shrink-0">
              <UserPlusIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">{isGroup ? "Add members" : "Create a group chat"}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-mute shrink-0" />
          </button>
        </div>

        {/* Shared Media / Links tabs */}
        <div className="mt-5 px-4">
          <div className="flex border-b border-white/[0.06] text-xs font-bold text-ink-soft mb-3 select-none">
            {(["media", "links", "files"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 pb-2.5 border-b-2 capitalize transition ${
                  activeTab === t ? "border-brand-500 text-ink" : "border-transparent text-ink-mute"
                }`}
              >
                {t === "media" ? "Photos & Videos" : t === "links" ? "Links" : "Files"}
              </button>
            ))}
          </div>

          {activeTab === "media" && (
            mediaCount > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {[...Array(mediaCount)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-white/20">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 opacity-50 select-none">
                <ImageIcon className="w-12 h-12 text-white/10 mb-3" />
                <p className="text-xs text-ink-mute">No photos or videos yet</p>
              </div>
            )
          )}

          {activeTab === "links" && (
            <div className="space-y-2">
              {linksToShow.length > 0 ? (
                linksToShow.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition text-xs font-semibold"
                  >
                    <LinkIcon className="w-5 h-5 text-ink-mute shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-ink truncate font-bold">{link.domain}</p>
                      <p className="text-brand-300 truncate text-[10px] mt-0.5">{link.url}</p>
                    </div>
                  </a>
                ))
              ) : (
                <div className="flex flex-col items-center py-10 opacity-50 select-none">
                  <LinkIcon className="w-12 h-12 text-white/10 mb-3" />
                  <p className="text-xs text-ink-mute">No links shared yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "files" && (
            <div className="flex flex-col items-center py-10 opacity-50 select-none">
              <FileIcon className="w-12 h-12 text-white/10 mb-3" />
              <p className="text-xs text-ink-mute">No files shared yet</p>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="mt-8 px-4 pb-4 space-y-0.5 select-none">
          {isGroup ? (
            <button
              onClick={() => setBlockConfirmOpen(true)}
              className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/[0.06] active:bg-red-500/10 transition inline-flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4 text-red-400" />
              Leave group
            </button>
          ) : (
            <>
              <button
                onClick={() => setBlockConfirmOpen(true)}
                className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/[0.06] active:bg-red-500/10 transition inline-flex items-center gap-2"
              >
                <BanIcon className="w-4 h-4 text-red-400" />
                Block {displayName?.split(" ")[0]}
              </button>
              <button
                onClick={() => setReportSheetOpen(true)}
                className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/[0.06] active:bg-red-500/10 transition inline-flex items-center gap-2"
              >
                <AlertIcon className="w-4 h-4 text-red-400" />
                Report
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 inset-x-5 z-[70] flex justify-center pointer-events-none">
          <div className="bg-[#1a1a1a] border border-white/10 text-white rounded-full px-5 py-2.5 text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2">
            <ShieldIcon className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Theme Picker Sheet */}
      <ThemePickerSheet
        open={themePickerOpen}
        onClose={() => setThemePickerOpen(false)}
        activeThemeId={savedTheme || "default"}
        onSelectTheme={(themeId: string) => {
          if (convo) {
            localStorage.setItem(`chat_theme_${convo.group_id}`, themeId);
            onUpdateSettings();
            showToast("Theme updated");
          }
        }}
      />

      {/* Disappearing Picker Sheet */}
      <DisappearingPickerSheet
        open={disappearingPickerOpen}
        onClose={() => setDisappearingPickerOpen(false)}
        activeMode={disappearingVal}
        onSelectMode={(mode: string) => {
          if (convo) {
            localStorage.setItem(`chat_disappearing_${convo.group_id}`, mode);
            onUpdateSettings();
            showToast(mode === "off" ? "Disappearing messages disabled" : `Messages disappear after ${mode === "24h" ? "24 hours" : mode === "7d" ? "7 days" : mode === "90 days"}`);
          }
        }}
      />

      {/* Nicknames Sheet */}
      <NicknamesSheet
        open={nicknamesOpen}
        onClose={() => setNicknamesOpen(false)}
        peerId={peer?.id || "peer"}
        peerRealName={peer?.name || "Student"}
        myRealName={profile?.name || "You"}
        groupId={convo?.group_id || ""}
        onSaveNicknames={() => {
          onUpdateSettings();
          showToast("Nicknames updated");
        }}
      />

      {/* Privacy Sub Screen */}
      <PrivacySubScreen
        open={privacyOpen}
        onBack={() => setPrivacyOpen(false)}
        groupId={convo?.group_id || ""}
        peerName={displayName}
        isGroup={isGroup}
        onBlock={() => {
          setPrivacyOpen(false);
          onBlock();
        }}
      />

      {/* Block Confirmation Bottom Sheet */}
      {blockConfirmOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] transition-opacity animate-fade-in">
          <div className="absolute inset-0" onClick={() => setBlockConfirmOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-6 z-10 space-y-4">
            <h3 className="font-bold text-base text-ink">{isGroup ? `Leave ${displayName}?` : `Block ${displayName}?`}</h3>
            <p className="text-xs text-ink-mute">
              {isGroup
                ? "You'll stop receiving messages from this group, and it will be removed from your inbox."
                : `You will no longer receive messages or calls from ${displayName}, and this conversation will be removed from your inbox.`
              }
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBlockConfirmOpen(false)}
                className="flex-1 py-3 text-xs font-bold bg-white/[0.05] hover:bg-white/10 active:scale-95 transition rounded-xl text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setBlockConfirmOpen(false);
                  onBlock();
                }}
                className="flex-1 py-3 text-xs font-bold bg-red-500 hover:bg-red-600 active:scale-95 transition rounded-xl text-white"
              >
                {isGroup ? "Leave" : "Block"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Reason Picker Sheet (from row tap) */}
      {reportSheetOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] transition-opacity animate-fade-in">
          <div className="absolute inset-0" onClick={() => setReportSheetOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 max-h-[80vh] z-10 space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <h3 className="font-bold text-base text-ink">Report Reason</h3>
              <button
                onClick={() => setReportSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-white"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-1.5">
              {["Spam", "Harassment or bullying", "Fake account", "Scam or fraud", "Other"].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReport(reason)}
                  className="w-full text-left py-3 px-4 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] transition text-xs font-semibold block text-white"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EXTRA SUBCOMPONENTS FOR CHAT INFO ────────────────────────────────────────

function ThemePickerSheet({
  open,
  onClose,
  activeThemeId,
  onSelectTheme,
}: {
  open: boolean;
  onClose: () => void;
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] transition-opacity animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 max-h-[85vh] z-10 flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-white/[0.05] pb-3">
          <h2 className="font-bold text-base text-ink">Chat Theme</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-white"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-3 gap-3 py-2">
          {THEMES.map((theme) => {
            const isSelected = theme.id === activeThemeId;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2.5 transition active:scale-95 bg-white/[0.02] ${
                  isSelected ? "border-brand-500 text-brand-300 font-extrabold" : "border-white/[0.06] text-ink-soft hover:bg-white/[0.04]"
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${theme.dotColor} border-2 border-white/20 shadow-md`} />
                <span className="text-[10px] font-bold text-center leading-tight">{theme.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DisappearingPickerSheet({
  open,
  onClose,
  activeMode,
  onSelectMode,
}: {
  open: boolean;
  onClose: () => void;
  activeMode: string;
  onSelectMode: (mode: string) => void;
}) {
  if (!open) return null;

  const options = [
    { id: "off", name: "Off", desc: "Keep all messages in the chat history." },
    { id: "24h", name: "24 hours", desc: "New messages disappear 24 hours after they are sent." },
    { id: "7d", name: "7 days", desc: "New messages disappear 7 days after they are sent." },
    { id: "90d", name: "90 days", desc: "New messages disappear 90 days after they are sent." },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] transition-opacity animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 max-h-[85vh] z-10 flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-white/[0.05] pb-3">
          <h2 className="font-bold text-base text-ink">Disappearing Messages</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-white"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Options list */}
        <div className="space-y-1.5">
          {options.map((opt) => {
            const isSelected = opt.id === activeMode;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onSelectMode(opt.id);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition text-white flex items-center justify-between ${
                  isSelected ? "bg-[#0F8F6F]/10 border-brand-500" : "bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.03]"
                }`}
              >
                <div className="min-w-0 pr-4">
                  <p className="text-xs font-bold">{opt.name}</p>
                  <p className="text-[10px] text-ink-mute mt-0.5 leading-normal">{opt.desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  isSelected ? "border-brand-500 text-brand-300 bg-brand-500/20" : "border-white/20"
                }`}>
                  {isSelected && <CheckIcon className="w-2.5 h-2.5 text-brand-300" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NicknamesSheet({
  open,
  onClose,
  peerId,
  peerRealName,
  myRealName,
  groupId,
  onSaveNicknames,
}: {
  open: boolean;
  onClose: () => void;
  peerId: string;
  peerRealName: string;
  myRealName: string;
  groupId: string;
  onSaveNicknames: () => void;
}) {
  const [peerNick, setPeerNick] = useState("");
  const [myNick, setMyNick] = useState("");

  useEffect(() => {
    if (open) {
      setPeerNick(localStorage.getItem(`chat_nickname_${groupId}_${peerId}`) || "");
      setMyNick(localStorage.getItem(`chat_nickname_${groupId}_me`) || "");
    }
  }, [open, groupId, peerId]);

  if (!open) return null;

  const handleSave = () => {
    if (peerNick.trim()) {
      localStorage.setItem(`chat_nickname_${groupId}_${peerId}`, peerNick.trim());
    } else {
      localStorage.removeItem(`chat_nickname_${groupId}_${peerId}`);
    }

    if (myNick.trim()) {
      localStorage.setItem(`chat_nickname_${groupId}_me`, myNick.trim());
    } else {
      localStorage.removeItem(`chat_nickname_${groupId}_me`);
    }

    onSaveNicknames();
    onClose();
  };

  const handleReset = (target: "peer" | "me") => {
    if (target === "peer") {
      setPeerNick("");
      localStorage.removeItem(`chat_nickname_${groupId}_${peerId}`);
    } else {
      setMyNick("");
      localStorage.removeItem(`chat_nickname_${groupId}_me`);
    }
    onSaveNicknames();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] transition-opacity animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 max-h-[85vh] z-10 flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-white/[0.05] pb-3">
          <h2 className="font-bold text-base text-ink">Set Nicknames</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-white"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          {/* Peer Row */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wide">{peerRealName}'s Nickname</label>
              {localStorage.getItem(`chat_nickname_${groupId}_${peerId}`) && (
                <button
                  type="button"
                  onClick={() => handleReset("peer")}
                  className="text-[9px] font-bold text-red-400 hover:underline"
                >
                  Reset to original
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder={`E.g. Arjun (original: ${peerRealName})`}
              value={peerNick}
              onChange={(e) => setPeerNick(e.target.value)}
              className="input text-xs py-2.5"
            />
          </div>

          {/* My Row */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wide">Your Nickname</label>
              {localStorage.getItem(`chat_nickname_${groupId}_me`) && (
                <button
                  type="button"
                  onClick={() => handleReset("me")}
                  className="text-[9px] font-bold text-red-400 hover:underline"
                >
                  Reset to original
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder={`E.g. Me (original: ${myRealName})`}
              value={myNick}
              onChange={(e) => setMyNick(e.target.value)}
              className="input text-xs py-2.5"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="btn-primary w-full py-3.5 mt-4 rounded-xl text-xs font-bold"
          >
            Save Nicknames
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivacySubScreen({
  open,
  onBack,
  groupId,
  peerName,
  isGroup,
  onBlock,
}: {
  open: boolean;
  onBack: () => void;
  groupId: string;
  peerName: string;
  isGroup: boolean;
  onBlock: () => void;
}) {
  const [readReceipts, setReadReceipts] = useState(true);
  const [activityStatus, setActivityStatus] = useState(true);
  const [restricted, setRestricted] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (open) {
      setReadReceipts(localStorage.getItem(`privacy_read_receipts_${groupId}`) !== "off");
      setActivityStatus(localStorage.getItem(`privacy_activity_status_${groupId}`) !== "off");
      setRestricted(localStorage.getItem(`privacy_restricted_${groupId}`) === "on");
    }
  }, [open, groupId]);

  if (!open) return null;

  const toggleReadReceipts = () => {
    const nextVal = !readReceipts;
    setReadReceipts(nextVal);
    localStorage.setItem(`privacy_read_receipts_${groupId}`, nextVal ? "on" : "off");
  };

  const toggleActivityStatus = () => {
    const nextVal = !activityStatus;
    setActivityStatus(nextVal);
    localStorage.setItem(`privacy_activity_status_${groupId}`, nextVal ? "on" : "off");
  };

  const toggleRestricted = () => {
    const nextVal = !restricted;
    setRestricted(nextVal);
    localStorage.setItem(`privacy_restricted_${groupId}`, nextVal ? "on" : "off");
    showToast(nextVal ? "Account restricted" : "Account unrestricted");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleReport = (reason: string) => {
    setReportSheetOpen(false);
    showToast(`Reported for "${reason}". Thanks, we'll review this.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] shrink-0 bg-[#0c0c0e]/95 backdrop-blur-md sticky top-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/10 active:scale-90 transition flex items-center justify-center shrink-0 text-white"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <span className="font-bold text-sm text-ink">Privacy and safety</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6">
        {/* Toggles Group */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-ink-soft uppercase tracking-wide px-1">Permissions</h3>
          
          <div className="card p-4 space-y-4 bg-[#0c0c0e]/90 border border-white/[0.07] rounded-3xl">
            {/* Read Receipts */}
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <p className="text-sm font-bold text-ink">Read receipts</p>
                <p className="text-[11px] text-ink-mute leading-normal">Let others see when you've read their messages.</p>
              </div>
              <button
                onClick={toggleReadReceipts}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                  readReceipts ? "bg-[#0F8F6F]" : "bg-white/10"
                }`}
              >
                <span className={`w-5 h-5 bg-white rounded-full absolute transition-transform ${
                  readReceipts ? "translate-x-[22px]" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            {/* Activity Status */}
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <p className="text-sm font-bold text-ink">Show activity status</p>
                <p className="text-[11px] text-ink-mute leading-normal">Allow accounts you message to see when you're active.</p>
              </div>
              <button
                onClick={toggleActivityStatus}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                  activityStatus ? "bg-[#0F8F6F]" : "bg-white/10"
                }`}
              >
                <span className={`w-5 h-5 bg-white rounded-full absolute transition-transform ${
                  activityStatus ? "translate-x-[22px]" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Account Status Group */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-ink-soft uppercase tracking-wide px-1">Account Actions</h3>
          
          <div className="card p-4 space-y-4 bg-[#0c0c0e]/90 border border-white/[0.07] rounded-3xl">
            {/* Restrict */}
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <p className="text-sm font-bold text-ink">Restrict</p>
                <p className="text-[11px] text-ink-mute leading-normal">Limit their interactions without them knowing. Their chats will move to requests.</p>
              </div>
              <button
                onClick={toggleRestricted}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                  restricted ? "bg-[#0F8F6F]" : "bg-white/10"
                }`}
              >
                <span className={`w-5 h-5 bg-white rounded-full absolute transition-transform ${
                  restricted ? "translate-x-[22px]" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="space-y-3 pt-4 select-none">
          <button
            onClick={onBlock}
            className="w-full py-4 text-center text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl hover:bg-red-500/15 active:scale-95 transition inline-flex items-center justify-center gap-2"
          >
            <BanIcon className="w-4 h-4 text-red-400" />
            Block {isGroup ? "Group" : peerName}
          </button>
          <button
            onClick={() => setReportSheetOpen(true)}
            className="w-full py-4 text-center text-sm font-bold text-white/80 bg-white/[0.05] border border-white/[0.08] rounded-2xl hover:bg-white/[0.08] active:scale-95 transition inline-flex items-center justify-center gap-2"
          >
            <AlertIcon className="w-4 h-4 text-white/80" />
            Report Chat
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 inset-x-5 z-[60] flex justify-center pointer-events-none">
          <div className="bg-[#1a1a1a] border border-white/10 text-white rounded-full px-5 py-2.5 text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2">
            <ShieldIcon className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Report Reason Picker Sheet (inside privacy screen) */}
      {reportSheetOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] transition-opacity animate-fade-in">
          <div className="absolute inset-0" onClick={() => setReportSheetOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 max-h-[80vh] z-10 space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <h3 className="font-bold text-base text-ink">Report Reason</h3>
              <button
                onClick={() => setReportSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-white"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-1.5">
              {["Spam", "Harassment or bullying", "Fake account", "Scam or fraud", "Other"].map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReport(reason)}
                  className="w-full text-left py-3 px-4 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] transition text-xs font-semibold block text-white"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. DraggableProfileSheet
function DraggableProfileSheet({
  open,
  onClose,
  peer,
  onSwitchTab,
  onStartChat,
}: {
  open: boolean;
  onClose: () => void;
  peer: any;
  onSwitchTab?: (tab: string) => void;
  onStartChat: (peer: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<"posts" | "media" | "links">("posts");
  const [translateY, setTranslateY] = useState(35); // top position vh offset
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const startTranslateY = useRef(35);

  useEffect(() => {
    if (open) {
      setTranslateY(35);
      setActiveTab("posts");
    }
  }, [open]);

  if (!open || !peer) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
    startTranslateY.current = translateY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - dragStartY.current;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    let newTranslateY = startTranslateY.current + deltaVh;
    if (newTranslateY < 10) newTranslateY = 10; // max visible (90vh)
    setTranslateY(newTranslateY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateY > 50) {
      onClose();
    } else if (translateY < 22) {
      setTranslateY(10); // snaps to 90vh height
    } else {
      setTranslateY(35); // snaps to 65vh default height
    }
  };

  // Mock mutual follower checking
  const isMutual = peer.id === "dp1" || peer.id === "dp2";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Draggable bottom sheet */}
      <div
        style={{ transform: `translateY(${translateY}vh)` }}
        className={`absolute bottom-0 inset-x-0 h-[100vh] bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] flex flex-col z-10 select-none pb-28 ${
          isDragging ? "transition-none" : "transition-transform duration-300 ease-out"
        }`}
      >
        {/* Drag handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing shrink-0"
        >
          <div className="w-8 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-5">
          {/* Avatar and Name */}
          <div className="flex flex-col items-center text-center">
            {peer.avatar_url ? (
              <img src={peer.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border border-white/10 shadow" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-2xl shadow">
                {peer.name[0]}
              </div>
            )}
            
            <div className="flex items-center gap-1.5 mt-3 justify-center">
              <h3 className="font-extrabold text-base text-ink">{peer.name}</h3>
              {peer.verified && (
                <span className="inline-flex items-center justify-center w-4 h-4 bg-brand-500 text-white rounded-full p-0.5 text-[8px] shrink-0">
                  <CheckIcon className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            {peer.username && <p className="text-xs text-brand-300 font-semibold mt-0.5">@{peer.username}</p>}
            
            {/* College info */}
            <p className="text-[11.5px] text-ink-mute mt-1.5">
              {peer.college || "IIIT Hyderabad"} • {peer.course || "B.Tech CSE"} • Year {peer.year || 2}
            </p>
          </div>

          {/* Active Broadcast signal */}
          {peer.signal && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-[11px] text-brand-300 font-semibold animate-fade-in">
                <SignalIcon className="w-3.5 h-3.5 text-brand-300" />
                <span>{peer.signal}</span>
              </div>
            </div>
          )}

          {/* Follow statistics counts */}
          <div className="flex justify-center gap-6 text-center py-1 border-y border-white/[0.04]">
            <div>
              <p className="text-xs font-bold text-ink">142</p>
              <p className="text-[9px] text-ink-mute uppercase tracking-wider">Followers</p>
            </div>
            <div>
              <p className="text-xs font-bold text-ink">98</p>
              <p className="text-[9px] text-ink-mute uppercase tracking-wider">Following</p>
            </div>
            {isMutual && (
              <div className="flex items-center">
                <span className="pill bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">Mutual</span>
              </div>
            )}
          </div>

          {/* Action follow buttons */}
          <div className="flex gap-2 text-xs select-none">
            {isMutual ? (
              <>
                <button
                  type="button"
                  onClick={() => onStartChat(peer)}
                  className="flex-grow py-2.5 font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition active:scale-95 inline-flex items-center justify-center gap-1.5"
                >
                  <ChatIcon className="w-4 h-4" />
                  Message
                </button>
                <button
                  type="button"
                  className="flex-grow py-2.5 font-bold rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition text-ink"
                >
                  Unfollow
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="flex-grow py-2.5 font-bold rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] text-brand-300 border-brand-500/30 transition inline-flex items-center justify-center gap-1.5"
                >
                  Following
                  <CheckIcon className="w-3.5 h-3.5 text-brand-300" />
                </button>
                <button
                  type="button"
                  disabled
                  className="flex-grow py-2.5 font-bold rounded-xl bg-white/[0.02] border border-white/[0.05] text-ink-mute transition cursor-not-allowed"
                >
                  Message
                </button>
              </>
            )}
          </div>

          {/* Tab Strip */}
          <div className="flex border-b border-white/[0.06] text-xs font-bold text-ink-soft select-none pt-2">
            {(["posts", "media", "links"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 pb-2 border-b-2 capitalize transition ${
                  activeTab === t ? "border-brand-500 text-ink" : "border-transparent text-ink-mute"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div className="min-h-[140px] pt-1">
            {activeTab === "posts" && (
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition" />
                ))}
              </div>
            )}

            {activeTab === "media" && (
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition flex items-center justify-center text-white/20">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                ))}
              </div>
            )}

            {activeTab === "links" && (
              <div className="space-y-2 select-none">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition text-xs font-semibold text-ink-soft hover:text-white"
                >
                  <LinkIcon className="w-4 h-4 text-ink-mute" />
                  <span>GitHub Profile</span>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition text-xs font-semibold text-ink-soft hover:text-white"
                >
                  <LinkIcon className="w-4 h-4 text-ink-mute" />
                  <span>LinkedIn Profile</span>
                </a>
              </div>
            )}
          </div>

          {/* Switch Tab trigger link */}
          {onSwitchTab && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchTab("profile");
                }}
                className="text-xs text-brand-300 font-bold hover:underline active:scale-95 transition"
              >
                View Full Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
