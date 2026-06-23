# Antigravity Task — Build the "Connect" tab for Footfall Student

You are building ONE feature inside an existing app. Read this fully before writing code.
Claude is building other features in parallel, so **stay strictly inside your file boundaries**
(listed below) to avoid collisions.

## Project context

**Footfall Student** is a free, mobile-first PWA for Indian college students. Stack: Next.js 14
(App Router) + TypeScript + Tailwind. It is **LOCAL-ONLY** for v1 — all data is in `localStorage`
via a single store. No backend, no login, no network calls. Location:
`C:\Dev\Software Services\footfall-student`. Dev server: `npm run dev` on port 3200.

The app has a 5-tab bottom nav: Home / Money / **Connect** / Market / Profile. Your job is the
**Connect** tab — currently a placeholder stub at `components/Connect.tsx`.

## What to build — Connect = Study Groups & Collaboration

Because v1 is local-only, "connecting to people" means **group/project collaboration tools that
are genuinely useful offline** (managing a group assignment). Real cross-device networking is v2.
Build these:

1. **Groups list (the Connect home view)**
   - List of the student's study/project groups as cards. Each card shows: group name, subject
     (if set, with its color dot), member count, task progress (e.g. "3/5 done"), and shared due
     date if any (use `dueLabel` from `lib/dates`).
   - Empty state when no groups, with a clear "Create your first group" CTA.
   - A "+ New group" button.

2. **Create / edit group** (use the `Sheet` component from `ui.tsx`)
   - Fields: name (required), optional subject (dropdown from `data.subjects`), add members by
     name (chip input — same pattern as the bill-split "add friend" input in `Money.tsx`),
     optional shared due date.

3. **Group detail view** (when a card is tapped — manage via local state in the component, no routing)
   - Header: group name, subject, members (as avatars/chips).
   - **Shared task checklist**: add tasks, each with a title and optional assignee (pick from
     members or "me"); tap to toggle done; delete. Show progress.
   - **Shared notes**: a `<textarea>` that saves to `group.notes` (debounce or save on blur).
   - **Members**: add/remove members.
   - Delete group (with confirm).
   - A back control to return to the groups list.

4. **A small "classmates" touch (optional, nice-to-have)**: since timetable holds subjects, you
   may show "you share [Subject] with this group" context. Don't overbuild — groups are the core.

## Data model (ALREADY DEFINED — do not edit types)

In `lib/types.ts` (already added by Claude — read, don't modify):

```ts
interface GroupTask { id: string; title: string; assignee?: string; done: boolean; }
interface StudyGroup {
  id: string; name: string; subjectId?: string; members: string[];
  tasks: GroupTask[]; notes: string; dueDate?: string; createdAt: string;
}
// AppData.groups: StudyGroup[]   (already wired, defaults to [])
```

## The store API (read `components/store.tsx`)

```ts
const { data, update, uid } = useStore();
// data.groups -> StudyGroup[]
// update(draft => { ... mutate draft ... })  // persists to localStorage automatically
// uid() -> unique id string
```

Example — add a group:
```ts
update(d => {
  d.groups.push({
    id: uid(), name, subjectId, members, tasks: [], notes: "",
    dueDate, createdAt: new Date().toISOString(),
  });
});
```

## File boundaries — STRICT

**You may create/edit ONLY:**
- `components/Connect.tsx`  (replace the stub's body — keep `export default function Connect()`)
- `components/connect/*`     (any new sub-components you want)

**Do NOT touch (Claude owns these):**
`store.tsx`, `lib/types.ts`, `lib/*`, `app/page.tsx`, `app/layout.tsx`, `components/BottomNav.tsx`,
`components/Home.tsx`, `components/Money.tsx`, `components/Profile.tsx`, `components/Business.tsx`,
`components/ui.tsx`, `components/icons.tsx`, `components/Onboarding.tsx`, `components/ComingSoon.tsx`,
`tailwind.config.ts`, `app/globals.css`.

Reuse these instead of redefining: `Sheet`, `Ring`, `SectionHeader`, `statusColor` from `ui.tsx`;
icons from `icons.tsx` (`UsersIcon`, `PlusIcon`, `CheckIcon`, `TrashIcon`, `ChevronRight`, etc.);
date helpers from `lib/dates.ts` (`dueLabel`, `daysUntil`, `todayISO`). If you need an icon that
doesn't exist, define it locally inside `components/connect/` — do NOT edit `icons.tsx`.

## Visual conventions (match the existing app exactly)

- Mobile-first, content width is already constrained by the app shell. Pages start with
  `<div className="px-5 pt-12 pb-28">`.
- Cards: `className="card"` (defined in globals.css). Primary button: `className="btn-primary"`.
  Ghost: `btn-ghost`. Input: `input`. Pill: `pill`.
- Brand color is emerald: `brand-500` (#0f8f6f) and the `brand-*` scale. Text: `text-ink`,
  `text-ink-soft`, `text-ink-mute`. Use `tabular-nums` for numbers.
- Rounded, soft, calm. No heavy shadows. Use `animate-fade-up` on appearing sections.
- Use subject colors (`subject.color`) as little accent dots/bars, like Home does.

## Acceptance criteria

- `npx tsc --noEmit` passes with no errors.
- App compiles and the Connect tab renders, creates groups, adds members + tasks, toggles tasks,
  edits notes, deletes — all persisting across refresh (localStorage).
- No edits to any file outside your boundary. No backend/network calls.
- Visually consistent with Home/Money tabs.

When done, report what you built and confirm `tsc` is clean.
