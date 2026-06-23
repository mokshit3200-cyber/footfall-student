"use client";

import { useMemo, useState } from "react";
import { useStore } from "./store";
import { useAuth } from "@/lib/auth";
import { dbSaveAttendance } from "@/lib/dbActions";
import { isDemo } from "@/lib/config";
import { subjectStats } from "@/lib/attendance";
import {
  thisMonth,
  prettyMonth,
  shiftMonth,
  todayISO,
} from "@/lib/dates";
import { Ring } from "./ui";
import { ChevronRight, XIcon } from "./icons";
import { AttStatus } from "@/lib/types";

const WD = ["M", "T", "W", "T", "F", "S", "S"];

export default function AttendanceDetail({
  subjectId,
  onClose,
}: {
  subjectId: string;
  onClose: () => void;
}) {
  const { data, update, uid } = useStore();
  const { user } = useAuth();
  const subject = data.subjects.find((s) => s.id === subjectId);
  const target = data.profile.attendanceTarget;
  const [month, setMonth] = useState(thisMonth());
  const [picker, setPicker] = useState<string | null>(null); // date being edited
  const [simAttend, setSimAttend] = useState(0);
  const [simBunk, setSimBunk] = useState(0);

  const stats = useMemo(
    () => subjectStats(subjectId, data.attendance, target),
    [subjectId, data.attendance, target]
  );

  const simulated = useMemo(() => {
    const totalHeld = stats.held + simAttend + simBunk;
    const totalAttended = stats.attended + simAttend;
    const percentage = totalHeld > 0 ? (totalAttended / totalHeld) * 100 : 100;
    const isSafe = percentage >= (target * 100);
    
    // Calculate simulated status
    let mustAttend = 0;
    if (percentage < (target * 100)) {
      let tempAttended = totalAttended;
      let tempHeld = totalHeld;
      while ((tempAttended / tempHeld) < target) {
        tempAttended++;
        tempHeld++;
        mustAttend++;
      }
    }

    let bunkable = 0;
    if (percentage >= (target * 100)) {
      let tempAttended = totalAttended;
      let tempHeld = totalHeld;
      while (((tempAttended) / (tempHeld + 1)) >= target) {
        tempHeld++;
        bunkable++;
      }
    }
    
    return {
      held: totalHeld,
      attended: totalAttended,
      percentage,
      isSafe,
      mustAttend,
      bunkable
    };
  }, [stats.held, stats.attended, simAttend, simBunk, target]);

  // records for this subject keyed by date -> collapsed status
  const dayStatus = useMemo(() => {
    const m: Record<string, AttStatus> = {};
    data.attendance
      .filter((r) => r.subjectId === subjectId)
      .forEach((r) => {
        const cur = m[r.date];
        // priority: present > bunked > cancelled
        if (
          !cur ||
          (cur === "cancelled" && r.status !== "cancelled") ||
          (cur === "bunked" && r.status === "present")
        ) {
          m[r.date] = r.status;
        }
      });
    return m;
  }, [data.attendance, subjectId]);

  function setDay(date: string, status: AttStatus | null) {
    update((d) => {
      // remove existing records for this subject+date, then add one (or none)
      d.attendance = d.attendance.filter(
        (r) => !(r.subjectId === subjectId && r.date === date)
      );
      if (status) {
        d.attendance.push({ id: uid(), subjectId, date, status });
      }
    });
    if (!isDemo() && user && status) {
      dbSaveAttendance(user.id, subjectId, date, status);
    }
    setPicker(null);
  }

  // build calendar grid (Mon-first)
  const [y, m] = month.split("-").map(Number);
  const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7; // 0=Mon
  const daysInM = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInM; d++) {
    cells.push(`${month}-${String(d).padStart(2, "0")}`);
  }

  const today = todayISO();
  const isCurMonth = month === thisMonth();

  const colorFor = (st: AttStatus | undefined) => {
    if (st === "present") return { bg: "#7c3aed", fg: "#fff" };
    if (st === "bunked") return { bg: "#ef4444", fg: "#fff" };
    if (st === "cancelled") return { bg: "#2a2a2e", fg: "#8b8b92" };
    return { bg: "transparent", fg: "#d4d4d8" };
  };

  const sc =
    stats.status === "danger"
      ? "#ef4444"
      : stats.status === "warning"
      ? "#f59e0b"
      : "#7c3aed";

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-[440px] bg-black overflow-y-auto no-scrollbar animate-fade-in">
      {/* header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <span
          className="w-2.5 h-8 rounded-full"
          style={{ background: subject?.color }}
        />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-ink leading-tight">
            {subject?.name}
          </h1>
          <p className="text-xs text-ink-mute">Attendance history</p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#0e0e0e] border border-white/10 flex items-center justify-center text-ink-soft"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 pb-28">
        {/* summary */}
        <div className="card p-5 flex items-center gap-4">
          <Ring pct={stats.percentage} color={sc} size={92}>
            <span className="text-lg font-bold text-ink">
              {stats.held === 0 ? "—" : Math.round(stats.percentage) + "%"}
            </span>
          </Ring>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink mb-1">
              {stats.attended}/{stats.held} classes attended
            </p>
            <p className="text-[13px] text-ink-mute leading-snug">
              {stats.held === 0
                ? "No classes marked yet."
                : stats.status === "danger"
                ? `Below target — attend ${stats.mustAttend} more in a row to reach ${Math.round(
                    target * 100
                  )}%.`
                : stats.bunkable === 0
                ? "Right on the line — don't skip any."
                : `You can skip ${stats.bunkable} more and stay above ${Math.round(
                    target * 100
                  )}%.`}
            </p>
          </div>
        </div>

        {/* simulator */}
        <div className="card p-5 mt-4 bg-gradient-to-br from-brand-900/10 to-black border-brand-500/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
              <span>🔮</span> Bunk Simulator & Forecaster
            </h3>
            {(simAttend > 0 || simBunk > 0) && (
              <button
                onClick={() => {
                  setSimAttend(0);
                  setSimBunk(0);
                }}
                className="text-[11px] text-brand-300 font-semibold"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-3">
            {/* simulator controllers */}
            <div className="flex items-center justify-between bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <div>
                <p className="text-xs font-semibold text-ink">Simulate Attending</p>
                <p className="text-[10px] text-ink-mute">Future classes you&apos;ll attend</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSimAttend(Math.max(0, simAttend - 1))}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center font-bold text-ink active:scale-90 transition"
                >
                  -
                </button>
                <span className="text-sm font-bold text-ink w-6 text-center">{simAttend}</span>
                <button
                  onClick={() => setSimAttend(simAttend + 1)}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center font-bold text-ink active:scale-90 transition"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white/[0.03] rounded-xl p-3 border border-white/5">
              <div>
                <p className="text-xs font-semibold text-ink">Simulate Bunking</p>
                <p className="text-[10px] text-ink-mute">Future classes you&apos;ll skip</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSimBunk(Math.max(0, simBunk - 1))}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center font-bold text-ink active:scale-90 transition"
                >
                  -
                </button>
                <span className="text-sm font-bold text-ink w-6 text-center">{simBunk}</span>
                <button
                  onClick={() => setSimBunk(simBunk + 1)}
                  className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center font-bold text-ink active:scale-90 transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* forecast result */}
            {(simAttend > 0 || simBunk > 0) && (
              <div className="mt-3 p-3.5 rounded-xl bg-white/[0.04] border border-brand-500/10 flex items-center gap-3 animate-fade-in">
                <Ring pct={simulated.percentage} color={simulated.isSafe ? "#7c3aed" : "#ef4444"} size={60}>
                  <span className="text-xs font-bold text-ink">{Math.round(simulated.percentage)}%</span>
                </Ring>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wider">Projected Attendance</p>
                  <p className="text-xs font-semibold text-ink mt-0.5 leading-snug">
                    {simulated.attended}/{simulated.held} classes.{" "}
                    {simulated.isSafe ? (
                      <span className="text-brand-300 font-bold">Safe!</span>
                    ) : (
                      <span className="text-red-400 font-bold">Below Target!</span>
                    )}
                  </p>
                  <p className="text-[11px] text-ink-mute mt-1 leading-snug">
                    {simulated.percentage >= (target * 100)
                      ? simulated.bunkable === 0
                        ? "Right on the line — cannot skip any more."
                        : `You can skip ${simulated.bunkable} more simulated classes.`
                      : `Must attend ${simulated.mustAttend} more classes in a row to recover.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* month nav */}
        <div className="flex items-center justify-between mt-6 mb-3">
          <p className="text-[15px] font-bold text-ink">Calendar</p>
          <div className="flex items-center gap-1 bg-[#0e0e0e] rounded-full border border-white/10 px-1 py-1">
            <button
              onClick={() => setMonth((mm) => shiftMonth(mm, -1))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-mute active:bg-white/10"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <span className="text-xs font-semibold text-ink-soft px-1 min-w-[84px] text-center">
              {prettyMonth(month)}
            </span>
            <button
              disabled={isCurMonth}
              onClick={() => setMonth((mm) => shiftMonth(mm, 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-mute active:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* calendar */}
        <div className="card p-3">
          <div className="grid grid-cols-7 mb-1">
            {WD.map((d, i) => (
              <div
                key={i}
                className="text-center text-[10px] font-bold text-ink-mute py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={i} />;
              const dayNum = Number(date.slice(-2));
              const st = dayStatus[date];
              const col = colorFor(st);
              const future = date > today;
              const isToday = date === today;
              return (
                <button
                  key={i}
                  disabled={future}
                  onClick={() => setPicker(date)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-[13px] font-semibold transition active:scale-90 disabled:opacity-25 ${
                    !st ? "hover:bg-white/[0.07]" : ""
                  } ${isToday && !st ? "ring-1 ring-brand-400" : ""}`}
                  style={{ background: col.bg, color: col.fg }}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
          {/* legend */}
          <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-white/10">
            <Legend color="#7c3aed" label="Present" />
            <Legend color="#ef4444" label="Bunked" />
            <Legend color="#d1d5db" label="Off" />
          </div>
        </div>

        <p className="text-xs text-ink-mute text-center mt-3">
          Tap any day to mark or fix your attendance.
        </p>
      </div>

      {/* day picker */}
      {picker && (
        <div className="fixed inset-0 z-50 mx-auto max-w-[440px] animate-fade-in">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setPicker(null)}
          />
          <div className="absolute bottom-0 inset-x-0 bg-black rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-fade-up">
            <p className="text-center text-sm font-semibold text-ink-soft mb-4">
              {new Date(picker + "T00:00:00").toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <PickBtn
                label="Present"
                color="#7c3aed"
                onClick={() => setDay(picker, "present")}
              />
              <PickBtn
                label="Bunked"
                color="#ef4444"
                onClick={() => setDay(picker, "bunked")}
              />
              <PickBtn
                label="No class"
                color="#9ca3af"
                onClick={() => setDay(picker, "cancelled")}
              />
            </div>
            {dayStatus[picker] && (
              <button
                onClick={() => setDay(picker, null)}
                className="w-full text-center text-red-400 text-sm font-medium py-2"
              >
                Clear this day
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-full"
        style={{ background: color }}
      />
      <span className="text-[11px] text-ink-mute">{label}</span>
    </div>
  );
}

function PickBtn({
  label,
  color,
  onClick,
}: {
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="py-3.5 rounded-xl font-semibold text-sm text-white active:scale-95 transition"
      style={{ background: color }}
    >
      {label}
    </button>
  );
}
