"use client";

import { useState, useEffect, useRef, useCallback } from "react"; // frequency
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isDemo } from "@/lib/config";
import {
  CheckIcon,
  ArrowLeftIcon,
  ChatIcon,
  LockIcon,
  SearchIcon,
  XIcon,
  SignalIcon,
  CampusIcon,
  GlobeIcon,
  SendIcon,
  CoffeeIcon,
  BookIcon,
  HelpIcon,
  UsersGroupIcon,
  ConfettiIcon,
  TagIcon,
  ClockIcon,
  BookmarkIcon,
  ShareIcon
} from "./icons";

// ── Intents configuration ────────────────────────────────────────────────────
export const INTENTS = [
  { id: "free", label: "Free now", color: "#22c55e", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", activeBg: "bg-emerald-500 text-white border-emerald-500", icon: CoffeeIcon },
  { id: "study", label: "Studying", color: "#3b82f6", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", activeBg: "bg-blue-500 text-white border-blue-500", icon: BookIcon },
  { id: "help", label: "Need help", color: "#f59e0b", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", activeBg: "bg-amber-500 text-white border-amber-500", icon: HelpIcon },
  { id: "looking", label: "Looking for", color: "#8b5cf6", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20", activeBg: "bg-purple-500 text-white border-purple-500", icon: UsersGroupIcon },
  { id: "event", label: "Event", color: "#ec4899", bg: "bg-pink-500/10 text-pink-400 border-pink-500/20", activeBg: "bg-pink-500 text-white border-pink-500", icon: ConfettiIcon },
  { id: "sell", label: "Sell", color: "#14b8a6", bg: "bg-teal-500/10 text-teal-400 border-teal-500/20", activeBg: "bg-teal-500 text-white border-teal-500", icon: TagIcon },
];

// Helper to compute expires_at timestamp
export function getExpiresAt(duration: "1h" | "4h" | "today"): Date {
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

// ── Demo data ────────────────────────────────────────────────────────────────
const DEMO_SIGNALS = [
  { 
    id:"ds1", 
    user_id:"dp1", 
    content:"DBMS grind rn 📚", 
    intent: "study",
    reach: "campus",
    expires_at: new Date(Date.now() + 7200000).toISOString(),
    created_at: new Date(Date.now()-7200000).toISOString(), 
    profiles:{ name:"Arjun Sharma",  username:"arjun_s",  course:"B.Tech CSE", year:2, college:"IIIT Hyderabad",    verified:true,  is_private:false, avatar_url:null }
  },
  { 
    id:"ds2", 
    user_id:"dp2", 
    content:"anyone for chai at 4pm? ☕", 
    intent: "free",
    reach: "campus",
    expires_at: new Date(Date.now() + 10800000).toISOString(),
    created_at: new Date(Date.now()-1800000).toISOString(), 
    profiles:{ name:"Priya Nair",    username:"priya.n",  course:"B.Tech ECE", year:3, college:"IIIT Hyderabad",    verified:false, is_private:true,  avatar_url:null }
  },
  { 
    id:"ds3", 
    user_id:"dp3", 
    content:"need remote frontend developer for next-gen fintech project 🚀", 
    intent: "looking",
    reach: "all",
    expires_at: new Date(Date.now() + 14400000).toISOString(),
    created_at: new Date(Date.now()-18000000).toISOString(),
    profiles:{ name:"Rohan Mehta",   username:"rohanm",   course:"B.Com",      year:1, college:"Osmania University",verified:false, is_private:false, avatar_url:null }
  },
  { 
    id:"ds4", 
    user_id:"dp4", 
    content:"selling brand new mechanical keyboard, keychron k2, ping if interested!", 
    intent: "sell",
    reach: "all",
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    created_at: new Date(Date.now()-3600000).toISOString(), 
    profiles:{ name:"Sneha Rao",     username:"sneha.r",  course:"MBA",        year:2, college:"BITS Pilani Hyd",  verified:true,  is_private:false, avatar_url:null }
  },
  { 
    id:"ds5", 
    user_id:"dp5", 
    content:"anyone explain OS scheduling? exam tomorrow 🙏", 
    intent: "help",
    reach: "campus",
    expires_at: new Date(Date.now() + 5400000).toISOString(),
    created_at: new Date(Date.now()-900000).toISOString(),  
    profiles:{ name:"Karan Patel",   username:"karanp",   course:"B.Tech Mech",year:3, college:"IIIT Hyderabad",   verified:false, is_private:false, avatar_url:null }
  },
  { 
    id:"ds6", 
    user_id:"dp6", 
    content:"hosting sunset photography meet this saturday 🏕️", 
    intent: "event",
    reach: "all",
    expires_at: new Date(Date.now() + 21600000).toISOString(),
    created_at: new Date(Date.now()-5400000).toISOString(), 
    profiles:{ name:"Divya Krishna", username:"divyak",   course:"BCA",        year:2, college:"Osmania University",verified:false, is_private:false, avatar_url:null }
  },
];
const DEMO_FOLLOW_STATES: Record<string,string> = { dp1:"mutual", dp2:"pending", dp3:"following", dp4:"none", dp5:"none", dp6:"none" };
const DEMO_REQUESTS = [
  { follower_id:"dr1", profiles:{ id:"dr1", name:"Vikram Singh",  username:"vikrams", college:"IIT Hyderabad",  avatar_url:null }},
  { follower_id:"dr2", profiles:{ id:"dr2", name:"Ananya Reddy",  username:"ananya_r",college:"KL University",   avatar_url:null }},
];
const DEMO_SEARCH_PEOPLE = [
  { id:"dp1", name:"Arjun Sharma",  username:"arjun_s",  course:"B.Tech CSE", year:2, college:"IIIT Hyderabad",    verified:true,  is_private:false },
  { id:"dp2", name:"Priya Nair",    username:"priya.n",  course:"B.Tech ECE", year:3, college:"IIIT Hyderabad",    verified:false, is_private:true  },
  { id:"dp3", name:"Rohan Mehta",   username:"rohanm",   course:"B.Com",      year:1, college:"Osmania University",verified:false, is_private:false },
  { id:"dp5", name:"Karan Patel",   username:"karanp",   course:"B.Tech Mech",year:3, college:"IIIT Hyderabad",   verified:false, is_private:false },
  { id:"dp6", name:"Divya Krishna", username:"divyak",   course:"BCA",        year:2, college:"Osmania University",verified:false, is_private:false },
];

// ── Time helper ───────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ person, size = 10 }: { person: any; size?: number }) {
  const initials = (person.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const cls = `w-${size} h-${size} rounded-full flex items-center justify-center font-bold text-sm shrink-0`;
  return person.avatar_url
    ? <img src={person.avatar_url} alt={person.name} className={`${cls} object-cover border border-white/10`} />
    : <div className={`${cls} bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs`}>{initials}</div>;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Connect({ onSwitchTab, onChatOpen }: { onSwitchTab?: (t: any) => void; onChatOpen?: (o: boolean) => void }) {
  const { user, profile } = useAuth();
  const demo = isDemo();

  // Tabs
  const [subTab, setSubTab] = useState<"frequency" | "requests">("frequency");

  // Search
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Frequency feed
  const [scope, setScope] = useState<"campus" | "all">("campus");
  const [signals, setSignals] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  
  // Rich active user signal state
  const [mySignal, setMySignal] = useState<string | null>(null);
  const [mySignalIntent, setMySignalIntent] = useState<string | null>(null);
  const [mySignalReach, setMySignalReach] = useState<"campus" | "all">("campus");
  const [mySignalExpiresAt, setMySignalExpiresAt] = useState<string | null>(null);

  // Composer sheet states
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastInput, setBroadcastInput] = useState("");
  const [broadcastIntent, setBroadcastIntent] = useState<string>("free");
  const [broadcastReach, setBroadcastReach] = useState<"campus" | "all">("campus");
  const [broadcastDuration, setBroadcastDuration] = useState<"1h" | "4h" | "today">("4h");
  
  const [saving, setSaving] = useState(false);

  // Follow states
  const [followStates, setFollowStates] = useState<Record<string, string>>(demo ? DEMO_FOLLOW_STATES : {});

  // Requests
  const [requests, setRequests] = useState<any[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqCount, setReqCount] = useState(demo ? DEMO_REQUESTS.length : 0);

  // DM
  const [activeDmId, setActiveDmId] = useState<string | null>(null);
  const [activePeer, setActivePeer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Profile sheet
  const [viewProfile, setViewProfile] = useState<any | null>(null);

  // Lock reach selector to campus if free intent is selected
  useEffect(() => {
    if (broadcastIntent === "free") {
      setBroadcastReach("campus");
    }
  }, [broadcastIntent]);

  // ── Demo seed ───────────────────────────────────────────
  useEffect(() => {
    if (!demo) return;
    setSignals(DEMO_SIGNALS as any[]);
    setFeedLoading(false);
    setMySignal(null);
    setMySignalIntent(null);
    setMySignalReach("campus");
    setMySignalExpiresAt(null);
  }, [demo]);

  // ── Load feed ───────────────────────────────────────────
  useEffect(() => {
    if (demo || !user || !profile?.college) { if (!demo) setFeedLoading(false); return; }
    loadFeed();
  }, [user, profile, scope, demo]);

  async function loadFeed() {
    setFeedLoading(true);
    const [feedRes, mySignalRes] = await Promise.all([
      supabase.from("signals")
        .select("*, profiles!signals_user_id_fkey(name,username,course,year,college,verified,is_private,avatar_url)")
        .gt("expires_at", new Date().toISOString())
        .neq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(60),
      supabase.from("signals")
        .select("content, intent, reach, expires_at")
        .eq("user_id", user!.id)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle(),
    ]);

    let data = feedRes.data ?? [];
    
    // Sort campus-first (optional fallback if needed)
    if (profile?.college) {
      data = [...data].sort((a, b) => {
        const ac = a.profiles?.college === profile.college ? 0 : 1;
        const bc = b.profiles?.college === profile.college ? 0 : 1;
        return ac - bc || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    // Filter based on selected scope
    if (scope === "campus") {
      data = data.filter((s: any) => s.profiles?.college === profile?.college);
    } else {
      data = data.filter((s: any) => s.reach === "all");
    }

    // Load follow states
    const ids = data.map((s: any) => s.user_id);
    if (ids.length > 0) {
      const [{ data: out }, { data: inc }] = await Promise.all([
        supabase.from("follows").select("following_id,status").eq("follower_id", user!.id).in("following_id", ids),
        supabase.from("follows").select("follower_id,status").eq("following_id", user!.id).in("follower_id", ids),
      ]);
      const outMap = Object.fromEntries((out ?? []).map((f: any) => [f.following_id, f.status]));
      const inMap  = Object.fromEntries((inc ?? []).map((f: any) => [f.follower_id, f.status]));
      const states: Record<string, string> = {};
      for (const s of data) {
        const myOut = outMap[s.user_id], theirOut = inMap[s.user_id];
        if (myOut === "accepted" && theirOut === "accepted") states[s.user_id] = "mutual";
        else if (myOut === "accepted") states[s.user_id] = "following";
        else if (myOut === "pending")  states[s.user_id] = "pending";
        else                           states[s.user_id] = "none";
      }
      setFollowStates(prev => ({ ...prev, ...states }));
    }

    setSignals(data);
    
    if (mySignalRes.data) {
      setMySignal(mySignalRes.data.content);
      setMySignalIntent(mySignalRes.data.intent);
      setMySignalReach(mySignalRes.data.reach as "campus" | "all");
      setMySignalExpiresAt(mySignalRes.data.expires_at);
    } else {
      setMySignal(null);
      setMySignalIntent(null);
      setMySignalReach("campus");
      setMySignalExpiresAt(null);
    }
    setFeedLoading(false);
  }

  // ── Broadcast signal ────────────────────────────────────
  async function broadcastSignal() {
    const text = broadcastInput.trim();
    if (!text) return;
    setSaving(true);
    
    const expiresAt = getExpiresAt(broadcastDuration);
    
    if (demo) {
      setMySignal(text);
      setMySignalIntent(broadcastIntent);
      setMySignalReach(broadcastReach);
      setMySignalExpiresAt(expiresAt.toISOString());
      
      const newSig = {
        id: "my-signal-id",
        user_id: user?.id || "me",
        content: text,
        intent: broadcastIntent,
        reach: broadcastReach,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        profiles: {
          name: profile?.name || "Me",
          username: profile?.username || "me",
          course: profile?.course || "B.Tech CSE",
          year: profile?.year || 2,
          college: profile?.college || "IIIT Hyderabad",
          verified: profile?.verified || false,
          is_private: (profile as any)?.is_private || false,
          avatar_url: profile?.avatar_url || null
        }
      };
      
      // Upsert in local signals state
      setSignals(prev => [newSig, ...prev.filter(s => s.user_id !== (user?.id || "me"))]);
      
      setBroadcasting(false);
      setBroadcastInput("");
      setSaving(false);
      return;
    }
    
    const expiresAtIso = expiresAt.toISOString();
    await supabase.from("signals").upsert({ 
      user_id: user!.id, 
      content: text, 
      intent: broadcastIntent,
      reach: broadcastReach,
      expires_at: expiresAtIso 
    }, { onConflict: "user_id" });
    
    setMySignal(text);
    setMySignalIntent(broadcastIntent);
    setMySignalReach(broadcastReach);
    setMySignalExpiresAt(expiresAtIso);
    
    setBroadcasting(false);
    setBroadcastInput("");
    setSaving(false);
    
    loadFeed();
  }

  async function clearSignal() {
    if (demo) {
      setMySignal(null);
      setMySignalIntent(null);
      setMySignalReach("campus");
      setMySignalExpiresAt(null);
      setSignals(prev => prev.filter(s => s.user_id !== (user?.id || "me")));
      return;
    }
    await supabase.from("signals").delete().eq("user_id", user!.id);
    setMySignal(null);
    setMySignalIntent(null);
    setMySignalReach("campus");
    setMySignalExpiresAt(null);
    loadFeed();
  }

  // ── Search ──────────────────────────────────────────────
  const searchTimeout = useRef<any>(null);
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      if (demo) {
        const q = search.toLowerCase();
        const res = DEMO_SEARCH_PEOPLE.filter(p => p.name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q));
        setSearchResults(res);
        return;
      }
      if (!user) return;
      setSearchLoading(true);
      const { data } = await supabase.from("profiles").select("id,name,username,course,year,college,verified,is_private,avatar_url")
        .neq("id", user.id).or(`name.ilike.%${search}%,username.ilike.%${search}%`).limit(20);
      setSearchResults(data ?? []);
      // Load follow states for results
      if (data && data.length > 0) {
        const ids = data.map((p: any) => p.id);
        const [{ data: out }, { data: inc }] = await Promise.all([
          supabase.from("follows").select("following_id,status").eq("follower_id", user.id).in("following_id", ids),
          supabase.from("follows").select("follower_id,status").eq("following_id", user.id).in("follower_id", ids),
        ]);
        const outMap = Object.fromEntries((out ?? []).map((f: any) => [f.following_id, f.status]));
        const inMap  = Object.fromEntries((inc ?? []).map((f: any) => [f.follower_id, f.status]));
        const states: Record<string, string> = {};
        for (const p of data) {
          const myOut = outMap[p.id], theirOut = inMap[p.id];
          if (myOut === "accepted" && theirOut === "accepted") states[p.id] = "mutual";
          else if (myOut === "accepted") states[p.id] = "following";
          else if (myOut === "pending")  states[p.id] = "pending";
          else                           states[p.id] = "none";
        }
        setFollowStates(prev => ({ ...prev, ...states }));
      }
      setSearchLoading(false);
    }, 300);
  }, [search, user, demo]);

  // ── Follow / unfollow ───────────────────────────────────
  async function handleFollow(personId: string, isPrivate: boolean) {
    if (demo) {
      const cur = followStates[personId] ?? "none";
      if (cur === "none") setFollowStates(p => ({ ...p, [personId]: isPrivate ? "pending" : "following" }));
      else if (cur !== "mutual") setFollowStates(p => ({ ...p, [personId]: "none" }));
      return;
    }
    if (!user) return;
    const cur = followStates[personId] ?? "none";
    if (cur === "none") {
      const status = isPrivate ? "pending" : "accepted";
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: personId, status });
      if (!error) {
        setFollowStates(p => ({ ...p, [personId]: isPrivate ? "pending" : "following" }));
        if (!isPrivate) {
          const { data } = await supabase.from("follows").select("status").eq("follower_id", personId).eq("following_id", user.id).maybeSingle();
          if (data?.status === "accepted") setFollowStates(p => ({ ...p, [personId]: "mutual" }));
        }
      }
    } else if (cur !== "mutual") {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", personId);
      setFollowStates(p => ({ ...p, [personId]: "none" }));
    }
  }

  // ── Requests ────────────────────────────────────────────
  useEffect(() => {
    if (subTab !== "requests") return;
    if (demo) { setRequests(DEMO_REQUESTS as any[]); return; }
    if (!user) return;
    setReqLoading(true);
    supabase.from("follows").select("follower_id,created_at,profiles!follows_follower_id_fkey(id,name,username,college,avatar_url)")
      .eq("following_id", user.id).eq("status", "pending")
      .then(({ data }) => { setRequests(data ?? []); setReqLoading(false); });
  }, [subTab, user, demo]);

  useEffect(() => {
    if (demo || !user) return;
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id).eq("status", "pending")
      .then(({ count }) => setReqCount(count ?? 0));
  }, [user, demo]);

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

  // ── DM ──────────────────────────────────────────────────
  async function openDm(person: any) {
    if (demo) { alert("Sign up to message for real!"); return; }
    setActivePeer(person); onChatOpen?.(true);
    const { data, error } = await supabase.rpc("create_dm", { other_user_id: person.id });
    if (error) { onChatOpen?.(false); setActivePeer(null); }
    else setActiveDmId(data as string);
  }

  useEffect(() => {
    if (!activeDmId) return;
    setMsgLoading(true);
    supabase.from("messages").select("*").eq("group_id", activeDmId).order("created_at")
      .then(({ data }) => { setMessages(data ?? []); setMsgLoading(false); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100); });
  }, [activeDmId]);

  useEffect(() => {
    if (!activeDmId) return;
    const ch = supabase.channel(`dm-${activeDmId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${activeDmId}` }, (payload) => {
        setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new as any]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeDmId]);

  async function sendMsg() {
    if (!msgInput.trim() || !activeDmId || !user) return;
    const content = msgInput.trim(); setMsgInput("");
    const { data } = await supabase.from("messages").insert({ group_id: activeDmId, sender_id: user.id, content, type: "text" }).select();
    if (data?.[0]) setMessages(prev => prev.some(m => m.id === data[0].id) ? prev : [...prev, data[0]]);
  }

  // ── Follow button ────────────────────────────────────────
  function FollowBtn({ personId, isPrivate }: { personId: string; isPrivate: boolean }) {
    const state = followStates[personId] ?? "none";
    if (state === "mutual") return (
      <button onClick={() => openDm({ id: personId })}
        className="shrink-0 h-8 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1.5 active:scale-95 transition-all">
        <ChatIcon className="w-3.5 h-3.5" />
        <span>Message</span>
      </button>
    );
    if (state === "following") return (
      <button onClick={() => handleFollow(personId, isPrivate)}
        className="shrink-0 h-8 px-3 rounded-xl bg-white/[0.04] text-brand-300 text-[11px] font-bold border border-brand-500/20 hover:border-brand-500/30 active:scale-95 transition-all">
        Following
      </button>
    );
    if (state === "pending") return (
      <button onClick={() => handleFollow(personId, isPrivate)}
        className="shrink-0 h-8 px-3 rounded-xl bg-white/[0.04] text-ink-mute text-[11px] font-bold border border-white/[0.06] active:scale-95 transition-all">
        Requested
      </button>
    );
    return (
      <button onClick={() => handleFollow(personId, isPrivate)}
        className="shrink-0 h-8 px-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-bold active:scale-95 transition-all">
        Follow
      </button>
    );
  }

  // ── DM chat screen ───────────────────────────────────────
  if (activeDmId && activePeer) {
    return (
      <div className="flex flex-col h-screen max-h-screen bg-black text-white overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] shrink-0 bg-[#0c0c0e]/95 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => { setActiveDmId(null); setActivePeer(null); onChatOpen?.(false); }}
            className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center shrink-0 text-white">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <Avatar person={activePeer} size={9} />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-ink text-sm truncate">{activePeer.name}</span>
              {activePeer.verified && <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px]"><CheckIcon className="w-2.5 h-2.5" /></span>}
            </div>
            {activePeer.username && <p className="text-[10px] text-brand-300 font-medium truncate">@{activePeer.username}</p>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 bg-black">
          {msgLoading ? <div className="flex items-center justify-center h-full opacity-40"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
            : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                <SignalIcon className="w-12 h-12 text-white/10 mb-3 animate-pulse" />
                <p className="text-xs font-bold text-ink">On the same frequency</p>
                <p className="text-[10px] text-ink-mute mt-1">Start the conversation by typing below.</p>
              </div>
            )
            : messages.map(m => {
              const mine = m.sender_id === user?.id;
              return <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${mine ? "bg-brand-500 text-white rounded-tr-none" : "bg-white/[0.08] text-ink rounded-tl-none border border-white/[0.05]"}`}>
                  <p className="break-words leading-relaxed">{m.content}</p>
                  <span className="text-[9px] opacity-50 block mt-1 text-right">{new Date(m.created_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</span>
                </div>
              </div>;
            })}
          <div ref={bottomRef} />
        </div>
        <div className="px-4 pt-2.5 border-t border-white/[0.07] bg-[#0c0c0e]/95 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <form onSubmit={e => { e.preventDefault(); sendMsg(); }} className="flex gap-2.5 items-center">
            <div className="flex-1 bg-[#1a1a1a] rounded-full px-4 min-h-[40px] flex items-center">
              <input type="text" placeholder="Message…" value={msgInput} onChange={e => setMsgInput(e.target.value)} className="bg-transparent text-sm text-white placeholder-white/40 focus:outline-none flex-grow py-2.5" />
            </div>
            <button type="submit" disabled={!msgInput.trim()} className="w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 active:scale-95 transition flex items-center justify-center text-white shrink-0">
              <SendIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Profile sheet ────────────────────────────────────────
  if (viewProfile) {
    const p = viewProfile;
    const state = followStates[p.id] ?? followStates[p.user_id] ?? "none";
    const personId = p.id ?? p.user_id;
    const isPrivate = p.is_private ?? p.profiles?.is_private ?? false;
    const profileData = p.profiles ?? p;
    return (
      <div className="min-h-screen bg-black animate-fade-in pb-28">
        <div className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-white/[0.07] bg-[#0c0c0e]/95 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => setViewProfile(null)} className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-white shrink-0">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <span className="font-bold text-ink">Profile</span>
        </div>
        <div className="px-5 pt-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar person={profileData} size={16} />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-ink">{profileData.name}</h2>
                {(profileData.verified) && <span className="inline-flex items-center justify-center w-4 h-4 bg-brand-500 text-white rounded-full text-[8px]"><CheckIcon className="w-3 h-3" /></span>}
                {profileData.is_private && <LockIcon className="w-3.5 h-3.5 text-ink-mute shrink-0" />}
              </div>
              {profileData.username && <p className="text-sm text-brand-300 font-medium">@{profileData.username}</p>}
              <p className="text-xs text-ink-mute mt-1">{profileData.course} · Y{profileData.year} · {profileData.college}</p>
            </div>
          </div>
          {/* Current signal */}
          {p.content && (
            <div className="bg-brand-500/[0.03] border border-brand-500/10 rounded-3xl p-5 mb-5 flex items-start gap-3.5">
              <SignalIcon className="w-5 h-5 text-brand-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-1">Broadcasting</p>
                <p className="text-sm text-ink font-semibold leading-relaxed">"{p.content}"</p>
                <p className="text-[10px] text-ink-mute mt-1.5">{timeAgo(p.created_at)} ago</p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            {state === "mutual" ? (
              <button onClick={() => { setViewProfile(null); openDm(profileData); }}
                className="flex-1 h-12 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-95 transition text-white text-sm font-bold flex items-center justify-center gap-2">
                <ChatIcon className="w-4 h-4" />
                <span>Message</span>
              </button>
            ) : (
              <button onClick={() => handleFollow(personId, isPrivate)}
                className={`flex-1 h-12 rounded-2xl text-sm font-bold transition active:scale-95 flex items-center justify-center gap-2 ${
                  state === "none" ? "bg-brand-500 hover:bg-brand-600 text-white" :
                  state === "pending" ? "bg-white/[0.06] text-ink-mute border border-white/[0.08]" :
                  "bg-white/[0.06] text-brand-300 border border-brand-500/20"
                }`}>
                <span>{state === "none" ? "Follow" : state === "pending" ? "Requested" : "Following"}</span>
                {state === "following" && <CheckIcon className="w-4 h-4 text-brand-300" />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const showingSearch = search.trim().length > 0;

  return (
    <div className="pb-28 min-h-screen no-scrollbar animate-fade-in">

      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              <SearchIcon className="w-4 h-4" />
            </span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input w-full pl-10 pr-10 py-3 text-sm rounded-2xl bg-[#1a1a1a] border border-white/[0.05] text-white focus:outline-none focus:border-brand-500/50 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white active:scale-90 transition shrink-0">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Search results ── */}
      {showingSearch ? (
        <div className="px-5">
          {searchLoading && <div className="text-center py-8 text-ink-mute text-sm">Searching…</div>}
          {!searchLoading && searchResults.length === 0 && (
            <div className="text-center py-10 text-ink-mute text-sm">No one found for "{search}"</div>
          )}
          <div className="space-y-2.5">
            {searchResults.map((p: any) => (
              <div key={p.id} onClick={() => setViewProfile(p)}
                className="bg-[#0c0c0e]/90 border border-white/[0.07] rounded-3xl p-5 flex items-center gap-3.5 cursor-pointer hover:border-white/12 active:scale-[0.98] transition-all">
                <Avatar person={p} size={10} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-ink text-sm truncate">{p.name}</span>
                    {p.verified && <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px]"><CheckIcon className="w-2.5 h-2.5" /></span>}
                    {p.is_private && <LockIcon className="w-3.5 h-3.5 text-ink-mute shrink-0" />}
                  </div>
                  {p.username && <p className="text-[11px] text-brand-300 font-medium">@{p.username}</p>}
                  <p className="text-[11px] text-ink-mute truncate mt-0.5">{p.course} · Y{p.year} · {p.college}</p>
                </div>
                <div onClick={e => e.stopPropagation()} className="shrink-0 select-none">
                  <FollowBtn personId={p.id} isPrivate={p.is_private} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ── Sub-tabs ── */}
          <div className="flex border-b border-white/[0.07] px-5 mb-5 select-none">
            {(["frequency", "requests"] as const).map(t => (
              <button key={t} onClick={() => setSubTab(t)}
                className={`flex-1 py-3 text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${subTab === t ? "text-brand-400 border-b-2 border-brand-500 font-bold" : "text-ink-mute"}`}>
                {t === "frequency" ? (
                  <>
                    <SignalIcon className="w-4 h-4" />
                    <span>Frequency</span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Requests</span>
                    {reqCount > 0 && <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold">{reqCount}</span>}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Frequency tab ── */}
          {subTab === "frequency" && (
            <div className="px-5">

              {/* My signal */}
              <button onClick={() => {
                setBroadcastInput(mySignal ?? "");
                setBroadcastIntent(mySignalIntent ?? "free");
                setBroadcastReach(mySignalReach ?? "campus");
                setBroadcastDuration("4h");
                setBroadcasting(true);
              }}
                className={`w-full mb-5 rounded-3xl border p-5 text-left transition-all active:scale-[0.98] ${
                  mySignal ? "bg-brand-500/[0.04] border-brand-500/20 hover:border-brand-500/30" : "bg-white/[0.02] border-white/[0.07] border-dashed hover:border-white/12"
                }`}>
                <div className="flex items-center gap-3">
                  <span style={mySignal && mySignalIntent ? { color: INTENTS.find(i => i.id === mySignalIntent)?.color } : {}}>
                    <SignalIcon className={`w-5 h-5 shrink-0 ${mySignal ? "animate-pulse" : "text-ink-mute opacity-40"}`} />
                  </span>
                  <div className="flex-1 min-w-0">
                    {mySignal ? (
                      <>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: INTENTS.find(i => i.id === mySignalIntent)?.color || "#10b981" }}>
                            Broadcasting · {INTENTS.find(i => i.id === mySignalIntent)?.label || "Signal"}
                          </p>
                          {mySignalReach === "all" && (
                            <span className="text-[8px] font-extrabold bg-purple-500/15 text-purple-400 px-1.5 py-0.2 rounded-full border border-purple-500/20 select-none">ALL CAMPUSES</span>
                          )}
                        </div>
                        <p className="text-sm text-ink font-semibold truncate">"{mySignal}"</p>
                      </>
                    ) : (
                      <p className="text-sm text-ink-soft">What are you broadcasting right now?</p>
                    )}
                  </div>
                  {mySignal && (
                    <button onClick={e => { e.stopPropagation(); clearSignal(); }}
                      className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/10 active:scale-90 transition flex items-center justify-center text-ink-soft hover:text-red-400 shrink-0">
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </button>

              {/* Campus toggle */}
              <div className="flex bg-white/[0.04] border border-white/[0.05] rounded-2xl p-1 mb-5 select-none">
                {(["campus", "all"] as const).map(s => (
                  <button key={s} onClick={() => setScope(s)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${scope === s ? "bg-brand-500 text-white shadow-md" : "text-ink-soft hover:bg-white/[0.02]"}`}>
                    {s === "campus" ? (
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

              {/* Feed */}
              {feedLoading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-3xl bg-white/[0.03] animate-pulse" />)}</div>
              ) : signals.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center select-none opacity-60">
                  <SignalIcon className="w-12 h-12 text-white/10 mb-4" />
                  <p className="text-sm font-bold text-ink mb-1">No signals yet</p>
                  <p className="text-xs text-ink-mute max-w-[200px] mx-auto leading-normal">{scope === "campus" ? "Be the first to broadcast from your campus" : "No one is broadcasting right now"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {signals.map((sig: any) => {
                    const p = sig.profiles ?? sig;
                    const isCampus = p.college === profile?.college || (demo && ["IIIT Hyderabad"].includes(p.college));
                    return (
                      <div key={sig.id} onClick={() => setViewProfile(sig)}
                        className={`rounded-3xl border p-5 cursor-pointer transition-all active:scale-[0.98] ${
                          isCampus
                            ? "bg-brand-500/[0.04] border-brand-500/15 hover:border-brand-500/25"
                            : "bg-[#0c0c0e]/90 border-white/[0.07] hover:border-white/12"
                        }`}>
                        <div className="flex items-start gap-3.5">
                          <div className="relative shrink-0">
                            <Avatar person={p} size={10} />
                            {isCampus && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-500 rounded-full border-2 border-black flex items-center justify-center">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="font-bold text-ink text-sm truncate">{p.name}</span>
                              {p.verified && <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px]"><CheckIcon className="w-2.5 h-2.5" /></span>}
                              {isCampus && <span className="text-[9px] font-bold text-brand-400 bg-brand-500/15 px-2 py-0.5 rounded-full select-none">MY CAMPUS</span>}
                            </div>
                            <p className={`text-sm font-semibold mb-2 leading-relaxed ${isCampus ? "text-ink" : "text-ink-soft"}`}>"{sig.content}"</p>
                            <div className="flex items-center justify-between text-[11px] text-ink-mute">
                              <p>{p.course} · Y{p.year}</p>
                              <p>{timeAgo(sig.created_at)} ago</p>
                            </div>
                          </div>
                          <div onClick={e => e.stopPropagation()} className="shrink-0 select-none">
                            <FollowBtn personId={sig.user_id} isPrivate={p.is_private} />
                          </div>
                        </div>
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
              {reqLoading ? (
                <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-3xl bg-white/[0.04] animate-pulse" />)}</div>
              ) : requests.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center select-none opacity-60">
                  <div className="w-12 h-12 bg-white/[0.04] border border-white/[0.08] rounded-full flex items-center justify-center mb-4">
                    <CheckIcon className="w-6 h-6 text-brand-300" />
                  </div>
                  <p className="text-xs font-bold text-ink">No pending requests</p>
                  <p className="text-[10px] text-ink-mute mt-1">You are all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req: any) => {
                    const p = req.profiles;
                    return (
                      <div key={req.follower_id} className="bg-[#0c0c0e]/90 border border-white/[0.07] rounded-3xl p-5 flex items-center gap-3.5">
                        <Avatar person={p} size={10} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-ink text-sm truncate">{p?.name}</p>
                          <p className="text-[11px] text-ink-mute mt-0.5">{p?.username ? `@${p.username}` : p?.college}</p>
                        </div>
                        <div className="flex gap-2.5 shrink-0 select-none">
                          <button onClick={() => acceptReq(req.follower_id)} className="h-9 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 transition text-white text-xs font-bold flex items-center justify-center">Accept</button>
                          <button onClick={() => declineReq(req.follower_id)} className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/10 active:scale-95 transition text-ink-soft hover:text-red-400 border border-white/[0.08] flex items-center justify-center shrink-0">
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Broadcast Composer Sheet (Bottom Sheet) ── */}
      {broadcasting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-fade-in flex items-end">
          <div className="absolute inset-0" onClick={() => setBroadcasting(false)} />
          <div className="relative w-full bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 pb-8 max-h-[90vh] overflow-y-auto z-10 animate-slide-up">
            <div className="flex items-center justify-between mb-5 border-b border-white/[0.05] pb-3 select-none">
              <h2 className="font-bold text-base text-ink flex items-center gap-2">
                <SignalIcon className="w-5 h-5 text-brand-400 animate-pulse" />
                <span>What's your signal?</span>
              </h2>
              <button
                onClick={() => setBroadcasting(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-ink-soft hover:text-white"
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
                  <div className="w-full bg-[#141416] border border-white/[0.08] rounded-3xl p-5 relative text-left">
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
                          {broadcastInput.trim() ? `"${broadcastInput}"` : '"What is your signal right now?"'}
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
                <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wide">Signal Note</label>
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
              {mySignal && (
                <button
                  type="button"
                  onClick={() => {
                    clearSignal();
                    setBroadcasting(false);
                  }}
                  className="flex-1 h-12 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold active:scale-95 transition-all flex items-center justify-center"
                >
                  Clear Signal
                </button>
              )}
              <button
                type="button"
                onClick={() => setBroadcasting(false)}
                className={`h-12 rounded-2xl bg-white/[0.06] text-ink-soft hover:bg-white/10 active:scale-95 transition-all text-xs font-bold ${mySignal ? "px-6" : "flex-1"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={broadcastSignal}
                disabled={saving || !broadcastInput.trim()}
                className="flex-[2] h-12 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 active:scale-95 transition-all text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-brand-500/15"
              >
                {saving ? "Broadcasting…" : (
                  <>
                    <span>Broadcast Signal</span>
                    <SignalIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
