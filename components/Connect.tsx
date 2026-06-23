"use client";

/**
 * CONNECT TAB — owned by Antigravity.
 * Overhauled to support Direct Messages (DMs), horizontal Stories bar, 
 * classmate profiles, Highlights, Search and Follow suggestions, and 
 * polished attachment-enabled chat threads.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useStore } from "./store";
import { dueLabel, todayISO, DAY_SHORT, daysUntil } from "@/lib/dates";
import { Sheet, Ring, triggerConfetti, playTick, playPop, playChime } from "./ui";
import {
  UsersIcon,
  PlusIcon,
  CheckIcon,
  TrashIcon,
  ChevronRight,
} from "./icons";
import { StudyGroup, Subject, GroupTask, Story, Classmate, GroupMessage, DayKey } from "@/lib/types";
import { StoryViewerModal } from "./Profile";
import { DEMO_LISTINGS } from "./Marketplace";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isDemo } from "@/lib/config";

function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "📕";
    case "xls":
    case "xlsx":
    case "csv":
      return "📊";
    case "doc":
    case "docx":
    case "txt":
    case "rtf":
      return "📝";
    case "ppt":
    case "pptx":
      return "📈";
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return "📦";
    case "js":
    case "ts":
    case "tsx":
    case "jsx":
    case "html":
    case "css":
    case "py":
    case "java":
    case "cpp":
    case "c":
    case "json":
    case "sh":
      return "💻";
    case "mp3":
    case "wav":
    case "m4a":
    case "ogg":
      return "🎵";
    default:
      return "📄";
  }
}

// Local Custom Icons to avoid modifying components/icons.tsx
const PaperclipIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const MessageIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// Helper for Initials
function InitialsAvatar({ name, avatar, isMe }: { name: string; avatar?: string; isMe?: boolean }) {
  if (avatar && avatar.startsWith("data:")) {
    return (
      <div className="w-7 h-7 rounded-full overflow-hidden border border-white shrink-0">
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  if (avatar) {
    return (
      <div className="w-7 h-7 rounded-full bg-white/[0.07] flex items-center justify-center text-sm border border-white shrink-0">
        {avatar}
      </div>
    );
  }
  if (isMe) {
    return (
      <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center text-[10px] font-bold border border-white shrink-0">
        Me
      </div>
    );
  }
  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-pink-100 text-pink-700 border-pink-200",
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
  ];
  const colorClass = colors[Math.abs(hash) % colors.length];

  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border border-white shrink-0 ${colorClass}`}
      title={name}
    >
      {initials || "?"}
    </div>
  );
}

function AvatarStack({ members, classmatesMap }: { members: string[]; classmatesMap: Record<string, Classmate> }) {
  const displayLimit = 3;
  const visibleMembers = members.slice(0, displayLimit);
  const totalCount = members.length + 1;
  const remainingCount = totalCount - (visibleMembers.length + 1);

  return (
    <div className="flex -space-x-1.5 items-center shrink-0">
      <InitialsAvatar name="Me" isMe />
      {visibleMembers.map((m, idx) => {
        const c = classmatesMap[m];
        return <InitialsAvatar key={idx} name={m} avatar={c?.avatar} />;
      })}
      {remainingCount > 0 && (
        <div className="w-7 h-7 rounded-full bg-white/[0.07] text-ink-mute flex items-center justify-center text-[10px] font-semibold border border-white shrink-0">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

function isSameDay(d1Str: string, d2Str: string) {
  const d1 = new Date(d1Str);
  const d2 = new Date(d2Str);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatSeparatorDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

const DEMO_PEOPLE = [
  { id:"dp1", name:"Arjun Sharma",  username:"arjun_s",  course:"B.Tech CSE", year:2, college:"IIIT Hyderabad",    is_private:false, verified:true  },
  { id:"dp2", name:"Priya Nair",    username:"priya.n",  course:"B.Tech ECE", year:3, college:"IIIT Hyderabad",    is_private:true,  verified:false },
  { id:"dp3", name:"Rohan Mehta",   username:"rohanm",   course:"B.Com",      year:1, college:"Osmania University", is_private:false, verified:false },
  { id:"dp4", name:"Sneha Rao",     username:"sneha.r",  course:"MBA",        year:2, college:"BITS Pilani Hyd",   is_private:true,  verified:true  },
  { id:"dp5", name:"Karan Patel",   username:"karanp",   course:"B.Tech Mech",year:3, college:"NIT Warangal",      is_private:false, verified:false },
  { id:"dp6", name:"Divya Krishna", username:"divyak",   course:"BCA",        year:2, college:"Osmania University", is_private:false, verified:false },
];
const DEMO_REQUESTS_DATA = [
  { follower_id:"dr1", profiles:{ id:"dr1", name:"Vikram Singh",  username:"vikrams", college:"IIT Hyderabad",     avatar_url:null } },
  { follower_id:"dr2", profiles:{ id:"dr2", name:"Ananya Reddy",  username:"ananya_r",college:"KL University",      avatar_url:null } },
];

function LiveConnect({ onSwitchTab, onChatOpen }: { onSwitchTab?: (tab: any) => void; onChatOpen?: (open: boolean) => void }) {
  const { user, profile } = useAuth();
  const demo = isDemo();

  // Sub-tabs
  const [subTab, setSubTab] = useState<"people" | "requests">("people");
  const [scope, setScope] = useState<"campus" | "all">("campus");

  // People list
  const [people, setPeople] = useState<any[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);

  // follow states: userId → 'none' | 'pending' | 'following' | 'mutual'
  const [followStates, setFollowStates] = useState<Record<string, string>>({});

  // Pending incoming requests
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [reqCount, setReqCount] = useState(0);

  // Free/busy status for mutuals
  const [freeBusy, setFreeBusy] = useState<Record<string, "free" | "busy">>({});

  // DM state
  const [activeDmId, setActiveDmId] = useState<string | null>(null);
  const [activePeer, setActivePeer] = useState<any | null>(null);
  const [messages, setMessages] = useState<{ id: string; sender_id: string; content: string; created_at: string }[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Demo mode seed ───────────────────────────────────────
  useEffect(() => {
    if (!demo) return;
    setPeople(DEMO_PEOPLE as any[]);
    setFollowStates({ dp1:"mutual", dp2:"pending", dp3:"following", dp4:"none", dp5:"none", dp6:"none" });
    setFreeBusy({ dp1:"free", dp3:"busy" });
    setReqCount(DEMO_REQUESTS_DATA.length);
    setLoadingPeople(false);
  }, [demo]);

  // ── Fetch people + follow states ──────────────────────────
  useEffect(() => {
    if (demo || !user || !profile?.college) { if (!demo) setLoadingPeople(false); return; }
    setLoadingPeople(true);
    (async () => {
      let query = supabase
        .from("profiles")
        .select("id, name, username, course, year, avatar_url, verified, college, is_private")
        .neq("id", user.id)
        .limit(60);
      if (scope === "campus") query = query.eq("college", profile.college);
      const { data: peopleData } = await query;
      if (!peopleData) { setLoadingPeople(false); return; }
      setPeople(peopleData);

      const ids = peopleData.map((p: any) => p.id);
      const [{ data: outgoing }, { data: incoming }] = await Promise.all([
        supabase.from("follows").select("following_id,status").eq("follower_id", user.id).in("following_id", ids),
        supabase.from("follows").select("follower_id,status").eq("following_id", user.id).in("follower_id", ids),
      ]);
      const outMap = Object.fromEntries((outgoing ?? []).map((f: any) => [f.following_id, f.status]));
      const inMap  = Object.fromEntries((incoming ?? []).map((f: any) => [f.follower_id, f.status]));
      const states: Record<string, string> = {};
      for (const p of peopleData) {
        const myOut = outMap[p.id];
        const theirOut = inMap[p.id];
        if (myOut === "accepted" && theirOut === "accepted") states[p.id] = "mutual";
        else if (myOut === "accepted") states[p.id] = "following";
        else if (myOut === "pending")  states[p.id] = "pending";
        else                           states[p.id] = "none";
      }
      setFollowStates(states);

      // free/busy for mutuals
      const mutualIds = Object.entries(states).filter(([,v]) => v === "mutual").map(([k]) => k);
      if (mutualIds.length > 0) {
        const now = new Date();
        const day = now.getDay();
        const cur = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
        const { data: slots } = await supabase.from("timetable").select("user_id,start_time,end_time").in("user_id", mutualIds).eq("day", day);
        const fb: Record<string, "free"|"busy"> = {};
        for (const id of mutualIds) {
          const s = (slots ?? []).filter((x: any) => x.user_id === id);
          fb[id] = s.some((x: any) => x.start_time <= cur && x.end_time > cur) ? "busy" : "free";
        }
        setFreeBusy(fb);
      }
      setLoadingPeople(false);
    })();
  }, [user, profile, scope]);

  // ── Fetch request count (badge) ───────────────────────────
  useEffect(() => {
    if (demo || !user) return;
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id).eq("status", "pending")
      .then(({ count }) => setReqCount(count ?? 0));
  }, [user, demo]);

  // ── Fetch requests when tab opens ────────────────────────
  useEffect(() => {
    if (subTab !== "requests") return;
    if (demo) { setRequests(DEMO_REQUESTS_DATA as any[]); return; }
    if (!user) return;
    setLoadingReqs(true);
    supabase.from("follows")
      .select("follower_id, created_at, profiles!follows_follower_id_fkey(id,name,username,college,avatar_url)")
      .eq("following_id", user.id).eq("status", "pending")
      .then(({ data }) => { setRequests(data ?? []); setLoadingReqs(false); });
  }, [subTab, user, demo]);

  // ── Follow / unfollow ────────────────────────────────────
  async function handleFollow(person: any) {
    const cur = followStates[person.id] ?? "none";
    if (demo) {
      if (cur === "none") setFollowStates(p => ({ ...p, [person.id]: person.is_private ? "pending" : "following" }));
      else if (cur !== "mutual") setFollowStates(p => ({ ...p, [person.id]: "none" }));
      return;
    }
    if (!user) return;
    if (cur === "none") {
      const status = person.is_private ? "pending" : "accepted";
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: person.id, status });
      if (!error) {
        const next = person.is_private ? "pending" : "following";
        setFollowStates(p => ({ ...p, [person.id]: next }));
        if (!person.is_private) {
          const { data } = await supabase.from("follows").select("status").eq("follower_id", person.id).eq("following_id", user.id).maybeSingle();
          if (data?.status === "accepted") setFollowStates(p => ({ ...p, [person.id]: "mutual" }));
        }
      }
    } else if (cur === "pending" || cur === "following" || cur === "mutual") {
      const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", person.id);
      if (!error) setFollowStates(p => ({ ...p, [person.id]: "none" }));
    }
  }

  // ── Accept / decline request ─────────────────────────────
  async function acceptReq(followerId: string) {
    if (!demo) await supabase.from("follows").update({ status: "accepted" }).eq("follower_id", followerId).eq("following_id", user!.id);
    setRequests(p => p.filter((r: any) => r.follower_id !== followerId));
    setReqCount(c => Math.max(0, c - 1));
  }
  async function declineReq(followerId: string) {
    if (!demo) await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", user!.id);
    setRequests(p => p.filter((r: any) => r.follower_id !== followerId));
    setReqCount(c => Math.max(0, c - 1));
  }

  // ── Open DM (mutuals only) ───────────────────────────────
  async function openDm(person: any) {
    if (demo) { alert("DMs are disabled in demo mode. Sign up to chat for real!"); return; }
    setActivePeer(person);
    onChatOpen?.(true);
    const { data, error } = await supabase.rpc("create_dm", { other_user_id: person.id });
    if (error) { console.error(error); onChatOpen?.(false); setActivePeer(null); }
    else setActiveDmId(data as string);
  }

  // ── Load messages ────────────────────────────────────────
  useEffect(() => {
    if (!activeDmId) return;
    setMsgLoading(true);
    supabase.from("messages").select("*").eq("group_id", activeDmId).order("created_at").then(({ data }) => {
      setMessages(data ?? []);
      setMsgLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  }, [activeDmId]);

  // ── Realtime messages ────────────────────────────────────
  useEffect(() => {
    if (!activeDmId) return;
    const ch = supabase.channel(`dm-${activeDmId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${activeDmId}` }, (payload) => {
        setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new as any]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeDmId]);

  // ── Send message ─────────────────────────────────────────
  async function sendMsg() {
    if (!msgInput.trim() || !activeDmId || !user) return;
    const content = msgInput.trim();
    setMsgInput("");
    const { data, error } = await supabase.from("messages").insert({ group_id: activeDmId, sender_id: user.id, content, type: "text" }).select();
    if (!error && data?.[0]) {
      setMessages(prev => prev.some(m => m.id === data[0].id) ? prev : [...prev, data[0]]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  // ── Avatar helper ────────────────────────────────────────
  function Avatar({ person, size = 12 }: { person: any; size?: number }) {
    const initials = (person.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
    const cls = `w-${size} h-${size} rounded-full flex items-center justify-center font-bold text-sm shrink-0`;
    return person.avatar_url
      ? <img src={person.avatar_url} alt={person.name} className={`${cls} object-cover border border-white/10`} />
      : <div className={`${cls} bg-brand-500/20 text-brand-300 border border-brand-500/30`}>{initials}</div>;
  }

  // ── DM chat screen ───────────────────────────────────────
  if (activeDmId && activePeer) {
    return (
      <div className="flex flex-col h-screen max-h-screen bg-black text-white overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] shrink-0 bg-[#0c0c0e]/80 backdrop-blur-md sticky top-0 z-50">
          <button onClick={() => { setActiveDmId(null); setActivePeer(null); onChatOpen?.(false); }}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 active:scale-90 transition flex items-center justify-center shrink-0">←</button>
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar person={activePeer} size={9} />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-ink text-sm truncate">{activePeer.name}</span>
                {activePeer.verified && <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full p-0.5 text-[7px]"><CheckIcon className="w-2.5 h-2.5" /></span>}
              </div>
              {activePeer.username && <p className="text-[10px] text-brand-300 font-medium truncate">@{activePeer.username}</p>}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3.5 bg-[#000]">
          {msgLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2 opacity-50">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-ink-mute">Loading…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
              <span className="text-3xl mb-2">👋</span>
              <p className="text-xs font-bold text-ink">No messages yet</p>
              <p className="text-[10px] text-ink-mute mt-1">Say hi!</p>
            </div>
          ) : messages.map((m) => {
            const isMine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3 animate-fade-up`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs md:text-sm ${isMine ? "bg-brand-500 text-white rounded-tr-none" : "bg-white/[0.08] text-ink rounded-tl-none border border-white/[0.05]"}`}>
                  <p className="leading-relaxed break-words">{m.content}</p>
                  <span className="text-[9px] text-white/50 block mt-1 text-right">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="p-3 border-t border-white/[0.07] bg-[#0c0c0e]/80 backdrop-blur-md pb-28 shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); sendMsg(); }} className="flex gap-2 items-center">
            <input type="text" placeholder="Type a message…" value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="input flex-grow text-xs md:text-sm py-2.5" />
            <button type="submit" disabled={!msgInput.trim()} className="btn-primary px-4 py-2.5 text-xs disabled:opacity-40">Send</button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main screen ──────────────────────────────────────────
  return (
    <div className="pb-28 min-h-screen no-scrollbar animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-ink">Connect</h2>
      </div>

      {/* Sub-tabs: People | Requests */}
      <div className="flex border-b border-white/[0.07] px-5 mb-4">
        {(["people", "requests"] as const).map((t) => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`flex-1 py-2.5 text-sm font-semibold relative transition ${subTab === t ? "text-brand-400 border-b-2 border-brand-500" : "text-ink-mute"}`}>
            {t === "people" ? "People" : (
              <span className="flex items-center justify-center gap-1.5">
                Requests
                {reqCount > 0 && <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold">{reqCount}</span>}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── People tab ── */}
      {subTab === "people" && (
        <div className="px-5">
          {/* Campus scope toggle */}
          <div className="flex bg-white/[0.06] rounded-2xl p-1 mb-5">
            {(["campus", "all"] as const).map((s) => (
              <button key={s} onClick={() => setScope(s)}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition ${scope === s ? "bg-brand-500 text-white" : "text-ink-mute hover:text-ink"}`}>
                {s === "campus" ? "My Campus" : "All Campuses"}
              </button>
            ))}
          </div>

          {loadingPeople ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-3xl bg-white/[0.04] animate-pulse" />)}</div>
          ) : people.length === 0 ? (
            <div className="p-8 text-center bg-[#0c0c0e]/90 border border-white/[0.07] rounded-3xl">
              <p className="text-sm text-ink-mute">{scope === "campus" ? "No one from your campus yet — share the app!" : "No students yet."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {people.map((person) => {
                const state = followStates[person.id] ?? "none";
                const fb = freeBusy[person.id];
                return (
                  <div key={person.id} className="bg-[#0c0c0e]/90 border border-white/[0.07] rounded-3xl p-4 flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Avatar person={person} size={12} />
                      {fb && (
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${fb === "free" ? "bg-green-400" : "bg-white/30"}`} title={fb === "free" ? "Free now" : "In class"} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-ink text-sm truncate">{person.name}</span>
                        {person.is_private && <span className="text-[10px] text-ink-mute">🔒</span>}
                        {person.verified && <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px]"><CheckIcon className="w-2.5 h-2.5" /></span>}
                      </div>
                      {person.username && <p className="text-[11px] text-brand-300 font-medium leading-none mt-0.5">@{person.username}</p>}
                      <p className="text-[11px] text-ink-mute mt-1 truncate">
                        {person.course} · Y{person.year}
                        {scope === "all" && person.college && ` · ${person.college}`}
                        {fb === "free" && state === "mutual" && <span className="text-green-400 ml-1">· Free now</span>}
                        {fb === "busy" && state === "mutual" && <span className="text-ink-mute ml-1">· In class</span>}
                      </p>
                    </div>
                    {/* Follow / Message button */}
                    {state === "none" && (
                      <button onClick={() => handleFollow(person)} className="shrink-0 px-3.5 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-bold active:scale-95 transition">Follow</button>
                    )}
                    {state === "pending" && (
                      <button onClick={() => handleFollow(person)} className="shrink-0 px-3.5 py-1.5 rounded-xl bg-white/[0.06] text-ink-mute text-xs font-bold border border-white/[0.1] active:scale-95 transition">Requested</button>
                    )}
                    {state === "following" && (
                      <button onClick={() => handleFollow(person)} className="shrink-0 px-3.5 py-1.5 rounded-xl bg-white/[0.06] text-brand-400 text-xs font-bold border border-brand-500/30 active:scale-95 transition">Following</button>
                    )}
                    {state === "mutual" && (
                      <button onClick={() => openDm(person)} className="shrink-0 px-3.5 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition">
                        <span>💬</span> Message
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Requests tab ── */}
      {subTab === "requests" && (
        <div className="px-5">
          {loadingReqs ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-3xl bg-white/[0.04] animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-3xl mb-3">✅</p>
              <p className="text-sm text-ink-mute">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req: any) => {
                const p = req.profiles;
                return (
                  <div key={req.follower_id} className="bg-[#0c0c0e]/90 border border-white/[0.07] rounded-3xl p-4 flex items-center gap-3">
                    <Avatar person={p} size={10} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-ink text-sm truncate">{p?.name}</p>
                      <p className="text-[11px] text-ink-mute">{p?.username ? `@${p.username}` : p?.college}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => acceptReq(req.follower_id)} className="px-3 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-bold active:scale-95 transition">Accept</button>
                      <button onClick={() => declineReq(req.follower_id)} className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-ink-mute text-xs border border-white/[0.1] active:scale-95 transition">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Connect({ onSwitchTab, onChatOpen }: { onSwitchTab?: (tab: any) => void; onChatOpen?: (open: boolean) => void }) {
  return <LiveConnect onSwitchTab={onSwitchTab} onChatOpen={onChatOpen} />;
}
