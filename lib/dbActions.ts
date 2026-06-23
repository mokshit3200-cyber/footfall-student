import { supabase } from "./supabase";
import type { AppData, ClassSlot, DayKey } from "./types";

const DAY_TO_NUM: Record<string, number> = { sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6 };
const NUM_TO_DAY: Record<number, DayKey> = { 0:"sun",1:"mon",2:"tue",3:"wed",4:"thu",5:"fri",6:"sat" };

export async function dbSaveTimetableSlot(userId: string, slot: ClassSlot, label: string) {
  await supabase.from("timetable").upsert(
    { id: slot.id, user_id: userId, day: DAY_TO_NUM[slot.day] ?? 1, start_time: slot.start, end_time: slot.end, label },
    { onConflict: "id" }
  );
}

export async function dbSaveTimetableBulk(userId: string, slots: ClassSlot[], labelMap: Record<string, string>) {
  if (slots.length === 0) return;
  await supabase.from("timetable").upsert(
    slots.map(s => ({ id: s.id, user_id: userId, day: DAY_TO_NUM[s.day] ?? 1, start_time: s.start, end_time: s.end, label: labelMap[s.subjectId] || s.subjectId })),
    { onConflict: "id" }
  );
}

export async function dbDeleteTimetableSlot(slotId: string) {
  await supabase.from("timetable").delete().eq("id", slotId);
}

export async function dbGetUserTimetable(userId: string) {
  const { data } = await supabase.from("timetable").select("day, start_time, end_time, label").eq("user_id", userId);
  return data ?? [];
}

export async function dbGetFreeBusy(userIds: string[]): Promise<Record<string, "free" | "busy">> {
  if (userIds.length === 0) return {};
  const now = new Date();
  const day = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const { data } = await supabase
    .from("timetable")
    .select("user_id, start_time, end_time")
    .in("user_id", userIds)
    .eq("day", day);
  const result: Record<string, "free" | "busy"> = {};
  for (const id of userIds) {
    const slots = (data ?? []).filter(s => s.user_id === id);
    result[id] = slots.some(s => s.start_time <= currentTime && s.end_time > currentTime) ? "busy" : "free";
  }
  return result;
}

// Save a single attendance record to Supabase
export async function dbSaveAttendance(
  userId: string,
  subjectId: string,
  date: string,
  status: "present" | "bunked" | "cancelled"
) {
  if (status === "cancelled") return; // cancelled = class didn't happen, don't log
  await supabase.from("attendance").upsert(
    { user_id: userId, subject_id: subjectId, date, present: status === "present" },
    { onConflict: "user_id,subject_id,date" }
  );
}

// Update profile fields in Supabase
export async function dbUpdateProfile(
  userId: string,
  fields: Partial<{
    name: string;
    bio: string;
    skills: string[];
    links: Record<string, string>;
    course: string;
    year: number;
    avatar_url: string;
    business_name: string;
    business_type: "sell" | "service" | "club";
    business_contact: string;
  }>
) {
  await supabase.from("profiles").update(fields).eq("id", userId);
}

// Load all user data from Supabase into the local store
export async function dbLoadAll(
  userId: string,
  update: (fn: (draft: AppData) => void) => void
) {
  const [profileRes, subjectsRes, attendanceRes, deadlinesRes, expensesRes, timetableRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("subjects").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("attendance").select("*").eq("user_id", userId),
    supabase.from("deadlines").select("*").eq("user_id", userId),
    supabase.from("expenses").select("*").eq("user_id", userId),
    supabase.from("timetable").select("*").eq("user_id", userId),
  ]);

  update((d) => {
    const p = profileRes.data;
    if (p) {
      if (p.name) d.profile.name = p.name;
      if (p.course) d.profile.course = p.course;
      d.profile.bio = p.bio ?? d.profile.bio;
      d.profile.skills = p.skills ?? d.profile.skills;
      d.profile.links = (p.links as typeof d.profile.links) ?? d.profile.links;
      d.profile.onboarded = true;
    }

    // Always overwrite — even empty arrays clear demo data from the store
    d.subjects = (subjectsRes.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color || "#7c3aed",
    }));

    d.attendance = (attendanceRes.data ?? []).map((r) => ({
      id: r.id,
      subjectId: r.subject_id,
      date: r.date as string,
      status: r.present ? ("present" as const) : ("bunked" as const),
    }));

    const dls = deadlinesRes.data;
    if (dls && dls.length > 0) {
      d.deadlines = dls.map((dl) => ({
        id: dl.id,
        title: dl.title,
        subjectId: dl.subject || undefined,
        date: dl.due_date,
        type: "assignment",
        done: !!dl.completed,
      }));
    }

    const exps = expensesRes.data;
    if (exps && exps.length > 0) {
      d.expenses = exps.map((e) => ({
        id: e.id,
        amount: Number(e.amount) || 0,
        category: e.category as any,
        date: e.date,
        note: e.note || undefined,
      }));
    }

    const slots = timetableRes.data;
    if (slots && slots.length > 0) {
      const subjectsByName = Object.fromEntries((subjectsRes.data ?? []).map((s: any) => [s.name, s.id]));
      d.timetable = slots.map((s: any) => ({
        id: s.id,
        day: NUM_TO_DAY[s.day as number] ?? "mon",
        subjectId: subjectsByName[s.label] ?? (subjectsRes.data?.[0]?.id ?? ""),
        start: s.start_time.slice(0, 5),
        end: s.end_time.slice(0, 5),
        room: "",
      }));
    }
  });
}
