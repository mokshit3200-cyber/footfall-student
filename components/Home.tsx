"use client";

import { useMemo, useState, useEffect } from "react";
import { useStore } from "./store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { 
  dbSaveAttendance, 
  dbSaveTimetableSlot, 
  dbDeleteTimetableSlot, 
  dbSaveTimetableBulk,
  dbSaveSubject,
  dbDeleteSubject,
  dbSaveDeadline,
  dbDeleteDeadline,
  dbToggleDeadline,
  dbSaveGrade,
  dbDeleteGrade
} from "@/lib/dbActions";
import { isDemo } from "@/lib/config";
import {
  overallStats,
  allSubjectStats,
  bunkVerdict,
} from "@/lib/attendance";
import {
  todayISO,
  todayDayKey,
  longToday,
  dueLabel,
  daysUntil,
  DAY_SHORT,
  DAY_KEYS,
  DAY_LABELS,
} from "@/lib/dates";
import { Ring, Sheet, SectionHeader, statusColor, triggerConfetti, playTick, playChime, SpotlightCard } from "./ui";
import {
  PlusIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  TrashIcon,
  ChevronRight,
  BellIcon,
  GearIcon,
  ArrowDownIcon,
  ArrowUpIcon,
} from "./icons";
import {
  AttStatus,
  DeadlineType,
  SUBJECT_COLORS,
  DayKey,
} from "@/lib/types";
import AttendanceDetail from "./AttendanceDetail";

type SheetKind =
  | null
  | "subject"
  | "timetable"
  | "deadline"
  | "grade"
  | "calc"
  | "addClass"
  | "notifications";

