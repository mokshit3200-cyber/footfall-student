# Antigravity Task — Stories + DM Inbox + Profile Cleanup

**Project:** `C:\Dev\Software Services\footfall-student`
**Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase
**Dev server:** `npm run dev` → http://localhost:3200
**App name:** Cmpus. Dark monochrome theme. Brand emerald: `#0F8F6F`.

---

## STEP 0 — Run this SQL in Supabase SQL Editor FIRST

```sql
-- Add visibility column to stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS visibility text
  CHECK (visibility IN ('public', 'followers')) DEFAULT 'public';

-- Create stories storage bucket
INSERT INTO storage.buckets (id, name, public)
  VALUES ('stories', 'stories', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Stories public read' AND tablename = 'objects') THEN
    CREATE POLICY "Stories public read" ON storage.objects FOR SELECT USING (bucket_id = 'stories');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Stories auth upload' AND tablename = 'objects') THEN
    CREATE POLICY "Stories auth upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Stories own delete' AND tablename = 'objects') THEN
    CREATE POLICY "Stories own delete" ON storage.objects FOR DELETE USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
```

---

## Overview of all 3 tasks

1. **Stories system** — Instagram-style photo stories. Bar at top of Connect tab. Fullscreen viewer. Story ring on avatars everywhere. Photos only, no video, no highlights.
2. **DM Inbox** — Conversation list so users can return to past chats.
3. **Profile cleanup** — Remove Posts/Media/Links tabs. Show Skills + Links properly. Add username to Edit Profile form.

---

## TASK 1 — Stories System

### 1a. Add to `lib/dbActions.ts`

Add these functions at the bottom:

```typescript
// Post a story photo
export async function dbPostStory(
  userId: string,
  file: File,
  visibility: "public" | "followers"
): Promise<boolean> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("stories")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (upErr) { console.error("Story upload error:", upErr.message); return false; }
  const { data: urlData } = supabase.storage.from("stories").getPublicUrl(path);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("stories").insert({
    user_id: userId,
    media_url: urlData.publicUrl,
    expires_at: expiresAt,
    visibility,
  });
  if (error) { console.error("Story insert error:", error.message); return false; }
  return true;
}

// Fetch stories bar entries (grouped by user, ranked)
export async function dbFetchStoriesBar(userId: string, college: string) {
  const now = new Date().toISOString();

  const [{ data: following }, { data: followers }, { data: stories }] = await Promise.all([
    supabase.from("follows").select("following_id").eq("follower_id", userId).eq("status", "accepted"),
    supabase.from("follows").select("follower_id").eq("following_id", userId).eq("status", "accepted"),
    supabase
      .from("stories")
      .select("id, user_id, media_url, visibility, created_at, expires_at, profiles!stories_user_id_fkey(id, name, username, avatar_url, college, verified)")
      .gt("expires_at", now)
      .neq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const followingIds = new Set((following ?? []).map((f: any) => f.following_id));
  const followerIds = new Set((followers ?? []).map((f: any) => f.follower_id));

  const visible = (stories ?? []).filter((s: any) => {
    if (s.visibility === "public" && s.profiles?.college === college) return true;
    if (s.visibility === "followers" && followingIds.has(s.user_id)) return true;
    return false;
  });

  // Group by user, collect all their stories
  const byUser = new Map<string, any>();
  for (const s of visible) {
    if (!byUser.has(s.user_id)) {
      const isMutual = followingIds.has(s.user_id) && followerIds.has(s.user_id);
      const isFollowing = followingIds.has(s.user_id);
      byUser.set(s.user_id, {
        userId: s.user_id,
        profile: s.profiles,
        stories: [s],
        isMutual,
        isFollowing,
        sameCampus: s.profiles?.college === college,
      });
    } else {
      byUser.get(s.user_id).stories.push(s);
    }
  }

  // Rank: mutuals first, then following, then same campus, then cross-campus
  const entries = Array.from(byUser.values());
  entries.sort((a, b) => {
    const rank = (e: any) => e.isMutual ? 0 : e.isFollowing ? 1 : e.sameCampus ? 2 : 3;
    return rank(a) - rank(b);
  });

  return entries;
}

// Fetch own active stories
export async function dbFetchMyStories(userId: string) {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("stories")
    .select("id, media_url, visibility, created_at, expires_at")
    .eq("user_id", userId)
    .gt("expires_at", now)
    .order("created_at", { ascending: false });
  return data ?? [];
}
```

