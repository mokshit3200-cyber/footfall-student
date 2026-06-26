"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react"; // frequency
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isDemo } from "@/lib/config";
import { INTENTS } from "@/lib/intents";
import { dbPostStory, dbFetchStoriesBar } from "@/lib/dbActions";
import StoryViewer, { hasViewedAllStories } from "./StoryViewer";
import SharedVibeCard, { encodeVibeShare, parseVibeShare } from "./SharedVibeCard";
import UserProfileView from "./UserProfileView";
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
  ClockIcon,
  BookmarkIcon,
  ShareIcon,
  HandRaiseIcon,
  BuildingIcon,
  SparklesIcon,
  BellIcon,
  CameraIcon,
  PlusIcon,
  ChevronRight
} from "./icons";

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
    profiles:{ name:"Arjun Sharma",  username:"arjun_s",  course:"B.Tech CSE", year:2, college:"IIIT Hyderabad",    verified:true,  is_private:false, avatar_url:null, is_ambassador:true, ambassador_role:"Event Manager", global_signup_rank:42, campus_signup_rank:2 },
    signal_raises: [
      { user_id: "dp2", profiles: { name: "Priya Nair", avatar_url: null } },
      { user_id: "dp4", profiles: { name: "Sneha Rao", avatar_url: null } },
    ]
  },
  { 
    id:"ds2", 
    user_id:"dp2", 
    content:"anyone for chai at 4pm? ☕", 
    intent: "free",
    reach: "campus",
    expires_at: new Date(Date.now() + 10800000).toISOString(),
    created_at: new Date(Date.now()-1800000).toISOString(), 
    profiles:{ name:"Priya Nair",    username:"priya.n",  course:"B.Tech ECE", year:3, college:"IIIT Hyderabad",    verified:false, is_private:true,  avatar_url:null, is_ambassador:false, global_signup_rank:87, campus_signup_rank:5 },
    signal_raises: [
      { user_id: "dp1", profiles: { name: "Arjun Sharma", avatar_url: null } }
    ]
  },
  { 
    id:"ds3", 
    user_id:"dp3", 
    content:"need remote frontend developer for next-gen fintech project 🚀", 
    intent: "looking",
    reach: "all",
    expires_at: new Date(Date.now() + 14400000).toISOString(),
    created_at: new Date(Date.now()-18000000).toISOString(),
    profiles:{ name:"Rohan Mehta",   username:"rohanm",   course:"B.Com",      year:1, college:"Osmania University",verified:false, is_private:false, avatar_url:null, is_ambassador:false, global_signup_rank:1042, campus_signup_rank:12 },
    signal_raises: [
      { user_id: "dp4", profiles: { name: "Sneha Rao", avatar_url: null } },
      { user_id: "dp5", profiles: { name: "Karan Patel", avatar_url: null } }
    ]
  },
  { 
    id:"ds4", 
    user_id:"dp4", 
    content:"selling brand new mechanical keyboard, keychron k2, ping if interested!", 
    intent: "sell",
    reach: "all",
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    created_at: new Date(Date.now()-3600000).toISOString(), 
    profiles:{ name:"Sneha Rao",     username:"sneha.r",  course:"MBA",        year:2, college:"BITS Pilani Hyd",  verified:true,  is_private:false, avatar_url:null, is_ambassador:true, ambassador_role:"Finance Lead", global_signup_rank:5, campus_signup_rank:1 },
    signal_raises: [
      { user_id: "dp2", profiles: { name: "Priya Nair", avatar_url: null } }
    ]
  },
  { 
    id:"ds5", 
    user_id:"dp5", 
    content:"anyone explain OS scheduling? exam tomorrow 🙏", 
    intent: "help",
    reach: "campus",
    expires_at: new Date(Date.now() + 5400000).toISOString(),
    created_at: new Date(Date.now()-900000).toISOString(),  
    profiles:{ name:"Karan Patel",   username:"karanp",   course:"B.Tech Mech",year:3, college:"IIIT Hyderabad",   verified:false, is_private:false, avatar_url:null, is_ambassador:false, global_signup_rank:98, campus_signup_rank:4 },
    signal_raises: []
  },
  { 
    id:"ds6", 
    user_id:"dp6", 
    content:"hosting sunset photography meet this saturday 🏕️", 
    intent: "event",
    reach: "all",
    expires_at: new Date(Date.now() + 21600000).toISOString(),
    created_at: new Date(Date.now()-5400000).toISOString(), 
    profiles:{ name:"Divya Krishna", username:"divyak",   course:"BCA",        year:2, college:"Osmania University",verified:false, is_private:false, avatar_url:null },
    signal_raises: [
      { user_id: "dp1", profiles: { name: "Arjun Sharma", avatar_url: null } },
      { user_id: "dp2", profiles: { name: "Priya Nair", avatar_url: null } }
    ]
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
  const name = person.name || "?";
  const cls = `w-${size} h-${size} rounded-full flex items-center justify-center shrink-0 overflow-hidden`;
  const url = person.avatar_url || person.avatar;
  const hasImage = url && (url.startsWith("http") || url.startsWith("data:"));
  const imgSrc = hasImage ? url : "/default_avatar.png";
  return <img src={imgSrc} alt={name} className={`${cls} object-cover border border-white/10`} />;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Connect({
  onSwitchTab,
  onChatOpen,
  onReplySheetOpen,
}: {
  onSwitchTab?: (t: any) => void;
  onChatOpen?: (o: boolean) => void;
  onReplySheetOpen?: (open: boolean) => void;
}) {
  const { user, profile } = useAuth();
  const demo = isDemo();

  // Search
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
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
  const [suggestedPeople, setSuggestedPeople] = useState<any[]>([]);

  // DM
  const [activeDmId, setActiveDmId] = useState<string | null>(null);
  const [activePeer, setActivePeer] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // DM extra actions
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [dmMenuOpen, setDmMenuOpen] = useState(false);
  const [blockConfirmingId, setBlockConfirmingId] = useState<string | null>(null);
  const [deleteConvoConfirming, setDeleteConvoConfirming] = useState(false);

  // Profile sheet
  const [viewProfile, setViewProfile] = useState<any | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileBlockConfirming, setProfileBlockConfirming] = useState(false);

  // Stories
  const [storyUsers, setStoryUsers] = useState<any[]>([]);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyViewerStartIdx, setStoryViewerStartIdx] = useState(0);
  const [addStoryOpen, setAddStoryOpen] = useState(false);
  const [storyUploading, setStoryUploading] = useState(false);
  const storyFileRef = useRef<HTMLInputElement | null>(null);
  const [storyPreviewUrl, setStoryPreviewUrl] = useState<string | null>(null);
  const [storyCaption, setStoryCaption] = useState("");
  const pendingStoryFileRef = useRef<File | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingVisibility, setPendingVisibility] = useState<"public" | "followers">("public");

  // DM Inbox
  const [dmInboxOpen, setDmInboxOpen] = useState(false);
  const [dmInboxConvos, setDmInboxConvos] = useState<any[]>([]);
  const [dmInboxLoading, setDmInboxLoading] = useState(false);
  const [dmUnreadCount, setDmUnreadCount] = useState(0);

  // Follow requests
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [requestsSheetOpen, setRequestsSheetOpen] = useState(false);

  // Story-style quick reply to a vibe ("I'm in" / raise hand)
  const [replyVibe, setReplyVibe] = useState<{ sig: any; peer: any } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  // Bookmarks
  const [bookmarkedSignals, setBookmarkedSignals] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [shareSignal, setShareSignal] = useState<any | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  // Countdown ticker
  const [ticker, setTicker] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(prev => prev + 1);
    }, 15000); // every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // Synchronize activeDmId with URL parameters for deep-linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeDmId) {
      params.set("chat", activeDmId);
    } else {
      params.delete("chat");
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    if (window.location.search !== `?${params.toString()}`) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [activeDmId]);

  // Share sheet search & friends
  const [shareSearch, setShareSearch] = useState("");
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [shareFriendsLoading, setShareFriendsLoading] = useState(false);

  useEffect(() => {
    if (!shareSignal) return;
    setShareSearch("");
    if (demo) {
      setFriendsList(DEMO_SEARCH_PEOPLE as any[]);
      return;
    }
    if (!user) return;
    
    const userId = user.id;
    async function loadFriends() {
      setShareFriendsLoading(true);
      try {
        const [{ data: outgoing }, { data: incoming }] = await Promise.all([
          supabase.from("follows")
            .select("following:profiles!follows_following_id_fkey(id,name,username,avatar_url,college,course,year,verified)")
            .eq("follower_id", userId)
            .eq("status", "accepted"),
          supabase.from("follows")
            .select("follower:profiles!follows_follower_id_fkey(id,name,username,avatar_url,college,course,year,verified)")
            .eq("following_id", userId)
            .eq("status", "accepted")
        ]);
        const friendsMap = new Map();
        (outgoing ?? []).forEach((f: any) => { if (f.following) friendsMap.set(f.following.id, f.following); });
        (incoming ?? []).forEach((f: any) => { if (f.follower) friendsMap.set(f.follower.id, f.follower); });
        setFriendsList(Array.from(friendsMap.values()));
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("Error loading friends:", err);
      } finally {
        setShareFriendsLoading(false);
      }
    }
    loadFriends();
  }, [shareSignal, user, demo]);

  const filteredFriends = useMemo(() => {
    const q = shareSearch.trim().toLowerCase();
    if (!q) return friendsList;
    return friendsList.filter(f => f.name.toLowerCase().includes(q) || (f.username || "").toLowerCase().includes(q));
  }, [friendsList, shareSearch]);

  const overlapBanner = useMemo(() => {
    if (scope !== "campus" || !mySignalIntent) return null;
    const campusSignals = signals.filter((s: any) => {
      const p = s.profiles ?? s;
      const isCampus = p.college === profile?.college || (demo && ["IIIT Hyderabad"].includes(p.college));
      return isCampus && s.user_id !== (user?.id || "me");
    });
    const sameIntentSignals = campusSignals.filter((s: any) => s.intent === mySignalIntent);
    const count = sameIntentSignals.length;
    if (count > 0) {
      const label = INTENTS.find(i => i.id === mySignalIntent)?.label?.toLowerCase() || "broadcasting";
      return (
        <div className="bg-brand-500/[0.05] border border-brand-500/20 rounded-3xl p-4 mb-5 flex items-center gap-3 select-none animate-fade-in">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          <p className="text-xs text-brand-300 font-medium leading-normal">
            You're {label} right now — <span className="text-white font-bold">{count} other{count > 1 ? 's' : ''}</span> {count > 1 ? 'are' : 'is'} too!
          </p>
        </div>
      );
    }
    return null;
  }, [scope, mySignalIntent, signals, profile, user, demo]);

  const crossCampusBanner = useMemo(() => {
    if (scope !== "all") return null;
    const lookingSignals = signals.filter((s: any) => s.reach === "all" && s.intent === "looking");
    const count = lookingSignals.length;
    if (count > 0) {
      return (
        <div className="bg-purple-500/[0.05] border border-purple-500/20 rounded-3xl p-4 mb-5 flex items-center gap-3 select-none animate-fade-in">
          <SparklesIcon className="w-4 h-4 text-purple-400 shrink-0" />
          <p className="text-xs text-purple-300 font-medium leading-normal">
            <span className="text-white font-bold">{count} classmate{count > 1 ? 's' : ''}</span> {count > 1 ? 'are' : 'is'} looking for teammates/opportunities across campuses.
          </p>
        </div>
      );
    }
    return null;
  }, [scope, signals]);

  // ── Helper functions for signal cards ───────────────────
  function getCountdown(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m left`;
    const h = Math.floor(m / 60);
    return `${h}h left`;
  }

  function getPrimaryLabel(intent: string, hasRaised: boolean) {
    if (hasRaised) return "You're in ✓";
    switch (intent) {
      case "free":
      case "looking":
      case "event":
        return "I'm in";
      case "study":
        return "Join";
      case "help":
        return "Help out";
      case "sell":
        return "I'm interested";
      default:
        return "Connect";
    }
  }

  async function toggleBookmark(sigId: string) {
    const next = new Set(bookmarkedSignals);
    if (next.has(sigId)) {
      next.delete(sigId);
      setBookmarkedSignals(next);
      if (!demo && user) {
        await supabase.from("signal_saves").delete().eq("signal_id", sigId).eq("user_id", user.id);
      }
    } else {
      next.add(sigId);
      setBookmarkedSignals(next);
      if (!demo && user) {
        await supabase.from("signal_saves").insert({ signal_id: sigId, user_id: user.id });
      }
    }
  }

  function handleShare(sig: any) {
    setShareSignal(sig);
  }

  async function handleSelectFriend(friend: any) {
    if (!shareSignal) return;
    // Encode the whole vibe so it renders as a card (Instagram-style share),
    // not a sentence. last_message stays human-readable for the inbox preview.
    const shareText = encodeVibeShare(shareSignal);
    const previewText = "📡 Shared a vibe";
    
    if (demo) {
      // For Arjun it's dg1, for Priya it's dg3, otherwise fake
      const groupId = friend.id === "dp1" ? "dg1" : friend.id === "dp2" ? "dg3" : `dg-fake-${friend.id}`;
      
      // 1. Write to localStorage demo_messages_{groupId}
      const savedMsgs = JSON.parse(localStorage.getItem(`demo_messages_${groupId}`) || "[]");
      const newMsg = {
        id: `share-${Date.now()}`,
        sender_id: "me",
        content: shareText,
        created_at: new Date().toISOString()
      };
      const updatedMsgs = [...savedMsgs, newMsg];
      localStorage.setItem(`demo_messages_${groupId}`, JSON.stringify(updatedMsgs));
      
      // 2. Update/create group conversation in demo_groups
      const localGroups = JSON.parse(localStorage.getItem("demo_groups") || "[]");
      const existingIdx = localGroups.findIndex((g: any) => g.group_id === groupId);
      
      if (existingIdx !== -1) {
        localGroups[existingIdx].last_message = previewText;
        localGroups[existingIdx].last_at = new Date().toISOString();
      } else {
        const newConvo = {
          group_id: groupId,
          type: "dm" as const,
          peer: {
            id: friend.id,
            name: friend.name,
            username: friend.username,
            avatar_url: friend.avatar_url || null,
            college: friend.college || "IIIT Hyderabad",
            course: friend.course || "B.Tech",
            year: friend.year || 2,
            verified: friend.verified || false
          },
          last_message: previewText,
          last_at: new Date().toISOString(),
          unread: 0,
          request_status: "accepted" as const
        };
        localGroups.unshift(newConvo);
      }
      localStorage.setItem("demo_groups", JSON.stringify(localGroups));
      
      setShareSignal(null);
      showToast(`Shared with ${friend.name.split(" ")[0]}`);
    } else {
      // Live mode
      try {
        const { data: groupId, error } = await supabase.rpc("create_dm", { other_user_id: friend.id });
        if (error) throw error;
        
        await supabase.from("messages").insert({
          group_id: groupId,
          sender_id: user!.id,
          content: shareText,
          type: 'text'
        });
        
        await supabase.from("groups").update({
          last_message: previewText,
          last_at: new Date().toISOString()
        }).eq("id", groupId);
        
        setShareSignal(null);
        showToast(`Shared with ${friend.name.split(" ")[0]}`);
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("Error sharing signal:", err);
        showToast("Couldn't share — try again");
      }
    }
  }

  async function acceptRequest(followerId: string) {
    if (!demo) {
      await supabase.from("follows").update({ status: "accepted" }).eq("follower_id", followerId).eq("following_id", user!.id);
    }
    setFollowRequests(prev => prev.filter(r => r.follower_id !== followerId));
    showToast("Request accepted");
  }

  async function declineRequest(followerId: string) {
    if (!demo) {
      await supabase.from("follows").delete().eq("follower_id", followerId).eq("following_id", user!.id);
    }
    setFollowRequests(prev => prev.filter(r => r.follower_id !== followerId));
  }

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
    // Demo stories
    setStoryUsers([
      {
        userId: "dp1",
        profile: { id: "dp1", name: "Arjun Sharma", username: "arjun_s", avatar_url: null, college: "IIIT Hyderabad", verified: true },
        stories: [{ id: "ds-s1", media_url: "https://picsum.photos/seed/story1/400/700", visibility: "public" as const, created_at: new Date(Date.now() - 3600000).toISOString(), expires_at: new Date(Date.now() + 72000000).toISOString() }],
      },
      {
        userId: "dp2",
        profile: { id: "dp2", name: "Priya Nair", username: "priya.n", avatar_url: null, college: "IIIT Hyderabad", verified: false },
        stories: [
          { id: "ds-s2", media_url: "https://picsum.photos/seed/story2/400/700", visibility: "followers" as const, created_at: new Date(Date.now() - 7200000).toISOString(), expires_at: new Date(Date.now() + 72000000).toISOString() },
          { id: "ds-s3", media_url: "https://picsum.photos/seed/story3/400/700", visibility: "public" as const, created_at: new Date(Date.now() - 1800000).toISOString(), expires_at: new Date(Date.now() + 72000000).toISOString() },
        ],
      },
      {
        userId: "dp6",
        profile: { id: "dp6", name: "Divya Krishna", username: "divyak", avatar_url: null, college: "Osmania University", verified: false },
        stories: [{ id: "ds-s4", media_url: "https://picsum.photos/seed/story4/400/700", visibility: "public" as const, created_at: new Date(Date.now() - 5400000).toISOString(), expires_at: new Date(Date.now() + 72000000).toISOString() }],
      },
    ]);
    // Demo DM inbox
    setDmUnreadCount(2);
  }, [demo]);

  // ── Load follow requests ─────────────────────────────────
  useEffect(() => {
    if (demo) {
      setFollowRequests(DEMO_REQUESTS.map(r => ({ follower_id: r.follower_id, profiles: r.profiles })));
      return;
    }
    if (!user) return;
    supabase.from("follows")
      .select("follower_id, profiles!follows_follower_id_fkey(id, name, username, avatar_url, college, course, year, verified)")
      .eq("following_id", user.id)
      .eq("status", "pending")
      .then(({ data }) => {
        setFollowRequests((data ?? []).map((r: any) => ({ follower_id: r.follower_id, profiles: r.profiles })));
      });
  }, [user, demo]);

  // ── Load stories bar ───────────────────────────────────────
  useEffect(() => {
    if (demo || !user || !profile?.college) return;
    dbFetchStoriesBar(user.id, profile.college).then(entries => {
      setStoryUsers(entries);
    });
  }, [user, profile, demo]);

  // ── Load suggested people (same college, not yet followed) ─
  useEffect(() => {
    if (demo) {
      setSuggestedPeople([
        { id: "s1", name: "Riya Sharma", username: "riya.sh", avatar_url: null, is_private: false },
        { id: "s2", name: "Dev Patel", username: "devp", avatar_url: null, is_private: false },
        { id: "s3", name: "Ananya K", username: "ananya.k", avatar_url: null, is_private: false },
        { id: "s4", name: "Rohan M", username: "rohanm", avatar_url: null, is_private: false },
      ]);
      return;
    }
    if (!user || !profile?.college) return;
    (async () => {
      const [{ data: peers }, { data: following }] = await Promise.all([
        supabase.from("profiles").select("id, name, username, avatar_url, is_private, college, course, year, verified").neq("id", user.id).limit(20),
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
      ]);
      const followedIds = new Set((following ?? []).map((f: any) => f.following_id));
      const suggestions = (peers ?? []).filter((p: any) => !followedIds.has(p.id)).slice(0, 8);
      setSuggestedPeople(suggestions);
    })();
  }, [user, profile?.college, demo]);

  // ── Load DM inbox ─────────────────────────────────────────
  async function loadDmInbox() {
    setDmInboxLoading(true);
    if (demo) {
      const localGroups = JSON.parse(localStorage.getItem("demo_groups") || "[]");
      setDmInboxConvos(localGroups);
      setDmInboxLoading(false);
      return;
    }
    if (!user) { setDmInboxLoading(false); return; }
    const { data } = await supabase
      .from("group_members")
      .select("group_id, groups!inner(id, type, last_message, last_at, request_status)")
      .eq("user_id", user.id)
      .eq("groups.type", "dm")
      .order("groups(last_at)", { ascending: false })
      .limit(30);
    if (data) {
      const convos = await Promise.all(data.map(async (gm: any) => {
        const group = gm.groups;
        const { data: members } = await supabase
          .from("group_members")
          .select("user_id, profiles!inner(id, name, username, avatar_url, college, course, year, verified)")
          .eq("group_id", group.id)
          .neq("user_id", user!.id)
          .limit(1);
        const peer = members?.[0]?.profiles || null;
        return { group_id: group.id, peer, last_message: group.last_message, last_at: group.last_at, request_status: group.request_status };
      }));
      setDmInboxConvos(convos.filter(c => c.peer));
    }
    setDmInboxLoading(false);
  }

  function resetStoryComposer() {
    if (storyPreviewUrl) URL.revokeObjectURL(storyPreviewUrl);
    setAddStoryOpen(false);
    setStoryPreviewUrl(null);
    setStoryCaption("");
    pendingStoryFileRef.current = null;
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (storyFileRef.current) storyFileRef.current.value = "";
  }

  function handleStoryFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingStoryFileRef.current = file;
    if (storyPreviewUrl) URL.revokeObjectURL(storyPreviewUrl);
    setStoryPreviewUrl(URL.createObjectURL(file));
  }

  async function handlePendingStoryUpload() {
    const file = pendingStoryFileRef.current;
    if (!file) return;
    setStoryUploading(true);
    if (demo) {
      // Demo: just show a toast
      setTimeout(() => {
        setStoryUploading(false);
        resetStoryComposer();
        showToast("Story posted! 📸");
      }, 800);
      return;
    }
    if (!user) { setStoryUploading(false); return; }
    const ok = await dbPostStory(user.id, file, pendingVisibility);
    setStoryUploading(false);
    resetStoryComposer();
    if (ok) {
      showToast("Story posted! 📸");
      // Refresh stories bar
      if (profile?.college) {
        const entries = await dbFetchStoriesBar(user.id, profile.college);
        setStoryUsers(entries ?? []);
      }
    } else {
      showToast("Upload failed - try again");
    }
  }

  // ── Load feed ───────────────────────────────────────────
  useEffect(() => {
    if (demo || !user || !profile?.college) { if (!demo) setFeedLoading(false); return; }
    loadFeed();
  }, [user, profile, scope, demo]);

  async function loadFeed() {
    setFeedLoading(true);
    const [feedRes, mySignalRes, savesRes, blocksRes] = await Promise.all([
      supabase.from("signals")
        .select("*, profiles!signals_user_id_fkey(name,username,course,year,college,verified,is_private,avatar_url), signal_raises(user_id, profiles(name,avatar_url))")
        .gt("expires_at", new Date().toISOString())
        .neq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(60),
      supabase.from("signals")
        .select("content, intent, reach, expires_at")
        .eq("user_id", user!.id)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle(),
      supabase.from("signal_saves")
        .select("signal_id")
        .eq("user_id", user!.id),
      supabase.from("blocks")
        .select("blocked_id")
        .eq("blocker_id", user!.id)
    ]);

    let data = feedRes.data ?? [];
    const blockedIds = new Set((blocksRes?.data ?? []).map((b: any) => b.blocked_id));
    if (blockedIds.size > 0) {
      data = data.filter((s: any) => !blockedIds.has(s.user_id));
    }
    
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

    if (savesRes.data) {
      setBookmarkedSignals(new Set(savesRes.data.map((s: any) => s.signal_id)));
    } else {
      setBookmarkedSignals(new Set());
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

  // ── DM ──────────────────────────────────────────────────
  async function openDm(person: any, seedContent?: string, signalId?: string) {
    setActivePeer(person); 
    onChatOpen?.(true);
    
    if (demo) {
      const fakeGroupId = `dg-fake-${person.id}`;
      setActiveDmId(fakeGroupId);
      
      const followState = followStates[person.id] || "none";
      const isMutual = followState === "mutual";
      const requestStatus = isMutual ? "accepted" : "pending";
      
      const newConvo = {
        group_id: fakeGroupId,
        type: "dm",
        peer: {
          id: person.id,
          name: person.name,
          username: person.username,
          avatar_url: person.avatar_url,
          verified: person.verified,
          college: person.college,
          course: person.course,
          year: person.year
        },
        last_message: seedContent || "",
        last_at: new Date().toISOString(),
        unread: 0,
        request_status: requestStatus,
        requested_by: "me",
        origin_signal_note: person.signal_note || person.content || ""
      };
      
      // Save/Merge in localStorage
      const localGroups = JSON.parse(localStorage.getItem("demo_groups") || "[]");
      const filteredGroups = localGroups.filter((g: any) => g.group_id !== fakeGroupId);
      localStorage.setItem("demo_groups", JSON.stringify([newConvo, ...filteredGroups]));
      
      const savedMsgs = JSON.parse(localStorage.getItem(`demo_messages_${fakeGroupId}`) || "[]");
      if (savedMsgs.length === 0 && seedContent) {
        const fakeMsg = {
          id: `seed-${Date.now()}`,
          sender_id: "me",
          content: seedContent,
          created_at: new Date().toISOString()
        };
        savedMsgs.push(fakeMsg);
        localStorage.setItem(`demo_messages_${fakeGroupId}`, JSON.stringify(savedMsgs));
      }
      setMessages(savedMsgs);
      setMsgLoading(false);
      return;
    }
    
    setMsgLoading(true);
    const { data, error } = await supabase.rpc("create_dm", { other_user_id: person.id });
    if (error) { 
      onChatOpen?.(false); 
      setActivePeer(null); 
      setMsgLoading(false);
    } else {
      const groupId = data as string;
      
      // Query follows table for robust mutual follow check
      const [{ data: outFollow }, { data: inFollow }] = await Promise.all([
        supabase.from("follows").select("status").eq("follower_id", user!.id).eq("following_id", person.id).maybeSingle(),
        supabase.from("follows").select("status").eq("following_id", user!.id).eq("follower_id", person.id).maybeSingle()
      ]);
      const isMutual = outFollow?.status === "accepted" && inFollow?.status === "accepted";
      const requestStatus = isMutual ? 'accepted' : 'pending';
      
      const groupUpdates: any = {
        request_status: requestStatus,
        requested_by: user!.id
      };
      if (signalId) {
        groupUpdates.origin_signal_id = signalId;
      }
      
      if (seedContent) {
        await Promise.all([
          supabase.from("groups").update(groupUpdates).eq("id", groupId),
          supabase.from("messages").insert({
            group_id: groupId,
            sender_id: user!.id,
            content: seedContent,
            type: 'text'
          })
        ]);
      } else {
        await supabase.from("groups").update(groupUpdates).eq("id", groupId);
      }
      setActiveDmId(groupId);
    }
  }

  // Send a quick story-style reply to a vibe WITHOUT opening the full chat.
  // Persists the DM + message in the background and keeps the user on the feed.
  async function sendQuickReply() {
    if (!replyVibe || !replyText.trim() || replySending) return;
    const { sig, peer } = replyVibe;
    if (!peer?.id) { showToast("Couldn't send — try again"); return; }
    const text = replyText.trim();
    setReplySending(true);

    try {
      if (demo) {
        const fakeGroupId = `dg-fake-${peer.id}`;
        const followState = followStates[peer.id] || "none";
        const requestStatus = followState === "mutual" ? "accepted" : "pending";

        const savedMsgs = JSON.parse(localStorage.getItem(`demo_messages_${fakeGroupId}`) || "[]");
        savedMsgs.push({ id: `reply-${Date.now()}`, sender_id: "me", content: text, created_at: new Date().toISOString() });
        localStorage.setItem(`demo_messages_${fakeGroupId}`, JSON.stringify(savedMsgs));

        const localGroups = JSON.parse(localStorage.getItem("demo_groups") || "[]");
        const idx = localGroups.findIndex((g: any) => g.group_id === fakeGroupId);
        if (idx !== -1) {
          localGroups[idx].last_message = text;
          localGroups[idx].last_at = new Date().toISOString();
        } else {
          localGroups.unshift({
            group_id: fakeGroupId,
            type: "dm",
            peer: { id: peer.id, name: peer.name, username: peer.username, avatar_url: peer.avatar_url, college: peer.college, course: peer.course, year: peer.year, verified: peer.verified },
            last_message: text,
            last_at: new Date().toISOString(),
            unread: 0,
            request_status: requestStatus,
            requested_by: "me",
            origin_signal_note: sig.content || "",
          });
        }
        localStorage.setItem("demo_groups", JSON.stringify(localGroups));
      } else if (user) {
        const { data: groupId, error } = await supabase.rpc("create_dm", { other_user_id: peer.id });
        if (error) throw error;
        await Promise.all([
          supabase.from("messages").insert({ group_id: groupId, sender_id: user.id, content: text, type: "text" }),
          supabase.from("groups").update({ last_message: text, last_at: new Date().toISOString(), origin_signal_id: sig.id, requested_by: user.id }).eq("id", groupId),
        ]);
      }
      onReplySheetOpen?.(false);
      setReplyVibe(null);
      setReplyText("");
      showToast(`Sent to ${peer.name.split(" ")[0]} ✓`);
    } catch {
      showToast("Couldn't send — try again");
    } finally {
      setReplySending(false);
    }
  }

  // Open a full profile view (fetches skills/links from DB in live mode)
  async function openViewProfile(partial: any) {
    setViewProfile(partial);
    setProfileMenuOpen(false);
    setProfileBlockConfirming(false);
    if (!demo && (partial.id || partial.user_id)) {
      const id = partial.id ?? partial.user_id;
      const { data } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url, college, course, year, verified, is_private, skills, links, bio")
        .eq("id", id)
        .single();
      if (data) setViewProfile((prev: any) => ({ ...prev, ...data }));
    }
  }

  // Check for pending DM from Marketplace "Message Seller"
  useEffect(() => {
    if (demo) return;
    const raw = localStorage.getItem("footfall-pending-dm");
    if (!raw) return;
    try {
      const person = JSON.parse(raw);
      localStorage.removeItem("footfall-pending-dm");
      if (person?.id) openDm(person);
    } catch { /* ignore */ }
  }, [demo]);

  useEffect(() => {
    if (!activeDmId || demo) return;
    setMsgLoading(true);
    supabase.from("messages").select("*").eq("group_id", activeDmId).order("created_at")
      .then(({ data }) => { setMessages(data ?? []); setMsgLoading(false); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100); });
  }, [activeDmId, demo]);

  useEffect(() => {
    if (!activeDmId || demo) return;
    const ch = supabase.channel(`dm-${activeDmId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${activeDmId}` }, (payload) => {
        setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new as any]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeDmId, demo]);

  async function sendMsg() {
    if (!msgInput.trim() || !activeDmId) return;
    const content = msgInput.trim(); 
    setMsgInput("");
    
    if (demo) {
      const fakeMsg = {
        id: `m-fake-${Date.now()}`,
        sender_id: user?.id || "me",
        content,
        created_at: new Date().toISOString()
      };
      // Append in localStorage
      const savedMsgs = JSON.parse(localStorage.getItem(`demo_messages_${activeDmId}`) || "[]");
      const updatedMsgs = [...savedMsgs, fakeMsg];
      localStorage.setItem(`demo_messages_${activeDmId}`, JSON.stringify(updatedMsgs));
      setMessages(updatedMsgs);
      
      // Update last message in demo_groups in localStorage
      const localGroups = JSON.parse(localStorage.getItem("demo_groups") || "[]");
      const updatedGroups = localGroups.map((g: any) => {
        if (g.group_id === activeDmId) {
          return { ...g, last_message: content, last_at: new Date().toISOString() };
        }
        return g;
      });
      localStorage.setItem("demo_groups", JSON.stringify(updatedGroups));
      
      // Simulated reply after 1.5 seconds
      setTimeout(() => {
        const replyMsg = {
          id: `m-fake-reply-${Date.now()}`,
          sender_id: activePeer.id,
          content: `Hey! Let's connect about that. 👍`,
          created_at: new Date().toISOString()
        };
        const curMsgs = JSON.parse(localStorage.getItem(`demo_messages_${activeDmId}`) || "[]");
        const withReply = [...curMsgs, replyMsg];
        localStorage.setItem(`demo_messages_${activeDmId}`, JSON.stringify(withReply));
        
        // Only update state if we are still chatting with the same peer
        setMessages(prev => {
          if (prev.length > 0 && prev[0].id === updatedMsgs[0].id) {
            return withReply;
          }
          return prev;
        });
        
        // Update last message in localStorage
        const curGroups = JSON.parse(localStorage.getItem("demo_groups") || "[]");
        localStorage.setItem("demo_groups", JSON.stringify(curGroups.map((g: any) => {
          if (g.group_id === activeDmId) {
            return { ...g, last_message: replyMsg.content, last_at: new Date().toISOString() };
          }
          return g;
        })));
      }, 1500);
      return;
    }
    
    if (!user) return;
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

  // Derived feed list — MUST run before any early return below so React
  // always sees the same number of hooks (DM chat + profile sheet both
  // early-return; a hook after them caused "Rendered fewer hooks" crashes).
  const visibleSignals = useMemo(() => {
    let list = [...signals];

    // Filter out expired signals
    list = list.filter((sig: any) => !sig.expires_at || new Date(sig.expires_at).getTime() > Date.now());

    // 1. Filter by scope
    if (scope === "campus") {
      if (demo) {
        list = list.filter((s: any) => {
          const p = s.profiles ?? s;
          return p.college === "IIIT Hyderabad";
        });
      } else {
        list = list.filter((s: any) => {
          const p = s.profiles ?? s;
          return p.college === profile?.college;
        });
      }
    } else {
      list = list.filter((s: any) => s.reach === "all");
    }

    // 2. Filter by intent category tabs
    if (activeFilter !== "all") {
      list = list.filter((s: any) => s.intent === activeFilter);
    }

    return list;
  }, [signals, scope, activeFilter, profile, demo, ticker]);

  // ── DM chat screen ───────────────────────────────────────
  if (activeDmId && activePeer) {
    const deleteMsg = async (msgId: string) => {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      setSelectedMsgId(null);
      if (!demo) {
        await supabase.from("messages").delete().eq("id", msgId);
      } else {
        const saved = JSON.parse(localStorage.getItem(`demo_messages_${activeDmId}`) || "[]");
        localStorage.setItem(`demo_messages_${activeDmId}`, JSON.stringify(saved.filter((m: any) => m.id !== msgId)));
      }
    };
    const blockPeer = async () => {
      if (!demo) {
        await supabase.from("blocks").insert({ blocker_id: user!.id, blocked_id: activePeer.id });
      }
      setSignals(prev => prev.filter((s: any) => s.user_id !== activePeer.id));
      setActiveDmId(null); setActivePeer(null); onChatOpen?.(false);
      setDmMenuOpen(false); setBlockConfirmingId(null);
      showToast("User blocked");
    };
    const deleteConvo = async () => {
      if (!demo) {
        await supabase.from("groups").delete().eq("id", activeDmId);
      } else {
        localStorage.removeItem(`demo_messages_${activeDmId}`);
        const groups = JSON.parse(localStorage.getItem("demo_groups") || "[]");
        localStorage.setItem("demo_groups", JSON.stringify(groups.filter((g: any) => g.group_id !== activeDmId)));
      }
      setActiveDmId(null); setActivePeer(null); onChatOpen?.(false);
      setDmMenuOpen(false); setDeleteConvoConfirming(false);
    };
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black text-white overflow-hidden" onClick={() => { if (selectedMsgId) setSelectedMsgId(null); }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] shrink-0 bg-[#0c0c0e]/95 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => { setActiveDmId(null); setActivePeer(null); onChatOpen?.(false); }}
            className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center shrink-0 text-white">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <Avatar person={activePeer} size={9} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="font-bold text-ink text-sm truncate">{activePeer.name}</span>
              {activePeer.verified && <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px]"><CheckIcon className="w-2.5 h-2.5" /></span>}
            </div>
            {activePeer.username && <p className="text-[10px] text-brand-300 font-medium truncate">@{activePeer.username}</p>}
          </div>
          <button onClick={(e) => { e.stopPropagation(); setDmMenuOpen(true); setBlockConfirmingId(null); setDeleteConvoConfirming(false); }}
            className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-90 transition flex items-center justify-center text-ink-soft shrink-0">
            <span className="text-lg leading-none font-bold tracking-tighter">⋯</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 bg-black" style={{ overscrollBehavior: "contain" }}>
          {msgLoading ? <div className="flex items-center justify-center h-full opacity-40"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
            : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                <SignalIcon className="w-12 h-12 text-white/10 mb-3 animate-pulse" />
                <p className="text-xs font-bold text-ink">On the same frequency</p>
                <p className="text-[10px] text-ink-mute mt-1">Start the conversation by typing below.</p>
              </div>
            )
            : messages.map(m => {
              const mine = m.sender_id === user?.id || (demo && m.sender_id === "me");
              const selected = selectedMsgId === m.id;
              const sharedVibe = parseVibeShare(m.content);
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  {mine && selected && (
                    <div className="flex items-center gap-1 mr-2 self-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMsg(m.id); }}
                        className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/20"
                      >
                        Delete?
                      </button>
                    </div>
                  )}
                  {sharedVibe ? (
                    <div
                      onClick={(e) => { e.stopPropagation(); if (mine) setSelectedMsgId(selected ? null : m.id); }}
                      className={selected ? "rounded-2xl ring-2 ring-red-400/50" : ""}
                    >
                      <SharedVibeCard
                        vibe={sharedVibe}
                        onOpenProfile={(v) => openViewProfile({ ...v, id: v.user_id })}
                      />
                      <span className="text-[9px] text-ink-mute block mt-1 text-right pr-1">{new Date(m.created_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</span>
                    </div>
                  ) : (
                    <div
                      onClick={(e) => { e.stopPropagation(); if (mine) setSelectedMsgId(selected ? null : m.id); }}
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs cursor-default ${mine ? "bg-brand-500 text-white rounded-tr-none" : "bg-white/[0.08] text-ink rounded-tl-none border border-white/[0.05]"} ${selected ? "ring-2 ring-red-400/50" : ""}`}
                    >
                      <p className="break-words leading-relaxed">{m.content}</p>
                      <span className="text-[9px] opacity-50 block mt-1 text-right">{new Date(m.created_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</span>
                    </div>
                  )}
                </div>
              );
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
        {/* ⋯ Action sheet */}
        {dmMenuOpen && (
          <div className="absolute inset-0 z-[60] flex flex-col justify-end" onClick={() => { setDmMenuOpen(false); setBlockConfirmingId(null); setDeleteConvoConfirming(false); }}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative bg-[#111] border-t border-white/[0.08] rounded-t-3xl p-4 space-y-2" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />
              {blockConfirmingId ? (
                <div className="space-y-2">
                  <p className="text-xs text-ink-mute text-center mb-2">Block {activePeer.name}? They won&apos;t be able to message you.</p>
                  <button onClick={blockPeer} className="w-full py-3 rounded-2xl bg-red-500/20 text-red-400 font-bold text-sm border border-red-500/20">Confirm Block</button>
                  <button onClick={() => setBlockConfirmingId(null)} className="w-full py-3 rounded-2xl bg-white/[0.05] text-ink-soft font-bold text-sm">Cancel</button>
                </div>
              ) : deleteConvoConfirming ? (
                <div className="space-y-2">
                  <p className="text-xs text-ink-mute text-center mb-2">Delete this conversation? This cannot be undone.</p>
                  <button onClick={deleteConvo} className="w-full py-3 rounded-2xl bg-red-500/20 text-red-400 font-bold text-sm border border-red-500/20">Delete Conversation</button>
                  <button onClick={() => setDeleteConvoConfirming(false)} className="w-full py-3 rounded-2xl bg-white/[0.05] text-ink-soft font-bold text-sm">Cancel</button>
                </div>
              ) : (
                <>
                  <button onClick={() => setBlockConfirmingId(activePeer.id)} className="w-full py-3 rounded-2xl bg-red-500/10 text-red-400 font-bold text-sm text-left px-4">
                    Block {activePeer.name}
                  </button>
                  <button onClick={() => setDeleteConvoConfirming(true)} className="w-full py-3 rounded-2xl bg-white/[0.05] text-ink-soft font-bold text-sm text-left px-4">
                    Delete conversation
                  </button>
                  <button onClick={() => setDmMenuOpen(false)} className="w-full py-3 rounded-2xl bg-white/[0.04] text-ink-mute font-bold text-sm">Cancel</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Profile sheet ────────────────────────────────────────
  if (viewProfile) {
    const peerId = viewProfile.id ?? viewProfile.user_id;
    const isRequest = followRequests.some(r => r.follower_id === peerId);
    return (
      <UserProfileView
        peer={viewProfile}
        open={!!viewProfile}
        onClose={() => setViewProfile(null)}
        demo={demo}
        currentUserId={user?.id}
        onSwitchTab={onSwitchTab}
        onOpenDm={(p) => {
          setViewProfile(null);
          openDm(p);
        }}
        followState={followStates[peerId] || "none"}
        onFollow={(pId, newState) => {
          setFollowStates(prev => ({ ...prev, [pId]: newState }));
          // If blocking is triggered via profile menu, remove from feed signals
          if (newState === "blocked") {
            setSignals(prev => prev.filter((s: any) => s.user_id !== pId));
          }
        }}
        mode={isRequest ? "request" : "view"}
        onAccept={async (followerId) => {
          await acceptRequest(followerId);
          setViewProfile(null);
        }}
        onDecline={async (followerId) => {
          await declineRequest(followerId);
          setViewProfile(null);
        }}
      />
    );
  }

  const showingSearch = search.trim().length > 0;

  return (
    <div className="pb-28 min-h-screen no-scrollbar animate-fade-in">

      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SignalIcon className="w-6 h-6 text-brand-400" />
            <h1 className="text-2xl font-bold text-ink tracking-tight">Frequency</h1>
          </div>
          {/* DM Inbox Bell */}
          <button
            onClick={() => { setDmInboxOpen(true); loadDmInbox(); }}
            className="relative w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-90 transition flex items-center justify-center text-ink-soft hover:text-white"
          >
            <BellIcon className="w-5 h-5" />
            {dmUnreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-black animate-bounce">
                {dmUnreadCount > 9 ? "9+" : dmUnreadCount}
              </span>
            )}
          </button>
        </div>
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
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
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
              <div key={p.id} onClick={() => openViewProfile(p)}
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
      ) : searchFocused ? (
        <div className="px-5 pt-2 animate-fade-in">
          <p className="text-[10px] font-semibold text-ink-mute uppercase tracking-wider mb-4">People you may know</p>
          {suggestedPeople.length === 0 ? (
            <p className="text-sm text-ink-mute text-center py-10">No one to discover yet 👀</p>
          ) : (
            <div className="space-y-2.5">
              {suggestedPeople.map((person: any) => (
                <div key={person.id} onClick={() => openViewProfile(person)}
                  className="bg-[#0c0c0e]/90 border border-white/[0.07] rounded-3xl p-4 flex items-center gap-3.5 cursor-pointer hover:border-white/12 active:scale-[0.98] transition-all">
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center overflow-hidden shrink-0">
                    {person.avatar_url && (person.avatar_url.startsWith("http") || person.avatar_url.startsWith("data:")) ? (
                      <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-ink-mute">{person.name?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-ink text-sm truncate">{person.name}</span>
                      {person.verified && <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px]"><CheckIcon className="w-2.5 h-2.5" /></span>}
                      {person.is_private && <LockIcon className="w-3.5 h-3.5 text-ink-mute shrink-0" />}
                    </div>
                    {person.username && <p className="text-[11px] text-brand-300 font-medium">@{person.username}</p>}
                    {person.college && <p className="text-[11px] text-ink-mute truncate mt-0.5">{person.college}</p>}
                  </div>
                  <div onClick={e => e.stopPropagation()} className="shrink-0">
                    <FollowBtn personId={person.id} isPrivate={person.is_private ?? false} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 animate-fade-in">
          {/* ── Follow Requests Banner ── */}
          {followRequests.length > 0 && (
            <button
              onClick={() => setRequestsSheetOpen(true)}
              className="w-full mb-4 flex items-center justify-between p-4 rounded-3xl bg-brand-500/[0.06] border border-brand-500/20 hover:border-brand-500/35 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                  <BellIcon className="w-4 h-4 text-brand-400" />
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">{followRequests.length}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-ink">{followRequests.length} Follow Request{followRequests.length > 1 ? "s" : ""}</p>
                  <p className="text-[11px] text-ink-mute truncate max-w-[200px]">
                    {followRequests[0]?.profiles?.name}{followRequests.length > 1 ? ` and ${followRequests.length - 1} others want to follow you` : " wants to follow you"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-mute shrink-0" />
            </button>
          )}

          {/* ── Stories Bar ── */}
          <div className="mb-5 -mx-5 px-5">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 select-none">
              {/* Your Story */}
              <button
                onClick={() => setAddStoryOpen(true)}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                <div className="relative">
                  <div className="w-[60px] h-[60px] rounded-full bg-white/[0.06] border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-brand-400/50 transition-colors">
                    <img 
                      src={profile?.avatar_url && (profile.avatar_url.startsWith("http") || profile.avatar_url.startsWith("data:")) ? profile.avatar_url : "/default_avatar.png"} 
                      alt="Me" 
                      className="w-full h-full rounded-full object-cover opacity-60" 
                    />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center border-2 border-black">
                    <PlusIcon className="w-3 h-3 text-white" />
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-ink-mute truncate max-w-[60px]">Your story</span>
              </button>

              {/* Other stories */}
              {storyUsers.map((su, idx) => {
                const allViewed = hasViewedAllStories(su.stories);
                const initials = (su.profile.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <button
                    key={su.userId}
                    onClick={() => { setStoryViewerStartIdx(idx); setStoryViewerOpen(true); }}
                    className="flex flex-col items-center gap-1.5 shrink-0 group"
                  >
                    <div className={`w-[60px] h-[60px] rounded-full p-[3px] ${allViewed ? "bg-gradient-to-br from-white/10 to-white/5" : "bg-gradient-to-br from-green-400 to-emerald-500"}`}>
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden border-2 border-black">
                        <img 
                          src={su.profile.avatar_url && (su.profile.avatar_url.startsWith("http") || su.profile.avatar_url.startsWith("data:")) ? su.profile.avatar_url : "/default_avatar.png"} 
                          alt={su.profile.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-ink-mute truncate max-w-[60px]">{su.profile.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Suggested People Strip */}
          {suggestedPeople.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] font-semibold text-ink-mute uppercase tracking-wider mb-3">People at your college</p>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 select-none -mx-5 px-5">
              {suggestedPeople.map((person) => (
                <div key={person.id} className="flex flex-col items-center gap-1.5 shrink-0 group">
                  <div className="relative w-12 h-12 rounded-full bg-white/[0.06] border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-brand-400/50 transition-colors">
                    <img
                      src={person.avatar_url && (person.avatar_url.startsWith('http') || person.avatar_url.startsWith('data:')) ? person.avatar_url : '/default_avatar.png'}
                      alt={person.name}
                      className="w-full h-full rounded-full object-cover opacity-60"
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-ink-mute truncate max-w-[60px]">{person.name.split(' ')[0]}</span>
                  <button
                    onClick={e => { e.stopPropagation(); handleFollow(person.id, person.is_private); setSuggestedPeople(prev => prev.filter(p => p.id !== person.id)); }}
                    className="mt-1 px-2 py-0.5 text-xs bg-brand-500 text-white rounded-full hover:bg-brand-600 transition"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* My signal */}
          <button onClick={() => {
            setBroadcastInput(mySignal ?? "");
            setBroadcastIntent(mySignalIntent ?? "free");
            setBroadcastReach(mySignalReach ?? "campus");
            setBroadcastDuration("4h");
            setBroadcasting(true);
          }}
            className={`w-full mb-5 rounded-3xl border p-5 text-left transition-all active:scale-[0.98] ${
              mySignal
                ? "bg-brand-500/[0.04] border-brand-500/20 hover:border-brand-500/35"
                : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
            }`}>
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                <div className="w-full h-full rounded-full bg-white/[0.05] border border-white/[0.12] flex items-center justify-center overflow-hidden">
                  <img 
                    src={profile?.avatar_url && (profile.avatar_url.startsWith("http") || profile.avatar_url.startsWith("data:")) ? profile.avatar_url : "/default_avatar.png"} 
                    alt="Me" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                {mySignal && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-brand-500 rounded-full border border-black flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {mySignal ? (
                  <>
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <span className="font-bold text-ink text-sm">Your vibe</span>
                      {mySignalReach === "all" && (
                        <span className="text-[8px] font-extrabold bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded-full border border-purple-500/20 select-none">ALL CAMPUSES</span>
                      )}
                      {mySignalIntent && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border" style={{ borderColor: `${(INTENTS.find(i => i.id === mySignalIntent))?.color}30`, color: (INTENTS.find(i => i.id === mySignalIntent))?.color, backgroundColor: `${(INTENTS.find(i => i.id === mySignalIntent))?.color}10` }}>
                          {(INTENTS.find(i => i.id === mySignalIntent))?.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink font-semibold truncate">"{mySignal}"</p>
                  </>
                ) : (
                  <>
  <div className="flex items-center">
    <p className="text-sm text-ink-soft font-semibold flex-1">Drop a vibe 🔥</p>
    <PlusIcon className="w-4 h-4 text-brand-500" />
  </div>
  <p className="mt-0.5 text-xs text-ink-mute">Your campus sees this • disappears in 24h</p>
</>
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
              <button key={s} onClick={() => {
                setScope(s);
                setActiveFilter("all");
              }}
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

          {/* Overlap & Cross-Campus banners */}
          {overlapBanner}
          {crossCampusBanner}

          {/* Category Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar select-none">
            {(scope === "campus"
              ? [
                  { id: "all", label: "All" },
                  { id: "free", label: "Free" },
                  { id: "study", label: "Study" },
                  { id: "help", label: "Help" },
                  { id: "looking", label: "Looking" },
                  { id: "event", label: "Event" },
                  { id: "sell", label: "Sell" }
                ]
              : [
                  { id: "all", label: "All" },
                  { id: "help", label: "Help" },
                  { id: "looking", label: "Looking" },
                  { id: "event", label: "Event" },
                  { id: "sell", label: "Sell" }
                ]
            ).map(filter => {
              const active = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                    active
                      ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
                      : "bg-white/[0.04] text-ink-soft hover:bg-white/[0.06] border border-white/[0.05]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Feed */}
          {feedLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-3xl bg-white/[0.03] animate-pulse border border-white/[0.05] flex items-center p-5 gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-white/[0.04] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 bg-white/[0.04] rounded" />
                    <div className="h-4 w-3/4 bg-white/[0.04] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleSignals.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center select-none opacity-60">
              <SignalIcon className="w-12 h-12 text-white/10 mb-4 animate-pulse" />
              <p className="text-sm font-bold text-ink mb-1">No signals yet</p>
              <p className="text-xs text-ink-mute max-w-[200px] mx-auto leading-normal">
                {scope === "campus" 
                  ? "Be the first to broadcast from your campus" 
                  : "No one's sharing a vibe right now"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleSignals.map((sig: any) => {
                const p = sig.profiles ?? sig;
                const isCampus = p.college === profile?.college || (demo && ["IIIT Hyderabad"].includes(p.college));
                const intentInfo = INTENTS.find(i => i.id === sig.intent) || INTENTS[0];
                const CardIcon = intentInfo.icon;
                const responders = sig.signal_raises || [];
                const hasRaised = responders.some((r: any) => r.user_id === (user?.id || "me"));
                const isBookmarked = bookmarkedSignals.has(sig.id);
                const countdown = sig.expires_at ? getCountdown(sig.expires_at) : null;

                return (
                  <div key={sig.id} onClick={() => openViewProfile({ ...sig.profiles, id: sig.user_id, content: sig.content, created_at: sig.created_at })}
                    className={`rounded-3xl border p-5 cursor-pointer transition-all active:scale-[0.98] ${
                      isCampus
                        ? "bg-brand-500/[0.04] border-brand-500/15 hover:border-brand-500/25"
                        : "bg-[#0c0c0e]/90 border-white/[0.07] hover:border-white/12 animate-fade-in"
                    }`}>
                    
                    {/* Top Metadata & Countdown */}
                    <div className="flex items-start justify-between mb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <Avatar person={p} size={10} />
                          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: intentInfo.color }} />
                          {isCampus && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-brand-500 rounded-full border border-black flex items-center justify-center">
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            </span>
                          )}
                        </div>
                        
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-ink text-sm truncate">{p.name}</span>
                            {p.verified && (
                              <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px]">
                                <CheckIcon className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-ink-mute mt-0.5 truncate">
                            {p.course} · Y{p.year} {scope === "campus" ? "" : `· ${p.college}`}
                          </p>
                        </div>
                      </div>

                      {countdown && (
                        <div className="flex items-center gap-1 text-ink-mute text-[10px] font-medium select-none bg-white/[0.04] px-2 py-0.5 rounded-lg border border-white/[0.05]">
                          <ClockIcon className="w-3.5 h-3.5 opacity-60" />
                          <span>{countdown}</span>
                        </div>
                      )}
                    </div>

                    {/* Intent chip & Signal Note */}
                    <div className="mb-4">
                      <div className="mb-2 select-none flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border" style={{ borderColor: `${intentInfo.color}30`, color: intentInfo.color, backgroundColor: `${intentInfo.color}10` }}>
                          <CardIcon className="w-3 h-3" />
                          <span>{intentInfo.label}</span>
                        </span>
                        {scope === "all" && p.college && (
                          <span className="text-[9px] font-bold bg-white/[0.06] text-ink-soft px-2 py-0.5 rounded-full border border-white/[0.05] inline-flex items-center gap-1 truncate max-w-[150px]">
                            <BuildingIcon className="w-2.5 h-2.5 opacity-60" />
                            <span>{p.college}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-ink leading-relaxed break-words">
                        "{sig.content}"
                      </p>
                    </div>

                    {/* Social Proof Responders */}
                    {responders.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 select-none bg-white/[0.02] border border-white/[0.05] p-2 rounded-2xl">
                        <div className="flex -space-x-1.5">
                          {responders.slice(0, 3).map((r: any, idx: number) => {
                            const initials = (r.profiles?.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                            return (
                              <div key={idx} className="w-5 h-5 rounded-full border border-[#141416] overflow-hidden bg-brand-500/20 flex items-center justify-center text-[7px] font-bold text-white shrink-0">
                                <img 
                                  src={r.profiles?.avatar_url && (r.profiles.avatar_url.startsWith("http") || r.profiles.avatar_url.startsWith("data:")) ? r.profiles.avatar_url : "/default_avatar.png"} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-brand-300 font-medium">
                          {responders.length === 1 ? `${responders[0].profiles?.name || "Someone"} is in` :
                           `${responders[0].profiles?.name || "Someone"} +${responders.length - 1} are in`}
                        </p>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div onClick={e => e.stopPropagation()} className="flex items-center gap-2.5 mt-1 select-none">
                      <button
                        onClick={async () => {
                          if (!hasRaised) {
                            const myRaise = {
                              user_id: user?.id || "me",
                              profiles: {
                                name: profile?.name || "Me",
                                avatar_url: profile?.avatar_url || null
                              }
                            };
                            setSignals(prev => prev.map(s => {
                              if (s.id === sig.id) {
                                return { ...s, signal_raises: [...(s.signal_raises || []), myRaise] };
                              }
                              return s;
                            }));

                            if (!demo && user) {
                              await supabase.from("signal_raises").insert({ signal_id: sig.id, user_id: user.id });
                            }
                          }
                          // Open an Instagram-story-style quick reply (stay on the
                          // feed) instead of jumping into a full chat thread.
                          setReplyText("");
                          onReplySheetOpen?.(true);
                          setReplyVibe({ sig, peer: { ...p, id: p.id ?? sig.user_id } });
                        }}
                        className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 ${
                          hasRaised
                            ? "bg-white/[0.08] text-brand-300 border border-brand-500/30"
                            : "bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/10"
                        }`}
                      >
                        <HandRaiseIcon className="w-4 h-4" />
                        <span>{getPrimaryLabel(sig.intent, hasRaised)}</span>
                      </button>

                      <button
                        onClick={() => handleShare(sig)}
                        className="h-10 px-3.5 rounded-xl bg-white/[0.04] text-ink-soft hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center border border-white/[0.06]"
                        title="Share"
                      >
                        <ShareIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleBookmark(sig.id)}
                        className={`h-10 px-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center border ${
                          isBookmarked
                            ? "bg-brand-500/10 text-brand-400 border-brand-500/30"
                            : "bg-white/[0.04] text-ink-soft hover:text-white hover:bg-white/10 border-white/[0.06]"
                        }`}
                        title="Save"
                      >
                        <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? "fill-brand-400" : ""}`} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Share bottom sheet ── */}
      {shareSignal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-fade-in flex items-end">
          <div className="absolute inset-0" onClick={() => setShareSignal(null)} />
          <div className="relative w-full bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 pb-8 max-h-[80vh] overflow-y-auto z-10 animate-slide-up flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.05] pb-3 select-none">
              <h2 className="font-bold text-base text-ink flex items-center gap-2">
                <ShareIcon className="w-5 h-5 text-brand-400" />
                <span>Share vibe</span>
              </h2>
              <button
                onClick={() => setShareSignal(null)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-ink-soft hover:text-white"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
                <SearchIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search friends..."
                value={shareSearch}
                onChange={e => setShareSearch(e.target.value)}
                className="input w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#161618] border border-white/[0.08] text-white focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>

            {/* Friends list */}
            <div className="flex-1 overflow-y-auto max-h-[40vh] space-y-2 mb-4 pr-1 no-scrollbar">
              {shareFriendsLoading ? (
                <div className="text-center py-6 text-xs text-ink-mute">Loading friends...</div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-6 text-xs text-ink-mute">No friends found</div>
              ) : (
                filteredFriends.map((friend: any) => {
                  const initials = (friend.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div
                      key={friend.id}
                      onClick={() => handleSelectFriend(friend)}
                      className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/10 rounded-2xl flex items-center justify-between gap-3 cursor-pointer active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-white/[0.08]">
                          <img 
                            src={friend.avatar_url && (friend.avatar_url.startsWith("http") || friend.avatar_url.startsWith("data:")) ? friend.avatar_url : "/default_avatar.png"} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink truncate">{friend.name}</p>
                          <p className="text-[10px] text-ink-soft truncate font-semibold">@{friend.username || "student"}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-brand-400 font-bold bg-brand-500/[0.08] px-2 py-0.5 rounded border border-brand-500/10 shrink-0">Send</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Fallback Native / Clipboard Share */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Cmpus vibe from ${shareSignal.profiles?.name || "Student"}`,
                    text: `Check out this vibe on Cmpus: "${shareSignal.content}"`,
                    url: window.location.href
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(`Check out this vibe on Cmpus: "${shareSignal.content}"`);
                  setShareSignal(null);
                  showToast("Link copied");
                }
              }}
              className="w-full h-11 rounded-2xl bg-white/[0.04] hover:bg-white/10 active:scale-95 transition-all text-xs font-bold border border-white/[0.06] flex items-center justify-center gap-2"
            >
              <span>More Options / Copy Link</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {/* ── Story-style quick reply to a vibe ── */}
      {replyVibe && (() => {
        const intent = INTENTS.find(i => i.id === replyVibe.sig.intent) || INTENTS[0];
        const firstName = (replyVibe.peer.name || "them").split(" ")[0];
        return (
          <div className="fixed inset-0 z-[70] flex items-end" onClick={() => { if (!replySending) { setReplyVibe(null); onReplySheetOpen?.(false); setReplyText(""); } }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
            <div className="relative w-full bg-[#0c0c0e] rounded-t-[28px] border-t border-white/[0.08] p-5 pb-[max(6rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-10 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-4" />

              {/* The vibe you're replying to */}
              <div className="rounded-2xl border p-3.5 mb-4 flex items-start gap-3" style={{ borderColor: intent.color + "40", backgroundColor: intent.color + "0f" }}>
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: intent.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: intent.color }}>
                    Replying to {firstName}&apos;s vibe
                  </p>
                  <p className="text-sm text-ink font-semibold leading-snug">&ldquo;{replyVibe.sig.content}&rdquo;</p>
                </div>
              </div>

              {/* Quick reactions */}
              <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
                {["I'm in! 🙌", "Where?", "On my way", "Count me in", "What time?"].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setReplyText(q)}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-ink-soft hover:bg-white/10 active:scale-95 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input row */}
              <form onSubmit={e => { e.preventDefault(); sendQuickReply(); }} className="flex items-center gap-2.5">
                <input
                  autoFocus
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Reply to ${firstName}…`}
                  className="flex-1 h-12 rounded-full bg-[#1a1a1a] border border-white/[0.08] px-4 text-sm text-white placeholder-white/35 focus:outline-none focus:border-brand-500/50 transition"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || replySending}
                  className="w-12 h-12 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 active:scale-95 transition flex items-center justify-center text-white shrink-0"
                >
                  <SendIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        );
      })()}

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-[80] flex justify-center px-4 pointer-events-none animate-fade-up">
          <div className="bg-[#1e1e1e] border border-white/10 text-ink text-xs font-semibold rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-brand-400" />
            {toast}
          </div>
        </div>
      )}

      {/* ── Story Viewer Overlay ── */}
      {storyViewerOpen && storyUsers.length > 0 && (
        <StoryViewer
          storyUsers={storyUsers}
          startIndex={storyViewerStartIdx}
          onClose={() => setStoryViewerOpen(false)}
          onNavigateToProfile={(username) => {
            const person = storyUsers.find(su => su.profile.username === username)?.profile;
            if (person) openViewProfile(person);
          }}
        />
      )}

      {/* ── Add Story Bottom Sheet ── */}
      {addStoryOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 shrink-0">
            <button
              type="button"
              onClick={resetStoryComposer}
              className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center active:scale-95 transition"
            >
              <XIcon className="w-5 h-5 text-white" />
            </button>
            <span className="text-sm font-bold text-white">New Story</span>
            {storyPreviewUrl ? (
              <button
                type="button"
                onClick={handlePendingStoryUpload}
                disabled={storyUploading}
                className="h-9 px-4 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 active:scale-95 transition text-white text-sm font-bold"
              >
                {storyUploading ? "Sharing..." : "Share"}
              </button>
            ) : (
              <div className="w-10" />
            )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
            {storyPreviewUrl ? (
              <div className="relative w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden bg-[#111]">
                <img
                  src={storyPreviewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 inset-x-4">
                  <input
                    type="text"
                    placeholder="Add a caption..."
                    value={storyCaption}
                    onChange={e => setStoryCaption(e.target.value)}
                    maxLength={120}
                    className="w-full bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/50 focus:outline-none border border-white/20 focus:border-white/40 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (storyPreviewUrl) URL.revokeObjectURL(storyPreviewUrl);
                    setStoryPreviewUrl(null);
                    setStoryCaption("");
                    pendingStoryFileRef.current = null;
                    if (cameraInputRef.current) cameraInputRef.current.value = "";
                    if (galleryInputRef.current) galleryInputRef.current.value = "";
                    if (storyFileRef.current) storyFileRef.current.value = "";
                  }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center active:scale-95 transition"
                >
                  <XIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-full max-w-sm aspect-[9/16] rounded-2xl border-2 border-dashed border-white/[0.12] flex flex-col items-center justify-center gap-5 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-20 h-20 rounded-3xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center active:scale-95 transition-all hover:bg-brand-500/25"
                >
                  <CameraIcon className="w-8 h-8 text-brand-400" />
                </button>
                <p className="text-sm font-bold text-white">Take a photo</p>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="text-xs text-ink-mute hover:text-ink-soft transition underline underline-offset-2 decoration-white/20"
                >
                  or choose from gallery
                </button>
              </div>
            )}
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleStoryFileSelected}
          />
          <input
            ref={(node) => {
              galleryInputRef.current = node;
              storyFileRef.current = node;
            }}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleStoryFileSelected}
          />

          {storyPreviewUrl && (
            <div className="shrink-0 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 border-t border-white/[0.07]">
              <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider mb-3">Who can see this?</p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setPendingVisibility("public")}
                  className={`flex-1 h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition active:scale-[0.97] border ${
                    pendingVisibility === "public"
                      ? "bg-brand-500 border-brand-500 text-white"
                      : "bg-white/[0.04] border-white/[0.08] text-ink-soft"
                  }`}
                >
                  <CampusIcon className="w-4 h-4" />
                  My University
                </button>
                <button
                  type="button"
                  onClick={() => setPendingVisibility("followers")}
                  className={`flex-1 h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition active:scale-[0.97] border ${
                    pendingVisibility === "followers"
                      ? "bg-white/[0.12] border-white/[0.2] text-white"
                      : "bg-white/[0.04] border-white/[0.08] text-ink-soft"
                  }`}
                >
                  <LockIcon className="w-4 h-4" />
                  My Friends
                </button>
              </div>
          </div>
          )}
        </div>
      )}

      {/* ── Follow Requests Sheet ── */}
      {requestsSheetOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-fade-in flex items-end">
          <div className="absolute inset-0" onClick={() => setRequestsSheetOpen(false)} />
          <div className="relative w-full bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 pb-8 max-h-[80vh] overflow-y-auto z-10 animate-slide-up">
            <div className="flex items-center justify-between mb-5 border-b border-white/[0.05] pb-3 select-none">
              <h2 className="font-bold text-base text-ink flex items-center gap-2">
                <BellIcon className="w-5 h-5 text-brand-400" />
                <span>Follow Requests</span>
              </h2>
              <button onClick={() => setRequestsSheetOpen(false)} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-ink-soft hover:text-white">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            {followRequests.length === 0 ? (
              <div className="text-center py-12 opacity-60">
                <CheckIcon className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-sm font-bold text-ink">All caught up</p>
                <p className="text-xs text-ink-mute">No pending follow requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {followRequests.map((req: any) => {
                  const p = req.profiles;
                  if (!p) return null;
                  const initials = (p.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={req.follower_id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                      <button
                        onClick={() => { setRequestsSheetOpen(false); openViewProfile({ ...p, id: p.id }); }}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <img 
                          src={p.avatar_url && (p.avatar_url.startsWith("http") || p.avatar_url.startsWith("data:")) ? p.avatar_url : "/default_avatar.png"} 
                          alt={p.name} 
                          className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" 
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-bold text-ink truncate">{p.name}</p>
                            {p.verified && <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px]"><CheckIcon className="w-2.5 h-2.5" /></span>}
                          </div>
                          {p.username && <p className="text-[11px] text-brand-300 truncate">@{p.username}</p>}
                          {p.college && <p className="text-[11px] text-ink-mute truncate">{p.college}</p>}
                        </div>
                      </button>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => acceptRequest(req.follower_id)} className="px-3 py-1.5 rounded-xl bg-brand-500 text-white text-[11px] font-bold active:scale-95 transition">
                          Accept
                        </button>
                        <button onClick={() => declineRequest(req.follower_id)} className="px-3 py-1.5 rounded-xl bg-white/[0.06] text-ink-soft border border-white/[0.08] text-[11px] font-bold active:scale-95 transition">
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DM Inbox Overlay ── */}
      {dmInboxOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-fade-in flex items-end">
          <div className="absolute inset-0" onClick={() => setDmInboxOpen(false)} />
          <div className="relative w-full bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 pb-8 max-h-[80vh] overflow-y-auto z-10 animate-slide-up">
            <div className="flex items-center justify-between mb-5 border-b border-white/[0.05] pb-3 select-none">
              <h2 className="font-bold text-base text-ink flex items-center gap-2">
                <ChatIcon className="w-5 h-5 text-brand-400" />
                <span>Messages</span>
              </h2>
              <button
                onClick={() => setDmInboxOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-ink-soft hover:text-white"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            {dmInboxLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : dmInboxConvos.length === 0 ? (
              <div className="text-center py-12 opacity-60">
                <ChatIcon className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-sm font-bold text-ink mb-1">No messages yet</p>
                <p className="text-xs text-ink-mute">Start a conversation from someone&apos;s profile</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dmInboxConvos.map((convo: any) => {
                  const peer = convo.peer;
                  if (!peer) return null;
                  const peerInitials = (peer.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={convo.group_id}
                      onClick={() => {
                        setDmInboxOpen(false);
                        openDm(peer);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] active:scale-[0.98] transition-all text-left"
                    >
                      <img 
                        src={peer.avatar_url && (peer.avatar_url.startsWith("http") || peer.avatar_url.startsWith("data:")) ? peer.avatar_url : "/default_avatar.png"} 
                        alt={peer.name} 
                        className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-ink truncate">{peer.name}</p>
                        <p className="text-[11px] text-ink-mute truncate mt-0.5">{convo.last_message || "Start chatting…"}</p>
                      </div>
                      {convo.last_at && (
                        <span className="text-[10px] text-ink-mute shrink-0">
                          {new Date(convo.last_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Broadcast Composer Sheet (Bottom Sheet) ── */}
      {broadcasting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-fade-in flex items-end">
          <div className="absolute inset-0" onClick={() => setBroadcasting(false)} />
          <div className="relative w-full bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 pb-8 max-h-[90vh] overflow-y-auto z-10 animate-slide-up">
            <div className="flex items-center justify-between mb-5 border-b border-white/[0.05] pb-3 select-none">
              <h2 className="font-bold text-base text-ink flex items-center gap-2">
                <SignalIcon className="w-5 h-5 text-brand-400 animate-pulse" />
                <span>What's your vibe?</span>
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
                        <img 
                          src={profile?.avatar_url && (profile.avatar_url.startsWith("http") || profile.avatar_url.startsWith("data:")) ? profile.avatar_url : "/default_avatar.png"} 
                          alt={profile?.name || ""} 
                          className="w-10 h-10 rounded-full object-cover border border-white/10" 
                          style={{ borderColor: intentInfo.color }} 
                        />
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
                    <span>Broadcast vibe</span>
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
