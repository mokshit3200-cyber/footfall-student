"use client";

import { useState, useEffect, useRef, useCallback } from "react"; // frequency
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isDemo } from "@/lib/config";
import { CheckIcon } from "./icons";

// ── Demo data ────────────────────────────────────────────────────────────────
const DEMO_SIGNALS = [
  { id:"ds1", user_id:"dp1", content:"DBMS grind rn 📚", created_at: new Date(Date.now()-7200000).toISOString(), profiles:{ name:"Arjun Sharma",  username:"arjun_s",  course:"B.Tech CSE", year:2, college:"IIIT Hyderabad",    verified:true,  is_private:false, avatar_url:null }},
  { id:"ds2", user_id:"dp2", content:"anyone for chai at 4pm? ☕",       created_at: new Date(Date.now()-1800000).toISOString(), profiles:{ name:"Priya Nair",    username:"priya.n",  course:"B.Tech ECE", year:3, college:"IIIT Hyderabad",    verified:false, is_private:true,  avatar_url:null }},
  { id:"ds3", user_id:"dp3", content:"need hackathon team 🚀",            created_at: new Date(Date.now()-18000000).toISOString(),profiles:{ name:"Rohan Mehta",   username:"rohanm",   course:"B.Com",      year:1, college:"Osmania University",verified:false, is_private:false, avatar_url:null }},
  { id:"ds4", user_id:"dp4", content:"placement prep SOS 😭",             created_at: new Date(Date.now()-3600000).toISOString(), profiles:{ name:"Sneha Rao",     username:"sneha.r",  course:"MBA",        year:2, college:"BITS Pilani Hyd",  verified:true,  is_private:false, avatar_url:null }},
  { id:"ds5", user_id:"dp5", content:"anyone explain OS scheduling? 🙏",  created_at: new Date(Date.now()-900000).toISOString(),  profiles:{ name:"Karan Patel",   username:"karanp",   course:"B.Tech Mech",year:3, college:"IIIT Hyderabad",   verified:false, is_private:false, avatar_url:null }},
  { id:"ds6", user_id:"dp6", content:"weekend trip planning 🏕️",          created_at: new Date(Date.now()-5400000).toISOString(), profiles:{ name:"Divya Krishna", username:"divyak",   course:"BCA",        year:2, college:"Osmania University",verified:false, is_private:false, avatar_url:null }},
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
  const [mySignal, setMySignal] = useState<string | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastInput, setBroadcastInput] = useState("");
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

  // ── Demo seed ───────────────────────────────────────────
  useEffect(() => {
    if (!demo) return;
    setSignals(DEMO_SIGNALS as any[]);
    setFeedLoading(false);
    setMySignal(null);
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
      supabase.from("signals").select("content").eq("user_id", user!.id).gt("expires_at", new Date().toISOString()).maybeSingle(),
    ]);

    let data = feedRes.data ?? [];
    // Campus-first sort
    if (profile?.college) {
      data = [...data].sort((a, b) => {
        const ac = a.profiles?.college === profile.college ? 0 : 1;
        const bc = b.profiles?.college === profile.college ? 0 : 1;
        return ac - bc || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    if (scope === "campus") data = data.filter((s: any) => s.profiles?.college === profile?.college);

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
    setMySignal(mySignalRes.data?.content ?? null);
    setFeedLoading(false);
  }

  // ── Broadcast signal ────────────────────────────────────
  async function broadcastSignal() {
    const text = broadcastInput.trim();
    if (!text) return;
    setSaving(true);
    if (demo) { setMySignal(text); setBroadcasting(false); setBroadcastInput(""); setSaving(false); return; }
    await supabase.from("signals").upsert({ user_id: user!.id, content: text, expires_at: new Date(Date.now() + 86400000).toISOString() }, { onConflict: "user_id" });
    setMySignal(text);
    setBroadcasting(false);
    setBroadcastInput("");
    setSaving(false);
  }

  async function clearSignal() {
    if (!demo) await supabase.from("signals").delete().eq("user_id", user!.id);
    setMySignal(null);
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
        className="shrink-0 px-3 py-1.5 rounded-xl bg-brand-500 text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition">
        💬 Message
      </button>
    );
    if (state === "following") return (
      <button onClick={() => handleFollow(personId, isPrivate)}
        className="shrink-0 px-3 py-1.5 rounded-xl bg-white/[0.06] text-brand-400 text-[11px] font-bold border border-brand-500/30 active:scale-95 transition">
        Following
      </button>
    );
    if (state === "pending") return (
      <button onClick={() => handleFollow(personId, isPrivate)}
        className="shrink-0 px-3 py-1.5 rounded-xl bg-white/[0.06] text-ink-mute text-[11px] font-bold border border-white/[0.1] active:scale-95 transition">
        Requested
      </button>
    );
    return (
      <button onClick={() => handleFollow(personId, isPrivate)}
        className="shrink-0 px-3 py-1.5 rounded-xl bg-brand-500 text-white text-[11px] font-bold active:scale-95 transition">
        Follow
      </button>
    );
  }

  // ── DM chat screen ───────────────────────────────────────
  if (activeDmId && activePeer) {
    return (
      <div className="flex flex-col h-screen max-h-screen bg-black text-white overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] shrink-0 bg-[#0c0c0e]/80 backdrop-blur-md">
          <button onClick={() => { setActiveDmId(null); setActivePeer(null); onChatOpen?.(false); }}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 active:scale-90 transition flex items-center justify-center shrink-0">←</button>
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
            : messages.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-center opacity-50"><span className="text-4xl mb-2">📡</span><p className="text-sm font-bold text-ink">On the same frequency</p><p className="text-xs text-ink-mute mt-1">Say something</p></div>
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
        <div className="p-3 border-t border-white/[0.07] bg-[#0c0c0e]/80 pb-28 shrink-0">
          <form onSubmit={e => { e.preventDefault(); sendMsg(); }} className="flex gap-2">
            <input type="text" placeholder="Type a message…" value={msgInput} onChange={e => setMsgInput(e.target.value)} className="input flex-1 text-sm py-2.5" />
            <button type="submit" disabled={!msgInput.trim()} className="btn-primary px-4 disabled:opacity-40">Send</button>
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
        <div className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-white/[0.07]">
          <button onClick={() => setViewProfile(null)} className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-ink shrink-0">←</button>
          <span className="font-bold text-ink">Profile</span>
        </div>
        <div className="px-5 pt-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar person={profileData} size={16} />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-ink">{profileData.name}</h2>
                {(profileData.verified) && <span className="inline-flex items-center justify-center w-4 h-4 bg-brand-500 text-white rounded-full text-[8px]"><CheckIcon className="w-3 h-3" /></span>}
                {(profileData.is_private) && <span className="text-xs text-ink-mute">🔒</span>}
              </div>
              {profileData.username && <p className="text-sm text-brand-300 font-medium">@{profileData.username}</p>}
              <p className="text-xs text-ink-mute mt-1">{profileData.course} · Y{profileData.year} · {profileData.college}</p>
            </div>
          </div>
          {/* Current signal */}
          {p.content && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 mb-5 flex items-start gap-3">
              <span className="text-brand-400 mt-0.5">📡</span>
              <div>
                <p className="text-xs text-ink-mute mb-1 font-semibold uppercase tracking-wider">Broadcasting</p>
                <p className="text-sm text-ink">"{p.content}"</p>
                <p className="text-[10px] text-ink-mute mt-1">{timeAgo(p.created_at)}</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {state === "mutual" ? (
              <button onClick={() => { setViewProfile(null); openDm(profileData); }}
                className="flex-1 btn-primary flex items-center justify-center gap-2">💬 Message</button>
            ) : (
              <button onClick={() => handleFollow(personId, isPrivate)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-[0.98] ${
                  state === "none" ? "btn-primary" :
                  state === "pending" ? "bg-white/[0.06] text-ink-mute border border-white/[0.1]" :
                  "bg-white/[0.06] text-brand-400 border border-brand-500/30"
                }`}>
                {state === "none" ? "Follow" : state === "pending" ? "Requested" : "Following"}
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute text-sm">🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input w-full pl-9 py-2.5 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute text-xs">✕</button>
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
                className="bg-[#0c0c0e]/90 border border-white/[0.07] rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-white/15 active:scale-[0.99] transition">
                <Avatar person={p} size={10} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-ink text-sm truncate">{p.name}</span>
                    {p.verified && <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px]"><CheckIcon className="w-2.5 h-2.5" /></span>}
                    {p.is_private && <span className="text-[10px] text-ink-mute">🔒</span>}
                  </div>
                  {p.username && <p className="text-[11px] text-brand-300 font-medium">@{p.username}</p>}
                  <p className="text-[11px] text-ink-mute truncate">{p.course} · Y{p.year} · {p.college}</p>
                </div>
                <FollowBtn personId={p.id} isPrivate={p.is_private} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ── Sub-tabs ── */}
          <div className="flex border-b border-white/[0.07] px-5 mb-4">
            {(["frequency", "requests"] as const).map(t => (
              <button key={t} onClick={() => setSubTab(t)}
                className={`flex-1 py-2.5 text-sm font-semibold transition ${subTab === t ? "text-brand-400 border-b-2 border-brand-500" : "text-ink-mute"}`}>
                {t === "frequency" ? "📡 Frequency" : (
                  <span className="flex items-center justify-center gap-1.5">
                    Requests
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
              {!broadcasting ? (
                <button onClick={() => { setBroadcastInput(mySignal ?? ""); setBroadcasting(true); }}
                  className={`w-full mb-5 rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.99] ${
                    mySignal ? "bg-brand-500/10 border-brand-500/30" : "bg-white/[0.04] border-white/[0.08] border-dashed"
                  }`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-lg ${mySignal ? "animate-pulse" : "opacity-40"}`}>📡</span>
                    <div className="flex-1 min-w-0">
                      {mySignal ? (
                        <>
                          <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-0.5">Broadcasting · 24h</p>
                          <p className="text-sm text-ink font-semibold truncate">"{mySignal}"</p>
                        </>
                      ) : (
                        <p className="text-sm text-ink-mute">What are you broadcasting right now?</p>
                      )}
                    </div>
                    {mySignal && (
                      <button onClick={e => { e.stopPropagation(); clearSignal(); }}
                        className="text-ink-mute text-xs hover:text-red-400 transition shrink-0">✕</button>
                    )}
                  </div>
                </button>
              ) : (
                <div className="mb-5 rounded-2xl border border-brand-500/40 bg-brand-500/10 p-4">
                  <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-2">📡 Set your signal</p>
                  <input autoFocus maxLength={80} value={broadcastInput} onChange={e => setBroadcastInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && broadcastSignal()}
                    className="input w-full text-sm mb-3" placeholder='"DBMS grind rn 📚"' />
                  <div className="flex gap-2">
                    <button onClick={broadcastSignal} disabled={saving || !broadcastInput.trim()}
                      className="flex-1 btn-primary text-sm py-2 disabled:opacity-40">
                      {saving ? "Broadcasting…" : "Broadcast 📡"}
                    </button>
                    <button onClick={() => setBroadcasting(false)} className="px-4 py-2 rounded-xl bg-white/[0.06] text-ink-mute text-sm">Cancel</button>
                  </div>
                </div>
              )}

              {/* Campus toggle */}
              <div className="flex bg-white/[0.06] rounded-2xl p-1 mb-5">
                {(["campus", "all"] as const).map(s => (
                  <button key={s} onClick={() => setScope(s)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${scope === s ? "bg-brand-500 text-white" : "text-ink-mute"}`}>
                    {s === "campus" ? "🏫 My Campus" : "🌍 All Campuses"}
                  </button>
                ))}
              </div>

              {/* Feed */}
              {feedLoading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />)}</div>
              ) : signals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-3">📡</p>
                  <p className="text-sm font-bold text-ink mb-1">No signals yet</p>
                  <p className="text-xs text-ink-mute">{scope === "campus" ? "Be the first to broadcast from your campus" : "No one is broadcasting right now"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {signals.map((sig: any) => {
                    const p = sig.profiles ?? sig;
                    const isCampus = p.college === profile?.college || (demo && ["IIIT Hyderabad"].includes(p.college));
                    return (
                      <div key={sig.id} onClick={() => setViewProfile(sig)}
                        className={`rounded-2xl border p-4 cursor-pointer transition active:scale-[0.99] ${
                          isCampus
                            ? "bg-brand-500/[0.07] border-brand-500/20 hover:border-brand-500/35"
                            : "bg-[#0c0c0e]/80 border-white/[0.07] hover:border-white/15"
                        }`}>
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0">
                            <Avatar person={p} size={10} />
                            {isCampus && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-500 rounded-full border-2 border-black flex items-center justify-center">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-bold text-ink text-sm truncate">{p.name}</span>
                              {p.verified && <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px]"><CheckIcon className="w-2.5 h-2.5" /></span>}
                              {isCampus && <span className="text-[9px] font-bold text-brand-400 bg-brand-500/15 px-1.5 py-0.5 rounded-full">MY CAMPUS</span>}
                            </div>
                            <p className={`text-sm font-semibold mb-1.5 ${isCampus ? "text-ink" : "text-ink-soft"}`}>"{sig.content}"</p>
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] text-ink-mute">{p.course} · Y{p.year}</p>
                              <p className="text-[11px] text-ink-mute">{timeAgo(sig.created_at)}</p>
                            </div>
                          </div>
                          <div onClick={e => e.stopPropagation()}>
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
                <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/[0.04] animate-pulse" />)}</div>
              ) : requests.length === 0 ? (
                <div className="text-center py-14">
                  <p className="text-3xl mb-3">✅</p>
                  <p className="text-sm text-ink-mute">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req: any) => {
                    const p = req.profiles;
                    return (
                      <div key={req.follower_id} className="bg-[#0c0c0e]/90 border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3">
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
        </>
      )}
    </div>
  );
}