---

### 1b. New file: `components/StoryViewer.tsx`

Create this new file from scratch:

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { XIcon, ArrowLeftIcon, CheckIcon } from "./icons";

interface Story {
  id: string;
  media_url: string;
  visibility: "public" | "followers";
  created_at: string;
}

interface StoryEntry {
  userId: string;
  profile: { id: string; name: string; username?: string; avatar_url?: string; verified?: boolean };
  stories: Story[];
}

interface StoryViewerProps {
  entries: StoryEntry[];       // all users' story groups to show
  initialEntryIndex: number;   // which user to start on
  onClose: () => void;         // called when done or X pressed → returns to origin
  onViewProfile: (userId: string) => void; // tap name → go to profile
}

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewer({ entries, initialEntryIndex, onClose, onViewProfile }: StoryViewerProps) {
  const [entryIdx, setEntryIdx] = useState(initialEntryIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedRef = useRef<number>(0);

  const entry = entries[entryIdx];
  const story = entry?.stories[storyIdx];

  // Mark story as viewed in localStorage
  useEffect(() => {
    if (!story) return;
    try {
      const viewed = new Set<string>(JSON.parse(localStorage.getItem("cmpus-viewed-stories") || "[]"));
      viewed.add(story.id);
      localStorage.setItem("cmpus-viewed-stories", JSON.stringify(Array.from(viewed)));
    } catch {}
  }, [story?.id]);

  // Progress timer
  useEffect(() => {
    if (paused || !story) return;
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();
    setProgress(0);

    timerRef.current = setInterval(() => {
      const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current);
      const pct = Math.min(100, (elapsed / STORY_DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) goNext();
    }, 50);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [entryIdx, storyIdx, paused]);

  function goNext() {
    if (timerRef.current) clearInterval(timerRef.current);
    const entry = entries[entryIdx];
    if (storyIdx < entry.stories.length - 1) {
      setStoryIdx(s => s + 1);
      setProgress(0);
    } else if (entryIdx < entries.length - 1) {
      setEntryIdx(e => e + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose(); // last story of last user → back to origin
    }
  }

  function goPrev() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (storyIdx > 0) {
      setStoryIdx(s => s - 1);
      setProgress(0);
    } else if (entryIdx > 0) {
      setEntryIdx(e => e - 1);
      setStoryIdx(0);
      setProgress(0);
    }
  }

  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    const x = e.clientX;
    const w = window.innerWidth;
    if (x < w * 0.3) goPrev();
    else goNext();
  }

  function timeAgo(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h`;
  }

  if (!entry || !story) return null;

  const initials = (entry.profile.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col select-none">
      {/* Progress bars */}
      <div className="absolute top-0 inset-x-0 z-10 flex gap-1 px-2 pt-2">
        {entry.stories.map((s, i) => (
          <div key={s.id} className="flex-1 h-[2px] bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{ width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-5 inset-x-0 z-10 flex items-center justify-between px-4 pt-2">
        <button
          onClick={() => { onViewProfile(entry.userId); onClose(); }}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/40 flex items-center justify-center bg-brand-500/20 shrink-0">
            {entry.profile.avatar_url
              ? <img src={entry.profile.avatar_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-white text-xs font-bold">{initials}</span>}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-white text-sm font-bold leading-none">{entry.profile.name}</span>
              {entry.profile.verified && (
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full">
                  <CheckIcon className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
            <span className="text-white/60 text-[10px]">{timeAgo(story.created_at)}</span>
          </div>
        </button>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/30 flex items-center justify-center text-white">
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Story image */}
      <div className="flex-1 relative overflow-hidden" onClick={handleTap}>
        <img
          src={story.media_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        {/* Tap zones (invisible) */}
        <div className="absolute inset-y-0 left-0 w-[30%]" />
        <div className="absolute inset-y-0 right-0 w-[70%]" />
      </div>

      {/* Visibility pill */}
      <div className="absolute bottom-8 inset-x-0 flex justify-center pointer-events-none">
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
          story.visibility === "public"
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-brand-500/10 border-brand-500/30 text-brand-300"
        }`}>
          {story.visibility === "public" ? "🌍 Campus" : "🔒 Followers only"}
        </span>
      </div>
    </div>
  );
}
```

---

### 1c. Update `components/Connect.tsx`

**Imports to add at top:**
```typescript
import { dbFetchStoriesBar, dbFetchMyStories, dbPostStory } from "@/lib/dbActions";
import StoryViewer from "./StoryViewer";
import { CameraIcon } from "./icons"; // add CameraIcon to icons if missing, use a simple camera SVG
```

**State to add inside the Connect component:**
```typescript
// Stories
const [storiesBar, setStoriesBar] = useState<any[]>([]);
const [myStories, setMyStories] = useState<any[]>([]);
const [storiesLoading, setStoriesLoading] = useState(true);
const [viewingStories, setViewingStories] = useState<{ entries: any[]; entryIndex: number } | null>(null);
const [addingStory, setAddingStory] = useState(false);
const [storyVisibility, setStoryVisibility] = useState<"public" | "followers">("public");
const [storyUploading, setStoryUploading] = useState(false);
const storyFileRef = useRef<HTMLInputElement>(null);

