import { supabase } from "./supabase";
import type { AppData, ClassSlot, DayKey, Grade } from "./types";

const DAY_TO_NUM: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const NUM_TO_DAY: Record<number, DayKey> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };

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
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
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
    college: string;
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
  const [profileRes, subjectsRes, attendanceRes, deadlinesRes, expensesRes, timetableRes, gradesRes, splitsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("subjects").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("attendance").select("*").eq("user_id", userId),
    supabase.from("deadlines").select("*").eq("user_id", userId),
    supabase.from("expenses").select("*").eq("user_id", userId),
    supabase.from("timetable").select("*").eq("user_id", userId),
    supabase.from("grades").select("*").eq("user_id", userId),
    supabase.from("splits").select("*").eq("user_id", userId),
  ]);

  update((d) => {
    const p = profileRes.data;
    if (p) {
      if (p.name) d.profile.name = p.name;
      if (p.course) d.profile.course = p.course;
      if (p.college) d.profile.college = p.college;
      if (p.year) d.profile.year = p.year;
      if (p.avatar_url) d.profile.avatar = p.avatar_url;
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
    } else {
      d.deadlines = [];
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
    } else {
      d.expenses = [];
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
    } else {
      d.timetable = [];
    }

    d.grades = (gradesRes.data ?? []).map((g) => ({
      id: g.id,
      subjectId: g.subject_name,
      semester: 1,
      credits: 1,
      score: g.total > 0 ? (g.obtained / g.total) * 100 : 0,
    }));

    d.splits = (splitsRes.data ?? []).map((s) => ({
      id: s.id,
      total: Number(s.total_amount) || 0,
      people: (s.split_with as string[]) ?? [],
      paidBy: "me",
      date: s.date,
      note: s.description || undefined,
    }));
  });
}

export async function dbSaveSubject(userId: string, subject: { id: string; name: string; color: string }) {
  await supabase.from("subjects").upsert(
    { id: subject.id, user_id: userId, name: subject.name, color: subject.color },
    { onConflict: "id" }
  );
}

export async function dbDeleteSubject(subjectId: string) {
  await supabase.from("subjects").delete().eq("id", subjectId);
}

export async function dbSaveDeadline(userId: string, dl: { id: string; title: string; subjectId?: string; date: string; type: string; done: boolean }) {
  await supabase.from("deadlines").upsert(
    { id: dl.id, user_id: userId, title: dl.title, subject: dl.subjectId ?? null, due_date: dl.date, completed: dl.done },
    { onConflict: "id" }
  );
}

export async function dbDeleteDeadline(deadlineId: string) {
  await supabase.from("deadlines").delete().eq("id", deadlineId);
}

export async function dbToggleDeadline(deadlineId: string, done: boolean) {
  await supabase.from("deadlines").update({ completed: done }).eq("id", deadlineId);
}

export async function dbSaveGrade(userId: string, grade: Grade, subjectName: string) {
  await supabase.from("grades").upsert(
    { id: grade.id, user_id: userId, subject_name: subjectName, obtained: grade.score, total: 100 },
    { onConflict: "id" }
  );
}

export async function dbDeleteGrade(gradeId: string) {
  await supabase.from("grades").delete().eq("id", gradeId);
}

export async function dbSaveExpense(
  userId: string,
  expense: { id: string; amount: number; category: string; date: string; note?: string }
) {
  await supabase.from("expenses").upsert(
    { id: expense.id, user_id: userId, amount: expense.amount, category: expense.category, date: expense.date, note: expense.note ?? null },
    { onConflict: "id" }
  );
}

export async function dbDeleteExpense(expenseId: string) {
  await supabase.from("expenses").delete().eq("id", expenseId);
}

export async function dbSaveSplit(
  userId: string,
  split: { id: string; total: number; people: string[]; paidBy: string; date: string; note?: string }
) {
  await supabase.from("splits").upsert(
    {
      id: split.id,
      user_id: userId,
      description: split.note ?? "Split",
      total_amount: split.total,
      split_with: split.people,
      date: split.date,
    },
    { onConflict: "id" }
  );
}

export async function dbDeleteSplit(splitId: string) {
  await supabase.from("splits").delete().eq("id", splitId);
}

/**
 * Tries to upload a File to Supabase Storage.
 * If it succeeds, returns the public URL.
 * If it fails (or if it's not a File), falls back to converting the file to Base64 (or returns the base64 string directly).
 */
export async function uploadPhoto(
  bucket: string,
  filePath: string,
  fileOrBase64: File | string
): Promise<string> {
  if (typeof fileOrBase64 === "string") {
    return fileOrBase64;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileOrBase64, { 
        upsert: true,
        contentType: fileOrBase64.type || "image/png"
      });

    if (error) {
      console.warn("Supabase storage upload failed, falling back to base64:", error.message);
      return await fileToBase64(fileOrBase64);
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn("Storage upload error, falling back to base64:", err);
    return await fileToBase64(fileOrBase64);
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}


// --- Stories Functions ---

// Post a story photo
export async function dbPostStory(
  userId: string,
  file: File,
  visibility: "public" | "followers"
): Promise<boolean> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('stories')
    .upload(path, file, { upsert: false, contentType: file.type });
  if (upErr) { console.error('Story upload error:', upErr.message); return false; }
  const { data: urlData } = supabase.storage.from('stories').getPublicUrl(path);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('stories').insert({
    user_id: userId,
    media_url: urlData.publicUrl,
    expires_at: expiresAt,
    visibility,
  });
  if (error) { console.error('Story insert error:', error.message); return false; }
  return true;
}

// Fetch stories bar entries (grouped by user, ranked)
export async function dbFetchStoriesBar(userId: string, college: string) {
  const now = new Date().toISOString();
  const [{ data: following }, { data: followers }, { data: stories }] = await Promise.all([
    supabase.from('follows').select('following_id').eq('follower_id', userId).eq('status', 'accepted'),
    supabase.from('follows').select('follower_id').eq('following_id', userId).eq('status', 'accepted'),
    supabase
      .from('stories')
      .select('id, user_id, media_url, visibility, created_at, expires_at, profiles!stories_user_id_fkey(id, name, username, avatar_url, college, verified, is_private)')
      .gt('expires_at', now)
      .neq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);
  const followingIds = new Set((following ?? []).map((f: any) => f.following_id));
  const followerIds = new Set((followers ?? []).map((f: any) => f.follower_id));
  const visible = (stories ?? []).filter((s: any) => {
    const prof = s.profiles as any;
    if (!prof) return false;
    const isPrivate = prof.is_private ?? false;
    
    // Private profiles stories can only be seen if following
    if (isPrivate && !followingIds.has(s.user_id)) return false;

    if (s.visibility === 'public' && prof.college === college) return true;
    if (s.visibility === 'followers' && followingIds.has(s.user_id)) return true;
    return false;
  });
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
        sameCampus: (s.profiles as any)?.college === college,
      });
    } else {
      byUser.get(s.user_id).stories.push(s);
    }
  }
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
    .from('stories')
    .select('id, media_url, visibility, created_at, expires_at')
    .eq('user_id', userId)
    .gt('expires_at', now)
    .order('created_at', { ascending: false });
  return data ?? [];
}
