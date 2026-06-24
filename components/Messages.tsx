"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isDemo } from "@/lib/config";
import { CheckIcon } from "./icons";

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_CONVOS = [
  {
    group_id: "dg1",
    peer: { id: "dp1", name: "Arjun Sharma", username: "arjun_s", avatar_url: null, verified: true },
    last_message: "bro study group at 6?",
    last_at: new Date(Date.now() - 900000).toISOString(),
    unread: 2,
  },
  {
    group_id: "dg2",
    peer: { id: "dp3", name: "Rohan Mehta", username: "rohanm", avatar_url: null, verified: false },
    last_message: "yeah I'm in for the hackathon",
    last_at: new Date(Date.now() - 7200000).toISOString(),
    unread: 0,
  },
];

const DEMO_MESSAGES: Record<string, any[]> = {
  dg1: [
    { id: "dm1", sender_id: "dp1", content: "hey! you free this evening?", created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: "dm2", sender_id: "me",  content: "yeah what's up", created_at: new Date(Date.now() - 1700000).toISOString() },
    { id: "dm3", sender_id: "dp1", content: "bro study group at 6?", created_at: new Date(Date.now() - 900000).toISOString() },
  ],
  dg2: [
    { id: "dm4", sender_id: "me",  content: "saw your signal - hackathon team?", created_at: new Date(Date.now() - 10800000).toISOString() },
    { id: "dm5", sender_id: "dp3", content: "yeah I'm in for the hackathon", created_at: new Date(Date.now() - 7200000).toISOString() },
  ],
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function Avatar({ person, size = 10 }: { person: any; size?: number }) {
  const initials = (person.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const cls = `w-${size} h-${size} rounded-full flex items-center justify-center font-bold shrink-0`;
  return person.avatar_url
    ? <img src={person.avatar_url} alt={person.name} className={`${cls} object-cover border border-white/10`} />
    : <div className={`${cls} bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs`}>{initials}</div>;
}

export default function Messages({ onChatOpen }: { onChatOpen?: (open: boolean) => void }) {
  const { user } = useAuth();
  const demo = isDemo();

  const [convos, setConvos] = useState<any[]>([]);
  const [loading, setLoading] = useState(!demo);
  const [activeDmId, setActiveDmId] = useState<string | null>(null);
  const [activePeer, setActivePeer] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load conversations ────────────────────────────────────────────────────
  useEffect(() => {
    if (demo) { setConvos(DEMO_CONVOS); return; }
    if (!user) return;
    loadConvos();
  }, [user]);

  async function loadConvos() {
    setLoading(true);
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user!.id);

    if (!memberships?.length) { setLoading(false); return; }
    const groupIds = memberships.map((m: any) => m.group_id);

    const { data: allMembers } = await supabase
      .from("group_members")
      .select("group_id, user_id, profiles(id, name, username, avatar_url, verified)")
      .in("group_id", groupIds)
      .neq("user_id", user!.id);

    const { data: lastMsgs } = await supabase
      .from("messages")
      .select("group_id, content, created_at, sender_id")
      .in("group_id", groupIds)
      .order("created_at", { ascending: false });

    const lastByGroup: Record<string, any> = {};
    for (const m of lastMsgs ?? []) {
      if (!lastByGroup[m.group_id]) lastByGroup[m.group_id] = m;
    }

    const list = (allMembers ?? []).map((m: any) => ({
      group_id: m.group_id,
      peer: m.profiles,
      last_message: lastByGroup[m.group_id]?.content ?? "",
      last_at: lastByGroup[m.group_id]?.created_at ?? "",
      unread: 0,
    })).sort((a: any, b: any) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());

    setConvos(list);
    setLoading(false);
  }

  // ── Open a DM ─────────────────────────────────────────────────────────────
  function openChat(groupId: string, peer: any) {
    setActiveDmId(groupId);
    setActivePeer(peer);
    onChatOpen?.(true);
    if (demo) {
      setMessages(DEMO_MESSAGES[groupId] ?? []);
      return;
    }
    loadMessages(groupId);
  }

  async function loadMessages(groupId: string) {
    setMsgLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at");
    setMessages(data ?? []);
    setMsgLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  // ── Realtime messages ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeDmId || demo) return;
    const ch = supabase.channel(`msgs-${activeDmId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${activeDmId}` },
        (payload) => {
          setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeDmId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMsg() {
    if (!msgInput.trim() || !activeDmId) return;
    const content = msgInput.trim();
    setMsgInput("");
    if (demo) {
      const fake = { id: `fake-${Date.now()}`, sender_id: "me", content, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, fake]);
      return;
    }
    const { data } = await supabase.from("messages")
      .insert({ group_id: activeDmId, sender_id: user!.id, content, type: "text" })
      .select();
    if (data?.[0]) setMessages(prev => prev.some(m => m.id === data[0].id) ? prev : [...prev, data[0]]);
  }

  // ── Chat screen ───────────────────────────────────────────────────────────
  if (activeDmId && activePeer) {
    return (
      <div className="flex flex-col h-screen max-h-screen bg-black text-white overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] shrink-0 bg-[#0c0c0e]/80 backdrop-blur-md">
          <button
            onClick={() => { setActiveDmId(null); setActivePeer(null); onChatOpen?.(false); }}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 active:scale-90 transition flex items-center justify-center shrink-0"
          >←</button>
          <Avatar person={activePeer} size={9} />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-ink text-sm truncate">{activePeer.name}</span>
              {activePeer.verified && (
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px]">
                  <CheckIcon className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
            {activePeer.username && <p className="text-[10px] text-brand-300 font-medium truncate">@{activePeer.username}</p>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 bg-black">
          {msgLoading
            ? <div className="flex items-center justify-center h-full opacity-40">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            : messages.length === 0
            ? <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                <span className="text-4xl mb-2">💬</span>
                <p className="text-sm font-bold text-ink">No messages yet</p>
                <p className="text-xs text-ink-mute mt-1">Say something</p>
              </div>
            : messages.map(m => {
                const mine = demo ? m.sender_id === "me" : m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${mine ? "bg-brand-500 text-white rounded-tr-none" : "bg-white/[0.08] text-ink rounded-tl-none border border-white/[0.05]"}`}>
                      <p className="break-words leading-relaxed">{m.content}</p>
                      <span className="text-[9px] opacity-50 block mt-1 text-right">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })
          }
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-white/[0.07] bg-[#0c0c0e]/80 pb-28 shrink-0">
          <form onSubmit={e => { e.preventDefault(); sendMsg(); }} className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message…"
              value={msgInput}
              onChange={e => setMsgInput(e.target.value)}
              className="input flex-1 text-sm py-2.5"
            />
            <button type="submit" disabled={!msgInput.trim()} className="btn-primary px-4 disabled:opacity-40">Send</button>
          </form>
        </div>
      </div>
    );
  }

  // ── Inbox list ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black pb-28">
      <div className="px-5 pt-12 pb-4 border-b border-white/[0.07]">
        <h1 className="text-xl font-bold text-ink">Messages</h1>
        <p className="text-xs text-ink-mute mt-0.5">Direct messages with your connections</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 opacity-40">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : convos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6 opacity-50">
          <span className="text-5xl mb-3">💬</span>
          <p className="text-sm font-bold text-ink">No messages yet</p>
          <p className="text-xs text-ink-mute mt-1">Follow someone on Frequency and start a DM when they follow back</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {convos.map(c => (
            <button
              key={c.group_id}
              onClick={() => openChat(c.group_id, c.peer)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.03] active:bg-white/[0.05] transition text-left"
            >
              <div className="relative shrink-0">
                <Avatar person={c.peer} size={12} />
                {c.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {c.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className={`font-bold text-sm truncate ${c.unread > 0 ? "text-ink" : "text-ink-soft"}`}>
                    {c.peer.name}
                  </span>
                  {c.peer.verified && (
                    <span className="inline-flex items-center justify-center w-3 h-3 bg-brand-500 text-white rounded-full text-[6px] shrink-0">
                      <CheckIcon className="w-2 h-2" />
                    </span>
                  )}
                </div>
                <p className={`text-xs truncate ${c.unread > 0 ? "text-ink-soft font-medium" : "text-ink-mute"}`}>
                  {c.last_message || "Start the conversation"}
                </p>
              </div>
              <span className="text-[10px] text-ink-mute shrink-0 self-start mt-1">
                {c.last_at ? timeAgo(c.last_at) : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