// DM Inbox
const [showInbox, setShowInbox] = useState(false);
const [conversations, setConversations] = useState<any[]>([]);
const [inboxLoading, setInboxLoading] = useState(false);
```

**Load stories on mount (add to existing useEffect or new one):**
```typescript
useEffect(() => {
  if (demo || !user || !profile?.college) {
    // Demo: fake stories bar entries
    if (demo) {
      setStoriesBar([
        {
          userId: "dp1",
          profile: { id: "dp1", name: "Arjun Sharma", username: "arjun_s", avatar_url: null, verified: true },
          stories: [{ id: "ds1", media_url: "https://picsum.photos/seed/story1/400/700", visibility: "public", created_at: new Date(Date.now() - 3600000).toISOString() }],
          isMutual: true, isFollowing: true, sameCampus: true,
        },
        {
          userId: "dp2",
          profile: { id: "dp2", name: "Priya Nair", username: "priya.n", avatar_url: null, verified: false },
          stories: [{ id: "ds2", media_url: "https://picsum.photos/seed/story2/400/700", visibility: "followers", created_at: new Date(Date.now() - 7200000).toISOString() }],
          isMutual: false, isFollowing: true, sameCampus: true,
        },
      ]);
    }
    setStoriesLoading(false);
    return;
  }
  async function loadStories() {
    setStoriesLoading(true);
    const [bar, mine] = await Promise.all([
      dbFetchStoriesBar(user!.id, profile!.college),
      dbFetchMyStories(user!.id),
    ]);
    setStoriesBar(bar);
    setMyStories(mine);
    setStoriesLoading(false);
  }
  loadStories();
}, [user, profile?.college, demo]);
```

**Story upload handler:**
```typescript
async function handleStoryFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file || !user) return;
  setStoryUploading(true);
  const ok = await dbPostStory(user.id, file, storyVisibility);
  if (ok) {
    setAddingStory(false);
    // Reload stories
    const [bar, mine] = await Promise.all([
      dbFetchStoriesBar(user.id, profile!.college),
      dbFetchMyStories(user.id),
    ]);
    setStoriesBar(bar);
    setMyStories(mine);
  } else {
    showToast("Upload failed — try again");
  }
  setStoryUploading(false);
  if (storyFileRef.current) storyFileRef.current.value = "";
}
```

**Load DM inbox:**
```typescript
async function loadInbox() {
  if (!user || demo) {
    // Demo conversations from localStorage
    const localGroups = JSON.parse(localStorage.getItem("demo_groups") || "[]");
    setConversations(localGroups);
    return;
  }
  setInboxLoading(true);
  // Get my group IDs
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);
  const groupIds = (myMemberships ?? []).map((m: any) => m.group_id);
  if (groupIds.length === 0) { setConversations([]); setInboxLoading(false); return; }

  // Get peer info + group info for each DM
  const { data: peers } = await supabase
    .from("group_members")
    .select("group_id, user_id, profiles!group_members_user_id_fkey(id, name, username, avatar_url, college, verified)")
    .in("group_id", groupIds)
    .neq("user_id", user.id);

  const { data: groups } = await supabase
    .from("groups")
    .select("id, last_message, last_at, type, request_status")
    .in("id", groupIds)
    .eq("type", "dm")
    .order("last_at", { ascending: false, nullsFirst: false });

  const groupMap = Object.fromEntries((groups ?? []).map((g: any) => [g.id, g]));
  const convos = (peers ?? [])
    .filter((p: any) => groupMap[p.group_id])
    .map((p: any) => ({
      group_id: p.group_id,
      peer: p.profiles,
      last_message: groupMap[p.group_id]?.last_message,
      last_at: groupMap[p.group_id]?.last_at,
      request_status: groupMap[p.group_id]?.request_status,
    }))
    .sort((a: any, b: any) => {
      if (!a.last_at) return 1;
      if (!b.last_at) return -1;
      return new Date(b.last_at).getTime() - new Date(a.last_at).getTime();
    });

  setConversations(convos);
  setInboxLoading(false);
}
```

**In the JSX, add the StoryViewer overlay (before the return's main div):**

```tsx
{/* Story Viewer */}
{viewingStories && (
  <StoryViewer
    entries={viewingStories.entries}
    initialEntryIndex={viewingStories.entryIndex}
    onClose={() => setViewingStories(null)}
    onViewProfile={(userId) => {
      setViewingStories(null);
      const sig = signals.find(s => s.user_id === userId);
      if (sig) setViewProfile(sig);
    }}
  />
)}
```

**Add story file input (hidden, inside the main return div):**
```tsx
<input
  ref={storyFileRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handleStoryFileChange}
