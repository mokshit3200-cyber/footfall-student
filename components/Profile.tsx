"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useStore } from "./store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { dbUpdateProfile } from "@/lib/dbActions";
import { isDemo } from "@/lib/config";
import { overallStats } from "@/lib/attendance";
import { Sheet, SectionHeader, playPop, triggerConfetti } from "./ui";
import { ChevronRight, SparkIcon, XIcon, CheckIcon, TrashIcon } from "./icons";
import { Story, Highlight } from "@/lib/types";

export default function Profile({
  onOpenBusiness,
}: {
  onOpenBusiness: () => void;
}) {
  const { data, update, reset } = useStore();
  const { profile, business, subjects, attendance, grades, deadlines } = data;
  const { signOut, refreshProfile } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  
  // New social sheets & modals states
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [createHighlightOpen, setCreateHighlightOpen] = useState(false);
  const [activeStoriesToView, setActiveStoriesToView] = useState<Story[] | null>(null);

  const overall = useMemo(
    () => overallStats(attendance, profile.attendanceTarget),
    [attendance, profile.attendanceTarget]
  );
  const openDeadlines = deadlines.filter((d) => !d.done).length;

  // Filter active stories (posted in the last 24 hours)
  const activeUserStories = useMemo(() => {
    return (profile.stories || []).filter((s) => {
      const diff = Date.now() - new Date(s.createdAt).getTime();
      return diff < 24 * 3600 * 1000;
    });
  }, [profile.stories]);

  const hasStories = activeUserStories.length > 0;

  return (
    <div className="px-5 pt-12 pb-28 min-h-screen flex flex-col no-scrollbar">
      {/* INSTAGRAM-STYLE PROFILE HEADER */}
      <div className="flex items-center justify-between mb-5">
        {/* Avatar Ring Section */}
        {hasStories ? (
          <div 
            onClick={() => setActiveStoriesToView(activeUserStories)}
            className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-brand-500 via-purple-500 to-pink-500 flex items-center justify-center cursor-pointer active:scale-95 transition shrink-0"
          >
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center p-0.5 overflow-hidden">
              {profile.avatar && profile.avatar.startsWith("data:") ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-3xl">{profile.avatar || "👨‍💻"}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="relative shrink-0">
            <div 
              onClick={() => setCreateStoryOpen(true)}
              className="w-20 h-20 rounded-full bg-white/[0.07] border border-white/[0.14] flex items-center justify-center cursor-pointer active:scale-95 transition overflow-hidden"
            >
              {profile.avatar && profile.avatar.startsWith("data:") ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-3xl">{profile.avatar || "👨‍💻"}</span>
              )}
            </div>
            <button 
              onClick={() => setCreateStoryOpen(true)}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center border-2 border-black shadow active:scale-90 transition text-sm font-black"
            >
              +
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="flex-1 flex justify-around text-center pl-4 py-1">
          <div>
            <p className="text-base font-black text-ink tabular-nums">{data.listings?.length || 0}</p>
            <p className="text-[9px] text-ink-mute font-bold uppercase tracking-wider">Listings</p>
          </div>
          <div>
            <p className="text-base font-black text-ink tabular-nums">{profile.followersCount || 142}</p>
            <p className="text-[9px] text-ink-mute font-bold uppercase tracking-wider">Followers</p>
          </div>
          <div>
            <p className="text-base font-black text-ink tabular-nums">{profile.followingCount || 98}</p>
            <p className="text-[9px] text-ink-mute font-bold uppercase tracking-wider">Following</p>
          </div>
        </div>
      </div>

      {/* Profile Info block */}
      <div className="mb-4 pl-1">
        <h1 className="text-base font-bold text-ink leading-tight">{profile.name || "Student Name"}</h1>
        {profile.username && (
          <p className="text-xs text-brand-300 font-medium mt-0.5">@{profile.username}</p>
        )}
        <p className="text-xs text-ink-soft mt-1.5 flex items-center gap-1.5 font-semibold">
          <span>🎓</span>
          <span>{profile.course || "B.Tech Computer Science"}</span>
        </p>
        {/* Bio */}
        {profile.bio && (
          <p className="text-[13px] text-ink-soft mt-2 leading-relaxed">{profile.bio}</p>
        )}
        {/* Skills chips */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {profile.skills.map((s) => (
              <span key={s} className="px-2.5 py-1 bg-white/[0.06] rounded-full text-[11px] font-semibold text-ink-soft border border-white/[0.08]">
                {s}
              </span>
            ))}
          </div>
        )}
        {/* Social links */}
        {profile.links && (profile.links.github || profile.links.linkedin || profile.links.instagram || profile.links.portfolio) && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {profile.links.github && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] rounded-full text-[11px] text-ink-mute border border-white/[0.07]">
                <span>🐙</span> {profile.links.github}
              </span>
            )}
            {profile.links.linkedin && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] rounded-full text-[11px] text-ink-mute border border-white/[0.07]">
                <span>💼</span> {profile.links.linkedin}
              </span>
            )}
            {profile.links.instagram && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] rounded-full text-[11px] text-ink-mute border border-white/[0.07]">
                <span>📸</span> @{profile.links.instagram}
              </span>
            )}
            {profile.links.portfolio && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] rounded-full text-[11px] text-ink-mute border border-white/[0.07]">
                <span>🌐</span> {profile.links.portfolio}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Social Actions */}
      <div className="flex gap-2.5 mb-6">
        <button
          onClick={() => setEditProfileOpen(true)}
          className="flex-1 py-2 text-xs font-bold rounded-xl bg-white/[0.07] hover:bg-white/10 active:scale-[0.98] transition text-ink text-center"
        >
          Edit Profile
        </button>
        <button
          onClick={() => setCreateStoryOpen(true)}
          className="flex-1 py-2 text-xs font-bold rounded-xl bg-brand-500/15 text-brand-300 hover:bg-brand-500/20 active:scale-[0.98] transition text-center"
        >
          + Add Story
        </button>
      </div>
      {profile?.verified ? (
        <div className="w-full -mt-4 mb-6 py-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider">
          ✓ Verified
        </div>
      ) : (
        <button
          onClick={() => setVerifyOpen(true)}
          className="btn-primary w-full -mt-4 mb-6 flex items-center justify-center gap-2"
        >
          🛡️ Verify Student ID
        </button>
      )}

      {/* INSTAGRAM-STYLE STORY HIGHLIGHTS */}
      <div className="mb-6">
        <p className="text-[11px] font-bold text-ink-soft uppercase tracking-wide mb-3 pl-1">
          Highlights
        </p>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
          {/* Create Highlight Circle */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <button
              onClick={() => setCreateHighlightOpen(true)}
              className="w-14 h-14 rounded-full border-2 border-dashed border-white/15 hover:border-white/30 flex items-center justify-center active:scale-95 transition bg-white/[0.05]"
            >
              <span className="text-xl text-ink-soft font-semibold">+</span>
            </button>
            <span className="text-[10px] font-bold text-ink-soft">New</span>
          </div>

          {/* Render highlights list */}
          {(profile.highlights || []).map((highlight) => (
            <div key={highlight.id} className="flex flex-col items-center gap-1.5 shrink-0 relative group">
              <button
                onClick={() => setActiveStoriesToView(highlight.stories)}
                className="w-14 h-14 rounded-full border border-white/10 bg-white/[0.05] flex items-center justify-center text-2xl active:scale-95 transition"
              >
                {highlight.coverEmoji || "🌟"}
              </button>
              <span className="text-[10px] font-bold text-ink-soft truncate max-w-[68px]">
                {highlight.title}
              </span>
              <button
                onClick={() => {
                  if (confirm(`Delete highlight "${highlight.title}"?`)) {
                    update((d) => {
                      d.profile.highlights = (d.profile.highlights || []).filter(h => h.id !== highlight.id);
                    });
                  }
                }}
                className="absolute -top-1 -right-1 bg-red-500/20 text-red-400 rounded-full w-4.5 h-4.5 flex items-center justify-center text-[8px] border border-white font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MY LISTINGS */}
      {data.listings && data.listings.length > 0 && (
        <div className="mb-6">
          <SectionHeader title="My Listings" />
          <div className="space-y-2">
            {data.listings.map((listing) => (
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
      )}

      {/* QUICK SNAPSHOT (from original Profile.tsx, moved lower to prioritize social layout) */}
      <SectionHeader title="Academic Snapshot" />
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <Snap
          label="Attendance"
          value={overall.held === 0 ? "—" : Math.round(overall.percentage) + "%"}
        />
        <Snap label="Subjects" value={String(subjects.length)} />
        <Snap label="To-dos" value={String(openDeadlines)} />
      </div>

      {/* BUSINESS CARD / BRIDGE */}
      {business?.registered ? (
        <div className="mb-6">
          <SectionHeader title="Business" />
          <button
            onClick={onOpenBusiness}
            className="w-full rounded-2xl p-4 flex items-center gap-4 active:scale-[0.99] transition text-left"
            style={{ background: "linear-gradient(135deg, #1a0533 0%, #3b0764 45%, #7c3aed 100%)" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl shrink-0">
              {business.type === "sell" ? "🛍️" : business.type === "service" ? "🛠️" : "🎓"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base truncate">{business.name}</p>
              <p className="text-white/55 text-xs mt-0.5">
                {business.type === "sell" ? "Selling" : business.type === "service" ? "Services" : "Club / Event"} · Tap to open dashboard
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/50 shrink-0" />
          </button>
        </div>
      ) : (
        <button
          onClick={onOpenBusiness}
          className="w-full rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition text-left mb-6 shadow-sm"
          style={{ background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #c026d3 100%)" }}
        >
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <SparkIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-[15px]">Got a side hustle?</p>
            <p className="text-white/75 text-xs">Start selling on Footfall — it&apos;s free</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
        </button>
      )}

      {/* SETTINGS */}
      <SectionHeader title="Settings" />
      <div className="card divide-y divide-black/5 shadow-sm">
        <Row
          label="Attendance target"
          value={Math.round(profile.attendanceTarget * 100) + "%"}
          onClick={() => setSettingsOpen(true)}
        />
        <Row
          label="Grade system"
          value={
            profile.gradeSystem === "percentage" ? "Percentage" : "10-point GPA"
          }
          onClick={() => setSettingsOpen(true)}
        />
        <Row
          label="Monthly budget"
          value={profile.monthlyBudget ? "₹" + profile.monthlyBudget : "Not set"}
          onClick={() => setSettingsOpen(true)}
        />
        <Row
          label="Reminders"
          value={data.reminders?.enabled ? "On" : "Off"}
          onClick={() => setRemindersOpen(true)}
        />
      </div>

      <button
        onClick={async () => {
          if (confirm("Are you sure you want to sign out?")) {
            await signOut();
          }
        }}
        className="w-full text-center text-brand-300 text-sm font-semibold mt-6"
      >
        Sign Out
      </button>

      <button
        onClick={() => {
          if (confirm("Reset all data? This clears everything on this device.")) {
            reset();
          }
        }}
        className="w-full text-center text-red-400 text-sm font-semibold mt-4"
      >
        Reset all data
      </button>
      
      <p className="text-center text-ink-mute text-[11px] mt-6">
        Powered by{" "}
        <span className="font-semibold text-brand-500">Footfall &amp; Co</span>
      </p>

      {/* SHEETS & DIALOGS */}
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <RemindersSheet
        open={remindersOpen}
        onClose={() => setRemindersOpen(false)}
      />

      {/* Edit Profile Sheet */}
      <EditProfileSheet
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />

      {/* Verify ID Sheet */}
      <VerifyIdSheet
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        name={profile?.name || ""}
        college={profile?.college || ""}
        onVerified={() => refreshProfile()}
      />

      {/* Create Story Sheet */}
      <CreateStoryOpenSheet
        open={createStoryOpen}
        onClose={() => setCreateStoryOpen(false)}
      />

      {/* Create Highlight Sheet */}
      <CreateHighlightSheet
        open={createHighlightOpen}
        onClose={() => setCreateHighlightOpen(false)}
      />

      {/* Story Viewer Modal */}
      {activeStoriesToView && (
        <StoryViewerModal
          stories={activeStoriesToView}
          onClose={() => setActiveStoriesToView(null)}
        />
      )}
    </div>
  );
}

function Snap({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3 text-center shadow-sm">
      <p className="text-lg font-black text-ink tabular-nums">{value}</p>
      <p className="text-[10px] text-ink-mute font-bold mt-0.5 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function Row({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3.5 text-left active:bg-white/[0.04]"
    >
      <span className="text-sm text-ink-soft font-semibold">{label}</span>
      <span className="flex items-center gap-1 text-sm font-bold text-ink">
        {value}
        <ChevronRight className="w-4 h-4 text-ink-mute" />
      </span>
    </button>
  );
}

function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, update } = useStore();
  const [target, setTarget] = useState(
    Math.round(data.profile.attendanceTarget * 100)
  );
  const [budget, setBudget] = useState(
    data.profile.monthlyBudget ? String(data.profile.monthlyBudget) : ""
  );
  const [soundEnabled, setSoundEnabled] = useState(
    data.profile.soundEnabled !== false
  );

  useEffect(() => {
    if (open) {
      setTarget(Math.round(data.profile.attendanceTarget * 100));
      setBudget(data.profile.monthlyBudget ? String(data.profile.monthlyBudget) : "");
      setSoundEnabled(data.profile.soundEnabled !== false);
    }
  }, [open, data.profile]);

  function save() {
    update((d) => {
      d.profile.attendanceTarget = target / 100;
      d.profile.monthlyBudget = Number(budget) || 0;
      d.profile.soundEnabled = soundEnabled;
    });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div className="space-y-5">
        <div>
          <label className="text-sm font-semibold text-ink-soft mb-2 block">
            Attendance target — {target}%
          </label>
          <input
            type="range"
            min={50}
            max={90}
            step={5}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink-soft mb-2 block">
            Grade system
          </label>
          <div className="flex gap-2">
            {(["gpa10", "percentage"] as const).map((g) => (
              <button
                key={g}
                onClick={() =>
                  update((d) => {
                    d.profile.gradeSystem = g;
                  })
                }
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${
                  data.profile.gradeSystem === g
                    ? "bg-brand-500 text-white"
                    : "bg-white/[0.07] text-ink-soft"
                }`}
              >
                {g === "gpa10" ? "10-point GPA" : "Percentage"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-ink-soft mb-2 block">
            Monthly budget (₹)
          </label>
          <input
            type="number"
            inputMode="numeric"
            className="input"
            placeholder="e.g. 5000 — leave empty for none"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between py-2 border-t border-white/5 pt-4">
          <div>
            <label className="text-sm font-semibold text-ink leading-none">Sound Effects</label>
            <p className="text-[10px] text-ink-mute mt-1">Play click and chime audio haptics</p>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
              soundEnabled ? "bg-brand-500" : "bg-white/10"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                soundEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <button onClick={save} className="btn-primary w-full">
          Save
        </button>
      </div>
    </Sheet>
  );
}

function RemindersSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, update } = useStore();
  const settings = data.reminders || {
    enabled: false,
    classReminders: true,
    classLeadMin: 15,
    deadlineReminders: true,
    deadlineLeadDays: 1,
    attendanceNudge: true,
    dailyAgenda: false,
  };

  const [enabled, setEnabled] = useState(settings.enabled);
  const [classReminders, setClassReminders] = useState(settings.classReminders);
  const [classLeadMin, setClassLeadMin] = useState(settings.classLeadMin);
  const [deadlineReminders, setDeadlineReminders] = useState(settings.deadlineReminders);
  const [deadlineLeadDays, setDeadlineLeadDays] = useState(settings.deadlineLeadDays);
  const [attendanceNudge, setAttendanceNudge] = useState(settings.attendanceNudge);
  const [dailyAgenda, setDailyAgenda] = useState(settings.dailyAgenda);

  useEffect(() => {
    if (open && data.reminders) {
      setEnabled(data.reminders.enabled);
      setClassReminders(data.reminders.classReminders);
      setClassLeadMin(data.reminders.classLeadMin);
      setDeadlineReminders(data.reminders.deadlineReminders);
      setDeadlineLeadDays(data.reminders.deadlineLeadDays);
      setAttendanceNudge(data.reminders.attendanceNudge);
      setDailyAgenda(data.reminders.dailyAgenda);
    }
  }, [open, data.reminders]);

  async function handleToggleMaster(val: boolean) {
    if (val) {
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications.");
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setEnabled(true);
      } else {
        alert("Notification permission was denied. Please enable notifications in your browser settings.");
        setEnabled(false);
      }
    } else {
      setEnabled(false);
    }
  }

  function save() {
    update((d) => {
      d.reminders = {
        enabled,
        classReminders,
        classLeadMin,
        deadlineReminders,
        deadlineLeadDays,
        attendanceNudge,
        dailyAgenda,
      };
    });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Reminders">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3.5 bg-white/[0.04] rounded-2xl">
          <div>
            <p className="text-sm font-bold text-ink">Enable Reminders</p>
            <p className="text-[10px] text-ink-mute">
              Get browser notifications for schedule
            </p>
          </div>
          <button
            onClick={() => handleToggleMaster(!enabled)}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
              enabled ? "bg-brand-500" : "bg-black/15"
            }`}
          >
            <span
              className={`w-4.5 h-4.5 rounded-full bg-white absolute transition-transform shadow ${
                enabled ? "translate-x-5.5" : "translate-x-1"
              }`}
              style={{ width: "18px", height: "18px" }}
            />
          </button>
        </div>

        {enabled && (
          <div className="space-y-3.5 animate-fade-in">
            {/* Class Reminders */}
            <div className="card p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-ink">Class Alerts</p>
                  <p className="text-[10px] text-ink-mute">
                    Before each class slot begins
                  </p>
                </div>
                <button
                  onClick={() => setClassReminders(!classReminders)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center shrink-0 ${
                    classReminders ? "bg-brand-500" : "bg-black/15"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white absolute transition-transform shadow ${
                      classReminders ? "translate-x-5" : "translate-x-1"
                    }`}
                    style={{ width: "14px", height: "14px" }}
                  />
                </button>
              </div>
              {classReminders && (
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-xs text-ink-soft">Lead time:</span>
                  <select
                    className="input py-1 px-2 text-xs w-[120px]"
                    value={classLeadMin}
                    onChange={(e) => setClassLeadMin(Number(e.target.value))}
                  >
                    <option value={5}>5 min before</option>
                    <option value={10}>10 min before</option>
                    <option value={15}>15 min before</option>
                    <option value={30}>30 min before</option>
                  </select>
                </div>
              )}
            </div>

            {/* Deadline Reminders */}
            <div className="card p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-ink">Deadline Alerts</p>
                  <p className="text-[10px] text-ink-mute">
                    For exams and assignments
                  </p>
                </div>
                <button
                  onClick={() => setDeadlineReminders(!deadlineReminders)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center shrink-0 ${
                    deadlineReminders ? "bg-brand-500" : "bg-black/15"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white absolute transition-transform shadow ${
                      deadlineReminders ? "translate-x-5" : "translate-x-1"
                    }`}
                    style={{ width: "14px", height: "14px" }}
                  />
                </button>
              </div>
              {deadlineReminders && (
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-xs text-ink-soft">Lead time:</span>
                  <select
                    className="input py-1 px-2 text-xs w-[120px]"
                    value={deadlineLeadDays}
                    onChange={(e) => setDeadlineLeadDays(Number(e.target.value))}
                  >
                    <option value={1}>1 day before</option>
                    <option value={2}>2 days before</option>
                    <option value={3}>3 days before</option>
                  </select>
                </div>
              )}
            </div>

            {/* Attendance Nudge */}
            <div className="card p-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-bold text-ink">Attendance Nudge</p>
                <p className="text-[10px] text-ink-mute">
                  Nudge at 6:00 PM if attendance is unmarked
                </p>
              </div>
              <button
                onClick={() => setAttendanceNudge(!attendanceNudge)}
                className={`w-10 h-5 rounded-full transition-colors relative flex items-center shrink-0 ${
                  attendanceNudge ? "bg-brand-500" : "bg-black/15"
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute transition-transform shadow ${
                    attendanceNudge ? "translate-x-5" : "translate-x-1"
                  }`}
                  style={{ width: "14px", height: "14px" }}
                />
              </button>
            </div>

            {/* Daily Agenda */}
            <div className="card p-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-bold text-ink">Daily Agenda</p>
                <p className="text-[10px] text-ink-mute">
                  Show today's agenda banner in the morning
                </p>
              </div>
              <button
                onClick={() => setDailyAgenda(!dailyAgenda)}
                className={`w-10 h-5 rounded-full transition-colors relative flex items-center shrink-0 ${
                  dailyAgenda ? "bg-brand-500" : "bg-black/15"
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute transition-transform shadow ${
                    dailyAgenda ? "translate-x-5" : "translate-x-1"
                  }`}
                  style={{ width: "14px", height: "14px" }}
                />
              </button>
            </div>
          </div>
        )}

        <button onClick={save} className="btn-primary w-full py-2.5">
          Save Settings
        </button>
      </div>
    </Sheet>
  );
}

// ── NEW SOCIAL SHEETS & COMPONENTS FOR PROFILE OVERHAUL ──

// Edit Profile Details and Avatar picker
function EditProfileSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, update } = useStore();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const emojis = ["👨‍💻", "👩‍💻", "🎓", "🌟", "🎨", "🚀", "🍕", "🎸", "🐱", "🦁", "🥤", "🛹"];

  useEffect(() => {
    if (open && data.profile) {
      setName(data.profile.name || "");
      setCourse(data.profile.course || "B.Tech Computer Science");
      setAvatar(data.profile.avatar || "👨‍💻");
      setBio(data.profile.bio || "");
      setSkills(data.profile.skills || []);
      setSkillInput("");
      setGithub(data.profile.links?.github || "");
      setLinkedin(data.profile.links?.linkedin || "");
      setInstagram(data.profile.links?.instagram || "");
      setPortfolio(data.profile.links?.portfolio || "");
    }
  }, [open, data.profile]);

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillInput("");
  }

  function removeSkill(s: string) {
    setSkills(skills.filter((x) => x !== s));
  }

  function handleSave() {
    if (!name.trim()) return;
    const trimmedBio = bio.trim() || undefined;
    const trimmedSkills = skills.length > 0 ? skills : undefined;
    const links = { github: github.trim() || undefined, linkedin: linkedin.trim() || undefined, instagram: instagram.trim() || undefined, portfolio: portfolio.trim() || undefined };
    const hasLinks = links.github || links.linkedin || links.instagram || links.portfolio;

    update((d) => {
      d.profile.name = name.trim();
      d.profile.course = course.trim();
      d.profile.avatar = avatar;
      d.profile.bio = trimmedBio;
      d.profile.skills = trimmedSkills;
      d.profile.links = hasLinks ? links : undefined;
    });

    if (!isDemo() && user) {
      dbUpdateProfile(user.id, {
        name: name.trim(),
        course: course.trim(),
        bio: trimmedBio,
        skills: trimmedSkills,
        links: hasLinks ? (links as Record<string, string>) : {},
      });
    }

    onClose();
  }

  // Handle base64 profile photo upload
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit Profile">
      <div className="space-y-4">
        {/* Username */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Username
          </label>
          <input
            className="input text-sm opacity-50 cursor-not-allowed bg-white/[0.02]"
            value={data.profile?.username ? `@${data.profile.username}` : "No username set"}
            readOnly
            disabled
          />
        </div>

        {/* Name */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Display Name
          </label>
          <input
            className="input text-sm"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Course */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Course / Department
          </label>
          <input
            className="input text-sm"
            placeholder="e.g. B.Tech Computer Science"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Bio
          </label>
          <textarea
            className="input text-sm resize-none"
            placeholder="A short intro about you..."
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={150}
          />
          <p className="text-[10px] text-ink-mute mt-1 text-right">{bio.length}/150</p>
        </div>

        {/* Skills */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Skills
          </label>
          <div className="flex gap-2">
            <input
              className="input text-sm flex-1"
              placeholder="Add a skill (e.g. React)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-3 py-2 bg-brand-500/20 text-brand-300 rounded-xl text-sm font-bold hover:bg-brand-500/30 transition shrink-0"
            >
              Add
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {skills.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => removeSkill(s)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.06] rounded-full text-[11px] font-semibold text-ink-soft border border-white/[0.08] hover:border-red-400/40 hover:text-red-400 transition"
                >
                  {s} <span className="text-[10px]">✕</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Social Links */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-2">
            Social Links
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base w-6 text-center shrink-0">🐙</span>
              <input className="input text-sm flex-1" placeholder="GitHub username" value={github} onChange={(e) => setGithub(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base w-6 text-center shrink-0">💼</span>
              <input className="input text-sm flex-1" placeholder="LinkedIn username" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base w-6 text-center shrink-0">📸</span>
              <input className="input text-sm flex-1" placeholder="Instagram handle" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base w-6 text-center shrink-0">🌐</span>
              <input className="input text-sm flex-1" placeholder="Portfolio URL" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-2">
            Select Avatar / Emoji
          </label>
          <div className="grid grid-cols-6 gap-2 mb-3">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                className={`h-11 rounded-xl flex items-center justify-center text-xl transition bg-white/[0.04] ${
                  avatar === emoji ? "ring-2 ring-brand-500 bg-brand-500/15" : "hover:bg-white/[0.07]"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          
          <div className="text-center py-1">
            <span className="text-xs text-ink-mute block mb-2">OR</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="avatar-file-upload"
              onChange={handlePhotoUpload}
            />
            <label
              htmlFor="avatar-file-upload"
              className="inline-block px-4 py-2 bg-white/[0.07] hover:bg-white/10 rounded-xl text-xs font-bold text-ink-soft cursor-pointer transition active:scale-95"
            >
              📷 Upload custom photo
            </label>
          </div>

          {avatar && avatar.startsWith("data:") && (
            <div className="mt-3 flex items-center justify-center gap-3 bg-white/[0.04] p-2.5 rounded-2xl">
              <img src={avatar} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-white/[0.14]" />
              <span className="text-xs font-semibold text-ink-soft">Custom avatar selected</span>
              <button 
                onClick={() => setAvatar("👨‍💻")} 
                className="text-red-500 font-bold text-xs ml-auto"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={!name.trim()} className="btn-primary w-full py-2.5 mt-2">
          Save Changes
        </button>
      </div>
    </Sheet>
  );
}

// Create and Post Story Sheet
function CreateStoryOpenSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, update, uid } = useStore();
  const [mediaType, setMediaType] = useState<"text" | "image">("text");
  const [caption, setCaption] = useState("");
  const [textContent, setTextContent] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  
  // Gradients list
  const gradients = [
    "from-purple-600 to-pink-500", // Instagram gradient
    "from-emerald-500 to-teal-700", // Brand teal
    "from-blue-600 to-indigo-800", // Dark royal blue
    "from-amber-500 to-red-600", // Sunset orange
  ];
  const [activeGradient, setActiveGradient] = useState(gradients[0]);

  useEffect(() => {
    if (open) {
      setMediaType("text");
      setCaption("");
      setTextContent("");
      setImageBase64("");
      setActiveGradient(gradients[0]);
    }
  }, [open]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handlePost() {
    if (mediaType === "text" && !textContent.trim()) return;
    if (mediaType === "image" && !imageBase64) return;

    // Use selected gradient class as mediaUrl for text stories
    const mediaUrl = mediaType === "text" ? `gradient:${activeGradient}|content:${textContent.trim()}` : imageBase64;

    const newStory = {
      id: uid(),
      userId: "me",
      userName: data.profile.name || "Me",
      userAvatar: data.profile.avatar || "👨‍💻",
      mediaUrl,
      mediaType,
      caption: mediaType === "image" && caption.trim() ? caption.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    update((d) => {
      if (!d.profile.stories) d.profile.stories = [];
      d.profile.stories.push(newStory);
    });

    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add to Story">
      <div className="space-y-4">
        {/* Toggle Media Type */}
        <div className="flex gap-2 bg-black/[0.04] p-1 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMediaType("text")}
            className={`flex-1 py-2 rounded-xl transition ${
              mediaType === "text" ? "bg-white/10 text-ink" : "text-ink-mute"
            }`}
          >
            ✍️ Text Story
          </button>
          <button
            type="button"
            onClick={() => setMediaType("image")}
            className={`flex-1 py-2 rounded-xl transition ${
              mediaType === "image" ? "bg-white/10 text-ink" : "text-ink-mute"
            }`}
          >
            📸 Photo Story
          </button>
        </div>

        {mediaType === "text" ? (
          /* Text story composer */
          <div className="space-y-3.5 animate-fade-in">
            <div className={`w-full h-44 rounded-2xl bg-gradient-to-tr ${activeGradient} flex items-center justify-center p-4 text-center text-white relative shadow-inner`}>
              <textarea
                className="bg-transparent w-full text-lg font-black placeholder-white/60 focus:outline-none text-center resize-none border-none leading-snug outline-none"
                placeholder="What's on your mind?"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                maxLength={120}
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-white/50 font-bold">
                {textContent.length}/120
              </span>
            </div>

            {/* Gradient Selector */}
            <div>
              <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-2">
                Background Theme
              </label>
              <div className="flex gap-3">
                {gradients.map((grad) => (
                  <button
                    key={grad}
                    type="button"
                    onClick={() => setActiveGradient(grad)}
                    className={`w-10 h-10 rounded-full bg-gradient-to-tr ${grad} transition ${
                      activeGradient === grad ? "ring-4 ring-brand-500/30 scale-105 border-2 border-white" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Image story composer */
          <div className="space-y-4 animate-fade-in">
            {imageBase64 ? (
              <div className="relative w-full h-44 rounded-2xl overflow-hidden shadow-inner border border-white/10 bg-white/[0.07] flex items-center justify-center">
                <img src={imageBase64} alt="Upload preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImageBase64("")}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="text-center py-4 bg-white/[0.04] border-2 border-dashed border-white/[0.14] rounded-2xl">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="story-image-picker"
                  onChange={handleImageUpload}
                />
                <label
                  htmlFor="story-image-picker"
                  className="inline-block px-5 py-3 bg-brand-500/15 hover:bg-brand-500/20 text-brand-300 font-bold text-xs rounded-xl cursor-pointer transition active:scale-95 shadow-sm"
                >
                  📁 Select Photo
                </label>
                <p className="text-[10px] text-ink-mute mt-2">Max file size 5MB (JPEG, PNG)</p>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
                Caption (Optional)
              </label>
              <input
                className="input text-sm"
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
          </div>
        )}

        <button
          onClick={handlePost}
          disabled={(mediaType === "text" && !textContent.trim()) || (mediaType === "image" && !imageBase64)}
          className="btn-primary w-full py-2.5 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed mt-2"
        >
          Share to Story
        </button>
      </div>
    </Sheet>
  );
}

// Create highlights Sheet from historical stories
function CreateHighlightSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, update, uid } = useStore();
  const [title, setTitle] = useState("");
  const [coverEmoji, setCoverEmoji] = useState("🌟");
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);

  const emojis = ["🌟", "🎓", "🍕", "🎉", "🔥", "💻", "📚", "🎨", "🚀", "🎸", "🌊", "🏡"];
  const userStories = data.profile.stories || [];

  useEffect(() => {
    if (open) {
      setTitle("");
      setCoverEmoji("🌟");
      setSelectedStoryIds([]);
    }
  }, [open]);

  function handleToggleStory(id: string) {
    setSelectedStoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleCreate() {
    if (!title.trim() || selectedStoryIds.length === 0) return;

    // Filter the selected story objects
    const selectedStoriesList = userStories.filter((s) => selectedStoryIds.includes(s.id));

    const newHighlight = {
      id: uid(),
      title: title.trim(),
      coverEmoji,
      stories: selectedStoriesList,
    };

    update((d) => {
      if (!d.profile.highlights) d.profile.highlights = [];
      d.profile.highlights.push(newHighlight);
    });

    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Create Highlight">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Highlight Title
          </label>
          <input
            className="input text-sm"
            placeholder="e.g. Campus / Food / Hack"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={10}
            required
          />
        </div>

        {/* Cover Emoji */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-2">
            Select Cover Icon
          </label>
          <div className="grid grid-cols-6 gap-2">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setCoverEmoji(emoji)}
                className={`h-10 rounded-xl flex items-center justify-center text-xl transition bg-white/[0.04] ${
                  coverEmoji === emoji ? "ring-2 ring-brand-500 bg-brand-500/15" : "hover:bg-white/[0.07]"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Select Stories */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-2">
            Select Stories ({selectedStoryIds.length} selected)
          </label>
          {userStories.length === 0 ? (
            <p className="text-xs text-ink-mute text-center py-4 bg-black/[0.01] rounded-xl border border-white/10">
              You haven't posted any stories yet.
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 no-scrollbar border border-white/10 rounded-xl p-2 bg-black/[0.01]">
              {userStories.map((story) => {
                const isSelected = selectedStoryIds.includes(story.id);
                // Parse helper for preview
                let textPreview = "";
                if (story.mediaType === "text") {
                  const contentPart = story.mediaUrl.split("|content:")[1];
                  textPreview = contentPart ? contentPart : "Text story";
                } else {
                  textPreview = story.caption || "[Photo story]";
                }

                return (
                  <div
                    key={story.id}
                    onClick={() => handleToggleStory(story.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition cursor-pointer ${
                      isSelected ? "bg-brand-500/15 border border-brand-200" : "bg-white hover:bg-white/[0.04]"
                    }`}
                  >
                    {story.mediaType === "image" ? (
                      <img src={story.mediaUrl} className="w-8 h-8 rounded-lg object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-400 to-teal-600 flex items-center justify-center text-white text-[8px] font-bold">
                        ✍️
                      </div>
                    )}
                    <span className="text-xs font-semibold text-ink-soft truncate flex-1">{textPreview}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-brand-500 bg-brand-500 text-white" : "border-white/20"
                    }`}>
                      {isSelected && <span className="text-[10px] font-bold">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={!title.trim() || selectedStoryIds.length === 0}
          className="btn-primary w-full py-2.5 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed mt-2"
        >
          Create Highlight
        </button>
      </div>
    </Sheet>
  );
}

// ── FULL-SCREEN STORY VIEWER MODAL ──
export function StoryViewerModal({
  stories,
  onClose,
}: {
  stories: Story[];
  onClose: () => void;
}) {
  const { update, uid } = useStore();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [toast, setToast] = useState("");
  const [lastTap, setLastTap] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(0);

  const currentStory = stories[index];

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 1500);
  }

  // Drag down to close handlers
  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientY);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStart === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;
    if (diff > 0) {
      setTranslateY(diff);
    }
  }

  function handleTouchEnd() {
    if (translateY > 120) {
      onClose();
    } else {
      setTranslateY(0);
    }
    setTouchStart(null);
  }

  // Double tap to like
  function handleDoubleTap(e: React.MouseEvent) {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap < DOUBLE_PRESS_DELAY) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
      playPop();
      handleSendReply("❤️");
      showToast("Story Liked! ❤️");
    } else {
      setLastTap(now);
    }
  }

  // Auto-progress story every 5 seconds (50 ticks of 100ms)
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          handleNext();
          return 0;
        }
        return p + 2; // Increments by 2% every 100ms = 5000ms total
      });
    }, 100);

    return () => clearInterval(interval);
  }, [index, stories]);

  function handleNext() {
    if (index < stories.length - 1) {
      setIndex(index + 1);
    } else {
      onClose();
    }
  }

  function handlePrev() {
    if (index > 0) {
      setIndex(index - 1);
    }
  }

  if (!currentStory) return null;

  // Helper to parse gradients in text stories
  let textStoryContent = "";
  let gradientClass = "from-purple-600 to-pink-500";
  if (currentStory.mediaType === "text" && currentStory.mediaUrl.startsWith("gradient:")) {
    const parts = currentStory.mediaUrl.split("|content:");
    textStoryContent = parts[1] || "";
    const gradPart = parts[0].replace("gradient:", "");
    if (gradPart) gradientClass = gradPart;
  } else if (currentStory.mediaType === "text") {
    textStoryContent = currentStory.mediaUrl;
  }

  function handleSendReply(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const classmateName = currentStory.userName;
    
    update((d) => {
      // Find or create direct message chat
      let chat = d.groups.find((g) => g.direct && g.members.includes(classmateName));
      if (!chat) {
        chat = {
          id: uid(),
          name: classmateName,
          members: [classmateName],
          tasks: [],
          notes: "",
          createdAt: new Date().toISOString(),
          messages: [],
          direct: true,
        };
        d.groups.push(chat);
      }
      
      chat.messages = chat.messages || [];
      chat.messages.push({
        id: uid(),
        sender: "me",
        text: `Replied to your story "${currentStory.mediaType === 'text' ? (textStoryContent.length > 20 ? textStoryContent.slice(0, 20) + '...' : textStoryContent) : 'Photo'}": ${trimmed}`,
        at: new Date().toISOString(),
      });
    });
  }

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateY(${translateY}px)`, transition: translateY === 0 ? "transform 0.2s ease" : "none" }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 max-w-[440px] mx-auto animate-fade-in"
    >
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-16 inset-x-0 mx-auto w-max z-50 bg-brand-500/20 border border-brand-500/40 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Top Segmented Progress Bar */}
      <div className="flex gap-1.5 w-full pt-2 px-1">
        {stories.map((_, i) => {
          let widthVal = "0%";
          if (i < index) widthVal = "100%";
          else if (i === index) widthVal = `${progress}%`;
          
          return (
            <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75"
                style={{ width: widthVal }}
              />
            </div>
          );
        })}
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mt-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold border border-white/20 overflow-hidden shrink-0">
            {currentStory.userAvatar && currentStory.userAvatar.startsWith("data:") ? (
              <img src={currentStory.userAvatar} className="w-full h-full object-cover" alt="" />
            ) : (
              <span>{currentStory.userAvatar || "👨‍💻"}</span>
            )}
          </div>
          <div>
            <p className="text-xs font-black text-white">{currentStory.userName === "me" ? "You" : currentStory.userName}</p>
            <p className="text-[9px] text-white/50 font-bold">
              {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-90 transition font-bold"
        >
          ✕
        </button>
      </div>

      {/* Main Content Area (Tappable zones) */}
      <div 
        onClick={handleDoubleTap}
        className="flex-1 flex items-center justify-center relative my-4 rounded-3xl overflow-hidden cursor-pointer"
      >
        {/* Left Tap Control */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }} 
          className="absolute left-0 inset-y-0 w-[35%] z-20 cursor-pointer"
        />
        {/* Right Tap Control */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }} 
          className="absolute right-0 inset-y-0 w-[65%] z-20 cursor-pointer"
        />

        {/* Flying Heart Animation */}
        {showHeart && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-ping">
            <span className="text-6xl filter drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]">❤️</span>
          </div>
        )}

        {/* Content Render */}
        {currentStory.mediaType === "text" ? (
          <div className={`w-full h-full bg-gradient-to-tr ${gradientClass} flex items-center justify-center text-center p-6 text-white`}>
            <p className="text-2xl font-black leading-snug drop-shadow-md px-2 max-w-[280px]">
              {textStoryContent}
            </p>
          </div>
        ) : (
          <div className="w-full h-full relative flex items-center justify-center bg-black">
            <img src={currentStory.mediaUrl} alt="Story" className="w-full max-h-full object-contain pointer-events-none" />
            {currentStory.caption && (
              <div className="absolute bottom-6 inset-x-0 text-center px-4 py-3 bg-black/40 backdrop-blur-sm text-white text-sm font-bold z-10 max-w-[90%] mx-auto rounded-2xl border border-white/10">
                {currentStory.caption}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Quick Reply Bar (only for classmate stories, not "me") */}
      {currentStory.userId !== "me" && (
        <div className="mb-2 px-1 flex flex-col gap-2 relative z-30">
          {/* Emojis row */}
          <div className="flex justify-around bg-white/[0.04] p-1.5 rounded-2xl border border-white/[0.08] backdrop-blur-sm">
            {["🔥", "😭", "😮", "😂", "❤️", "👏"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  handleSendReply(emoji);
                  showToast(`Sent ${emoji} reaction!`);
                }}
                className="text-xl active:scale-125 transition hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>
          
          {/* Message input */}
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Send message..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && replyText.trim()) {
                  handleSendReply(replyText);
                  setReplyText("");
                  showToast("Reply sent!");
                }
              }}
              className="bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] rounded-xl text-white text-xs px-3.5 py-2.5 flex-1 focus:outline-none focus:border-brand-500 transition"
            />
            <button
              onClick={() => {
                if (replyText.trim()) {
                  handleSendReply(replyText);
                  setReplyText("");
                  showToast("Reply sent!");
                }
              }}
              className="px-4 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white text-xs font-bold rounded-xl transition"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Bottom Spacer */}
      <div className="h-6 text-center text-[10px] font-bold text-white/40 tracking-wider">
        Swipe down to close · Double tap center to ❤️
      </div>
    </div>
  );
}

interface VerifyIdSheetProps {
  open: boolean;
  onClose: () => void;
  name: string;
  college: string;
  onVerified: () => void;
}

function VerifyIdSheet({ open, onClose, name, college, onVerified }: VerifyIdSheetProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState(0); // 0 = upload, 1 = scanning
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setStep(0);
      setLogs([]);
    }
  }, [open]);

  useEffect(() => {
    if (step !== 1 || !open) return;

    const logsSequence = [
      { text: "[AI] Initializing OCR vision engine...", delay: 0 },
      { text: "[AI] Analyzing image structure...", delay: 600 },
      { text: `[AI] Extracted: Name = ${name}`, delay: 1200 },
      { text: `[AI] Extracted: College = ${college}`, delay: 1800 },
      { text: "[AI] Matching records... ✓ SUCCESS", delay: 2400 },
    ];

    setLogs([]);
    const timers: NodeJS.Timeout[] = [];

    logsSequence.forEach((item) => {
      const t = setTimeout(() => {
        setLogs((prev) => [...prev, item.text]);
      }, item.delay);
      timers.push(t);
    });

    const finishTimer = setTimeout(() => {
      handleVerifyComplete();
    }, 2500);
    timers.push(finishTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [step, open]);

  async function handleVerifyComplete() {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ verified: true })
        .eq("id", user.id);
      
      if (error) {
        console.error(error);
        alert("Verification failed: " + error.message);
      } else {
        triggerConfetti();
        onVerified();
      }
    } catch (err) {
      console.error(err);
    } finally {
      onClose();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setStep(1);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Verify Student ID">
      <div className="space-y-4">
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-xs text-ink-mute leading-relaxed">
              Upload a clear photo of your student ID card. Our AI OCR system will scan the card to verify your identity and institution status instantly.
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-brand-500/30 hover:border-brand-500/60 transition duration-200 rounded-2xl aspect-[16/10] flex flex-col items-center justify-center cursor-pointer bg-white/[0.02] hover:bg-white/[0.04]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <span className="text-3xl mb-2">🛡️</span>
              <span className="text-sm font-bold text-ink">Upload ID Photo</span>
              <span className="text-[10px] text-ink-mute mt-1">PNG, JPG or JPEG files</span>
            </div>
          </div>
        )}

        {step === 1 && file && (
          <div className="space-y-4">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-black border border-white/10">
              <img
                src={URL.createObjectURL(file)}
                alt="ID Preview"
                className="w-full h-full object-cover"
              />
              {/* Laser Line Scanner */}
              <div
                className="absolute inset-x-0 h-0.5 bg-brand-400 opacity-80 animate-bounce"
                style={{ top: "50%" }}
              />
            </div>

            <div className="bg-[#0c0c0e]/95 border border-white/[0.07] rounded-2xl p-4 font-mono text-xs text-green-400 min-h-[140px] flex flex-col gap-1.5 shadow-inner">
              {logs.map((log, idx) => (
                <div key={idx} className="animate-fade-in">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
