import { AttendanceRecord, Subject } from "./types";

export interface SubjectAttendance {
  subjectId: string;
  attended: number; // present (held & attended)
  held: number; // present + bunked (cancelled excluded)
  percentage: number; // 0-100
  bunkable: number; // how many more you can skip and stay >= target
  mustAttend: number; // if below target, how many you must attend to recover
  status: "safe" | "warning" | "danger";
}

export interface OverallAttendance {
  attended: number;
  held: number;
  percentage: number;
  bunkable: number;
  mustAttend: number;
  status: "safe" | "warning" | "danger";
}

/**
 * Bunkable: max consecutive future classes you can skip while staying >= target.
 * attended / (held + x) >= target  ->  x <= attended/target - held
 */
function calcBunkable(attended: number, held: number, target: number): number {
  if (held === 0) return 0;
  const raw = Math.floor(attended / target - held);
  return Math.max(0, raw);
}

/**
 * MustAttend: when below target, how many classes you must attend in a row to recover.
 * (attended + x) / (held + x) >= target  ->  x >= (target*held - attended)/(1 - target)
 */
function calcMustAttend(attended: number, held: number, target: number): number {
  if (target >= 1) return 0;
  const raw = Math.ceil((target * held - attended) / (1 - target));
  return Math.max(0, raw);
}

function statusFor(pct: number, target: number): "safe" | "warning" | "danger" {
  const t = target * 100;
  if (pct < t) return "danger";
  if (pct < t + 5) return "warning";
  return "safe";
}

export function subjectStats(
  subjectId: string,
  records: AttendanceRecord[],
  target: number
): SubjectAttendance {
  const subRecords = records.filter(
    (r) => r.subjectId === subjectId && r.status !== "cancelled"
  );
  const held = subRecords.length;
  const attended = subRecords.filter((r) => r.status === "present").length;
  const percentage = held === 0 ? 0 : (attended / held) * 100;
  const meets = percentage >= target * 100;
  return {
    subjectId,
    attended,
    held,
    percentage,
    bunkable: meets ? calcBunkable(attended, held, target) : 0,
    mustAttend: meets ? 0 : calcMustAttend(attended, held, target),
    status: statusFor(percentage, target),
  };
}

export function allSubjectStats(
  subjects: Subject[],
  records: AttendanceRecord[],
  target: number
): SubjectAttendance[] {
  return subjects.map((s) => subjectStats(s.id, records, target));
}

export function overallStats(
  records: AttendanceRecord[],
  target: number
): OverallAttendance {
  const valid = records.filter((r) => r.status !== "cancelled");
  const held = valid.length;
  const attended = valid.filter((r) => r.status === "present").length;
  const percentage = held === 0 ? 0 : (attended / held) * 100;
  const meets = percentage >= target * 100;
  return {
    attended,
    held,
    percentage,
    bunkable: meets ? calcBunkable(attended, held, target) : 0,
    mustAttend: meets ? 0 : calcMustAttend(attended, held, target),
    status: statusFor(percentage, target),
  };
}

/** Human sentence for the Home hero. */
export function bunkVerdict(o: OverallAttendance, target: number): string {
  if (o.held === 0) return "Mark your first class to start tracking";
  if (o.status === "danger") {
    return o.mustAttend === 1
      ? "Attend your next class to get back on track"
      : `Attend the next ${o.mustAttend} classes to reach ${Math.round(
          target * 100
        )}%`;
  }
  if (o.bunkable === 0) return "You're right on the line — don't skip any class";
  return o.bunkable === 1
    ? "You can skip 1 more class and stay safe"
    : `You can skip ${o.bunkable} more classes and stay safe`;
}
