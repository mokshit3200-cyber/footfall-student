import { supabase } from "./supabase";
import type { AppData } from "./types";

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
  const [profileRes, subjectsRes, attendanceRes, deadlinesRes, expensesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("subjects").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("attendance").select("*").eq("user_id", userId),
    supabase.from("deadlines").select("*").eq("user_id", userId),
    supabase.from("expenses").select("*").eq("user_id", userId),
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
  });
}