/>
```

**In the header area of Connect (after the search bar, BEFORE the scope toggle), add the Stories Bar:**

```tsx
{/* ── Stories Bar ── */}
<div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 pt-1 px-5">
  {/* Own story circle */}
  <button
    onClick={() => setAddingStory(true)}
    className="flex flex-col items-center gap-1.5 shrink-0"
  >
    <div className="relative w-14 h-14">
      <div className={`w-full h-full rounded-full overflow-hidden border-2 flex items-center justify-center bg-white/[0.05] ${myStories.length > 0 ? "border-brand-500" : "border-white/20"}`}>
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="You" className="w-full h-full object-cover" />
          : <span className="text-white font-bold text-base">{(profile?.name || "?")[0].toUpperCase()}</span>}
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand-500 border-2 border-black flex items-center justify-center">
        <span className="text-white text-[11px] font-bold leading-none">+</span>
      </div>
    </div>
    <span className="text-[10px] text-ink-mute font-medium">Your story</span>
  </button>

  {/* Others' story circles */}
  {storiesLoading
    ? Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="w-14 h-14 rounded-full bg-white/[0.05] animate-pulse border-2 border-white/10" />
          <div className="w-10 h-2 bg-white/[0.05] rounded animate-pulse" />
        </div>
      ))
    : storiesBar.map((entry, i) => {
        const viewed = (() => {
          try {
            const set = new Set(JSON.parse(localStorage.getItem("cmpus-viewed-stories") || "[]"));
            return entry.stories.every((s: any) => set.has(s.id));
          } catch { return false; }
        })();
        const ringColor = viewed
          ? "border-white/20"
          : entry.stories.some((s: any) => s.visibility === "public")
          ? "border-green-400"
          : "border-brand-500";
        const initials = (entry.profile.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
        return (
          <button
            key={entry.userId}
            onClick={() => setViewingStories({ entries: storiesBar, entryIndex: i })}
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${ringColor} flex items-center justify-center bg-brand-500/20`}>
              {entry.profile.avatar_url
                ? <img src={entry.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-sm">{initials}</span>}
            </div>
            <span className="text-[10px] text-ink-mute font-medium truncate max-w-[56px]">
              {entry.profile.name?.split(" ")[0] || "Student"}
            </span>
          </button>
        );
      })}
</div>
```

**In the Connect header (top right, next to title), add DM inbox icon:**
```tsx
<button
  onClick={() => { setShowInbox(true); loadInbox(); }}
  className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-ink-soft active:scale-95 transition"
>
  <ChatIcon className="w-4.5 h-4.5" />
</button>
```

**DM Inbox overlay (render before closing div of main return):**

```tsx
{/* DM Inbox */}
{showInbox && (
  <div className="fixed inset-0 z-50 flex flex-col bg-black animate-fade-in">
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] bg-[#0c0c0e]/95 backdrop-blur-md">
      <button
        onClick={() => setShowInbox(false)}
        className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-white active:scale-95 transition"
      >
        <ArrowLeftIcon className="w-5 h-5" />
      </button>
      <span className="font-bold text-ink text-base">Messages</span>
    </div>

    <div className="flex-1 overflow-y-auto no-scrollbar">
      {inboxLoading ? (
        <div className="space-y-0 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-12 h-12 rounded-full bg-white/[0.05] animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-2.5 w-2/3 bg-white/[0.04] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 opacity-60">
          <ChatIcon className="w-12 h-12 text-white/10 mb-3" />
          <p className="text-sm font-bold text-ink">No messages yet</p>
          <p className="text-xs text-ink-mute mt-1">Raise a hand on someone's vibe to start a conversation</p>
        </div>
      ) : (
        <div>
          {conversations.map((convo: any) => {
            const peer = convo.peer || {};
            const initials = (peer.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
            const timeAgoStr = convo.last_at ? (() => {
              const m = Math.floor((Date.now() - new Date(convo.last_at).getTime()) / 60000);
              if (m < 1) return "now";
              if (m < 60) return `${m}m`;
              if (m < 1440) return `${Math.floor(m / 60)}h`;
              return `${Math.floor(m / 1440)}d`;
            })() : "";
            return (
              <button
                key={convo.group_id}
                onClick={() => {
                  setShowInbox(false);
                  setActiveDmId(convo.group_id);
                  setActivePeer(peer);
                  onChatOpen?.(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] active:bg-white/[0.05] transition border-b border-white/[0.04]"
              >
                <div className="w-12 h-12 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center overflow-hidden shrink-0">
                  {peer.avatar_url
                    ? <img src={peer.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-brand-300 font-bold text-sm">{initials}</span>}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-ink text-sm truncate">{peer.name}</span>
                    {timeAgoStr && <span className="text-[10px] text-ink-mute shrink-0">{timeAgoStr}</span>}
                  </div>
                  <p className="text-[12px] text-ink-mute truncate mt-0.5">
                    {convo.last_message || "Start a conversation"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  </div>
)}
```

**Add Story sheet (render before closing div):**
```tsx
{/* Add Story sheet */}
{addingStory && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end animate-fade-in">
    <div className="absolute inset-0" onClick={() => !storyUploading && setAddingStory(false)} />
    <div className="relative w-full bg-[#0c0c0e] rounded-t-[32px] border-t border-white/[0.08] p-5 pb-10 z-10 animate-slide-up">
      <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
      <h2 className="text-base font-bold text-ink mb-1">Add to your story</h2>
      <p className="text-xs text-ink-mute mb-5">Photo only · disappears in 24 hours</p>

      {/* Visibility picker */}
      <div className="flex bg-white/[0.04] border border-white/[0.05] rounded-2xl p-1 mb-5">
        {(["public", "followers"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setStoryVisibility(v)}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${storyVisibility === v ? "bg-brand-500 text-white" : "text-ink-soft"}`}
          >
            {v === "public" ? "🌍 My Campus (Public)" : "🔒 Followers Only"}
          </button>
        ))}
      </div>

      <button
        onClick={() => storyFileRef.current?.click()}
        disabled={storyUploading}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {storyUploading ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Uploading…</span></>
        ) : (
          <span>Choose Photo</span>
        )}
      </button>
    </div>
  </div>
)}
```

---

## TASK 2 — Profile Cleanup + Username Edit (`components/Profile.tsx`)

### 2a. Remove Posts/Media/Links tabs

Find the section that renders the "Posts", "Media", "Links" tab bar and the grid of empty squares below it. Delete it entirely. This includes:
- The tab state variable (something like `activeTab` with values "posts"/"media"/"links")
- The tab bar buttons
- The 3-column image grid of placeholder squares

### 2b. Add Skills + Links display on viewed profile

After the Follow/Message buttons on someone else's profile, add this section. Use the privacy logic: if `profile.is_private` AND you don't follow them (followState === "none" or "pending") → show lock wall instead.

```tsx
{/* Privacy wall for non-followers of private accounts */}
{viewProfile.is_private && followState !== "following" && followState !== "mutual" && !isOwnProfile ? (
  <div className="mt-8 px-5 text-center">
    <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-3">
      <LockIcon className="w-7 h-7 text-ink-mute" />
    </div>
    <p className="text-sm font-bold text-ink">This account is private</p>
    <p className="text-xs text-ink-mute mt-1 leading-relaxed">Follow to see their skills, links, and more</p>
  </div>
) : (
  <div className="mt-5 px-5 space-y-5">
    {/* Skills */}
    {viewProfile.skills?.length > 0 && (
      <div>
        <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wider mb-2.5">Skills</p>
        <div className="flex flex-wrap gap-2">
          {viewProfile.skills.map((skill: string, i: number) => (
            <span key={i} className="px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-ink-soft">
              {skill}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Links */}
    {viewProfile.links && Object.values(viewProfile.links).some(Boolean) && (
      <div>
        <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wider mb-2.5">Links</p>
        <div className="space-y-2">
          {Object.entries(viewProfile.links).map(([label, url]) => url && (
            <a
              key={label}
              href={url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm text-brand-300 font-medium active:opacity-70 transition"
            >
              <span className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-[11px] shrink-0 capitalize">
                {label[0].toUpperCase()}
              </span>
              <span className="truncate">{url as string}</span>
            </a>
          ))}
        </div>
      </div>
    )}
  </div>
)}
```

### 2c. Add username field to Edit Profile sheet

In the Edit Profile bottom sheet, find where name/bio/college/year/course are edited. Add a username field AFTER the name field:

Add state: `const [editUsername, setEditUsername] = useState(profile?.username || "");`
Add state: `const [usernameEditStatus, setUsernameEditStatus] = useState<"idle"|"checking"|"available"|"taken"|"invalid">("idle");`
Add ref: `const usernameEditTimer = useRef<ReturnType<typeof setTimeout> | null>(null);`

Add useEffect for real-time check (same pattern as Onboarding.tsx but exclude user's own current username):
```typescript
useEffect(() => {
  const v = editUsername.trim();
  if (!v || v === profile?.username) { setUsernameEditStatus(v === profile?.username ? "available" : "idle"); return; }
  if (!/^[a-z0-9_]{3,20}$/.test(v)) { setUsernameEditStatus("invalid"); return; }
  setUsernameEditStatus("checking");
  if (usernameEditTimer.current) clearTimeout(usernameEditTimer.current);
  usernameEditTimer.current = setTimeout(async () => {
    const { data } = await supabase.from("profiles").select("id").eq("username", v).neq("id", user?.id ?? "").maybeSingle();
    setUsernameEditStatus(data ? "taken" : "available");
  }, 400);
}, [editUsername, profile?.username, user?.id]);
```

Username input JSX (add after name field in edit sheet):
```tsx
<div>
  <label className="text-xs font-semibold text-ink-soft mb-1.5 block">Username</label>
  <div className="relative">
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute font-bold text-sm">@</span>
    <input
      className="input pl-7 pr-8"
      placeholder="your_handle"
      value={editUsername}
      maxLength={20}
      onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
      autoCapitalize="none"
      autoCorrect="off"
    />
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
      {usernameEditStatus === "checking" && <span className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin inline-block" />}
      {usernameEditStatus === "available" && <span className="text-brand-400">✓</span>}
      {usernameEditStatus === "taken" && <span className="text-red-400">✗</span>}
      {usernameEditStatus === "invalid" && <span className="text-amber-400">!</span>}
    </span>
  </div>
  <p className={`text-[10px] mt-1 font-medium ${usernameEditStatus === "available" ? "text-brand-400" : usernameEditStatus === "taken" ? "text-red-400" : usernameEditStatus === "invalid" ? "text-amber-400" : "text-ink-mute"}`}>
    {usernameEditStatus === "available" && editUsername !== profile?.username && `@${editUsername} is available`}
    {usernameEditStatus === "taken" && "That username is taken"}
    {usernameEditStatus === "invalid" && "3–20 chars, lowercase, numbers, underscores only"}
    {(usernameEditStatus === "idle" || usernameEditStatus === "checking") && "3–20 chars · letters, numbers, underscores"}
  </p>
</div>
```

In the save function of Edit Profile, add username:
```typescript
// alongside existing fields:
username: usernameEditStatus === "available" ? editUsername.trim() || null : undefined,
```
(only save if available — don't overwrite if taken/invalid)

---

## Acceptance Criteria

- `npx tsc --noEmit` → 0 errors
- Stories bar renders at top of Connect tab (above scope toggle) with avatar circles
- Tapping own `+` circle → Add Story sheet → choose visibility → pick photo → uploads → ring appears on own avatar
- Other users with stories show green ring (public) or brand ring (followers-only)
- Viewed stories show faded/white ring
- Tapping a story circle → fullscreen viewer → auto-advances every 5s → tap right = next, tap left = prev → after last story → back to Connect
- Tapping name in story viewer → goes to their profile
- Chat icon in Connect header → DM inbox → shows all past conversations with name + last message + time
- Tapping a conversation → opens that DM chat directly
- Profile page: Posts/Media/Links tabs gone completely
- Profile page: Skills + Links show for public accounts or followers of private accounts
- Profile page: private account shows lock wall to non-followers
- Edit Profile: username field with live availability check → saves to Supabase on save
- Demo mode: fake stories in bar, fake conversations in inbox, no Supabase writes for stories

---

## DO NOT touch
- `components/Home.tsx`
- `components/Money.tsx`
- `components/Marketplace.tsx`
- `components/AuthGate.tsx`
- `components/DesktopSidebar.tsx`
- `lib/types.ts`
- `public/` folder
- Any migration files

## Report back
When done, report:
1. `tsc --noEmit` result
2. Which parts of Connect.tsx you edited (line ranges)
3. Whether the StoryViewer is a separate file or inline
4. Any Supabase queries that returned errors during testing
5. Anything you simplified or skipped and why
