"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isDemo } from "@/lib/config";
import {
  CheckIcon,
  EditIcon,
  SignalIcon,
  UserIcon,
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
  MailIcon
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

// ── AVAILABILITY STATUS ──────────────────────────────────────────────────────
// Lets friends see at a glance whether you're free, in class, studying or busy.
const STATUSES = [
  { id: "free",     label: "Free now", short: "Free",     ring: "#22c55e", dot: "bg-green-500",  text: "text-green-400" },
  { id: "class",    label: "In class", short: "In class", ring: "#f59e0b", dot: "bg-amber-500",  text: "text-amber-400" },
  { id: "studying", label: "Studying", short: "Studying", ring: "#3b82f6", dot: "bg-blue-500",   text: "text-blue-400" },
  { id: "busy",     label: "Busy",     short: "Busy",     ring: "#ef4444", dot: "bg-red-500",    text: "text-red-400" },
] as const;

function statusMeta(id: string | null | undefined) {
  return STATUSES.find((s) => s.id === id) ?? null;
}

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
  { id: "dp1", name: "Arjun", signal: "DBMS grind, library 2nd floor", avatar_url: null, status: "studying" },
  { id: "dp2", name: "Priya", signal: "anyone for chai at 4pm?", avatar_url: null, status: "free" },
  { id: "dp5", name: "Karan", signal: "OS lecture till 3", avatar_url: null, status: "class" },
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

// ── SignalEditorSheet — set your note + availability status ───────────────────
function SignalEditorSheet({
  open,
  initialText,
  initialStatus,
  onClose,
  onSave,
}: {
  open: boolean;
  initialText: string;
  initialStatus: string | null;
  onClose: () => void;
  onSave: (text: string, status: string | null) => void;
}) {
  const [text, setText] = useState(initialText);
  const [status, setStatus] = useState<string | null>(initialStatus);

  useEffect(() => {
    if (open) {
      setText(initialText);
      setStatus(initialStatus);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 pb-8 max-h-[90vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between mb-5 border-b border-white/[0.05] pb-3">
          <h2 className="font-bold text-base text-ink">Your signal</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-white"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Live preview */}
        <div className="flex justify-center mb-5">
          <NoteBubble text={text} placeholder="Set a note" />
        </div>

        {/* Note input */}
        <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wide block mb-1.5">Note</label>
        <textarea
          maxLength={80}
          placeholder="What are you up to? e.g. Free after 3, anyone for chai?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="input w-full text-sm resize-none"
        />
        <div className="text-right mt-1">
          <span className="text-[10px] text-ink-mute">{text.length}/80</span>
        </div>

        {/* Availability status */}
        <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wide block mb-2 mt-4">Availability</label>
        <div className="grid grid-cols-2 gap-2">
          {STATUSES.map((s) => {
            const active = status === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatus(active ? null : s.id)}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border transition active:scale-95 ${
                  active ? "border-white/25 bg-white/[0.06]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${s.dot} shrink-0`} style={{ boxShadow: active ? `0 0 0 3px ${s.ring}33` : undefined }} />
                <span className={`text-xs font-semibold ${active ? "text-ink" : "text-ink-soft"}`}>{s.label}</span>
                {active && <CheckIcon className="w-4 h-4 ml-auto text-brand-300 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 mt-6">
          <button
            type="button"
            onClick={() => onSave("", null)}
            className="flex-1 py-3 text-xs font-bold bg-white/[0.05] hover:bg-white/10 active:scale-95 transition rounded-xl text-red-400"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => onSave(text, status)}
            className="flex-1 py-3 text-xs font-bold btn-primary rounded-xl"
          >
            Share signal
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
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [editSignalOpen, setEditSignalOpen] = useState(false);
  const [signals, setSignals] = useState<any[]>([]);

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
      setConvos([...DEMO_CONVOS]);
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
        .select("id, name, type, avatar")
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
        .from("profiles")
        .select("id, name, username, avatar_url, verified, college, course, year, bio, links, business_name, availability")
        .eq("college", profile.college)
        .neq("id", user!.id)
        .limit(15);

      const signalsList = (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name.split(" ")[0],
        signal: p.bio ? p.bio.slice(0, 45) : null,
        avatar_url: p.avatar_url,
        status: p.availability ?? null,
        peer: p,
      })).filter(s => s.signal || s.status);

      // load my own current signal + status
      const me = await supabase.from("profiles").select("bio, availability").eq("id", user!.id).single();
      if (me.data) {
        setMySignal(me.data.bio || "");
        setMyStatus(me.data.availability ?? null);
      }

      setSignals(signalsList);
    } catch (err) {
      console.error(err);
    }
  }

  // ── Edit Signal modal controls ──────────────────────────────────────────────
  function handleSaveSignal(txt: string, status: string | null) {
    setMySignal(txt.trim());
    setMyStatus(status);
    setEditSignalOpen(false);
    if (!demo && user) {
      supabase
        .from("profiles")
        .update({ bio: txt.trim(), availability: status })
        .eq("id", user.id)
        .then(() => {
          loadLiveSignals();
        });
    }
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
      const demoMsgs = DEMO_MESSAGES[convo.group_id as keyof typeof DEMO_MESSAGES] ?? [];
      setMessages(demoMsgs.map(m => ({
        id: m.id,
        sender_id: m.sender_id,
        content: m.content,
        created_at: m.created_at,
        reactions: m.reactions ? [...m.reactions] as { emoji: string; from: string }[] : [],
        reply_to: null
      })));
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
      setMessages(prev => [...prev, fakeMsg]);
      
      // Update convo list last message preview
      setConvos(prev => prev.map(c => {
        if (c.group_id === activeDmId) {
          return { ...c, last_message: `You: ${content}`, last_at: new Date().toISOString() };
        }
        return c;
      }));

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

  // Filter conversations
  const filteredConvos = convos.filter(c => {
    // Check if blocked
    const blockedList = JSON.parse(localStorage.getItem("blocked_groups") || "[]");
    if (blockedList.includes(c.group_id)) return false;

    const q = search.toLowerCase();
    if (c.type === "dm") {
      const peerDisplayName = c.peer ? getNickname(c.peer.id, c.peer.name, c.group_id) : "";
      return peerDisplayName.toLowerCase().includes(q) || (c.peer?.username || "").toLowerCase().includes(q);
    }
    return (c.group_name || "").toLowerCase().includes(q);
  });

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

  return (
    <div className="flex flex-col min-h-screen bg-black text-white max-w-2xl mx-auto border-x border-white/[0.04]">
      {/* SCREEN 1 — INBOX (default view) */}
      {!activeDmId && (
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
              const meStatus = statusMeta(myStatus);
              return (
                <div className="flex flex-col items-center gap-1.5 shrink-0 w-[76px]">
                  {/* Note bubble */}
                  <NoteBubble text={mySignal} placeholder="Set a note" />
                  {/* Avatar */}
                  <button
                    onClick={() => setEditSignalOpen(true)}
                    className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition shrink-0"
                    style={meStatus ? { boxShadow: `0 0 0 2px #000, 0 0 0 4px ${meStatus.ring}` } : undefined}
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
                  <span className={`text-[10px] font-semibold text-center leading-tight ${meStatus ? meStatus.text : "text-ink-mute"}`}>
                    {meStatus ? meStatus.short : "You"}
                  </span>
                </div>
              );
            })()}

            {/* Other signals */}
            {signals.map((sig) => {
              const st = statusMeta(sig.status);
              const ringStyle = st
                ? { boxShadow: `0 0 0 2px #000, 0 0 0 4px ${st.ring}` }
                : { boxShadow: `0 0 0 2px #000, 0 0 0 4px rgba(255,255,255,0.12)` };
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
                    {st && (
                      <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-black ${st.dot}`} />
                    )}
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
                    <div key={m.id} className="flex flex-col w-full">
                      {/* 5 min Gap Time Divider */}
                      {showTimeDivider && (
                        <div className="w-full flex justify-center py-2.5 my-2">
                          <span className="bg-white/[0.04] border border-white/[0.06] text-ink-mute text-[10px] font-medium px-3 py-1 rounded-full select-none">
                            {formatDividerTime(m.created_at)}
                          </span>
                        </div>
                      )}

                      {/* Message Bubble Cluster container */}
                      <div className={`flex items-end gap-2.5 ${mine ? "justify-end ml-auto" : "justify-start mr-auto"} max-w-[85%] relative`}>
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
          <div className="p-3.5 border-t border-white/[0.07] bg-[#0c0c0e]/95 pb-28 shrink-0">
            <div className="flex gap-2.5 items-center">
              {/* Attachment */}
              <button className="w-9 h-9 rounded-full bg-white/[0.04] hover:bg-white/10 flex items-center justify-center shrink-0 text-ink-soft active:scale-95 transition">
                <PaperclipIcon className="w-5 h-5" />
              </button>

              {/* Text bar */}
              <div className="flex-1 bg-[#1a1a1a] rounded-2xl px-4 py-1.5 flex items-center gap-2">
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
                  className="bg-transparent text-sm text-white placeholder-white/40 focus:outline-none flex-grow resize-none max-h-24 py-1.5 align-middle"
                />

                {msgInput.trim() && (
                  <button
                    onClick={handleSend}
                    className="w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center shrink-0 active:scale-95 transition text-white"
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
        initialStatus={myStatus}
        onClose={() => setEditSignalOpen(false)}
        onSave={handleSaveSignal}
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
    <div className="relative w-full flex flex-col">
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
        className={`relative group max-w-[85%] rounded-2xl px-4 py-2.5 text-xs md:text-sm ${
          mine
            ? `${themeBgClass || "bg-brand-500"} text-white rounded-tr-none ml-auto`
            : "bg-[#1e1e1e] border border-white/[0.06] text-ink rounded-tl-none mr-auto"
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
        <span className="text-[9.5px] text-white/50 block mt-1 text-right select-none flex items-center justify-end gap-1">
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
            { icon: <UserIcon className="w-5 h-5" />, label: "Profile", action: () => { if (peer) onViewProfile(peer); } },
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

          {/* Nicknames */}
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

          {/* Create a group chat */}
          <button
            onClick={() => { onBack(); onCreateGroup(); }}
            className="w-full flex items-center gap-3.5 px-3 py-4 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] transition text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-brand-500 flex items-center justify-center shrink-0">
              <UsersIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink">Create a group chat</p>
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

        {/* Block / Report danger zone */}
        <div className="mt-8 px-4 pb-4 space-y-0.5 select-none">
          <button
            onClick={() => setBlockConfirmOpen(true)}
            className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/[0.06] active:bg-red-500/10 transition inline-flex items-center gap-2"
          >
            <BanIcon className="w-4 h-4 text-red-400" />
            Block {isGroup ? "Group" : displayName?.split(" ")[0]}
          </button>
          <button
            onClick={() => setReportSheetOpen(true)}
            className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/[0.06] active:bg-red-500/10 transition inline-flex items-center gap-2"
          >
            <AlertIcon className="w-4 h-4 text-red-400" />
            Report
          </button>
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
            <h3 className="font-bold text-base text-ink">Block {isGroup ? "Group" : displayName}?</h3>
            <p className="text-xs text-ink-mute">
              {isGroup 
                ? "You will no longer receive messages from this group, and it will be removed from your inbox."
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
                Block
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
                  readReceipts ? "translate-x-5.5" : "translate-x-0.5"
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
                  activityStatus ? "translate-x-5.5" : "translate-x-0.5"
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
                  restricted ? "translate-x-5.5" : "translate-x-0.5"
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
