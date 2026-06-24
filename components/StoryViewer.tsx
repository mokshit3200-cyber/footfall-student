"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { XIcon } from "./icons";

// ── Types ────────────────────────────────────────────────────────────────────
interface Story {
  id: string;
  media_url: string;
  visibility: "public" | "followers";
  created_at: string;
  expires_at: string;
}

interface StoryUser {
  userId: string;
  profile: {
    id: string;
    name: string;
    username?: string;
    avatar_url?: string | null;
    college?: string;
    verified?: boolean;
  };
  stories: Story[];
}

interface StoryViewerProps {
  storyUsers: StoryUser[];
  startIndex: number;
  onClose: () => void;
  onNavigateToProfile?: (username: string) => void;
}

// ── localStorage helpers ─────────────────────────────────────────────────────
const VIEWED_KEY = "cmpus-viewed-stories";

function getViewedStories(): Set<string> {
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function markStoryViewed(storyId: string) {
  const viewed = getViewedStories();
  viewed.add(storyId);
  try {
    localStorage.setItem(VIEWED_KEY, JSON.stringify(Array.from(viewed)));
  } catch { /* ignore */ }
}

export function hasViewedAllStories(stories: Story[]): boolean {
  const viewed = getViewedStories();
  return stories.every(s => viewed.has(s.id));
}

// ── Time helper ──────────────────────────────────────────────────────────────
function storyTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Main component ───────────────────────────────────────────────────────────
export default function StoryViewer({ storyUsers, startIndex, onClose, onNavigateToProfile }: StoryViewerProps) {
  const [userIdx, setUserIdx] = useState(startIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const DURATION = 5000; // 5 seconds per story
  const TICK = 50; // update every 50ms

  const currentUser = storyUsers[userIdx];
  const currentStory = currentUser?.stories[storyIdx];

  // Mark story as viewed when it becomes active
  useEffect(() => {
    if (currentStory) {
      markStoryViewed(currentStory.id);
    }
  }, [currentStory]);

  // Reset progress and loaded state when story changes
  useEffect(() => {
    setProgress(0);
    setLoaded(false);
  }, [userIdx, storyIdx]);

  // Progress bar timer
  useEffect(() => {
    if (paused || !loaded) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + (TICK / DURATION) * 100;
        if (next >= 100) {
          goNext();
          return 0;
        }
        return next;
      });
    }, TICK);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, loaded, userIdx, storyIdx]);

  // Navigation
  const goNext = useCallback(() => {
    const user = storyUsers[userIdx];
    if (!user) { onClose(); return; }
    if (storyIdx < user.stories.length - 1) {
      setStoryIdx(storyIdx + 1);
    } else if (userIdx < storyUsers.length - 1) {
      setUserIdx(userIdx + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }, [userIdx, storyIdx, storyUsers, onClose]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx(storyIdx - 1);
    } else if (userIdx > 0) {
      const prevUser = storyUsers[userIdx - 1];
      setUserIdx(userIdx - 1);
      setStoryIdx(prevUser.stories.length - 1);
    }
    // else: already at the very first story, do nothing
  }, [userIdx, storyIdx, storyUsers]);

  // Keyboard
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  // Touch handling for tap zones
  function handleTouchStart(e: React.TouchEvent) {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
    setPaused(true);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    setPaused(false);
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    // Only process taps (not swipes)
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30 && dt < 300) {
      const tapX = e.changedTouches[0].clientX;
      const screenW = window.innerWidth;
      if (tapX < screenW * 0.35) {
        goPrev();
      } else {
        goNext();
      }
    }
    touchStartRef.current = null;
  }

  // Click handling for desktop tap zones
  function handleClick(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width;
    if (x < w * 0.35) {
      goPrev();
    } else {
      goNext();
    }
  }

  // Handle avatar/name tap → navigate to profile
  function handleProfileTap(e: React.MouseEvent) {
    e.stopPropagation();
    if (currentUser?.profile.username && onNavigateToProfile) {
      onNavigateToProfile(currentUser.profile.username);
    }
    onClose();
  }

  if (!currentUser || !currentStory) return null;

  const initials = (currentUser.profile.name || "?").trim().split(/\s+/).map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-fade-in">
      {/* ── Progress bars at top ── */}
      <div className="absolute top-0 inset-x-0 z-20 px-3 pt-3 pb-2 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex gap-1 mb-3">
          {currentUser.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-[3px] rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-75 ease-linear"
                style={{
                  width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%",
                  background: "linear-gradient(90deg, #4ade80, #22c55e)",
                }}
              />
            </div>
          ))}
        </div>

        {/* ── User info bar ── */}
        <div className="flex items-center justify-between">
          <button onClick={handleProfileTap} className="flex items-center gap-2.5 active:opacity-70 transition-opacity">
            {currentUser.profile.avatar_url ? (
              <img
                src={currentUser.profile.avatar_url}
                alt={currentUser.profile.name}
                className="w-9 h-9 rounded-full object-cover border-2 border-white/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-500/30 text-brand-200 flex items-center justify-center text-xs font-bold border-2 border-white/30">
                {initials}
              </div>
            )}
            <div>
              <p className="text-white text-sm font-bold leading-tight">{currentUser.profile.name}</p>
              <p className="text-white/50 text-[11px] leading-tight">{storyTimeAgo(currentStory.created_at)}</p>
            </div>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Story image ── */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer select-none"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={currentStory.media_url}
          alt="Story"
          className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          draggable={false}
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* ── Bottom scope pill ── */}
      <div className="absolute bottom-8 inset-x-0 z-20 flex justify-center pointer-events-none">
        <div
          className={`px-4 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md border ${
            currentStory.visibility === "public"
              ? "bg-green-500/15 text-green-400 border-green-500/25"
              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
          }`}
        >
          {currentStory.visibility === "public" ? "🏫 Campus" : "👥 Followers only"}
        </div>
      </div>
    </div>
  );
}
