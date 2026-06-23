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

function LiveConnect({ onSwitchTab, onChatOpen }: { onSwitchTab?: (tab: any) => void; onChatOpen?: (open: boolean) => void }) {
  const { user, profile } = useAuth();
  const [classmates, setClassmates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"campus" | "all">("campus");

  // DM State
  const [activeDmId, setActiveDmId] = useState<string | null>(null);
  const [activePeer, setActivePeer] = useState<any | null>(null);
  const [messages, setMessages] = useState<{ id: string; sender_id: string; content: string; created_at: string }[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchClassmates() {
      if (!user || !profile?.college) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let query = supabase
          .from("profiles")
          .select("id, name, username, course, year, avatar_url, bio, verified, college")
          .neq("id", user.id)
          .limit(50);
        if (scope === "campus") query = query.eq("college", profile.college);
        const { data, error } = await query;
        if (error) {
          console.error(error);
        } else if (data) {
          setClassmates(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchClassmates();
  }, [user, profile, scope]);

  // Open DM on classmate card click
  async function openDm(classmate: any) {
    setActivePeer(classmate);
    onChatOpen?.(true);
    try {
      const { data, error } = await supabase.rpc("create_dm", { other_user_id: classmate.id });
      if (error) {
        console.error(error);
        alert("Error opening DM: " + error.message + "\n\nMake sure to run the create_dm SQL RPC function in your Supabase SQL Editor before testing.");
        onChatOpen?.(false);
        setActivePeer(null);
      } else {
        setActiveDmId(data as string);
      }
    } catch (err) {
      console.error(err);
      onChatOpen?.(false);
      setActivePeer(null);
    }
  }

  // Load messages when activeDmId changes
  useEffect(() => {
    if (!activeDmId) return;
    setMsgLoading(true);
    supabase.from("messages").select("*").eq("group_id", activeDmId).order("created_at").then(({ data, error }) => {
      if (error) {
        console.error(error);
      } else {
        setMessages(data ?? []);
      }
      setMsgLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  }, [activeDmId]);

  // Realtime subscription
  useEffect(() => {
    if (!activeDmId) return;
    const channel = supabase
      .channel(`dm-${activeDmId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${activeDmId}` }, (payload) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.new.id)) return prev;
          return [...prev, payload.new as any];
        });
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeDmId]);

  // Send message
  async function sendMsg() {
    if (!msgInput.trim() || !activeDmId || !user) return;
    const content = msgInput.trim();
    setMsgInput("");
    
    try {
      const { data, error } = await supabase.from("messages").insert({
        group_id: activeDmId,
        sender_id: user.id,
        content,
        type: "text",
      }).select();
      
      if (error) {
        console.error(error);
      } else if (data && data[0]) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data[0].id)) return prev;
          return [...prev, data[0]];
        });
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="px-5 pt-12 pb-28 min-h-screen no-scrollbar animate-fade-in">
        <h2 className="text-xl font-bold text-ink mb-6">Classmates</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#0c0c0e]/90 border border-white/[0.07] rounded-3xl p-4 flex items-center gap-4 animate-pulse"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active DM Chat Screen View
  if (activeDmId && activePeer) {
    return (
      <div className="flex flex-col h-screen max-h-screen bg-black text-white overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] shrink-0 bg-[#0c0c0e]/80 backdrop-blur-md sticky top-0 z-50">
          <button
            onClick={() => {
              setActiveDmId(null);
              setActivePeer(null);
              onChatOpen?.(false);
            }}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 active:scale-90 transition flex items-center justify-center shrink-0"
          >
            ←
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            {activePeer.avatar_url ? (
              <img
                src={activePeer.avatar_url}
                alt={activePeer.name}
                className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                {(activePeer.name || "").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-ink text-sm truncate">{activePeer.name}</span>
                {activePeer.verified && (
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full p-0.5 text-[7px]" title="Verified">
                    <CheckIcon className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              {activePeer.username && (
                <p className="text-[10px] text-brand-300 font-medium truncate">@{activePeer.username}</p>
              )}
            </div>
          </div>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3.5 bg-[#000]">
          {msgLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2 opacity-50">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-ink-mute">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
              <span className="text-3xl mb-2">👋</span>
              <p className="text-xs font-bold text-ink">No messages yet</p>
              <p className="text-[10px] text-ink-mute mt-1">Start the conversation by sending a wave.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"} mb-3 animate-fade-up`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs md:text-sm ${
                      isMine
                        ? "bg-brand-500 text-white rounded-tr-none"
                        : "bg-white/[0.08] text-ink rounded-tl-none border border-white/[0.05]"
                    }`}
                  >
                    <p className="leading-relaxed break-words">{m.content}</p>
                    <span className="text-[9px] text-white/50 block mt-1 text-right">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Message Input Form */}
        <div className="p-3 border-t border-white/[0.07] bg-[#0c0c0e]/80 backdrop-blur-md pb-28 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMsg();
            }}
            className="flex gap-2 items-center"
          >
            <input
              type="text"
              placeholder="Type a message..."
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              className="input flex-grow text-xs md:text-sm py-2.5"
            />
            <button
              type="submit"
              disabled={!msgInput.trim()}
              className="btn-primary px-4 py-2.5 text-xs md:text-sm disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-12 pb-28 min-h-screen no-scrollbar animate-fade-in">
      <h2 className="text-xl font-bold text-ink mb-4">Connect</h2>

      {/* Scope toggle */}
      <div className="flex bg-white/[0.06] rounded-2xl p-1 mb-6">
        {(["campus", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition ${
              scope === s
                ? "bg-brand-500 text-white shadow"
                : "text-ink-mute hover:text-ink"
            }`}
          >
            {s === "campus" ? "My Campus" : "All Campuses"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-3xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : classmates.length === 0 ? (
        <div className="card p-8 text-center bg-[#0c0c0e]/90 border border-white/[0.07] rounded-3xl mt-4">
          <p className="text-sm text-ink-mute">
            {scope === "campus"
              ? "No classmates found yet — share the app with your batchmates!"
              : "No students found yet — be the first to invite friends!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {classmates.map((classmate) => {
            const initials = classmate.name
              .trim()
              .split(/\s+/)
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={classmate.id}
                onClick={() => openDm(classmate)}
                className="bg-[#0c0c0e]/90 border border-white/[0.07] rounded-3xl p-4 flex items-center justify-between hover:border-white/15 cursor-pointer transition duration-200 active:scale-[0.99]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {classmate.avatar_url ? (
                    <img
                      src={classmate.avatar_url}
                      alt={classmate.name}
                      className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                      {initials || "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-ink truncate text-sm md:text-base">{classmate.name}</span>
                      {classmate.verified && (
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-brand-500 text-white rounded-full p-0.5 text-[8px]" title="Verified">
                          <CheckIcon className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    {classmate.username && (
                      <p className="text-xs text-brand-300 font-medium leading-none mt-1">
                        @{classmate.username}
                      </p>
                    )}
                    <p className="text-[11px] md:text-xs text-ink-mute mt-1.5 truncate">
                      {classmate.course} • Year {classmate.year}
                      {scope === "all" && classmate.college && ` • ${classmate.college}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Connect({ onSwitchTab, onChatOpen }: { onSwitchTab?: (tab: any) => void; onChatOpen?: (open: boolean) => void }) {
  if (!isDemo()) {
    return <LiveConnect onSwitchTab={onSwitchTab} onChatOpen={onChatOpen} />;
  }
  const { data, update, uid } = useStore();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  
  // DM Profile Full-Screen state
  const [dmProfileOpen, setDmProfileOpen] = useState(false);
  const [optionsSheetOpen, setOptionsSheetOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [preaddedMember, setPreaddedMember] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<"media" | "links">("media");
  
  // Tabs & search sheets states
  const [connectTab, setConnectTab] = useState<"dm" | "groups" | "requests">("dm");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassmate, setSelectedClassmate] = useState<Classmate | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudyGroup | null>(null);

  // V2 Upgrades states
  const [isShareGroupOpen, setIsShareGroupOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importToken, setImportToken] = useState("");
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // Stories View modal
  const [activeStoriesToView, setActiveStoriesToView] = useState<Story[] | null>(null);

  // Chat message & attachment state
  const [msgText, setMsgText] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string; type: "image" | "file" } | null>(null);
  const [viewAttachedImage, setViewAttachedImage] = useState<string | null>(null);

  // Tasks & notes group specific state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [notesText, setNotesText] = useState("");
  const [taskViewMode, setTaskViewMode] = useState<"checklist" | "kanban">("checklist");
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [activeAddingColumn, setActiveAddingColumn] = useState<"todo" | "progress" | "done" | null>(null);
  const [columnTaskTitle, setColumnTaskTitle] = useState("");
  const [columnTaskAssignee, setColumnTaskAssignee] = useState("");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [isStudyBuddyOpen, setIsStudyBuddyOpen] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [typingChatId, setTypingChatId] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<{
    text: string;
    quiz?: { q: string; opts: string[]; ansIdx: number };
  } | null>(null);
  const [quizSelectedIdx, setQuizSelectedIdx] = useState<number | null>(null);

  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventVenue, setEventVenue] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  // V2 Helper functions
  const todayDayKey = (): DayKey => {
    const days: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    return days[new Date().getDay()];
  };

  const classmatesList = data.classmates || [];

  const classmatesMap = useMemo(() => {
    return Object.fromEntries(classmatesList.map((c) => [c.name, c]));
  }, [classmatesList]);

  const subjectMap = useMemo(() => {
    return Object.fromEntries(data.subjects.map((s) => [s.id, s]));
  }, [data.subjects]);

  const activeGroup = useMemo(() => {
    return data.groups.find((g) => g.id === activeGroupId) || null;
  }, [data.groups, activeGroupId]);

  // Filter study groups vs DMs vs Requests
  const directChats = useMemo(() => {
    return data.groups.filter((g) => g.direct && !g.isRequest);
  }, [data.groups]);

  const requestChats = useMemo(() => {
    return data.groups.filter((g) => g.direct && g.isRequest);
  }, [data.groups]);

  const studyGroups = useMemo(() => {
    return data.groups.filter((g) => !g.direct);
  }, [data.groups]);

  // Active user stories
  const activeUserStories = useMemo(() => {
    return (data.profile.stories || []).filter((s) => {
      const diff = Date.now() - new Date(s.createdAt).getTime();
      return diff < 24 * 3600 * 1000;
    });
  }, [data.profile.stories]);

  const freeClassmates = useMemo(() => {
    const currentDay = todayDayKey();
    const currentHour = new Date().getHours();
    return classmatesList.filter((c) => {
      if (!c.followed) return false;
      if (!c.timetable || c.timetable.length === 0) return true;
      const hasClass = c.timetable.some((slot) => {
        if (slot.day !== currentDay) return false;
        const startHour = parseInt(slot.start.split(":")[0], 10);
        const endHour = parseInt(slot.end.split(":")[0], 10);
        return currentHour >= startHour && currentHour < endHour;
      });
      return !hasClass;
    });
  }, [classmatesList]);

  const vaultAttachments = useMemo(() => {
    if (!activeGroup || !activeGroup.messages) return { images: [], files: [] };
    const images: { name: string; url: string; sender: string; at: string }[] = [];
    const files: { name: string; url: string; sender: string; at: string }[] = [];
    activeGroup.messages.forEach((msg) => {
      if (msg.attachment) {
        if (msg.attachment.type === "image") {
          images.push({
            name: msg.attachment.name,
            url: msg.attachment.url,
            sender: msg.sender,
            at: msg.at
          });
        } else {
          files.push({
            name: msg.attachment.name,
            url: msg.attachment.url,
            sender: msg.sender,
            at: msg.at
          });
        }
      }
    });
    return { images, files };
  }, [activeGroup?.messages]);

  const sharedImages = useMemo(() => {
    if (!activeGroup || !activeGroup.messages) return [];
    return activeGroup.messages
      .filter((msg) => msg.attachment && msg.attachment.type === "image")
      .map((msg) => msg.attachment!.url);
  }, [activeGroup?.messages]);

  const sharedLinks = useMemo(() => {
    if (!activeGroup || !activeGroup.messages) return [];
    return activeGroup.messages.filter((msg) => msg.text && msg.text.includes("http"));
  }, [activeGroup?.messages]);

  function handleVote(pollId: string, optionIdx: number) {
    update((d) => {
      const g = d.groups.find((x) => x.id === activeGroupId);
      if (g && g.polls) {
        const poll = g.polls.find((p) => p.id === pollId);
        if (poll) {
          poll.options.forEach((opt, idx) => {
            if (idx === optionIdx) {
              if (opt.votes.includes("me")) {
                opt.votes = opt.votes.filter((v) => v !== "me");
              } else {
                opt.votes.push("me");
              }
            } else {
              opt.votes = opt.votes.filter((v) => v !== "me");
            }
          });
        }
      }
    });
  }

  function handleDeletePoll(pollId: string) {
    update((d) => {
      const g = d.groups.find((x) => x.id === activeGroupId);
      if (g && g.polls) {
        g.polls = g.polls.filter((p) => p.id !== pollId);
      }
    });
  }

  function handleCreatePoll(e: React.FormEvent) {
    e.preventDefault();
    const question = pollQuestion.trim();
    const options = pollOptions.map(o => o.trim()).filter(o => o !== "");
    if (!question || options.length < 2 || !activeGroupId) return;

    update((d) => {
      const g = d.groups.find((x) => x.id === activeGroupId);
      if (g) {
        g.polls = g.polls || [];
        g.polls.push({
          id: uid(),
          question,
          options: options.map((opt) => ({ text: opt, votes: [] })),
          createdAt: new Date().toISOString(),
        });
      }
    });

    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowCreatePoll(false);
  }

  function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!activeGroup || !eventTitle.trim()) return;

    update((d) => {
      const g = d.groups.find((x) => x.id === activeGroup.id);
      if (g) {
        g.events = g.events || [];
        g.events.push({
          id: uid(),
          title: eventTitle.trim(),
          date: eventDate,
          time: eventTime,
          venue: eventVenue.trim(),
          createdAt: new Date().toISOString(),
        });
      }
    });

    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventVenue("");
    setShowCreateEvent(false);
  }
  
  function handleDeleteEvent(eventId: string) {
    if (!activeGroup) return;
    update((d) => {
      const g = d.groups.find((x) => x.id === activeGroup.id);
      if (g && g.events) {
        g.events = g.events.filter((ev) => ev.id !== eventId);
      }
    });
  }

  // Sync notes when active group changes
  useEffect(() => {
    if (activeGroup) {
      setNotesText(activeGroup.notes || "");
    } else {
      setNotesText("");
    }
    setDmProfileOpen(false);
    // Auto-scroll to bottom of chats on load
    scrollToBottom();
  }, [activeGroupId]);

  // Notify parent when entering/leaving a chat (hides bottom nav)
  useEffect(() => { onChatOpen?.(activeGroupId !== null); }, [activeGroupId]);

  // Read navigation parameters from localStorage on mount
  useEffect(() => {
    const navChatId = localStorage.getItem("footfall-active-chat-id");
    const navTab = localStorage.getItem("footfall-connect-tab");
    if (navChatId) {
      setActiveGroupId(navChatId);
      localStorage.removeItem("footfall-active-chat-id");
    }
    if (navTab) {
      setConnectTab(navTab as any);
      localStorage.removeItem("footfall-connect-tab");
    }
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeGroup?.messages?.length]);

  // Debounced notes auto-save
  useEffect(() => {
    if (!activeGroup || activeGroup.direct) return;
    const timeoutId = setTimeout(() => {
      if (notesText !== activeGroup.notes) {
        update((d) => {
          const g = d.groups.find((x) => x.id === activeGroup.id);
          if (g) {
            g.notes = notesText;
          }
        });
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [notesText, activeGroup, update]);

  // If the active group was deleted from elsewhere, reset view
  useEffect(() => {
    if (activeGroupId && !activeGroup) {
      setActiveGroupId(null);
    }
  }, [activeGroupId, activeGroup]);

  // Simulated Autoreply engine for DMs to make the app feel alive
  useEffect(() => {
    const messages = activeGroup?.messages || [];
    const lastMsg = messages[messages.length - 1];

    if (activeGroup?.direct && lastMsg && lastMsg.sender === "me") {
      const typingTimer = setTimeout(() => {
        setTypingChatId(activeGroup.id);
      }, 300);

      const replyTimer = setTimeout(() => {
        setTypingChatId(null);
        playPop();
        const classmateName = activeGroup.members[0];
        const replies = [
          "Hey! That sounds like a plan. Let's catch up.",
          "Awesome, thanks for sharing. I'll check it out.",
          "Sure thing! Are we meeting near the cafeteria or library?",
          "Got it, I'm working on the other segments of the report now.",
          "Super! Let's discuss this tomorrow in class.",
          "Can you send me the notes from last lecture as well? Thanks!",
          "I'm actually in the library right now, drop by if you are free!",
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        update((d) => {
          const g = d.groups.find((x) => x.id === activeGroup.id);
          if (g) {
            g.messages = g.messages || [];
            g.messages.push({
              id: uid(),
              sender: classmateName,
              text: randomReply,
              at: new Date().toISOString(),
            });
          }
        });
      }, 1500);

      return () => {
        clearTimeout(typingTimer);
        clearTimeout(replyTimer);
        setTypingChatId(null);
      };
    }
  }, [activeGroup?.messages?.length]);

  // Simulated classmate voting engine for study group polls
  useEffect(() => {
    if (!activeGroup || activeGroup.direct) return;
    const polls = activeGroup.polls || [];
    if (polls.length === 0) return;
    const lastPoll = polls[polls.length - 1];
    
    // check if this poll has no classmate votes yet
    const hasClassmateVotes = lastPoll.options.some(o => o.votes.some(v => v !== "me"));
    if (!hasClassmateVotes) {
      const timer = setTimeout(() => {
        update((d) => {
          const g = d.groups.find((x) => x.id === activeGroup.id);
          if (g && g.polls) {
            const poll = g.polls.find((p) => p.id === lastPoll.id);
            if (poll) {
              // assign random votes from group members
              g.members.forEach((member) => {
                if (Math.random() < 0.8) {
                  const randomOptIdx = Math.floor(Math.random() * poll.options.length);
                  poll.options[randomOptIdx].votes.push(member);
                }
              });
            }
          }
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeGroup?.polls?.length]);

  // Voice message playback simulation loop
  useEffect(() => {
    if (!playingVoiceId) return;
    setVoiceProgress(0);
    const interval = setInterval(() => {
      setVoiceProgress((vp) => {
        if (vp >= 18) {
          setPlayingVoiceId(null);
          return 0;
        }
        return vp + 1;
      });
    }, 300); // 18 bars * 300ms = 5.4s playback

    return () => clearInterval(interval);
  }, [playingVoiceId]);

  // Shared classes context helper
  const sharedClasses = useMemo(() => {
    if (!activeGroup?.subjectId) return [];
    return data.timetable.filter((slot) => slot.subjectId === activeGroup.subjectId);
  }, [activeGroup?.subjectId, data.timetable]);

  function handleBuddyPrompt(promptType: "quiz" | "explain" | "summarize") {
    setAiTyping(true);
    setAiResponse(null);
    setQuizSelectedIdx(null);

    const subject = data.subjects.find((s) => s.id === activeGroup?.subjectId);
    const subjName = subject?.name || "General";

    setTimeout(() => {
      setAiTyping(false);
      
      if (promptType === "quiz") {
        if (subjName.toLowerCase().includes("dbms")) {
          setAiResponse({
            text: "Here is a quick quiz question on DBMS:",
            quiz: {
              q: "Which normal form deals with multi-valued dependencies?",
              opts: ["1NF - First Normal Form", "2NF - Second Normal Form", "3NF - Third Normal Form", "4NF - Fourth Normal Form"],
              ansIdx: 3,
            }
          });
        } else if (subjName.toLowerCase().includes("operating") || subjName.toLowerCase().includes("os")) {
          setAiResponse({
            text: "Here is a quick quiz question on Operating Systems:",
            quiz: {
              q: "What is thrashing in OS memory management?",
              opts: ["A condition of high CPU utilisation", "A process execution delay in I/O queue", "High paging activity causing CPU to spend more time swapping than executing", "A deadlock state due to resource hold-and-wait"],
              ansIdx: 2,
            }
          });
        } else {
          setAiResponse({
            text: "Here is a general computer science quiz question:",
            quiz: {
              q: "What is the average time complexity of searching in a Balanced Binary Search Tree (BST)?",
              opts: ["O(1) - Constant Time", "O(N) - Linear Time", "O(log N) - Logarithmic Time", "O(N log N) - Linear-Logarithmic Time"],
              ansIdx: 2,
            }
          });
        }
      } else if (promptType === "explain") {
        if (subjName.toLowerCase().includes("dbms")) {
          setAiResponse({
            text: "💡 Key Concept: Database Indexing\n\nThink of an index like a table of contents in a textbook. Instead of scanning the entire book page-by-page (Sequential Scan), you go straight to the index to find the page number.\n\nIn SQL databases, indexes are commonly built using B-Tree data structures. Searching a B-Tree scales at O(log N) operations, dramatically faster than a full-table scan which scales at O(N) operations. However, writing data becomes slightly slower because the index must be updated on every INSERT, UPDATE, or DELETE."
          });
        } else if (subjName.toLowerCase().includes("operating") || subjName.toLowerCase().includes("os")) {
          setAiResponse({
            text: "💡 Key Concept: Virtual Memory & Paging\n\nVirtual memory is an abstraction that makes a process think it has a contiguous block of RAM, when in reality its memory pages might be scattered across physical RAM or even swapped onto the hard disk (paging).\n\nWhen a process tries to access a page that isn't currently loaded in RAM, the CPU registers a 'Page Fault'. The OS halts the process, loads the page from the disk swap space into an empty frame in RAM, updates the Page Table mapping, and resumes execution. This lets you run applications larger than your physical RAM!"
          });
        } else {
          setAiResponse({
            text: "💡 Key Concept: Time Complexity & Big O\n\nBig O notation is a mathematical model used to describe the limiting behavior of a function when the argument tends towards infinity.\n\nIn programming, it measures how the run-time or memory usage of an algorithm scales as the size of the input data (N) grows. For instance:\n- O(1) runs in the same time regardless of size.\n- O(N) takes time linear to the size of the input.\n- O(log N) cuts the remaining search space in half each step (like Binary Search)."
          });
        }
      } else if (promptType === "summarize") {
        const notes = activeGroup?.notes || "";
        if (!notes.trim()) {
          setAiResponse({
            text: "📝 Note Summary:\n\nYour group notes are currently empty! Go write some notes in the Checklist/Notes drawer and I'll summarize them for you."
          });
        } else {
          setAiResponse({
            text: `📝 Note Summary:\n\nHere is a bullet-pointed summary of your group notes:\n\n• Key Topics: Analyzed group milestones.\n• Current Scope: ${notes.slice(0, 100)}${notes.length > 100 ? "..." : ""}\n• Action Items: Assigned responsibilities to group members. Verify status on the Kanban Board.`
          });
        }
      }
    }, 1200);
  }

  function handleSaveNotes() {
    if (!activeGroup) return;
    if (notesText !== activeGroup.notes) {
      update((d) => {
        const g = d.groups.find((x) => x.id === activeGroup.id);
        if (g) {
          g.notes = notesText;
        }
      });
    }
  }

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = taskTitle.trim();
    if (!trimmedTitle || !activeGroupId) return;

    update((d) => {
      const g = d.groups.find((x) => x.id === activeGroupId);
      if (g) {
        g.tasks.push({
          id: uid(),
          title: trimmedTitle,
          assignee: taskAssignee || undefined,
          done: false,
          status: "todo",
          createdAt: new Date().toISOString(),
        });
      }
    });

    setTaskTitle("");
    setTaskAssignee("");
  }

  function handleToggleTask(taskId: string) {
    let becameDone = false;
    update((d) => {
      const g = d.groups.find((x) => x.id === activeGroupId);
      if (g) {
        const t = g.tasks.find((x) => x.id === taskId);
        if (t) {
          t.done = !t.done;
          t.status = t.done ? "done" : "todo";
          if (t.done) becameDone = true;
        }
      }
    });
    if (becameDone) triggerConfetti();
  }

  function handleUpdateTaskStatus(taskId: string, status: "todo" | "progress" | "done") {
    update((d) => {
      const g = d.groups.find((x) => x.id === activeGroupId);
      if (g) {
        const t = g.tasks.find((x) => x.id === taskId);
        if (t) {
          t.status = status;
          t.done = status === "done";
        }
      }
    });
    if (status === "done") triggerConfetti();
  }

  function handleAddColumnTask(title: string, assignee: string, status: "todo" | "progress" | "done") {
    const trimmed = title.trim();
    if (!trimmed || !activeGroupId) return;
    update((d) => {
      const g = d.groups.find((x) => x.id === activeGroupId);
      if (g) {
        g.tasks.push({
          id: uid(),
          title: trimmed,
          assignee: assignee || undefined,
          done: status === "done",
          status,
          createdAt: new Date().toISOString(),
        });
      }
    });
  }

  function handleDeleteTask(taskId: string) {
    update((d) => {
      const g = d.groups.find((x) => x.id === activeGroupId);
      if (g) {
        g.tasks = g.tasks.filter((x) => x.id !== taskId);
      }
    });
  }

  function handleRemoveMember(memberName: string) {
    if (window.confirm(`Remove ${memberName} from this group?`)) {
      update((d) => {
        const g = d.groups.find((x) => x.id === activeGroupId);
        if (g) {
          g.members = g.members.filter((m) => m !== memberName);
          g.tasks.forEach((t) => {
            if (t.assignee === memberName) {
              delete t.assignee;
            }
          });
        }
      });
    }
  }

  function handleDeleteGroup() {
    if (!activeGroup) return;
    if (
      window.confirm(
        `Are you sure you want to delete the chat/group "${activeGroup.name}"? This cannot be undone.`
      )
    ) {
      const id = activeGroup.id;
      setActiveGroupId(null);
      update((d) => {
        d.groups = d.groups.filter((g) => g.id !== id);
      });
    }
  }

  // Handle follow / unfollow
  function handleFollowToggle(classmateId: string) {
    update((d) => {
      const c = (d.classmates || []).find((x) => x.id === classmateId);
      if (c) {
        c.followed = !c.followed;
        if (c.followed) {
          c.followersCount += 1;
          d.profile.followingCount = (d.profile.followingCount || 0) + 1;
        } else {
          c.followersCount -= 1;
          d.profile.followingCount = Math.max(0, (d.profile.followingCount || 0) - 1);
        }
        
        // Update local state if currently selected classmate is this one
        if (selectedClassmate && selectedClassmate.id === classmateId) {
          setSelectedClassmate({
            ...selectedClassmate,
            followed: c.followed,
            followersCount: c.followersCount
          });
        }
      }
    });
  }

  // Initialize direct message chat
  function handleStartDM(classmate: Classmate) {
    let existingChat = data.groups.find(
      (g) => g.direct && g.members.includes(classmate.name)
    );

    if (!existingChat) {
      const newChat: StudyGroup = {
        id: uid(),
        name: classmate.name,
        members: [classmate.name],
        tasks: [],
        notes: "",
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: uid(),
            sender: classmate.name,
            text: `Hey there! Let's connect here. 👋`,
            at: new Date().toISOString(),
          },
        ],
        direct: true,
      };

      update((d) => {
        d.groups.push(newChat);
      });
      existingChat = newChat;
    }

    setActiveGroupId(existingChat.id);
    setIsSearchOpen(false);
    setSelectedClassmate(null);
  }

  // Send Direct Message or Group Chat
  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = msgText.trim();
    if (!text && !attachedFile) return;

    update((d) => {
      const g = d.groups.find((x) => x.id === activeGroupId);
      if (g) {
        g.messages = g.messages || [];
        g.messages.push({
          id: uid(),
          sender: "me",
          text,
          at: new Date().toISOString(),
          attachment: attachedFile || undefined,
        });
      }
    });

    playTick();
    setMsgText("");
    setAttachedFile(null);
  }

  // File Upload base64 reader for chat attachments
  function handleChatAttachment(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const type = file.type.startsWith("image/") ? "image" : "file";
        setAttachedFile({
          name: file.name,
          url: reader.result as string,
          type,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  // Filter suggested classmates based on search query
  const filteredClassmates = useMemo(() => {
    if (!searchQuery.trim()) return classmatesList;
    return classmatesList.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.course.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [classmatesList, searchQuery]);

  const subject = activeGroup?.subjectId ? subjectMap[activeGroup.subjectId] : null;

  return (
    <div className="px-5 pt-12 pb-28 min-h-screen flex flex-col no-scrollbar">
      {!activeGroup ? (
        // MAIN CHATS & STORIES BAR VIEW
        <div className="flex-1 flex flex-col animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-ink">Connect</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center text-ink-soft active:scale-95 transition"
              >
                <SearchIcon className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => setIsImportOpen(true)}
                className="text-brand-300 text-xs font-semibold flex items-center gap-1 active:scale-95 transition bg-white/[0.07] py-1.5 px-2.5 rounded-lg border border-white/10"
              >
                📥 Import
              </button>
              <button
                onClick={() => {
                  setEditingGroup(null);
                  setIsSheetOpen(true);
                }}
                className="text-brand-300 text-xs font-semibold flex items-center gap-1 active:scale-95 transition bg-white/[0.07] py-1.5 px-2.5 rounded-lg border border-white/10"
              >
                <PlusIcon className="w-3.5 h-3.5" /> New Group
              </button>
            </div>
          </div>

          {/* INSTAGRAM-STYLE STORIES BAR */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3.5 mb-2.5 border-b border-white/10">
            {/* User's story card */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              {activeUserStories.length > 0 ? (
                (() => {
                  const hasUnseen = activeUserStories.some((s: any) => !s.seen);
                  return (
                    <div
                      onClick={() => setActiveStoriesToView(activeUserStories)}
                      className={`w-16 h-16 rounded-full p-[3px] ${
                        hasUnseen
                          ? "bg-gradient-to-tr from-brand-500 via-purple-500 to-pink-500"
                          : "bg-white/20"
                      } flex items-center justify-center cursor-pointer active:scale-95 transition`}
                    >
                      <div className="w-full h-full rounded-full bg-black p-[2px]">
                        <div className="w-full h-full rounded-full bg-white/[0.07] flex items-center justify-center overflow-hidden">
                          {data.profile.avatar && data.profile.avatar.startsWith("data:") ? (
                            <img src={data.profile.avatar} alt="Me" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="text-2xl">{data.profile.avatar || "👨‍💻"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="relative shrink-0 cursor-pointer active:scale-95 transition">
                  <div className="w-16 h-16 rounded-full bg-white/[0.07] flex items-center justify-center overflow-hidden border border-white/[0.14]">
                    {data.profile.avatar && data.profile.avatar.startsWith("data:") ? (
                      <img src={data.profile.avatar} alt="Me" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-2xl">{data.profile.avatar || "👨‍💻"}</span>
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-5 h-5 bg-brand-500 rounded-full border-2 border-black text-white flex items-center justify-center text-[10px] font-black shadow-lg">
                    +
                  </span>
                </div>
              )}
              <span className="text-[11px] font-medium text-ink-soft truncate max-w-[60px] text-center mt-1">Your Story</span>
            </div>

            {/* Classmates stories list */}
            {classmatesList
              .filter((c) => c.followed && c.stories && c.stories.length > 0)
              .map((classmate) => {
                const hasUnseen = classmate.stories.some((s: any) => !s.seen);
                return (
                  <div key={classmate.id} className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      onClick={() => setActiveStoriesToView(classmate.stories)}
                      className={`w-16 h-16 rounded-full p-[3px] ${
                        hasUnseen 
                          ? "bg-gradient-to-tr from-brand-500 via-purple-500 to-pink-500" 
                          : "bg-white/20"
                      } flex items-center justify-center cursor-pointer active:scale-95 transition`}
                    >
                      <div className="w-full h-full rounded-full bg-black p-[2px]">
                        <div className="w-full h-full rounded-full bg-white/[0.07] flex items-center justify-center overflow-hidden">
                          {classmate.avatar && classmate.avatar.startsWith("data:") ? (
                            <img src={classmate.avatar} alt={classmate.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="text-2xl">{classmate.avatar || "🙋‍♂️"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-ink-soft truncate max-w-[60px] text-center mt-1">
                      {classmate.name.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
          </div>

          {/* Who's Free Now Section */}
          {freeClassmates.length > 0 && (
            <div className="mb-4 animate-fade-up">
              <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping shrink-0" />
                Who's Free Now
              </p>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {freeClassmates.map((classmate) => (
                  <div
                    key={classmate.id}
                    onClick={() => setSelectedClassmate(classmate)}
                    className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] active:scale-[0.98] transition rounded-2xl p-2 cursor-pointer shrink-0"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-35" />
                      <InitialsAvatar name={classmate.name} avatar={classmate.avatar} />
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-black rounded-full" />
                    </div>
                    <div className="pr-1.5">
                      <p className="text-xs font-bold text-ink leading-tight truncate max-w-[80px]">
                        {classmate.name.split(" ")[0]}
                      </p>
                      <p className="text-[9px] text-ink-mute font-medium leading-none mt-0.5">
                        Free now
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DM / GROUPS / REQUESTS SUB-TABS */}
          <div className="flex gap-1.5 bg-black/[0.04] p-1 rounded-2xl text-xs font-bold mb-4">
            <button
              onClick={() => setConnectTab("dm")}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                connectTab === "dm" ? "bg-white/10 text-ink" : "text-ink-mute"
              }`}
            >
              <MessageIcon className="w-3.5 h-3.5" /> DMs ({directChats.length})
            </button>
            <button
              onClick={() => setConnectTab("groups")}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                connectTab === "groups" ? "bg-white/10 text-ink" : "text-ink-mute"
              }`}
            >
              <UsersIcon className="w-3.5 h-3.5" /> Groups ({studyGroups.length})
            </button>
            <button
              onClick={() => setConnectTab("requests")}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                connectTab === "requests" ? "bg-white/10 text-ink" : "text-ink-mute"
              }`}
            >
              📩 Requests ({requestChats.length})
            </button>
          </div>

          {/* LISTS */}
          {connectTab === "dm" && (
            /* Direct message chats */
            <div className="space-y-2.5">
              {directChats.length === 0 ? (
                <div className="card p-6 text-center">
                  <p className="text-xs text-ink-mute font-medium">No direct messages yet.</p>
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="text-brand-300 text-xs font-bold mt-2"
                  >
                    Find Classmates to chat →
                  </button>
                </div>
              ) : (
                directChats.map((chat) => {
                  const classmateName = chat.members[0] || "Classmate";
                  const c = classmatesMap[classmateName];
                  const lastMessage = chat.messages?.[chat.messages.length - 1];

                  return (
                    <div
                      key={chat.id}
                      onClick={() => setActiveGroupId(chat.id)}
                      className="card p-3.5 flex gap-3.5 items-center active:scale-[0.99] transition cursor-pointer shadow-sm"
                    >
                      <InitialsAvatar name={classmateName} avatar={c?.avatar} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-ink truncate">{classmateName}</p>
                          {lastMessage && (
                            <span className="text-[10px] text-ink-mute font-medium">
                              {new Date(lastMessage.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-mute truncate mt-0.5 font-medium">
                          {lastMessage ? (lastMessage.sender === "me" ? "You: " : "") + lastMessage.text : "No messages yet"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-mute" />
                    </div>
                  );
                })
              )}
            </div>
          )}

          {connectTab === "groups" && (
            /* Study groups */
            <div className="space-y-3">
              {studyGroups.length === 0 ? (
                <div className="card p-6 text-center">
                  <p className="text-xs text-ink-mute font-medium">No study groups created yet.</p>
                  <button
                    onClick={() => {
                      setEditingGroup(null);
                      setIsSheetOpen(true);
                    }}
                    className="text-brand-300 text-xs font-bold mt-2"
                  >
                    Create a Study Group now →
                  </button>
                </div>
              ) : (
                studyGroups.map((group) => {
                  const groupSubject = group.subjectId ? subjectMap[group.subjectId] : null;
                  const totalTasks = group.tasks.length;
                  const doneTasks = group.tasks.filter((t) => t.done).length;
                  const taskProgressText =
                    totalTasks > 0 ? `${doneTasks}/${totalTasks} done` : "No tasks";

                  return (
                    <div
                      key={group.id}
                      onClick={() => setActiveGroupId(group.id)}
                      className="card p-4 flex gap-4 items-center relative overflow-hidden active:scale-[0.99] transition cursor-pointer shadow-sm"
                    >
                      {groupSubject && (
                        <span
                          className="absolute left-0 top-0 bottom-0 w-1.5"
                          style={{ backgroundColor: groupSubject.color }}
                        />
                      )}
                      <div className="flex-1 min-w-0 pl-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-sm font-bold text-ink truncate">
                            {group.name}
                          </p>
                          {groupSubject && (
                            <span
                              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: groupSubject.color + "15",
                                color: groupSubject.color,
                              }}
                            >
                              {groupSubject.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-[11px] text-ink-mute font-medium">
                          <span className="flex items-center gap-0.5">
                            <UsersIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="tabular-nums">
                              {group.members.length + 1}
                            </span>
                          </span>
                          <span>•</span>
                          <span className="tabular-nums">{taskProgressText}</span>
                          {group.dueDate && (
                            <>
                              <span>•</span>
                              <span
                                className={
                                  daysUntil(group.dueDate) < 0
                                    ? "text-red-500 font-semibold"
                                    : ""
                                }
                              >
                                {dueLabel(group.dueDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2.5">
                        <AvatarStack members={group.members} classmatesMap={classmatesMap} />
                        <ChevronRight className="w-4 h-4 text-ink-mute" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {connectTab === "requests" && (
            /* Message Requests */
            <div className="space-y-2.5 animate-fade-up">
              {requestChats.length === 0 ? (
                <div className="card p-6 text-center">
                  <p className="text-xs text-ink-mute font-medium">No message requests.</p>
                  <p className="text-[10px] text-ink-mute mt-1">Offers and negotiations from classmates on listings appear here.</p>
                </div>
              ) : (
                requestChats.map((chat) => {
                  const classmateName = chat.members[0] || "Classmate";
                  const c = classmatesMap[classmateName];
                  const lastMessage = chat.messages?.[chat.messages.length - 1];

                  return (
                    <div
                      key={chat.id}
                      onClick={() => setActiveGroupId(chat.id)}
                      className="card p-3.5 flex gap-3.5 items-center active:scale-[0.99] transition cursor-pointer shadow-sm border border-brand-500/10"
                    >
                      <InitialsAvatar name={classmateName} avatar={c?.avatar} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-ink truncate">{classmateName}</p>
                          {lastMessage && (
                            <span className="text-[10px] text-ink-mute font-medium">
                              {new Date(lastMessage.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-soft font-semibold truncate mt-0.5">
                          {lastMessage ? lastMessage.text : "No messages yet"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-mute" />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      ) : (
        // DETAIL VIEW / CHAT PAGE
        <div className="flex-1 flex flex-col animate-fade-up max-h-[85vh]">
          {/* Top Bar / Navigation */}
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveGroupId(null)}
                className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center text-ink-soft active:scale-95 transition"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              {activeGroup.direct ? (
                // DM Header details - Tappable avatar + name
                <button
                  onClick={() => setDmProfileOpen(true)}
                  className="flex items-center gap-2 text-left active:opacity-90 transition"
                >
                  <InitialsAvatar 
                    name={activeGroup.name} 
                    avatar={classmatesMap[activeGroup.name]?.avatar} 
                  />
                  <div>
                    <p className="text-sm font-bold text-ink leading-tight">{activeGroup.name}</p>
                    <p className="text-[9px] text-brand-300 font-bold uppercase tracking-wider">Direct Message</p>
                  </div>
                </button>
              ) : (
                // Group Header details
                <div>
                  <h1 className="text-sm font-bold text-ink leading-tight">
                    {activeGroup.name}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {subject && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: subject.color + "15",
                          color: subject.color,
                        }}
                      >
                        {subject.name}
                      </span>
                    )}
                    <span className="text-[9px] text-ink-mute font-bold">
                      {activeGroup.members.length + 1} members
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions: only Share, Edit for groups; nothing extra for DMs */}
            <div className="flex gap-1.5 items-center">
              {!activeGroup.direct && (
                <>
                  <button
                    onClick={() => setIsShareGroupOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold active:scale-95 transition"
                  >
                    🔗 Share
                  </button>
                  <button
                    onClick={() => {
                      setEditingGroup(activeGroup);
                      setIsSheetOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-ink text-[10px] font-bold active:scale-95 transition border border-white/[0.08]"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>

          {activeGroup.direct ? (
            /* POLISHED direct chat messaging interface */
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Message List area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto no-scrollbar py-4 px-4 space-y-2 pr-1 pb-24"
              >
                {(activeGroup.messages || []).map((msg, idx, arr) => {
                  const isMe = msg.sender === "me";
                  const isNextSame = idx < arr.length - 1 && arr[idx + 1].sender === msg.sender && isSameDay(msg.at, arr[idx + 1].at);
                  const isPrevSame = idx > 0 && arr[idx - 1].sender === msg.sender && isSameDay(arr[idx - 1].at, msg.at);
                  const showDateSep = idx === 0 || !isSameDay(arr[idx - 1].at, msg.at);

                  return (
                    <div key={msg.id} className="w-full flex flex-col animate-fade-in">
                      {showDateSep && (
                        <div className="flex justify-center my-4 w-full">
                          <span className="text-[10px] text-ink-mute bg-white/[0.04] rounded-full px-3 py-1">
                            {formatSeparatorDate(msg.at)}
                          </span>
                        </div>
                      )}
                      
                      <div 
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${
                          isPrevSame ? "!mt-1" : "mt-3"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] py-2.5 px-4 text-sm leading-snug shadow-sm flex flex-col gap-1.5 ${
                            isMe
                              ? "bg-brand-500 text-white rounded-2xl rounded-tr-sm"
                              : "bg-white/[0.08] text-ink rounded-2xl rounded-tl-sm"
                          }`}
                        >
                          {/* Render attachments */}
                          {msg.attachment && (
                            <div className="w-full">
                              {msg.attachment.url === "voice" ? (
                                <div className="flex items-center gap-3 py-1.5 px-1 min-w-[200px]">
                                  <button
                                    type="button"
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] shadow shrink-0 active:scale-95 transition ${
                                      isMe ? "bg-white text-brand-300" : "bg-brand-500 text-white"
                                    }`}
                                    onClick={() => {
                                      if (playingVoiceId === msg.id) {
                                        setPlayingVoiceId(null);
                                      } else {
                                        setPlayingVoiceId(msg.id);
                                      }
                                    }}
                                  >
                                    {playingVoiceId === msg.id ? "◼" : "▶"}
                                  </button>
                                  
                                  <div className="flex-1 flex gap-0.5 items-end h-6 pt-1">
                                    {[3, 5, 2, 6, 4, 7, 3, 5, 2, 4, 6, 3, 5, 2, 4, 7, 5, 3].map((val, idx) => {
                                      const isActive = playingVoiceId === msg.id && idx <= voiceProgress;
                                      return (
                                        <span 
                                          key={idx} 
                                          className={`w-[2px] rounded-full transition-colors duration-150 ${
                                            isActive
                                              ? isMe ? "bg-white" : "bg-brand-500"
                                              : isMe ? "bg-white/40" : "bg-brand-500/40"
                                          }`} 
                                          style={{ height: `${val * 3}px` }} 
                                        />
                                      );
                                    })}
                                  </div>
                                  
                                  <span className={`text-[9px] font-bold shrink-0 ${isMe ? "text-white/80" : "text-ink-mute"} min-w-[24px] text-right`}>
                                    {playingVoiceId === msg.id
                                      ? `0:${String(Math.min(14, Math.floor((voiceProgress / 18) * 14))).padStart(2, "0")}`
                                      : "0:14"}
                                  </span>
                                </div>
                              ) : msg.attachment.type === "image" ? (
                                <div className="rounded-2xl overflow-hidden mb-1 max-h-64 w-full">
                                  <img 
                                    src={msg.attachment.url} 
                                    alt="Attachment" 
                                    onClick={() => setViewAttachedImage(msg.attachment?.url || null)}
                                    className="w-full h-full object-cover cursor-zoom-in hover:opacity-95 transition max-h-64"
                                  />
                                </div>
                              ) : (
                                <a
                                  href={msg.attachment.url}
                                  download={msg.attachment.name}
                                  className="bg-black/30 hover:bg-black/45 rounded-xl p-2.5 flex items-center justify-between gap-2 mb-1 text-xs text-white/95"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-lg shrink-0">{getFileIcon(msg.attachment.name)}</span>
                                    <span className="truncate max-w-[120px] font-semibold">{msg.attachment.name}</span>
                                  </div>
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/90 uppercase tracking-wide shrink-0">
                                    file
                                  </span>
                                </a>
                              )}
                            </div>
                          )}
                          {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                        </div>
                        {!isNextSame && (
                          <span className={`text-[10px] mt-1 px-1 font-medium ${isMe ? "text-white/50" : "text-ink-mute"}`}>
                            {new Date(msg.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {typingChatId === activeGroup.id && (
                  <div className="flex flex-col items-start animate-fade-in pl-1 mt-3">
                    <div className="bg-white/[0.07] text-ink rounded-2xl rounded-tl-none py-3 px-4 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-ink-mute rounded-full animate-bounce shrink-0" style={{ animationDuration: "0.8s" }} />
                      <span className="w-1.5 h-1.5 bg-ink-mute rounded-full animate-bounce shrink-0" style={{ animationDuration: "0.8s", animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-ink-mute rounded-full animate-bounce shrink-0" style={{ animationDuration: "0.8s", animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[9px] text-ink-mute font-medium mt-1 px-1">
                      typing...
                    </span>
                  </div>
                )}
              </div>

              {/* Chat composer with attachments */}
              {activeGroup.isRequest ? (
                <div className="pt-3 pb-3 border-t border-white/10 mt-auto bg-white/[0.04] -mx-5 px-4 rounded-b-2xl text-center space-y-3.5 animate-fade-up">
                  <p className="text-xs text-ink-soft font-semibold leading-relaxed">
                    Message Request regarding an offer
                    <br />
                    <span className="text-[10px] text-ink-mute font-normal">
                      Accept to reply and add them to your main chat list. If declined, this request will be deleted.
                    </span>
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Decline and delete this message request?")) {
                          const id = activeGroup.id;
                          setActiveGroupId(null);
                          update((d) => {
                            d.groups = d.groups.filter((g) => g.id !== id);
                          });
                        }
                      }}
                      className="px-6 py-2 rounded-xl text-xs font-bold bg-red-950/20 text-red-400 hover:bg-red-950/40 active:scale-95 transition border border-red-500/10"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        update((d) => {
                          const g = d.groups.find((x) => x.id === activeGroup.id);
                          if (g) {
                            g.isRequest = false; // Move to DMs!
                          }
                        });
                        alert("Request accepted! Chat moved to DMs.");
                      }}
                      className="px-6 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white active:scale-95 transition shadow-sm"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="sticky bottom-0 border-t border-white/[0.07] bg-black/90 backdrop-blur px-4 py-3 z-10 -mx-5">
                  {attachedFile && (
                    <div className="bg-white/[0.06] rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-ink-soft mb-2 w-fit animate-fade-in">
                      <span>{attachedFile.type === "image" ? "📷" : "📁"}</span>
                      <span className="truncate max-w-[150px] font-semibold">{attachedFile.name}</span>
                      <button 
                        type="button" 
                        onClick={() => setAttachedFile(null)}
                        className="text-red-400 hover:text-red-500 font-bold ml-1 text-[11px]"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 items-center">
                    <input type="file" className="hidden" id="chat-attach-upload" onChange={handleChatAttachment} />
                    <label
                      htmlFor="chat-attach-upload"
                      className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center cursor-pointer transition active:scale-90 shrink-0"
                    >
                      <PaperclipIcon className="w-4 h-4 text-ink-mute" />
                    </label>

                    <input
                      className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-full px-4 py-2.5 text-sm text-ink placeholder:text-ink-mute outline-none focus:border-brand-500/40 focus:bg-white/[0.08] transition"
                      placeholder="Message..."
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                    />

                    {(msgText.trim().length > 0 || attachedFile !== null) && (
                      <button
                        type="submit"
                        className="brand-gradient rounded-full w-8 h-8 flex items-center justify-center active:scale-90 transition shrink-0 shadow-md shadow-brand-500/10"
                      >
                        <SendIcon className="w-3.5 h-3.5 text-white" />
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* GROUP TAB DETAILS (checklist + notes + group messages) */
            <div className="flex-1 overflow-y-auto no-scrollbar pr-1 max-h-[78vh]">
              {/* Group message checklist & class context */}
              <div className="space-y-4 pb-4">
                {/* Buttons block */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsStudyBuddyOpen(true);
                      setAiResponse(null);
                      setQuizSelectedIdx(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 text-xs font-bold active:scale-95 transition border border-brand-500/20 flex items-center justify-center gap-1.5"
                  >
                    <span>🤖</span> Ask Buddy AI
                  </button>
                  <button
                    onClick={handleDeleteGroup}
                    className="flex-1 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-950/60 text-red-400 text-xs font-bold active:scale-95 transition border border-red-500/20 text-center"
                  >
                    Delete Group
                  </button>
                </div>

                {/* Members list & contexts */}
                <div className="card p-4">
                  <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wide mb-2.5">
                    Classmates ({activeGroup.members.length + 1})
                  </p>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <div className="pill bg-brand-500/15 text-brand-300 flex items-center gap-1.5 text-xs font-medium pl-1 pr-2.5 py-0.5">
                      <InitialsAvatar name="Me" isMe />
                      <span>You</span>
                    </div>
                    {activeGroup.members.map((member, idx) => (
                      <div
                        key={idx}
                        className="pill bg-white/[0.07] text-ink-soft flex items-center gap-1.5 text-xs font-medium pl-1 pr-2 py-0.5"
                      >
                        <InitialsAvatar name={member} avatar={classmatesMap[member]?.avatar} />
                        <span className="truncate max-w-[80px]">{member}</span>
                        <button
                          onClick={() => handleRemoveMember(member)}
                          className="text-ink-mute/70 hover:text-red-500 pl-0.5 text-[10px]"
                          title="Remove member"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setEditingGroup(activeGroup);
                        setIsSheetOpen(true);
                      }}
                      className="pill border border-dashed border-white/20 text-brand-300 hover:bg-brand-500/15 flex items-center gap-1 text-xs font-semibold py-1 px-2.5"
                    >
                      <PlusIcon className="w-3.5 h-3.5" /> Invite
                    </button>
                  </div>

                  {subject && (
                    <div className="mt-4 pt-3.5 border-t border-white/10 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="text-xs font-bold text-ink-soft">
                          You share this class with the group
                        </span>
                      </div>
                      {sharedClasses.length > 0 ? (
                        <p className="text-[11px] text-ink-mute pl-4 font-medium">
                          Schedule:{" "}
                          {sharedClasses
                            .map(
                              (s) =>
                                `${DAY_SHORT[s.day]} at ${s.start}${
                                  s.room ? ` (${s.room})` : ""
                                }`
                            )
                            .join(", ")}
                        </p>
                      ) : (
                        <p className="text-[11px] text-ink-mute pl-4 font-medium">
                          No classes scheduled on your timetable for {subject.name}.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Checklist Task Section */}
                {/* Checklist Task Section */}
                <div className="card p-4">
                  {(() => {
                    const filteredTasks = activeGroup.tasks.filter((t) => {
                      if (taskFilter === "all") return true;
                      if (taskFilter === "me") return t.assignee === "me";
                      return t.assignee === taskFilter;
                    });
                    const todoTasksList = filteredTasks.filter(t => t.status === "todo" || (!t.status && !t.done));
                    const progressTasksList = filteredTasks.filter(t => t.status === "progress");
                    const doneTasksList = filteredTasks.filter(t => t.status === "done" || (!t.status && t.done));

                    return (
                      <>
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wide">
                              Tasks Board
                            </p>
                            <span className="text-[10px] text-ink-mute font-medium tabular-nums">
                              {activeGroup.tasks.filter((t) => t.done).length}/{activeGroup.tasks.length} completed
                            </span>
                          </div>
                          
                          {/* View Switcher toggle */}
                          <div className="flex bg-black/[0.04] p-0.5 rounded-lg text-[10px] font-bold border border-white/[0.04]">
                            <button
                              onClick={() => setTaskViewMode("checklist")}
                              className={`px-2.5 py-1 rounded-md transition ${
                                taskViewMode === "checklist" ? "bg-white/10 text-ink" : "text-ink-mute"
                              }`}
                            >
                              List
                            </button>
                            <button
                              onClick={() => setTaskViewMode("kanban")}
                              className={`px-2.5 py-1 rounded-md transition ${
                                taskViewMode === "kanban" ? "bg-white/10 text-ink" : "text-ink-mute"
                              }`}
                            >
                              Kanban
                            </button>
                          </div>
                        </div>

                        {/* Task Progress Bar */}
                        <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden mb-3">
                          <div
                            className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                            style={{
                              width: `${
                                activeGroup.tasks.length > 0
                                  ? (activeGroup.tasks.filter((t) => t.done).length /
                                      activeGroup.tasks.length) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>

                        {/* Filter Chips */}
                        <div className="flex gap-1 overflow-x-auto no-scrollbar py-2 mb-3 border-t border-b border-white/[0.04]">
                          <button
                            onClick={() => setTaskFilter("all")}
                            className={`px-2.5 py-1 rounded-full text-[9px] font-bold border transition shrink-0 ${
                              taskFilter === "all"
                                ? "bg-brand-500 text-white border-brand-500"
                                : "bg-white/[0.03] text-ink-mute border-white/5 hover:border-white/10"
                            }`}
                          >
                            All Tasks
                          </button>
                          <button
                            onClick={() => setTaskFilter("me")}
                            className={`px-2.5 py-1 rounded-full text-[9px] font-bold border transition shrink-0 ${
                              taskFilter === "me"
                                ? "bg-brand-500 text-white border-brand-500"
                                : "bg-white/[0.03] text-ink-mute border-white/5 hover:border-white/10"
                            }`}
                          >
                            My Tasks (@me)
                          </button>
                          {activeGroup.members.map((member) => (
                            <button
                              key={member}
                              onClick={() => setTaskFilter(member)}
                              className={`px-2.5 py-1 rounded-full text-[9px] font-bold border transition shrink-0 ${
                                taskFilter === member
                                  ? "bg-brand-500 text-white border-brand-500"
                                  : "bg-white/[0.03] text-ink-mute border-white/5 hover:border-white/10"
                              }`}
                            >
                              @{member.split(" ")[0]}
                            </button>
                          ))}
                        </div>

                        {taskViewMode === "kanban" ? (
                          /* Kanban view */
                          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 mb-1.5 scroll-smooth">
                            {/* TO DO COLUMN */}
                            {(() => {
                              const colStatus = "todo";
                              const colTitle = "📋 To Do";
                              const tasks = todoTasksList;
                              return (
                                <div className="w-[230px] min-w-[230px] bg-red-950/[0.03] border border-red-500/10 rounded-2xl p-3 flex flex-col gap-2.5 shrink-0 transition hover:border-red-500/20">
                                  <div className="flex justify-between items-center px-1">
                                    <span className="text-xs font-bold text-ink-soft">{colTitle}</span>
                                    <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-bold tabular-nums">
                                      {tasks.length}
                                    </span>
                                  </div>
                                  
                                  <div className="flex-1 space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                                    {tasks.length === 0 ? (
                                      <p className="text-[10px] text-ink-mute text-center py-6 italic">No tasks here</p>
                                    ) : (
                                      tasks.map((task) => (
                                        <div key={task.id} className="bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:scale-[1.01] rounded-xl p-2.5 flex flex-col gap-2 relative group transition shadow-sm">
                                          <div className="flex gap-1.5 items-start">
                                            <span className="text-ink-mute/30 cursor-grab shrink-0 select-none text-xs font-mono pt-0.5">⠿</span>
                                            <p className="text-xs font-bold text-ink pr-5 leading-snug break-words flex-1">{task.title}</p>
                                          </div>
                                          <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="absolute top-2 right-2 text-ink-mute/40 hover:text-red-500 text-[10px] transition"
                                            title="Delete"
                                          >
                                            ✕
                                          </button>
                                          
                                          <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-white/[0.04]">
                                            <div className="flex items-center gap-1.5">
                                              {task.assignee ? (
                                                <span className="text-[8px] font-black text-brand-300 bg-brand-500/15 px-1 py-0.5 rounded uppercase max-w-[80px] truncate">
                                                  @{task.assignee === "me" ? "me" : task.assignee}
                                                </span>
                                              ) : (
                                                <span className="w-1" />
                                              )}
                                              {task.createdAt && (
                                                <span className="text-[8px] text-ink-mute font-medium">
                                                  {new Date(task.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                                                </span>
                                              )}
                                            </div>
                                            
                                            <button
                                              onClick={() => handleUpdateTaskStatus(task.id, "progress")}
                                              className="w-5 h-5 rounded bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center text-[10px] active:scale-90 transition font-bold"
                                              title="Move to Progress"
                                            >
                                              →
                                            </button>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                  
                                  {/* Column Quick Add */}
                                  {activeAddingColumn === colStatus ? (
                                    <form 
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        handleAddColumnTask(columnTaskTitle, columnTaskAssignee, colStatus);
                                        setColumnTaskTitle("");
                                        setColumnTaskAssignee("");
                                        setActiveAddingColumn(null);
                                      }}
                                      className="bg-black/25 border border-white/[0.08] p-2.5 rounded-xl flex flex-col gap-1.5 animate-fade-in"
                                    >
                                      <input
                                        autoFocus
                                        className="input text-[11px] py-1 px-2 w-full"
                                        placeholder="Task title..."
                                        value={columnTaskTitle}
                                        onChange={(e) => setColumnTaskTitle(e.target.value)}
                                        required
                                      />
                                      <select
                                        className="input text-[9px] py-1 px-1.5 w-full"
                                        value={columnTaskAssignee}
                                        onChange={(e) => setColumnTaskAssignee(e.target.value)}
                                      >
                                        <option value="">Assignee</option>
                                        <option value="me">Me</option>
                                        {activeGroup.members.map((m) => (
                                          <option key={m} value={m}>{m}</option>
                                        ))}
                                      </select>
                                      <div className="flex gap-1 justify-end mt-0.5">
                                        <button
                                          type="button"
                                          onClick={() => setActiveAddingColumn(null)}
                                          className="px-2 py-1 text-[9px] text-ink-soft hover:text-white font-bold"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="submit"
                                          className="btn-primary px-2 py-1 rounded text-[9px] font-bold"
                                        >
                                          Add
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setColumnTaskTitle("");
                                        setColumnTaskAssignee("");
                                        setActiveAddingColumn(colStatus);
                                      }}
                                      className="text-left text-[10px] text-ink-mute hover:text-brand-500 py-1.5 px-2 bg-white/[0.01] hover:bg-white/[0.03] border border-dashed border-white/[0.06] rounded-xl flex items-center justify-center gap-1 transition"
                                    >
                                      + Add Task
                                    </button>
                                  )}
                                </div>
                              );
                            })()}

                            {/* IN PROGRESS COLUMN */}
                            {(() => {
                              const colStatus = "progress";
                              const colTitle = "⚡ In Progress";
                              const tasks = progressTasksList;
                              return (
                                <div className="w-[230px] min-w-[230px] bg-amber-950/[0.03] border border-amber-500/10 rounded-2xl p-3 flex flex-col gap-2.5 shrink-0 transition hover:border-amber-500/20">
                                  <div className="flex justify-between items-center px-1">
                                    <span className="text-xs font-bold text-ink-soft">{colTitle}</span>
                                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold tabular-nums">
                                      {tasks.length}
                                    </span>
                                  </div>
                                  
                                  <div className="flex-1 space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                                    {tasks.length === 0 ? (
                                      <p className="text-[10px] text-ink-mute text-center py-6 italic">No tasks here</p>
                                    ) : (
                                      tasks.map((task) => (
                                        <div key={task.id} className="bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:scale-[1.01] rounded-xl p-2.5 flex flex-col gap-2 relative group transition shadow-sm">
                                          <div className="flex gap-1.5 items-start">
                                            <span className="text-ink-mute/30 cursor-grab shrink-0 select-none text-xs font-mono pt-0.5">⠿</span>
                                            <p className="text-xs font-bold text-ink pr-5 leading-snug break-words flex-1">{task.title}</p>
                                          </div>
                                          <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="absolute top-2 right-2 text-ink-mute/40 hover:text-red-500 text-[10px] transition"
                                            title="Delete"
                                          >
                                            ✕
                                          </button>
                                          
                                          <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-white/[0.04]">
                                            <div className="flex items-center gap-1.5">
                                              {task.assignee ? (
                                                <span className="text-[8px] font-black text-brand-300 bg-brand-500/15 px-1 py-0.5 rounded uppercase max-w-[80px] truncate">
                                                  @{task.assignee === "me" ? "me" : task.assignee}
                                                </span>
                                              ) : (
                                                <span className="w-1" />
                                              )}
                                              {task.createdAt && (
                                                <span className="text-[8px] text-ink-mute font-medium">
                                                  {new Date(task.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                                                </span>
                                              )}
                                            </div>
                                            
                                            <div className="flex gap-1">
                                              <button
                                                onClick={() => handleUpdateTaskStatus(task.id, "todo")}
                                                className="w-5 h-5 rounded bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] text-ink-soft flex items-center justify-center text-[10px] active:scale-90 transition font-bold"
                                                title="Move to Todo"
                                              >
                                                ←
                                              </button>
                                              <button
                                                onClick={() => handleUpdateTaskStatus(task.id, "done")}
                                                className="w-5 h-5 rounded bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center text-[10px] active:scale-90 transition font-bold"
                                                title="Mark Done"
                                              >
                                                →
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                  
                                  {/* Column Quick Add */}
                                  {activeAddingColumn === colStatus ? (
                                    <form 
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        handleAddColumnTask(columnTaskTitle, columnTaskAssignee, colStatus);
                                        setColumnTaskTitle("");
                                        setColumnTaskAssignee("");
                                        setActiveAddingColumn(null);
                                      }}
                                      className="bg-black/25 border border-white/[0.08] p-2.5 rounded-xl flex flex-col gap-1.5 animate-fade-in"
                                    >
                                      <input
                                        autoFocus
                                        className="input text-[11px] py-1 px-2 w-full"
                                        placeholder="Task title..."
                                        value={columnTaskTitle}
                                        onChange={(e) => setColumnTaskTitle(e.target.value)}
                                        required
                                      />
                                      <select
                                        className="input text-[9px] py-1 px-1.5 w-full"
                                        value={columnTaskAssignee}
                                        onChange={(e) => setColumnTaskAssignee(e.target.value)}
                                      >
                                        <option value="">Assignee</option>
                                        <option value="me">Me</option>
                                        {activeGroup.members.map((m) => (
                                          <option key={m} value={m}>{m}</option>
                                        ))}
                                      </select>
                                      <div className="flex gap-1 justify-end mt-0.5">
                                        <button
                                          type="button"
                                          onClick={() => setActiveAddingColumn(null)}
                                          className="px-2 py-1 text-[9px] text-ink-soft hover:text-white font-bold"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="submit"
                                          className="btn-primary px-2 py-1 rounded text-[9px] font-bold"
                                        >
                                          Add
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setColumnTaskTitle("");
                                        setColumnTaskAssignee("");
                                        setActiveAddingColumn(colStatus);
                                      }}
                                      className="text-left text-[10px] text-ink-mute hover:text-brand-500 py-1.5 px-2 bg-white/[0.01] hover:bg-white/[0.03] border border-dashed border-white/[0.06] rounded-xl flex items-center justify-center gap-1 transition"
                                    >
                                      + Add Task
                                    </button>
                                  )}
                                </div>
                              );
                            })()}

                            {/* COMPLETED/DONE COLUMN */}
                            {(() => {
                              const colStatus = "done";
                              const colTitle = "✅ Done";
                              const tasks = doneTasksList;
                              return (
                                <div className="w-[230px] min-w-[230px] bg-brand-950/[0.03] border border-brand-500/10 rounded-2xl p-3 flex flex-col gap-2.5 shrink-0 transition hover:border-brand-500/20">
                                  <div className="flex justify-between items-center px-1">
                                    <span className="text-xs font-bold text-ink-soft">{colTitle}</span>
                                    <span className="text-[10px] text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full font-bold tabular-nums">
                                      {tasks.length}
                                    </span>
                                  </div>
                                  
                                  <div className="flex-1 space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                                    {tasks.length === 0 ? (
                                      <p className="text-[10px] text-ink-mute text-center py-6 italic">No tasks here</p>
                                    ) : (
                                      tasks.map((task) => (
                                        <div key={task.id} className="bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:scale-[1.01] rounded-xl p-2.5 flex flex-col gap-2 relative group transition shadow-sm">
                                          <div className="flex gap-1.5 items-start">
                                            <span className="text-ink-mute/30 cursor-grab shrink-0 select-none text-xs font-mono pt-0.5">⠿</span>
                                            <p className="text-xs font-bold text-ink-mute line-through pr-5 leading-snug break-words flex-1">{task.title}</p>
                                          </div>
                                          <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="absolute top-2 right-2 text-ink-mute/40 hover:text-red-500 text-[10px] transition"
                                            title="Delete"
                                          >
                                            ✕
                                          </button>
                                          
                                          <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-white/[0.04]">
                                            <div className="flex items-center gap-1.5">
                                              {task.assignee ? (
                                                <span className="text-[8px] font-black text-brand-300 bg-brand-500/15 px-1 py-0.5 rounded uppercase max-w-[80px] truncate">
                                                  @{task.assignee === "me" ? "me" : task.assignee}
                                                </span>
                                              ) : (
                                                <span className="w-1" />
                                              )}
                                              {task.createdAt && (
                                                <span className="text-[8px] text-ink-mute font-medium">
                                                  {new Date(task.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                                                </span>
                                              )}
                                            </div>
                                            
                                            <button
                                              onClick={() => handleUpdateTaskStatus(task.id, "progress")}
                                              className="w-5 h-5 rounded bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.1] text-ink-soft flex items-center justify-center text-[10px] active:scale-90 transition font-bold"
                                              title="Move to Progress"
                                            >
                                              ←
                                            </button>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                  
                                  {/* Column Quick Add */}
                                  {activeAddingColumn === colStatus ? (
                                    <form 
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        handleAddColumnTask(columnTaskTitle, columnTaskAssignee, colStatus);
                                        setColumnTaskTitle("");
                                        setColumnTaskAssignee("");
                                        setActiveAddingColumn(null);
                                      }}
                                      className="bg-black/25 border border-white/[0.08] p-2.5 rounded-xl flex flex-col gap-1.5 animate-fade-in"
                                    >
                                      <input
                                        autoFocus
                                        className="input text-[11px] py-1 px-2 w-full"
                                        placeholder="Task title..."
                                        value={columnTaskTitle}
                                        onChange={(e) => setColumnTaskTitle(e.target.value)}
                                        required
                                      />
                                      <select
                                        className="input text-[9px] py-1 px-1.5 w-full"
                                        value={columnTaskAssignee}
                                        onChange={(e) => setColumnTaskAssignee(e.target.value)}
                                      >
                                        <option value="">Assignee</option>
                                        <option value="me">Me</option>
                                        {activeGroup.members.map((m) => (
                                          <option key={m} value={m}>{m}</option>
                                        ))}
                                      </select>
                                      <div className="flex gap-1 justify-end mt-0.5">
                                        <button
                                          type="button"
                                          onClick={() => setActiveAddingColumn(null)}
                                          className="px-2 py-1 text-[9px] text-ink-soft hover:text-white font-bold"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="submit"
                                          className="btn-primary px-2 py-1 rounded text-[9px] font-bold"
                                        >
                                          Add
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setColumnTaskTitle("");
                                        setColumnTaskAssignee("");
                                        setActiveAddingColumn(colStatus);
                                      }}
                                      className="text-left text-[10px] text-ink-mute hover:text-brand-500 py-1.5 px-2 bg-white/[0.01] hover:bg-white/[0.03] border border-dashed border-white/[0.06] rounded-xl flex items-center justify-center gap-1 transition"
                                    >
                                      + Add Task
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          /* Existing Checklist view */
                          <>
                            {/* Add Task Form */}
                            <form onSubmit={handleAddTask} className="flex gap-1.5 mb-4">
                              <input
                                className="input text-sm py-1.5 px-3 flex-1"
                                placeholder="New task..."
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                required
                              />
                              <select
                                className="input text-xs py-1.5 px-2 w-[100px] shrink-0"
                                value={taskAssignee}
                                onChange={(e) => setTaskAssignee(e.target.value)}
                              >
                                <option value="">Assignee</option>
                                <option value="me">Me</option>
                                {activeGroup.members.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                className="btn-primary w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              >
                                <PlusIcon className="w-4 h-4 text-white" />
                              </button>
                            </form>

                            {/* Checklist */}
                            {activeGroup.tasks.length === 0 ? (
                              <p className="text-xs text-ink-mute text-center py-4">
                                No tasks yet. Create one above to collaborate!
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {activeGroup.tasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className="flex items-center gap-2.5 p-2 bg-black/[0.01] hover:bg-white/[0.05] rounded-xl transition"
                                  >
                                    <button
                                      onClick={() => handleToggleTask(task.id)}
                                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 active:scale-90 transition ${
                                        task.done
                                          ? "border-brand-500 bg-brand-500 text-white"
                                          : "border-white/20 hover:border-white/25 bg-white"
                                      }`}
                                    >
                                      {task.done && <CheckIcon className="w-3 h-3 text-white" />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className={`text-sm leading-snug truncate ${
                                          task.done
                                            ? "line-through text-ink-mute"
                                            : "text-ink font-medium"
                                        }`}
                                      >
                                        {task.title}
                                      </p>
                                      {task.assignee && (
                                        <span className="text-[9px] font-bold text-brand-300 bg-brand-500/15 px-1.5 py-0.5 rounded-md mt-0.5 inline-block font-sans">
                                          @{task.assignee === "me" ? "me" : task.assignee}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="text-ink-mute/50 hover:text-red-500 p-1 shrink-0 transition"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Group Calendar & Events Section */}
                <div className="card p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wide">
                        Group Calendar & Events
                      </p>
                      <span className="text-[10px] text-ink-mute font-medium">
                        {(activeGroup.events || []).length} events scheduled
                      </span>
                    </div>
                    <button
                      onClick={() => setShowCreateEvent(!showCreateEvent)}
                      className="text-brand-300 text-xs font-bold active:scale-95 transition"
                    >
                      {showCreateEvent ? "Cancel" : "+ Schedule"}
                    </button>
                  </div>

                  {showCreateEvent && (
                    <form onSubmit={handleCreateEvent} className="space-y-2 mb-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 animate-fade-in">
                      <input
                        className="input text-xs py-1.5 px-3 w-full"
                        placeholder="Event Title (e.g. Study Session)"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        required
                      />
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="input text-xs py-1.5 px-2 flex-1"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          required
                        />
                        <input
                          type="time"
                          className="input text-xs py-1.5 px-2 flex-1"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          required
                        />
                      </div>
                      <input
                        className="input text-xs py-1.5 px-3 w-full"
                        placeholder="Venue (e.g. Library Room 2)"
                        value={eventVenue}
                        onChange={(e) => setEventVenue(e.target.value)}
                        required
                      />
                      <button
                        type="submit"
                        className="btn-primary w-full py-2 text-xs font-bold"
                      >
                        Schedule Event
                      </button>
                    </form>
                  )}

                  {/* Events List */}
                  {!(activeGroup.events || []).length ? (
                    <p className="text-xs text-ink-mute text-center py-4">
                      No group events scheduled yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(activeGroup.events || []).map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-ink truncate">{ev.title}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-ink-soft">
                              <span>📅 {ev.date} at {ev.time}</span>
                              <span className="text-ink-mute font-medium">·</span>
                              <span>📍 {ev.venue}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="text-ink-mute/50 hover:text-red-500 p-1 shrink-0 transition"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Group Polls Section */}
                <div className="card p-4">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wide">
                      Group Polls
                    </p>
                    <button
                      onClick={() => setShowCreatePoll(!showCreatePoll)}
                      className="text-brand-300 text-xs font-bold active:scale-95 transition"
                    >
                      {showCreatePoll ? "Cancel" : "+ Create Poll"}
                    </button>
                  </div>

                  {showCreatePoll && (
                    <form onSubmit={handleCreatePoll} className="space-y-2 mb-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 animate-fade-in">
                      <input
                        className="input text-xs py-1.5 px-3 w-full"
                        placeholder="Ask a question..."
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        required
                      />
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            className="input text-xs py-1 px-2.5 flex-1"
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const copy = [...pollOptions];
                              copy[idx] = e.target.value;
                              setPollOptions(copy);
                            }}
                            required={idx < 2}
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                              className="text-red-500 text-xs font-bold p-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-1.5">
                        <button
                          type="button"
                          onClick={() => setPollOptions([...pollOptions, ""])}
                          className="text-xs text-brand-500 hover:text-brand-300 font-bold"
                        >
                          + Add Option
                        </button>
                        <button
                          type="submit"
                          disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                          className="btn-primary text-xs py-1 px-3.5 rounded-lg font-bold disabled:opacity-40"
                        >
                          Create
                        </button>
                      </div>
                    </form>
                  )}

                  {(!activeGroup.polls || activeGroup.polls.length === 0) ? (
                    <p className="text-xs text-ink-mute text-center py-4">
                      No polls yet. Create one to get votes from members!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activeGroup.polls.map((poll) => {
                        const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
                        return (
                          <div key={poll.id} className="bg-white/[0.01] border border-white/[0.04] p-3.5 rounded-2xl relative">
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-xs font-bold text-ink leading-tight pr-4">{poll.question}</p>
                              <button
                                onClick={() => handleDeletePoll(poll.id)}
                                className="text-ink-mute hover:text-red-500 transition text-xs font-bold px-1"
                                title="Delete Poll"
                              >
                                ✕
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              {poll.options.map((option, oIdx) => {
                                const optPercent = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
                                const userVoted = option.votes.includes("me");
                                
                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => handleVote(poll.id, oIdx)}
                                    className="w-full text-left relative overflow-hidden rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition h-9 flex items-center px-3"
                                  >
                                    {/* Percentage Progress Bar */}
                                    <div 
                                      className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                                        userVoted ? "bg-brand-500/20" : "bg-white/[0.04]"
                                      }`}
                                      style={{ width: `${optPercent}%` }}
                                    />
                                    
                                    <div className="relative z-10 w-full flex justify-between items-center text-xs font-bold">
                                      <span className="text-ink flex items-center gap-1.5">
                                        {option.text}
                                        {userVoted && <span className="text-[10px] text-brand-400">✓</span>}
                                      </span>
                                      <span className="text-ink-mute tabular-nums">
                                        {optPercent}% ({option.votes.length})
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            
                            {/* Voted names display */}
                            <p className="text-[9px] text-ink-mute mt-2.5 font-medium truncate">
                              Total votes: {totalVotes} {totalVotes > 0 && `(${poll.options.map(o => o.votes.length > 0 ? o.text + ': ' + o.votes.map(v => v === 'me' ? 'You' : v).join(', ') : '').filter(Boolean).join(' | ')})`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div className="card p-4">
                  <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wide mb-2.5">
                    Shared notes
                  </p>
                  <textarea
                    className="input w-full min-h-[160px] text-sm py-2.5 px-3 leading-relaxed resize-none bg-black/[0.01] focus:bg-white"
                    placeholder="Type team notes, links, references or deadlines here..."
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    onBlur={handleSaveNotes}
                  />
                  <p className="text-[9px] text-ink-mute text-right mt-1.5 font-medium">
                    Auto-saves as you type
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEARCH & SUGGESTED CLASSMATES SHEET */}
      <Sheet open={isSearchOpen} onClose={() => setIsSearchOpen(false)} title="Search classmates">
        <div className="space-y-4">
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-3 w-4 h-4 text-ink-mute" />
            <input
              type="text"
              placeholder="Search by name or course..."
              className="input pl-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar pt-1">
            {filteredClassmates.length === 0 ? (
              <p className="text-xs text-ink-mute text-center py-8">No classmates found.</p>
            ) : (
              filteredClassmates.map((classmate) => (
                <div
                  key={classmate.id}
                  className="card p-3 flex items-center gap-3 active:scale-[0.99] transition"
                >
                  {/* Click classmate avatar to open profile detail modal */}
                  <div 
                    onClick={() => setSelectedClassmate(classmate)}
                    className="cursor-pointer active:scale-95 transition"
                  >
                    <InitialsAvatar name={classmate.name} avatar={classmate.avatar} />
                  </div>
                  
                  <div 
                    onClick={() => setSelectedClassmate(classmate)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <p className="text-sm font-bold text-ink truncate leading-tight">{classmate.name}</p>
                    <p className="text-[10px] text-ink-mute font-medium truncate mt-0.5">{classmate.course}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFollowToggle(classmate.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition active:scale-95 shrink-0 ${
                        classmate.followed
                          ? "bg-white/[0.07] hover:bg-white/10 text-ink-soft"
                          : "bg-brand-500 hover:bg-brand-600 text-white shadow-sm"
                      }`}
                    >
                      {classmate.followed ? "Unfollow" : "Follow"}
                    </button>
                    <button
                      onClick={() => handleStartDM(classmate)}
                      className="w-8 h-8 rounded-lg bg-brand-500/15 text-brand-300 flex items-center justify-center active:scale-95 transition shrink-0"
                      title="Message"
                    >
                      <MessageIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Sheet>

      {/* CLASSMATE FULL-SCREEN PROFILE SLIDE-IN */}
      {selectedClassmate && (
        <div className="fixed inset-0 z-50 bg-black animate-slide-in-right overflow-y-auto no-scrollbar">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-white/[0.07]">
            <button
              onClick={() => setSelectedClassmate(null)}
              className="w-9 h-9 rounded-full bg-white/[0.07] flex items-center justify-center text-ink active:scale-90 transition"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <p className="text-sm font-bold text-ink">{selectedClassmate.name}</p>
            <div className="w-9" />
          </div>

          <div className="px-5 pt-6 pb-28 space-y-5">
            {/* Avatar + stats row */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-brand-500 via-purple-500 to-pink-500 shrink-0">
                <div className="w-full h-full rounded-full bg-black p-[2px]">
                  <div className="w-full h-full rounded-full bg-white/[0.07] flex items-center justify-center text-3xl overflow-hidden">
                    {selectedClassmate.avatar}
                  </div>
                </div>
              </div>
              <div className="flex-1 flex justify-around text-center">
                <div>
                  <p className="text-base font-bold text-ink">{selectedClassmate.stories?.length || 0}</p>
                  <p className="text-[10px] text-ink-mute font-semibold">Stories</p>
                </div>
                <div>
                  <p className="text-base font-bold text-ink">{selectedClassmate.followersCount ?? 0}</p>
                  <p className="text-[10px] text-ink-mute font-semibold">Followers</p>
                </div>
                <div>
                  <p className="text-base font-bold text-ink">{selectedClassmate.followingCount ?? 0}</p>
                  <p className="text-[10px] text-ink-mute font-semibold">Following</p>
                </div>
              </div>
            </div>

            {/* Name & course */}
            <div>
              <p className="text-base font-bold text-ink">{selectedClassmate.name}</p>
              <p className="text-[13px] text-ink-mute mt-0.5 flex items-center gap-1">🎓 {selectedClassmate.course}</p>
              {/* Bio */}
              {selectedClassmate.bio && (
                <p className="text-[13px] text-ink-soft mt-2 leading-relaxed">{selectedClassmate.bio}</p>
              )}
              {/* Skills chips */}
              {selectedClassmate.skills && selectedClassmate.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {selectedClassmate.skills.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-white/[0.06] rounded-full text-[11px] font-semibold text-ink-soft border border-white/[0.08]">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {/* Social links */}
              {selectedClassmate.links && (selectedClassmate.links.github || selectedClassmate.links.linkedin || selectedClassmate.links.instagram || selectedClassmate.links.portfolio) && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {selectedClassmate.links.github && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] rounded-full text-[11px] text-ink-mute border border-white/[0.07]">
                      <span>🐙</span> {selectedClassmate.links.github}
                    </span>
                  )}
                  {selectedClassmate.links.linkedin && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] rounded-full text-[11px] text-ink-mute border border-white/[0.07]">
                      <span>💼</span> {selectedClassmate.links.linkedin}
                    </span>
                  )}
                  {selectedClassmate.links.instagram && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] rounded-full text-[11px] text-ink-mute border border-white/[0.07]">
                      <span>📸</span> @{selectedClassmate.links.instagram}
                    </span>
                  )}
                  {selectedClassmate.links.portfolio && (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] rounded-full text-[11px] text-ink-mute border border-white/[0.07]">
                      <span>🌐</span> {selectedClassmate.links.portfolio}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleFollowToggle(selectedClassmate.id)}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition active:scale-95 ${
                  selectedClassmate.followed
                    ? "bg-white/[0.08] text-ink border border-white/10"
                    : "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                }`}
              >
                {selectedClassmate.followed ? "Following" : "Follow"}
              </button>
              <button
                onClick={() => { handleStartDM(selectedClassmate); setSelectedClassmate(null); }}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-white/[0.08] text-ink border border-white/10 active:scale-95 transition"
              >
                Message
              </button>
            </div>

            {/* Highlights */}
            {selectedClassmate.highlights && selectedClassmate.highlights.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-ink-mute uppercase tracking-widest mb-3">Highlights</p>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                  {selectedClassmate.highlights.map((h) => (
                    <div key={h.id} className="flex flex-col items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setActiveStoriesToView(h.stories)}
                        className="w-14 h-14 rounded-full border-2 border-white/20 bg-white/[0.05] flex items-center justify-center text-2xl active:scale-95 transition"
                      >
                        {h.coverEmoji || "🌟"}
                      </button>
                      <span className="text-[10px] font-semibold text-ink-soft truncate max-w-[56px] text-center">{h.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stories */}
            {selectedClassmate.stories && selectedClassmate.stories.length > 0 && (
              <button
                onClick={() => setActiveStoriesToView(selectedClassmate.stories)}
                className="w-full card p-4 flex items-center gap-3 active:scale-[0.99] transition"
              >
                <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-brand-500 via-purple-500 to-pink-500">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-lg">
                    {selectedClassmate.avatar}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">View story</p>
                  <p className="text-[11px] text-ink-mute">{selectedClassmate.stories.length} update{selectedClassmate.stories.length > 1 ? "s" : ""}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-mute ml-auto" />
              </button>
            )}

            {/* Business card */}
            {selectedClassmate.business && (
              <div
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: "linear-gradient(135deg, #1a0533 0%, #3b0764 45%, #7c3aed 100%)" }}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl shrink-0">
                  {selectedClassmate.business.type === "sell" ? "🛍️" : selectedClassmate.business.type === "service" ? "🛠️" : "🎓"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-[15px] truncate">{selectedClassmate.business.name}</p>
                  <p className="text-white/55 text-xs mt-0.5">
                    {selectedClassmate.business.type === "sell" ? "Selling" : selectedClassmate.business.type === "service" ? "Services" : "Club / Event"}
                    {selectedClassmate.business.contact ? ` · ${selectedClassmate.business.contact}` : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Marketplace listings by this classmate */}
            {(() => {
              const theirListings = DEMO_LISTINGS.filter(
                (l) => l.seller === selectedClassmate.name || l.seller.startsWith(selectedClassmate.name.split(" ")[0])
              );
              if (theirListings.length === 0) return null;
              return (
                <div>
                  <p className="text-[11px] font-bold text-ink-mute uppercase tracking-widest mb-3">Marketplace</p>
                  <div className="space-y-2">
                    {theirListings.map((listing) => (
                      <div key={listing.id} className="card p-3 flex items-center gap-3">
                        {listing.image ? (
                          <img src={listing.image} alt={listing.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center text-xl shrink-0">🛒</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-ink truncate">{listing.title}</p>
                          <p className="text-[11px] text-ink-mute mt-0.5">₹{listing.price}{listing.priceUnit ? ` / ${listing.priceUnit}` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* CREATE GROUP SHEET */}
      <GroupSheet
        open={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setEditingGroup(null);
          setPreaddedMember(null);
        }}
        group={editingGroup}
        preaddedMember={preaddedMember}
      />

      {/* Full-screen Story Viewer Overlay */}
      {activeStoriesToView && (
        <StoryViewerModal
          stories={activeStoriesToView}
          onClose={() => setActiveStoriesToView(null)}
        />
      )}

      {/* Chat Image attachment full screen popup */}
      {viewAttachedImage && (
        <div 
          onClick={() => setViewAttachedImage(null)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <img src={viewAttachedImage} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" alt="" />
          <button 
            onClick={() => setViewAttachedImage(null)}
            className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* STUDY BUDDY AI SHEET */}
      <Sheet
        open={isStudyBuddyOpen}
        onClose={() => setIsStudyBuddyOpen(false)}
        title="🤖 Study Buddy AI TA"
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-mute leading-snug">
            Your virtual Teaching Assistant. Ask me to generate a quiz, explain key concepts, or summarize group notes!
          </p>

          {/* Quick Prompts */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleBuddyPrompt("quiz")}
              disabled={aiTyping}
              className="py-2.5 px-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-95 transition text-center flex flex-col items-center justify-center gap-1"
            >
              <span className="text-base">❓</span>
              <span className="text-[10px] font-bold text-ink">Quiz</span>
            </button>
            <button
              onClick={() => handleBuddyPrompt("explain")}
              disabled={aiTyping}
              className="py-2.5 px-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-95 transition text-center flex flex-col items-center justify-center gap-1"
            >
              <span className="text-base">💡</span>
              <span className="text-[10px] font-bold text-ink">Explain</span>
            </button>
            <button
              onClick={() => handleBuddyPrompt("summarize")}
              disabled={aiTyping}
              className="py-2.5 px-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] active:scale-95 transition text-center flex flex-col items-center justify-center gap-1"
            >
              <span className="text-base">📝</span>
              <span className="text-[10px] font-bold text-ink">Summary</span>
            </button>
          </div>

          {/* AI Output Window */}
          {(aiTyping || aiResponse) && (
            <div className="card p-4 min-h-[140px] bg-gradient-to-br from-brand-900/5 to-black border-brand-500/10 flex flex-col justify-between">
              {aiTyping ? (
                <div className="flex items-center gap-2 text-xs text-ink-soft py-6 justify-center">
                  <span className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce" />
                  <span className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span>Buddy is thinking...</span>
                </div>
              ) : aiResponse ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">AI Response</span>
                  </div>
                  
                  <p className="text-xs text-ink-soft leading-relaxed whitespace-pre-line font-medium">
                    {aiResponse.text}
                  </p>

                  {/* Render Quiz Options if it's a quiz */}
                  {aiResponse.quiz && (
                    <div className="space-y-2 mt-3">
                      {aiResponse.quiz.opts.map((opt, oIdx) => {
                        const isSelected = quizSelectedIdx === oIdx;
                        const isCorrect = oIdx === aiResponse.quiz?.ansIdx;
                        const showFeedback = quizSelectedIdx !== null;
                        
                        let optStyle = "bg-white/[0.03] border-white/5 hover:border-white/10";
                        if (showFeedback) {
                          if (isCorrect) {
                            optStyle = "bg-green-500/10 border-green-500/30 text-green-300";
                          } else if (isSelected) {
                            optStyle = "bg-red-500/10 border-red-500/30 text-red-300";
                          } else {
                            optStyle = "bg-white/[0.01] border-white/5 opacity-50";
                          }
                        }
                        
                        return (
                          <button
                            key={opt}
                            disabled={showFeedback}
                            onClick={() => setQuizSelectedIdx(oIdx)}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition active:scale-[0.99] flex items-center justify-between ${optStyle}`}
                          >
                            <span>{opt}</span>
                            {showFeedback && isCorrect && <span>✓ Correct</span>}
                            {showFeedback && isSelected && !isCorrect && <span>✗ Incorrect</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}
              
              {/* Reset/Done */}
              {aiResponse && !aiTyping && (
                <button
                  onClick={() => {
                    setAiResponse(null);
                    setQuizSelectedIdx(null);
                  }}
                  className="mt-3 text-right text-[10px] font-bold text-ink-mute hover:text-ink-soft"
                >
                  Clear Output
                </button>
              )}
            </div>
          )}
        </div>
      </Sheet>

      {/* SHARE GROUP SHEET */}
      <Sheet open={isShareGroupOpen} onClose={() => setIsShareGroupOpen(false)} title="Share Study Group">
        {activeGroup && (() => {
          const groupData = {
            n: activeGroup.name,
            s: activeGroup.subjectId || "",
            m: activeGroup.members || [],
            t: (activeGroup.tasks || []).map(t => ({ t: t.title, d: t.done })),
            nt: activeGroup.notes || ""
          };
          const token = btoa(encodeURIComponent(JSON.stringify(groupData)).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
          }));
          
          return (
            <div className="space-y-4 flex flex-col items-center text-center">
              <p className="text-xs text-ink-soft">
                Scan this QR code from another device to import the study group, tasks, and notes instantly.
              </p>
              
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-white/10 flex items-center justify-center">
                <QRCodeSVG value={token} size={180} />
              </div>
              
              <div className="w-full space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-ink-mute uppercase tracking-wide block">
                  Copy Share Token
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    type="text"
                    value={token}
                    className="input text-xs font-mono py-1.5 px-3 flex-1 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(token);
                      alert("Share token copied!");
                    }}
                    className="btn-primary text-xs py-1.5 px-3 rounded-xl font-bold shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </Sheet>

      {/* IMPORT GROUP SHEET */}
      <Sheet open={isImportOpen} onClose={() => setIsImportOpen(false)} title="Import Study Group">
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-ink-soft">
            Paste the share token/code copied from another device to import the study group:
          </p>
          <textarea
            className="input w-full min-h-[100px] text-xs font-mono py-2 px-3 leading-normal resize-none"
            placeholder="Paste token here..."
            value={importToken}
            onChange={(e) => setImportToken(e.target.value)}
          />
          <button
            onClick={() => {
              try {
                const decodedJson = decodeURIComponent(atob(importToken.trim()).split('').map((c) => {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const parsed = JSON.parse(decodedJson);
                if (!parsed.n) throw new Error("Invalid format");
                
                const newGroup: StudyGroup = {
                  id: uid(),
                  name: parsed.n,
                  subjectId: parsed.s || undefined,
                  members: parsed.m || [],
                  tasks: (parsed.t || []).map((task: any) => ({
                    id: uid(),
                    title: task.t,
                    done: task.d || false,
                    status: task.d ? "done" : "todo",
                    createdAt: task.createdAt || new Date().toISOString(),
                  })),
                  notes: parsed.nt || "",
                  createdAt: new Date().toISOString(),
                  messages: [],
                  direct: false,
                };
                
                update(d => {
                  if (!d.groups) d.groups = [];
                  d.groups.push(newGroup);
                });
                
                setActiveGroupId(newGroup.id);
                setImportToken("");
                setIsImportOpen(false);
              } catch (e) {
                alert("Invalid group token!");
              }
            }}
            disabled={!importToken.trim()}
            className="btn-primary w-full py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Import Group
          </button>
        </div>
      </Sheet>

      {/* DM Profile Full-Screen Slide-In */}
      {dmProfileOpen && activeGroup?.direct && (
        <div className="fixed inset-0 z-50 bg-black transform transition-transform duration-300 translate-x-0 animate-slide-in-right overflow-y-auto no-scrollbar pb-10">
          {/* Top Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.08]">
            <button 
              onClick={() => setDmProfileOpen(false)}
              className="flex items-center gap-1.5 text-ink-soft hover:text-white font-semibold text-sm active:scale-95 transition"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span>Details</span>
            </button>
            <button 
              onClick={() => setOptionsSheetOpen(true)}
              className="text-ink-soft hover:text-white text-lg font-bold"
            >
              ⋯
            </button>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center mt-6">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-brand-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-black p-[3px]">
                <div className="w-full h-full rounded-full bg-white/[0.07] flex items-center justify-center overflow-hidden">
                  {classmatesMap[activeGroup.name]?.avatar && classmatesMap[activeGroup.name].avatar.startsWith("data:") ? (
                    <img src={classmatesMap[activeGroup.name].avatar} alt={activeGroup.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-4xl">{classmatesMap[activeGroup.name]?.avatar || "👤"}</span>
                  )}
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-ink mt-3">{activeGroup.name}</h2>
            <p className="text-xs text-ink-mute font-medium mt-1">{classmatesMap[activeGroup.name]?.course || "Student"}</p>
          </div>

          {/* Icon Actions */}
          <div className="grid grid-cols-4 gap-4 px-8 mt-6">
            <button 
              onClick={() => {
                if (classmatesMap[activeGroup.name]) {
                  setSelectedClassmate(classmatesMap[activeGroup.name]);
                } else {
                  alert("Profile not found.");
                }
              }}
              className="flex flex-col items-center gap-1.5 text-center active:scale-95 transition"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-ink-soft text-lg">
                👤
              </div>
              <span className="text-[10px] font-bold text-ink-soft">Profile</span>
            </button>

            <button 
              onClick={() => alert("Search feature coming soon!")}
              className="flex flex-col items-center gap-1.5 text-center active:scale-95 transition"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-ink-soft text-lg">
                🔍
              </div>
              <span className="text-[10px] font-bold text-ink-soft">Search</span>
            </button>

            <button 
              onClick={() => {
                setToastMsg("Chat muted");
                setTimeout(() => setToastMsg(null), 2000);
              }}
              className="flex flex-col items-center gap-1.5 text-center active:scale-95 transition"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-ink-soft text-lg">
                🔕
              </div>
              <span className="text-[10px] font-bold text-ink-soft">Mute</span>
            </button>

            <button 
              onClick={() => setOptionsSheetOpen(true)}
              className="flex flex-col items-center gap-1.5 text-center active:scale-95 transition"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-ink-soft text-lg">
                •••
              </div>
              <span className="text-[10px] font-bold text-ink-soft">Options</span>
            </button>
          </div>

          {/* List Options */}
          <div className="mt-8 border-t border-white/[0.08] divide-y divide-white/[0.08]">
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition">
              <span className="text-xs font-semibold text-ink">Theme</span>
              <ChevronRight className="w-4 h-4 text-ink-mute" />
            </div>
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition">
              <span className="text-xs font-semibold text-ink">Disappearing messages</span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-ink-mute font-medium">Off</span>
                <ChevronRight className="w-4 h-4 text-ink-mute" />
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition">
              <span className="text-xs font-semibold text-ink">Privacy and safety</span>
              <ChevronRight className="w-4 h-4 text-ink-mute" />
            </div>
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition">
              <span className="text-xs font-semibold text-ink">Nicknames</span>
              <ChevronRight className="w-4 h-4 text-ink-mute" />
            </div>
          </div>

          {/* Create Group Chat Row */}
          <div className="mt-4 border-t border-white/[0.08] border-b border-white/[0.08] divide-y divide-white/[0.08]">
            <div 
              onClick={() => {
                setPreaddedMember(activeGroup.name);
                setDmProfileOpen(false);
                setIsSheetOpen(true);
              }}
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition"
            >
              <span className="text-xs font-semibold text-brand-300">Create a group chat</span>
              <ChevronRight className="w-4 h-4 text-ink-mute" />
            </div>
          </div>

          {/* Shared Media / Links Tabs */}
          <div className="mt-8 px-5">
            <div className="flex gap-6 border-b border-white/[0.08] pb-2 mb-4">
              <button
                onClick={() => setProfileTab("media")}
                className={`text-sm font-bold pb-2 transition relative ${
                  profileTab === "media" ? "text-ink" : "text-ink-mute"
                }`}
              >
                <span>📷 Media</span>
                {profileTab === "media" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setProfileTab("links")}
                className={`text-sm font-bold pb-2 transition relative ${
                  profileTab === "links" ? "text-ink" : "text-ink-mute"
                }`}
              >
                <span>🔗 Links</span>
                {profileTab === "links" && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-500 rounded-full" />
                )}
              </button>
            </div>

            {profileTab === "media" ? (
              sharedImages.length === 0 ? (
                <p className="text-xs text-ink-mute italic py-8 text-center bg-white/[0.01] border border-white/[0.04] rounded-2xl">
                  No photos shared yet
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 animate-fade-in">
                  {sharedImages.map((url, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setViewAttachedImage(url)}
                      className="aspect-square rounded-xl overflow-hidden border border-white/[0.06] bg-black cursor-zoom-in active:scale-95 transition"
                    >
                      <img src={url} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                </div>
              )
            ) : (
              sharedLinks.length === 0 ? (
                <p className="text-xs text-ink-mute italic py-8 text-center bg-white/[0.01] border border-white/[0.04] rounded-2xl">
                  No links shared yet
                </p>
              ) : (
                <div className="space-y-2 animate-fade-in">
                  {sharedLinks.map((msg) => {
                    const words = msg.text.split(/\s+/);
                    const url = words.find(w => w.startsWith("http")) || msg.text;
                    return (
                      <a
                        key={msg.id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] rounded-xl transition"
                      >
                        <span className="text-lg">🔗</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-brand-300 truncate font-semibold">{url}</p>
                          <p className="text-[10px] text-ink-mute mt-0.5">Shared by @{msg.sender === "me" ? "you" : msg.sender}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Options Bottom Sheet */}
      <Sheet
        open={optionsSheetOpen}
        onClose={() => setOptionsSheetOpen(false)}
        title="Options"
      >
        <div className="space-y-1">
          <button
            onClick={() => {
              setToastMsg("Done");
              setTimeout(() => setToastMsg(null), 2000);
              setOptionsSheetOpen(false);
            }}
            className="w-full text-left py-3.5 px-4 text-xs font-bold hover:bg-white/[0.04] rounded-xl transition text-red-500"
          >
            Block user
          </button>
          <button
            onClick={() => {
              setToastMsg("Done");
              setTimeout(() => setToastMsg(null), 2000);
              setOptionsSheetOpen(false);
            }}
            className="w-full text-left py-3.5 px-4 text-xs font-bold hover:bg-white/[0.04] rounded-xl transition text-ink"
          >
            Restrict user
          </button>
          <button
            onClick={() => {
              setToastMsg("Reported to moderators");
              setTimeout(() => setToastMsg(null), 2000);
              setOptionsSheetOpen(false);
            }}
            className="w-full text-left py-3.5 px-4 text-xs font-bold hover:bg-white/[0.04] rounded-xl transition text-red-400"
          >
            Report user
          </button>
        </div>
      </Sheet>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-white text-black text-xs font-bold px-4 py-2.5 rounded-full shadow-lg animate-fade-up">
          {toastMsg}
        </div>
      )}
    </div>
  );
}

// Group settings sheet form component (study groups only)
function GroupSheet({
  open,
  onClose,
  group,
  preaddedMember,
}: {
  open: boolean;
  onClose: () => void;
  group: StudyGroup | null;
  preaddedMember?: string | null;
}) {
  const { data, update, uid } = useStore();
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [memberName, setMemberName] = useState("");

  useEffect(() => {
    if (open) {
      if (group) {
        setName(group.name);
        setSubjectId(group.subjectId || "");
        setDueDate(group.dueDate || "");
        setMembers(group.members || []);
      } else {
        setName("");
        setSubjectId("");
        setDueDate("");
        setMembers(preaddedMember ? [preaddedMember] : []);
      }
      setMemberName("");
    }
  }, [open, group, preaddedMember]);

  function handleAddMember() {
    const trimmed = memberName.trim();
    if (!trimmed) return;
    if (members.includes(trimmed)) {
      setMemberName("");
      return;
    }
    setMembers((m) => [...m, trimmed]);
    setMemberName("");
  }

  function handleRemoveMember(idx: number) {
    setMembers((m) => m.filter((_, i) => i !== idx));
  }

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    update((d) => {
      if (group) {
        const g = d.groups.find((x) => x.id === group.id);
        if (g) {
          g.name = trimmedName;
          g.subjectId = subjectId || undefined;
          g.dueDate = dueDate || undefined;
          g.members = members;
        }
      } else {
        d.groups.push({
          id: uid(),
          name: trimmedName,
          subjectId: subjectId || undefined,
          members: members,
          tasks: [],
          notes: "",
          dueDate: dueDate || undefined,
          createdAt: new Date().toISOString(),
          messages: [],
          direct: false,
        });
      }
    });

    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={group ? "Edit study group" : "Create new group"}
    >
      <div className="space-y-4">
        {/* Group Name */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Group Name
          </label>
          <input
            autoFocus
            className="input text-sm"
            placeholder="e.g. DBMS Term Project / Math Study Crew"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Linked Subject */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Subject (Optional)
          </label>
          <select
            className="input text-sm"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">No subject link</option>
            {data.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Group Members (Chip Input style) */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Add Members (Classmates)
          </label>
          <div className="flex gap-2">
            <input
              className="input flex-1 text-sm"
              placeholder="Type name..."
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddMember();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddMember}
              className="btn-primary px-4 flex items-center justify-center shrink-0"
            >
              <PlusIcon className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <span className="pill bg-brand-500/15 text-brand-300 text-xs font-semibold py-0.5 px-2">
              You
            </span>
            {members.map((member, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleRemoveMember(idx)}
                className="pill bg-white/[0.07] hover:bg-white/10 text-ink-soft text-xs font-semibold py-0.5 px-2 flex items-center gap-1 transition"
              >
                {member} ✕
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Shared Due Date (Optional)
          </label>
          <input
            type="date"
            className="input text-sm"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="btn-primary w-full py-2.5 rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed mt-2"
        >
          {group ? "Save changes" : "Create group"}
        </button>
      </div>
    </Sheet>
  );
}
