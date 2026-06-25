# Antigravity Task — Home tab: make subjects, deadlines & grades fully cloud-backed

**Project:** `C:\Dev\Software Services\footfall-student` (Next.js 14 App Router PWA, TypeScript, Tailwind, Supabase). Dev: `npm run dev` → http://localhost:3200. App name **Cmpus**. Dark monochrome theme.

**Goal:** Every piece of data the user adds in the **Home tab** (subjects, deadlines, grades) must save to Supabase and load back on next login — so a user signing in from a new device sees their full data, not an empty screen.

**Files to work in:**
- `lib/dbActions.ts` — add all new DB functions here
- `components/Home.tsx` — wire the new functions after every local `update()` call
- `lib/dbActions.ts:dbLoadAll` — add loading of subjects (when added post-onboarding), grades
- `lib/types.ts` — minor type fix for grades (see below)

**DO NOT touch:** Connect.tsx, Profile.tsx, Money.tsx, Marketplace.tsx, the bottom nav.

---

## What's already cloud-backed (do not redo)
- **Attendance** — `dbSaveAttendance` is already called on every mark. ✅
- **Timetable** — `dbSaveTimetableSlot/Bulk/Delete` already called. ✅
- **Subjects at onboarding** — `Onboarding.tsx` inserts subjects to Supabase on first setup. ✅

## What IS NOT cloud-backed (fix these)

### 1. Subjects (when added/deleted after onboarding)
In `Home.tsx`, when the user adds a subject via the "Add Subject" sheet (search for the subject `update` that pushes to `d.subjects`), or deletes one, it only writes to localStorage. 

**Fix:** 
Add to `lib/dbActions.ts`:
```ts
export async function dbSaveSubject(userId: string, subject: { id: string; name: string; color: string }) {
  await supabase.from("subjects").upsert(
    { id: subject.id, user_id: userId, name: subject.name, color: subject.color },
    { onConflict: "id" }
  );
}
export async function dbDeleteSubject(subjectId: string) {
  await supabase.from("subjects").delete().eq("id", subjectId);
}
```
In `Home.tsx`, after every `update((d) => { d.subjects.push(...) })` call, fire `dbSaveSubject(user.id, newSubject)` (guard with `if (!isDemo() && user)`). After every subject delete, fire `dbDeleteSubject(subjectId)`.

### 2. Deadlines
The Supabase `deadlines` table exists with columns: `id, user_id, title, subject (text), due_date (date), completed (boolean)`. `dbLoadAll` already loads deadlines from it. But **every add/edit/complete/delete in Home.tsx only writes to the local store**.

Find all places in `Home.tsx` where `d.deadlines` is modified:
- **Add deadline** (look for deadline upsert push to `d.deadlines`)
- **Toggle done** (look for `dl.done = !dl.done` or similar)
- **Delete deadline** (look for deadline filter/remove)

Add to `lib/dbActions.ts`:
```ts
export async function dbSaveDeadline(userId: string, dl: { id: string; title: string; subjectId?: string; date: string; type: string; done: boolean }) {
  await supabase.from("deadlines").upsert(
    { id: dl.id, user_id: userId, title: dl.title, subject: dl.subjectId ?? null, due_date: dl.date, completed: dl.done },
    { onConflict: "id" }
  );
}
export async function dbDeleteDeadline(deadlineId: string) {
  await supabase.from("deadlines").delete().eq("id", deadlineId);
}
```
Also add an update-completed shortcut:
```ts
export async function dbToggleDeadline(deadlineId: string, done: boolean) {
  await supabase.from("deadlines").update({ completed: done }).eq("id", deadlineId);
}
```
Wire them in `Home.tsx` after every local store write. Guard all with `if (!isDemo() && user)`.

### 3. Grades
The Supabase `grades` table exists: `id, user_id, subject_name (text), type (text: internal/external/practical/assignment/other), obtained (numeric), total (numeric)`.

BUT `dbLoadAll` does NOT load grades from Supabase at all. And there are no grade save/delete functions.

**Fix `dbLoadAll`** — add grades loading:
```ts
supabase.from("grades").select("*").eq("user_id", userId)
// In the update block:
d.grades = (gradesRes.data ?? []).map((g) => ({
  id: g.id,
  subjectId: g.subject_name, // map subject_name → subjectId; note the local Grade type uses subjectId but DB stores subject_name
  semester: 1, // no semester column in DB, default to 1
  credits: 1,  // no credits column in DB, default to 1  
  score: g.total > 0 ? (g.obtained / g.total) * 100 : 0,
}));
```
Note: the local `Grade` type has `subjectId`, `semester`, `credits`, `score`. The DB has `subject_name`, `obtained`, `total`. Map them correctly. When saving, convert back:
  - `subject_name` = `subjects.find(s => s.id === grade.subjectId)?.name ?? grade.subjectId`
  - `obtained` = grade.score (since we're storing percentage as a 0-100 score out of 100)
  - `total` = 100

Add to `lib/dbActions.ts`:
```ts
export async function dbSaveGrade(userId: string, grade: Grade, subjectName: string) {
  await supabase.from("grades").upsert(
    { id: grade.id, user_id: userId, subject_name: subjectName, obtained: grade.score, total: 100 },
    { onConflict: "id" }
  );
}
export async function dbDeleteGrade(gradeId: string) {
  await supabase.from("grades").delete().eq("id", gradeId);
}
```
In `Home.tsx`, find all grade add/delete calls and wire the DB functions after the local store write.

---

## Bug fixes to do while you're in Home.tsx

1. **Demo seed timetable** — around line 250, when demo is seeded, the subjects are hardcoded inline. These go to the store fine. Don't modify demo seed behavior.
2. **Follow requests panel** — the Home tab queries `supabase.from("follows")` for pending follow requests (around line 85). Verify this works when a real user logs in (not just demo). Should work already — just confirm no bugs.
3. Check for any `console.error` / unhandled promise rejections from the Supabase calls you add and make sure they don't crash the UI (wrap in try/catch, fail silently but log).

---

## Acceptance
- `npx tsc --noEmit` → 0 errors
- Real login (not demo): add a subject → visible after page reload (comes from Supabase). Add a deadline → visible after reload. Add a grade → visible after reload.
- Delete each → gone after reload.
- Demo mode (`?mode=demo`) unchanged — all seeded data still shows, no network calls for writes.
- No new console errors in a real session.

Report: exactly which Home.tsx lines you wired, and confirm `dbLoadAll` now loads grades.