export default function Home({ onSwitchTab }: { onSwitchTab?: (tab: any) => void }) {
  const { data, update, uid } = useStore();
  const { user } = useAuth();
  const { profile, subjects, timetable, attendance, deadlines, grades, expenses, classmates } =
    data;
  const target = profile.attendanceTarget;
  const today = todayISO();
  const todayKey = todayDayKey();

  const [sheet, setSheet] = useState<SheetKind>(null);
  const [detailSubject, setDetailSubject] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [pullStart, setPullStart] = useState<number | null>(null);
  const [pullOffset, setPullOffset] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const demo = isDemo();
  const [followRequests, setFollowRequests] = useState<any[]>([]);

  useEffect(() => {
    if (demo) {
      setFollowRequests([
        { follower_id:"dr1", profiles:{ id:"dr1", name:"Vikram Singh",  username:"vikrams", college:"IIT Hyderabad",  avatar_url:null }},
        { follower_id:"dr2", profiles:{ id:"dr2", name:"Ananya Reddy",  username:"ananya_r",college:"KL University",   avatar_url:null }},
      ]);
      return;
    }
    if (!user) return;
    supabase
      .from("follows")
      .select("id, status, follower_id, follower:profiles!follows_follower_id_fkey(id, name, username, avatar_url, college, course, year)")
      .eq("following_id", user.id)
      .eq("status", "pending")
      .then(({ data }) => {
        const mapped = (data ?? []).map((item: any) => ({
          follower_id: item.follower_id,
          profiles: item.follower || { id: item.follower_id, name: "Student", username: "student", college: "Campus", avatar_url: null }
        }));
        setFollowRequests(mapped);
      });
  }, [user, demo]);

  async function handleAcceptFollow(followerId: string) {
    playTick();
    if (!demo && user) {
      await supabase
        .from("follows")
        .update({ status: "accepted" })
        .eq("follower_id", followerId)
        .eq("following_id", user.id);
    }
    setFollowRequests((prev) => prev.filter((r) => r.follower_id !== followerId));
  }

  async function handleDeclineFollow(followerId: string) {
    playTick();
    if (!demo && user) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("following_id", user.id);
    }
    setFollowRequests((prev) => prev.filter((r) => r.follower_id !== followerId));
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (window.scrollY === 0 && !isSyncing) {
      setPullStart(e.touches[0].clientY);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (pullStart === null || isSyncing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - pullStart;
    if (diff > 0) {
      if (e.cancelable) e.preventDefault();
      setPullOffset(Math.min(70, diff * 0.45));
    }
  }

  function handleTouchEnd() {
    if (pullStart === null || isSyncing) return;
    setPullStart(null);
    if (pullOffset > 45) {
      setIsSyncing(true);
      setPullOffset(50);
      playTick();
      
      setTimeout(() => {
        playChime();
        setIsSyncing(false);
        setPullOffset(0);
        
        const t = document.createElement("div");
        t.className = "fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white text-black text-xs font-bold px-4 py-2.5 rounded-full shadow-lg animate-fade-up";
        t.innerText = "⚡ Dashboard Synced!";
        document.body.appendChild(t);
        setTimeout(() => {
          t.classList.add("animate-fade-out");
          setTimeout(() => {
            if (t.parentNode) document.body.removeChild(t);
          }, 300);
        }, 1500);
      }, 1200);
    } else {
      setPullOffset(0);
    }
  }

  const overall = useMemo(
    () => overallStats(attendance, target),
    [attendance, target]
  );
  const subjectStatsList = useMemo(
    () => allSubjectStats(subjects, attendance, target),
    [subjects, attendance, target]
  );
  const subjectById = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s])),
    [subjects]
  );

  const todaySlots = useMemo(
    () =>
      timetable
        .filter((s) => s.day === todayKey)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [timetable, todayKey]
  );

  function statusOfSlot(slotId: string): AttStatus | null {
    const rec = attendance.find((r) => r.slotId === slotId && r.date === today);
    return rec ? rec.status : null;
  }

  function markSlot(slotId: string, subjectId: string, status: AttStatus) {
    let allPresent = false;
    update((d) => {
      const existing = d.attendance.find(
        (r) => r.slotId === slotId && r.date === today
      );
      if (existing) {
        if (existing.status === status) {
          d.attendance = d.attendance.filter((r) => r.id !== existing.id);
        } else {
          existing.status = status;
        }
      } else {
        d.attendance.push({
          id: uid(),
          subjectId,
          slotId,
          date: today,
          status,
        });
      }

      // Check if all today's slots are marked present now
      if (status === "present" && todaySlots.length > 0) {
        const markedPresentSlots = d.attendance
          .filter((r) => r.date === today && r.status === "present")
          .map((r) => r.slotId);
        
        allPresent = todaySlots.every((slot) => markedPresentSlots.includes(slot.id));
      }
    });

    if (allPresent) {
      triggerConfetti();
    }

    if (!isDemo() && user) {
      dbSaveAttendance(user.id, subjectId, today, status);
    }
  }

  // bulk-cancel all today's slots (holiday / no classes)
  function markAllHoliday() {
    playTick();
    update((d) => {
      todaySlots.forEach((slot) => {
        const existing = d.attendance.find(
          (r) => r.slotId === slot.id && r.date === today
        );
        if (existing) {
          existing.status = "cancelled";
        } else {
          d.attendance.push({
            id: uid(),
            subjectId: slot.subjectId,
            slotId: slot.id,
            date: today,
            status: "cancelled",
          });
        }
      });
    });
    if (!isDemo() && user) {
      todaySlots.forEach((slot) =>
        dbSaveAttendance(user.id, slot.subjectId, today, "cancelled")
      );
    }
  }

  // quick-mark (no timetable) — one tap adds a held class for a subject
  function quickMark(subjectId: string, status: AttStatus) {
    update((d) => {
      d.attendance.push({ id: uid(), subjectId, date: today, status });
    });
    if (!isDemo() && user) {
      dbSaveAttendance(user.id, subjectId, today, status);
    }
  }

  function generateMockTimetable() {
    setIsGenerating(true);
    playTick();

    setTimeout(() => {
      update((d) => {
        // 1. Seed subjects if empty
        if (d.subjects.length === 0) {
          d.subjects = [
            { id: "subj-0", name: "DBMS", color: "#7c3aed" },
            { id: "subj-1", name: "Operating Systems", color: "#3b82f6" },
            { id: "subj-2", name: "Maths III", color: "#f59e0b" },
            { id: "subj-3", name: "Computer Networks", color: "#ec4899" },
            { id: "subj-4", name: "Economics", color: "#14b8a6" },
          ];
        }
        
        const subjs = d.subjects;
        
        // 2. Clear old timetable and add class slots
        d.timetable = [
          { id: uid(), day: "mon", subjectId: subjs[0 % subjs.length].id, start: "09:00", end: "10:00", room: "204" },
          { id: uid(), day: "mon", subjectId: subjs[1 % subjs.length].id, start: "11:00", end: "12:00", room: "Lab 2" },
          { id: uid(), day: "mon", subjectId: subjs[2 % subjs.length].id, start: "14:00", end: "15:00", room: "108" },
          { id: uid(), day: "tue", subjectId: subjs[3 % subjs.length].id, start: "10:00", end: "11:00", room: "301" },
          { id: uid(), day: "tue", subjectId: subjs[4 % subjs.length].id, start: "12:00", end: "13:00", room: "210" },
          { id: uid(), day: "wed", subjectId: subjs[0 % subjs.length].id, start: "09:00", end: "10:00", room: "204" },
          { id: uid(), day: "wed", subjectId: subjs[1 % subjs.length].id, start: "11:00", end: "12:00", room: "Lab 2" },
          { id: uid(), day: "thu", subjectId: subjs[2 % subjs.length].id, start: "10:00", end: "11:00", room: "108" },
          { id: uid(), day: "thu", subjectId: subjs[3 % subjs.length].id, start: "13:00", end: "14:00", room: "301" },
          { id: uid(), day: "fri", subjectId: subjs[4 % subjs.length].id, start: "11:00", end: "12:00", room: "210" },
          { id: uid(), day: "fri", subjectId: subjs[0 % subjs.length].id, start: "14:00", end: "15:00", room: "204" },
        ];

        // 3. Seed some mock deadlines if empty
        if (d.deadlines.length === 0) {
          d.deadlines = [
            { id: uid(), title: "DBMS Lab Assignment 4", subjectId: subjs[0].id, date: todayISO(), type: "assignment", done: false },
            { id: uid(), title: "OS End-sem Project Report", subjectId: subjs[1].id, date: todayISO(), type: "project", done: false },
          ];
        }

        // 4. Push in-app notifications
        d.notifications = d.notifications || [];
        d.notifications.push({
          id: uid(),
          title: "⚡ Timetable Generated",
          body: "Mock CS timetable successfully generated for your week!",
          type: "system",
          read: false,
          createdAt: new Date().toISOString(),
        });
      });
      setIsGenerating(false);
      playChime();
      triggerConfetti();
    }, 1200);
  }

  const upcoming = useMemo(
    () =>
      deadlines
        .filter((d) => !d.done)
        .sort((a, b) => daysUntil(a.date) - daysUntil(b.date)),
    [deadlines]
  );

  const cgpa = useMemo(() => computeCgpa(grades, profile.gradeSystem), [
    grades,
    profile.gradeSystem,
  ]);

  const spentThisMonth = useMemo(() => {
    const m = today.slice(0, 7);
    return expenses
      .filter((e) => e.date.startsWith(m))
      .reduce((a, e) => a + e.amount, 0);
  }, [expenses, today]);

  // Budget calculations
  const budget = profile.monthlyBudget || 0;
  const remaining = budget - spentThisMonth;
  const budgetPct = budget > 0 ? (spentThisMonth / budget) * 100 : 0;
  const over = budget > 0 && spentThisMonth > budget;

  const sc = statusColor(overall.status);

  const unreadCount = useMemo(() => {
    const notifsCount = (data.notifications || []).filter((n) => !n.read).length;
    return notifsCount + followRequests.length;
  }, [data.notifications, followRequests]);

  return (
    <div 
      className="relative transition-transform duration-200"
      style={{ transform: pullOffset > 0 ? `translateY(${pullOffset}px)` : "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {pullOffset > 0 && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-opacity z-50 animate-fade-in"
          style={{ 
            top: `-${Math.max(12, pullOffset / 2)}px`,
            opacity: Math.min(1, pullOffset / 40)
          }}
        >
          <div className={`w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent ${isSyncing ? "animate-spin" : ""}`} />
        </div>
      )}
      <div className="px-5 pt-12 pb-28 no-scrollbar">
      {/* Brand wordmark (Instagram-style) + Notification Bell */}
      <div className="flex items-center justify-between mb-5">
        <img
          src="/brand/wordmark-white.png"
          alt="Cmpus"
          className="h-[26px] w-auto object-contain select-none"
          draggable={false}
        />
        <button
          onClick={() => setSheet("notifications")}
          className="relative w-10 h-10 rounded-full bg-[#0e0e0e] border border-white/10 flex items-center justify-center text-ink-soft active:scale-95 transition"
        >
          <BellIcon className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-1 ring-black animate-pulse" />
          )}
        </button>
      </div>

      {/* Greeting */}
      <div className="mb-5">
        <p className="text-ink-mute text-xs">{longToday()}</p>
        <h1 className="text-2xl font-bold text-ink mt-0.5">
          Hi {profile.name} 👋
        </h1>
      </div>

      <RemindersPanel />

      {/* ATTENDANCE HERO */}
      <SpotlightCard className="card p-5">
        <div className="flex items-center gap-4">
          <Ring pct={overall.percentage} color={sc.fg}>
            <span className="text-2xl font-bold text-ink">
              {overall.held === 0 ? "—" : Math.round(overall.percentage) + "%"}
            </span>
            <span className="text-[10px] text-ink-mute font-medium">
              attendance
            </span>
          </Ring>
          <div className="flex-1">
            <span
              className="pill mb-2"
              style={{ background: sc.bg, color: sc.fg }}
            >
              {sc.label}
            </span>
            <p className="text-[15px] font-semibold text-ink leading-snug">
              {bunkVerdict(overall, target)}
            </p>
          </div>
        </div>

        {/* today's classes */}
        <div id="attendance-section" className="mt-5 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-ink">Today&apos;s classes</p>
            <div className="flex items-center gap-3">
              {todaySlots.length > 0 && (
                <button
                  onClick={markAllHoliday}
                  className="text-xs font-semibold text-ink-mute hover:text-ink-soft transition flex items-center gap-1"
                >
                  <span>🏖️</span> Holiday
                </button>
              )}
              {timetable.length > 0 && (
                <button
                  onClick={() => setSheet("timetable")}
                  className="text-brand-300 text-xs font-semibold"
                >
                  Edit timetable
                </button>
              )}
            </div>
          </div>

          {todaySlots.length > 0 ? (
            <div className="space-y-2">
              {todaySlots.map((slot) => {
                const subj = subjectById[slot.subjectId];
                const st = statusOfSlot(slot.id);
                return (
                  <div
                    key={slot.id}
                    className="flex items-center gap-2.5 bg-white/[0.04] rounded-xl p-2.5"
                  >
                    <span
                      className="w-1.5 h-9 rounded-full shrink-0"
                      style={{ background: subj?.color || "#999" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">
                        {subj?.name || "Subject"}
                      </p>
                      <p className="text-[11px] text-ink-mute">
                        {slot.start}
                        {slot.room ? ` · ${slot.room}` : ""}
                      </p>
                    </div>
                    <MarkButtons
                      value={st}
                      onMark={(s) => markSlot(slot.id, slot.subjectId, s)}
                    />
                  </div>
                );
              })}
            </div>
          ) : timetable.length === 0 ? (
            isGenerating ? (
              <div className="space-y-2.5 animate-pulse py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 h-[52px]">
                    <div className="w-1.5 h-7 bg-white/[0.08] rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/[0.08] rounded w-1/3" />
                      <div className="h-2 bg-white/[0.05] rounded w-1/4" />
                    </div>
                    <div className="w-12 h-6 bg-white/[0.06] rounded-lg shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <QuickMark
                subjects={subjects}
                onMark={quickMark}
                onSetup={() => setSheet("timetable")}
                onGenerateMock={generateMockTimetable}
              />
            )
          ) : (
            <p className="text-ink-mute text-sm py-2">
              No classes scheduled today. Enjoy 🎉
            </p>
          )}
        </div>
      </SpotlightCard>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        <Stat label="Attendance" value={overall.held === 0 ? "—" : Math.round(overall.percentage) + "%"} />
        <Stat label="CGPA" value={cgpa === null ? "—" : cgpa.toFixed(2)} />
      </div>

      {/* WALLET CARD */}
      {(() => {
        const followedClassmates = (classmates || []).filter((c) => c.followed);
        return (
          <button
            onClick={() => onSwitchTab?.("money")}
            className="w-full mt-3 text-left active:opacity-90 transition rounded-3xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0f0320 0%, #2d0a6e 45%, #7c3aed 100%)" }}
          >
            <div className="px-5 pt-5 pb-6">
              {/* Top row */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {profile.name?.[0]?.toUpperCase() || "S"}
                  </div>
                  <span className="text-white/75 text-[14px] font-semibold">{profile.name || "Student"}</span>
                </div>
                <div
                  onClick={(e) => { e.stopPropagation(); onSwitchTab?.("money"); }}
                  className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center"
                >
                  <GearIcon className="w-3.5 h-3.5 text-white/50" />
                </div>
              </div>

              {/* Balance label + number */}
              <div className="text-center mb-5">
                <span className="inline-block text-[10px] font-bold text-white/50 uppercase tracking-widest px-3 py-1.5 bg-white/10 rounded-full mb-3">
                  {budget > 0 ? (over ? "Over Budget" : "Remaining Budget") : "Spent This Month"}
                </span>
                <p className="text-[48px] font-black text-white leading-none tabular-nums">
                  ₹{(budget > 0 ? Math.abs(remaining) : spentThisMonth).toLocaleString("en-IN")}
                </p>
                {budget > 0 && (
                  <p className="text-white/35 text-xs mt-1.5">
                    ₹{spentThisMonth.toLocaleString("en-IN")} of ₹{budget.toLocaleString("en-IN")}{over ? " — over budget" : " used"}
                  </p>
                )}
              </div>

              {/* Classmate avatar row */}
              {followedClassmates.length > 0 && (
                <div className="flex justify-center gap-3.5 mb-5">
                  {followedClassmates.slice(0, 5).map((c) => {
                    const hasImage = c.avatar && (c.avatar.startsWith("http") || c.avatar.startsWith("data:"));
                    const imgSrc = hasImage ? c.avatar : "/default_avatar.png";
                    return (
                      <div key={c.id} className="flex flex-col items-center gap-1">
                        <img 
                          src={imgSrc} 
                          alt={c.name} 
                          className="w-11 h-11 rounded-full object-cover border-2 border-white/20 shrink-0" 
                        />
                        <span className="text-[9px] text-white/40 font-medium">{c.name.split(" ")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onSwitchTab?.("money"); }}
                  className="flex-1 h-11 rounded-2xl bg-white/[0.11] border border-white/15 text-white text-sm font-bold flex items-center justify-center gap-1.5 active:bg-white/20 transition"
                >
                  <ArrowDownIcon className="w-4 h-4" /> Add Expense
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSwitchTab?.("money"); }}
                  className="flex-1 h-11 rounded-2xl bg-white text-purple-900 text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 transition shadow-lg"
                >
                  Split <ArrowUpIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </button>
        );
      })()}

      {/* SUBJECT-WISE ATTENDANCE */}
      <SectionHeader
        title="Subject attendance"
        action={subjects.length ? "Add" : undefined}
        onAction={() => setSheet("subject")}
      />
      {subjects.length === 0 ? (
        <EmptyCard
          text="Add your subjects to track attendance per class."
          cta="Add subjects"
          onCta={() => setSheet("subject")}
        />
      ) : (
        <div className="space-y-2">
          {subjectStatsList.map((s) => {
            const subj = subjectById[s.subjectId];
            const c = statusColor(s.status);
            return (
              <button
                key={s.subjectId}
                onClick={() => setDetailSubject(s.subjectId)}
                className="w-full card p-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition"
              >
                <span
                  className="w-2 h-10 rounded-full shrink-0"
                  style={{ background: subj?.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">
                    {subj?.name}
                  </p>
                  <p className="text-[11px] text-ink-mute">
                    {s.attended}/{s.held} classes
                    {s.held > 0 &&
                      (s.status === "danger"
                        ? ` · attend ${s.mustAttend} more`
                        : ` · skip ${s.bunkable} more`)}
                  </p>
                </div>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: c.fg }}
                >
                  {s.held === 0 ? "—" : Math.round(s.percentage) + "%"}
                </span>
                <ChevronRight className="w-4 h-4 text-ink-mute shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* DEADLINES */}
      <SectionHeader
        title="Deadlines"
        action="Add"
        onAction={() => setSheet("deadline")}
      />
      {upcoming.length === 0 ? (
        <EmptyCard
          text="No deadlines yet. Add assignments and exams to get reminders."
          cta="Add deadline"
          onCta={() => setSheet("deadline")}
        />
      ) : (
        <div className="space-y-2">
          {upcoming.slice(0, 6).map((d) => {
            const overdue = daysUntil(d.date) < 0;
            const soon = daysUntil(d.date) <= 2 && !overdue;
            return (
              <div key={d.id} className="card p-3.5 flex items-center gap-3">
                <button
                  onClick={() => {
                    update((s) => {
                      const t = s.deadlines.find((x) => x.id === d.id);
                      if (t) t.done = true;
                    });
                    if (!isDemo() && user) {
                      dbToggleDeadline(d.id, true);
                    }
                  }}
                  className="w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center shrink-0 active:scale-90 transition"
                >
                  <CheckIcon className="w-3.5 h-3.5 text-transparent" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">
                    {d.title}
                  </p>
                  <p className="text-[11px] text-ink-mute capitalize">
                    {d.type}
                    {d.subjectId && subjectById[d.subjectId]
                      ? ` · ${subjectById[d.subjectId].name}`
                      : ""}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-bold ${
                    overdue
                      ? "text-red-500"
                      : soon
                      ? "text-amber-500"
                      : "text-ink-mute"
                  }`}
                >
                  {dueLabel(d.date)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* GRADES */}
      <SectionHeader
        title="Grades"
        action="Add"
        onAction={() => setSheet("grade")}
      />
      {grades.length === 0 ? (
        <EmptyCard
          text="Log your marks to see your running CGPA and what you need on finals."
          cta="Add a grade"
          onCta={() => setSheet("grade")}
        />
      ) : (
        <div className="card p-4">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm font-semibold text-ink-soft">
              Current CGPA
            </span>
            <span className="text-2xl font-bold text-brand-300">
              {cgpa?.toFixed(2)}
            </span>
          </div>
          <div className="space-y-1.5">
            {grades.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between text-[13px] group py-1"
              >
                <span className="text-ink-soft truncate">
                  {subjectById[g.subjectId]?.name || "Subject"}
                  <span className="text-ink-mute">
                    {" "}
                    · {g.credits} cr
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink tabular-nums">
                    {g.score}
                    {profile.gradeSystem === "percentage" ? "%" : ""}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete grade for ${subjectById[g.subjectId]?.name || "Subject"}?`)) {
                        update((d) => {
                          d.grades = d.grades.filter((x) => x.id !== g.id);
                        });
                        if (!isDemo() && user) {
                          dbDeleteGrade(g.id);
                        }
                      }
                    }}
                    className="text-red-400 hover:text-red-500 opacity-60 hover:opacity-100 transition"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setSheet("calc")}
            className="w-full mt-3 pt-3 border-t border-white/10 text-brand-300 text-sm font-semibold flex items-center justify-center gap-1.5"
          >
            🎯 What do I need on finals?
          </button>
        </div>
      )}

      {/* SHEETS */}
      <SubjectSheet open={sheet === "subject"} onClose={() => setSheet(null)} />
      <TimetableSheet
        open={sheet === "timetable"}
        onClose={() => setSheet(null)}
      />
      <DeadlineSheet open={sheet === "deadline"} onClose={() => setSheet(null)} />
      <GradeSheet open={sheet === "grade"} onClose={() => setSheet(null)} />
      <GradeCalcSheet open={sheet === "calc"} onClose={() => setSheet(null)} />
      <NotificationsSheet
        open={sheet === "notifications"}
        onClose={() => setSheet(null)}
        onSwitchTab={onSwitchTab}
        setHomeSheet={setSheet}
        followRequests={followRequests}
        onAcceptFollow={handleAcceptFollow}
        onDeclineFollow={handleDeclineFollow}
      />

      {/* attendance detail overlay */}
      {detailSubject && (
        <AttendanceDetail
          subjectId={detailSubject}
          onClose={() => setDetailSubject(null)}
        />
      )}
      </div>
    </div>
  );
}

/* ── small pieces ─────────────────────────────────────────── */

function MarkButtons({
  value,
  onMark,
}: {
  value: AttStatus | null;
  onMark: (s: AttStatus) => void;
}) {
  const opts: { s: AttStatus; label: string; on: string }[] = [
    { s: "present", label: "P", on: "bg-brand-500 text-white" },
    { s: "bunked", label: "B", on: "bg-red-500 text-white" },
    { s: "cancelled", label: "✕", on: "bg-ink-mute text-white" },
  ];
  return (
    <div className="flex gap-1 shrink-0">
      {opts.map((o) => (
        <button
          key={o.s}
          onClick={() => onMark(o.s)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition active:scale-90 ${
            value === o.s ? o.on : "bg-white/[0.07] text-ink-mute"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function QuickMark({
  subjects,
  onMark,
  onSetup,
  onGenerateMock,
}: {
  subjects: { id: string; name: string; color: string }[];
  onMark: (subjectId: string, status: AttStatus) => void;
  onSetup: () => void;
  onGenerateMock: () => void;
}) {
  if (subjects.length === 0) {
    return (
      <div>
        <p className="text-ink-mute text-sm py-1">
          Add subjects above, then set up your timetable to mark classes fast.
        </p>
        <button
          onClick={onGenerateMock}
          className="mt-2 text-xs text-brand-300 font-bold hover:underline flex items-center gap-1 active:scale-95 transition"
        >
          ⚡ Quick Auto-Setup (Mock CS Timetable)
        </button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-ink-mute">
          Quick-mark a class (or{" "}
          <button onClick={onSetup} className="text-brand-300 font-semibold">
            set up timetable
          </button>
          )
        </p>
        <button
          onClick={onGenerateMock}
          className="text-[11px] text-brand-400 font-bold hover:underline flex items-center gap-0.5 active:scale-95 transition"
        >
          ⚡ Auto-Setup CS
        </button>
      </div>
      <div className="space-y-1.5">
        {subjects.slice(0, 5).map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-2 bg-white/[0.04] rounded-xl p-2"
          >
            <span
              className="w-1.5 h-6 rounded-full"
              style={{ background: s.color }}
            />
            <span className="flex-1 text-sm text-ink truncate">{s.name}</span>
            <button
              onClick={() => onMark(s.id, "present")}
              className="px-2.5 h-7 rounded-lg bg-brand-500 text-white text-xs font-bold active:scale-90 transition"
            >
              Present
            </button>
            <button
              onClick={() => onMark(s.id, "bunked")}
              className="px-2.5 h-7 rounded-lg bg-red-500 text-white text-xs font-bold active:scale-90 transition"
            >
              Bunk
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <SpotlightCard className="card p-3 text-center">
      <p className="text-lg font-bold text-ink tabular-nums">{value}</p>
      <p className="text-[10px] text-ink-mute font-medium mt-0.5">{label}</p>
    </SpotlightCard>
  );
}

function EmptyCard({
  text,
  cta,
  onCta,
}: {
  text: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div className="card p-5 text-center">
      <p className="text-ink-mute text-sm mb-3">{text}</p>
      <button
        onClick={onCta}
        className="inline-flex items-center gap-1.5 text-brand-300 font-semibold text-sm"
      >
        <PlusIcon className="w-4 h-4" />
        {cta}
      </button>
    </div>
  );
}

/* ── sheets ───────────────────────────────────────────────── */

function NotificationsSheet({
  open,
  onClose,
  onSwitchTab,
  setHomeSheet,
  followRequests = [],
  onAcceptFollow,
  onDeclineFollow,
}: {
  open: boolean;
  onClose: () => void;
  onSwitchTab?: (tab: any) => void;
  setHomeSheet: (s: SheetKind) => void;
  followRequests?: any[];
  onAcceptFollow?: (followerId: string) => void;
  onDeclineFollow?: (followerId: string) => void;
}) {
  const { data, update } = useStore();
  const list = useMemo(() => {
    return [...(data.notifications || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data.notifications]);

  function markAllRead() {
    update((d) => {
      d.notifications = (d.notifications || []).map((n) => ({ ...n, read: true }));
    });
  }

  function handleNotifClick(notif: any) {
    // 1. Mark as read
    update((d) => {
      const found = d.notifications?.find((n) => n.id === notif.id);
      if (found) found.read = true;
    });

    // 2. Redirect
    if (notif.link && onSwitchTab) {
      if (notif.link === "connect:requests") {
        localStorage.setItem("footfall-connect-tab", "requests");
        onSwitchTab("connect");
      } else if (notif.link === "connect:groups") {
        localStorage.setItem("footfall-connect-tab", "groups");
        onSwitchTab("connect");
      } else if (notif.link.startsWith("connect:chats:")) {
        const chatId = notif.link.replace("connect:chats:", "");
        localStorage.setItem("footfall-connect-tab", "dms");
        localStorage.setItem("footfall-active-chat-id", chatId);
        onSwitchTab("connect");
      } else if (notif.link === "home:deadlines") {
        setHomeSheet("deadline");
      }
    }
    onClose();
  }

  function deleteNotif(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    update((d) => {
      d.notifications = (d.notifications || []).filter((n) => n.id !== id);
    });
  }

  return (
    <Sheet open={open} onClose={onClose} title="Notifications">
      {/* Follow Requests */}
      {followRequests.length > 0 && (
        <div className="mb-5 space-y-2 border-b border-white/[0.08] pb-4">
          <h3 className="text-[10px] font-bold text-brand-400 uppercase tracking-wider block mb-2 px-1">Follow Requests</h3>
          {followRequests.map((req) => {
            const initials = (req.profiles.name || "?").trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div key={req.follower_id} className="p-3 bg-brand-500/[0.04] border border-brand-500/20 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center shrink-0 overflow-hidden border border-white/[0.08]">
                    <img 
                      src={req.profiles.avatar_url && (req.profiles.avatar_url.startsWith("http") || req.profiles.avatar_url.startsWith("data:")) ? req.profiles.avatar_url : "/default_avatar.png"} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink truncate">{req.profiles.name}</p>
                    <p className="text-[10px] text-ink-soft truncate font-semibold">requested to follow you</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 select-none">
                  <button
                    onClick={() => onAcceptFollow?.(req.follower_id)}
                    className="h-8 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 active:scale-95 transition text-white text-[11px] font-bold flex items-center justify-center"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onDeclineFollow?.(req.follower_id)}
                    className="h-8 px-3 rounded-lg bg-white/[0.06] hover:bg-white/10 active:scale-95 transition text-ink-soft hover:text-red-400 border border-white/[0.08] flex items-center justify-center text-[11px] font-bold"
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-ink-mute">
          {list.filter((n) => !n.read).length} unread
        </span>
        {list.length > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-brand-300 font-semibold hover:text-brand-400"
          >
            Mark all as read
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="py-12 flex flex-col items-center text-center">
          <BellIcon className="w-9 h-9 text-white/15 mb-2" />
          <p className="text-sm text-ink-mute">All caught up! No notifications.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar pb-6">
          {list.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotifClick(n)}
              className={`p-3.5 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                n.read
                  ? "bg-white/[0.02] border-white/5 opacity-70"
                  : "bg-brand-500/[0.04] border-brand-500/20 shadow-sm"
              } hover:bg-white/[0.06]`}
            >
              {/* unread dot */}
              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-ink truncate">{n.title}</p>
                <p className="text-[11px] text-ink-soft mt-0.5 leading-snug break-words font-medium">
                  {n.body}
                </p>
                <p className="text-[9px] text-ink-mute mt-1.5">
                  {new Date(n.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={(e) => deleteNotif(n.id, e)}
                className="text-ink-mute hover:text-red-400 p-1 shrink-0 active:scale-95 transition"
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

function SubjectSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, update, uid } = useStore();
  const { user } = useAuth();
  const [name, setName] = useState("");
  function add() {
    const v = name.trim();
    if (!v) return;
    const newSubject = {
      id: uid(),
      name: v,
      color: SUBJECT_COLORS[data.subjects.length % SUBJECT_COLORS.length],
    };
    update((d) => {
      d.subjects.push(newSubject);
    });
    setName("");

    if (!isDemo() && user) {
      dbSaveSubject(user.id, newSubject);
    }
  }
  return (
    <Sheet open={open} onClose={onClose} title="Your subjects">
      <div className="flex gap-2 mb-4">
        <input
          className="input flex-1"
          placeholder="Add a subject"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button onClick={add} className="btn-primary px-5">
          Add
        </button>
      </div>
      <div className="space-y-2">
        {data.subjects.map((s) => (
          <div key={s.id} className="card p-3 flex items-center gap-3">
            <span
              className="w-2 h-7 rounded-full"
              style={{ background: s.color }}
            />
            <span className="flex-1 text-sm font-medium text-ink">{s.name}</span>
            <button
              onClick={() => {
                update((d) => {
                  d.subjects = d.subjects.filter((x) => x.id !== s.id);
                });
                if (!isDemo() && user) {
                  dbDeleteSubject(s.id);
                }
              }}
              className="text-ink-mute"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
        {data.subjects.length === 0 && (
          <p className="text-ink-mute text-sm text-center py-4">
            No subjects yet.
          </p>
        )}
      </div>
    </Sheet>
  );
}

function TimetableSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, update, uid } = useStore();
  const { user } = useAuth();
  const [day, setDay] = useState<DayKey>("mon");
  const [subjectId, setSubjectId] = useState("");
  const [start, setStart] = useState("09:00");
  const [room, setRoom] = useState("");

  const subjectById = Object.fromEntries(data.subjects.map((s) => [s.id, s]));
  const slotsForDay = data.timetable
    .filter((s) => s.day === day)
    .sort((a, b) => a.start.localeCompare(b.start));

  function addClass() {
    const sid = subjectId || data.subjects[0]?.id;
    if (!sid) return;
    const newSlot = { id: uid(), day, subjectId: sid, start, end: start, room: room.trim() || undefined };
    update((d) => { d.timetable.push(newSlot); });
    if (!isDemo() && user) {
      const subjectName = data.subjects.find(s => s.id === sid)?.name ?? sid;
      dbSaveTimetableSlot(user.id, newSlot, subjectName);
    }
    setRoom("");
  }

  return (
    <Sheet open={open} onClose={onClose} title="Timetable">
      {data.subjects.length === 0 ? (
        <p className="text-ink-mute text-sm py-4 text-center">
          Add subjects first, then build your timetable here.
        </p>
      ) : (
        <>
          {/* day selector */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
            {DAY_KEYS.map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${
                  day === d
                    ? "bg-brand-500 text-white"
                    : "bg-white/[0.07] text-ink-soft"
                }`}
              >
                {DAY_SHORT[d]}
              </button>
            ))}
          </div>

          {/* add class form */}
          <div className="card p-3.5 mb-4 space-y-2.5">
            <p className="text-xs font-bold text-ink-soft">
              Add class to {DAY_LABELS[day]}
            </p>
            <select
              className="input"
              value={subjectId || data.subjects[0]?.id}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {data.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="time"
                className="input flex-1"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
              <input
                className="input flex-1"
                placeholder="Room (opt)"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
            </div>
            <button onClick={addClass} className="btn-primary w-full">
              Add class
            </button>
          </div>

          {/* existing slots */}
          <div className="space-y-2">
            {slotsForDay.map((slot) => (
              <div key={slot.id} className="flex items-center gap-3 card p-3">
                <ClockIcon className="w-4 h-4 text-ink-mute shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">
                    {subjectById[slot.subjectId]?.name}
                  </p>
                  <p className="text-[11px] text-ink-mute">
                    {slot.start}
                    {slot.room ? ` · ${slot.room}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => {
                    update((d) => { d.timetable = d.timetable.filter((x) => x.id !== slot.id); });
                    if (!isDemo() && user) dbDeleteTimetableSlot(slot.id);
                  }}
                  className="text-ink-mute"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            {slotsForDay.length === 0 && (
              <p className="text-ink-mute text-sm text-center py-2">
                No classes on {DAY_LABELS[day]}.
              </p>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}

function DeadlineSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, update, uid } = useStore();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DeadlineType>("assignment");
  const [date, setDate] = useState(todayISO());
  const [subjectId, setSubjectId] = useState("");

  function add() {
    if (!title.trim()) return;
    const newDeadline = {
      id: uid(),
      title: title.trim(),
      type,
      date,
      subjectId: subjectId || undefined,
      done: false,
    };
    update((d) => {
      d.deadlines.push(newDeadline);
    });
    setTitle("");
    onClose();

    if (!isDemo() && user) {
      dbSaveDeadline(user.id, newDeadline);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add deadline">
      <div className="space-y-3">
        <input
          autoFocus
          className="input"
          placeholder="e.g. DBMS assignment 2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          {(["assignment", "exam", "project"] as DeadlineType[]).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize ${
                type === t ? "bg-brand-500 text-white" : "bg-white/[0.07] text-ink-soft"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {data.subjects.length > 0 && (
          <select
            className="input"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">No subject</option>
            {data.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <button onClick={add} className="btn-primary w-full">
          Add deadline
        </button>
      </div>
    </Sheet>
  );
}

function GradeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, update, uid } = useStore();
  const { user } = useAuth();
  const [subjectId, setSubjectId] = useState("");
  const [credits, setCredits] = useState("4");
  const [score, setScore] = useState("");

  const isPct = data.profile.gradeSystem === "percentage";

  function add() {
    const sid = subjectId || data.subjects[0]?.id;
    const sc = Number(score);
    if (!sid || !score || isNaN(sc)) return;
    const newGrade = {
      id: uid(),
      subjectId: sid,
      semester: 1,
      credits: Number(credits) || 0,
      score: sc,
    };
    update((d) => {
      d.grades.push(newGrade);
    });
    setScore("");
    onClose();

    if (!isDemo() && user) {
      const subjectName = data.subjects.find((s) => s.id === sid)?.name ?? sid;
      dbSaveGrade(user.id, newGrade, subjectName);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add grade">
      {data.subjects.length === 0 ? (
        <p className="text-ink-mute text-sm py-4 text-center">
          Add subjects first to log grades.
        </p>
      ) : (
        <div className="space-y-3">
          <select
            className="input"
            value={subjectId || data.subjects[0]?.id}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            {data.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-ink-mute mb-1 block">Credits</label>
              <input
                type="number"
                className="input"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-ink-mute mb-1 block">
                {isPct ? "Marks %" : "Grade point (0-10)"}
              </label>
              <input
                type="number"
                className="input"
                placeholder={isPct ? "82" : "9"}
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
            </div>
          </div>
          <button onClick={add} className="btn-primary w-full">
            Add grade
          </button>
        </div>
      )}
    </Sheet>
  );
}

function GradeCalcSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data } = useStore();
  const isPct = data.profile.gradeSystem === "percentage";
  const max = isPct ? 100 : 10;
  const [target, setTarget] = useState("");
  const [remCredits, setRemCredits] = useState("");

  const current = useMemo(() => {
    const tc = data.grades.reduce((a, g) => a + g.credits, 0);
    const w = data.grades.reduce((a, g) => a + g.credits * g.score, 0);
    return { tc, w, cgpa: tc ? w / tc : 0 };
  }, [data.grades]);

  const result = useMemo(() => {
    const t = Number(target);
    const rc = Number(remCredits);
    if (!t || !rc) return null;
    // (w + needed*rc) / (tc + rc) = t  ->  needed = (t*(tc+rc) - w)/rc
    const needed = (t * (current.tc + rc) - current.w) / rc;
    return { needed, rc, t };
  }, [target, remCredits, current]);

  return (
    <Sheet open={open} onClose={onClose} title="What do I need?">
      {data.grades.length === 0 ? (
        <p className="text-ink-mute text-sm py-4 text-center">
          Log some grades first so we know where you stand.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="bg-brand-500/15 rounded-xl p-3 text-center">
            <p className="text-xs text-brand-300">
              You&apos;re at{" "}
              <span className="font-bold">{current.cgpa.toFixed(2)}</span> across{" "}
              {current.tc} credits
            </p>
          </div>
          <div>
            <label className="text-xs text-ink-mute mb-1 block">
              Target CGPA you want
            </label>
            <input
              type="number"
              className="input"
              placeholder={isPct ? "e.g. 85" : "e.g. 8.5"}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-ink-mute mb-1 block">
              Credits still remaining (not yet graded)
            </label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 20"
              value={remCredits}
              onChange={(e) => setRemCredits(e.target.value)}
            />
          </div>

          {result && (
            <div
              className={`rounded-xl p-4 text-center ${
                result.needed > max
                  ? "bg-red-500/15"
                  : result.needed <= 0
                  ? "bg-brand-500/20"
                  : "bg-brand-500/15"
              }`}
            >
              {result.needed > max ? (
                <p className="text-sm font-semibold text-red-600">
                  Not reachable this term — even {max}
                  {isPct ? "%" : ""} on the rest gives less than {result.t}.
                </p>
              ) : result.needed <= 0 ? (
                <p className="text-sm font-semibold text-brand-200">
                  You&apos;re already there 🎉 Even a low score keeps you above{" "}
                  {result.t}.
                </p>
              ) : (
                <>
                  <p className="text-xs text-ink-mute mb-1">
                    You need to average
                  </p>
                  <p className="text-3xl font-bold text-brand-300">
                    {result.needed.toFixed(isPct ? 1 : 2)}
                    {isPct ? "%" : ""}
                  </p>
                  <p className="text-xs text-ink-mute mt-1">
                    on your remaining {result.rc} credits
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

/* ── grade math ───────────────────────────────────────────── */
function computeCgpa(
  grades: { credits: number; score: number }[],
  system: "percentage" | "gpa10"
): number | null {
  if (grades.length === 0) return null;
  const totalCredits = grades.reduce((a, g) => a + g.credits, 0);
  if (totalCredits === 0) return null;
  const weighted = grades.reduce((a, g) => a + g.credits * g.score, 0);
  const avg = weighted / totalCredits;
  // percentage system: show as-is (e.g. 82.4); gpa10: show 0-10
  return avg;
}

function RemindersPanel() {
  const { data, update } = useStore();
  const [showBanner, setShowBanner] = useState(false);
  const [, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("footfall-reminders-banner-dismissed");
    setDismissed(!!isDismissed);

    if (
      "Notification" in window &&
      Notification.permission !== "granted" &&
      !data.reminders?.enabled &&
      !isDismissed
    ) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [data.reminders?.enabled]);

  async function handleEnable() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      update((d) => {
        d.reminders.enabled = true;
      });
      setShowBanner(false);
    } else {
      localStorage.setItem("footfall-reminders-banner-dismissed", "1");
      setDismissed(true);
      setShowBanner(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem("footfall-reminders-banner-dismissed", "1");
    setDismissed(true);
    setShowBanner(false);
  }

  const today = todayISO();
  const todayKey = todayDayKey();

  const classesToday = useMemo(() => {
    return data.timetable.filter((s) => s.day === todayKey);
  }, [data.timetable, todayKey]);

  const deadlinesToday = useMemo(() => {
    return data.deadlines.filter((d) => d.date === today && !d.done);
  }, [data.deadlines, today]);

  const showAgenda = data.reminders?.dailyAgenda && new Date().getHours() < 12;

  const isEvening = new Date().getHours() >= 18;
  const unmarkedClasses = useMemo(() => {
    if (!isEvening) return [];
    return classesToday.filter(
      (slot) => !data.attendance.some((r) => r.slotId === slot.id && r.date === today)
    );
  }, [classesToday, data.attendance, today, isEvening]);

  const showNudge = data.reminders?.attendanceNudge && unmarkedClasses.length > 0;

  if (!showBanner && !showAgenda && !showNudge) return null;

  return (
    <div className="space-y-3 mb-5 animate-fade-up">
      {/* Permission banner */}
      {showBanner && (
        <div className="card p-4 bg-brand-500/15 border border-brand-500/30 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/20 flex items-center justify-center shrink-0 text-brand-200">
            <BellIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-brand-200">Enable Reminders</p>
            <p className="text-[10px] text-brand-300 leading-snug">
              Get notified of upcoming classes, exams, and unmarked attendance.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={handleEnable}
              className="btn-primary py-1 px-3 text-[10px] font-bold rounded-xl"
            >
              Enable
            </button>
            <button
              onClick={handleDismiss}
              className="text-center text-[10px] font-bold text-ink-mute hover:text-ink-soft"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Daily Agenda card */}
      {showAgenda && (classesToday.length > 0 || deadlinesToday.length > 0) && (
        <div className="card p-4 bg-[#0e0e0e] border border-white/10 shadow-sm">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
            <span className="text-base">📅</span>
            <span className="text-xs font-bold text-ink-soft uppercase tracking-wide">
              Today's Agenda
            </span>
          </div>
          <p className="text-sm font-semibold text-ink leading-tight">
            You have {classesToday.length} classes scheduled and {deadlinesToday.length} deadlines due today.
          </p>
          <div className="mt-2 space-y-1">
            {classesToday.slice(0, 3).map((slot) => {
              const subj = data.subjects.find((s) => s.id === slot.subjectId);
              return (
                <div key={slot.id} className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: subj?.color || "#999" }}
                  />
                  <span className="font-semibold">{subj?.name}</span>
                  <span className="text-ink-mute">at {slot.start}</span>
                </div>
              );
            })}
            {deadlinesToday.slice(0, 2).map((dl) => (
              <div key={dl.id} className="flex items-center gap-1.5 text-[11px] text-red-500 font-semibold">
                <span className="shrink-0">⚠️</span>
                <span className="truncate">Due: {dl.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Nudge */}
      {showNudge && (
        <div className="card p-3.5 bg-red-500/15/50 border border-red-100 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-sm">
            📝
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-red-800">Unmarked Attendance</p>
            <p className="text-[10px] text-red-700 leading-snug">
              You haven't logged attendance for {unmarkedClasses.length} classes today.
            </p>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById("attendance-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold shadow-sm shrink-0"
          >
            Mark Now
          </button>
        </div>
      )}
    </div>
  );
}
