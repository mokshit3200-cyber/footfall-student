# Antigravity Task — Notifications/Reminders + Marketplace (Footfall Student)

Build TWO features end-to-end. You have **full authorization** for this task (see below). Work
autonomously and only report when both are done and the production build passes.

## ⚠️ AUTHORIZATION — do not pause to ask

You are **fully authorized** for everything this task needs. Do **NOT** stop to ask for permission
or confirmation at any point. You may freely:
- create, edit, or delete any file in the project,
- install any npm packages (`npm install ...`),
- run any terminal commands (`npx tsc --noEmit`, `npm run build`, `npm run dev`, etc.).

Proceed start-to-finish on your own. Only come back when both features are built and verified.

## Project context

**Footfall Student** — a free, mobile-first **PWA** for Indian college students. Stack: Next.js 14
(App Router) + TypeScript + Tailwind. It is **LOCAL-ONLY** (all data in `localStorage` via a single
store — no backend, no login). Location: `C:\Dev\Software Services\footfall-student`. Dev port 3200.

Bottom nav (5 tabs, `components/BottomNav.tsx`): **Home / Money / Connect / Market / Profile**.
- `Market` currently renders a `ComingSoon` placeholder in `app/page.tsx` — you will replace it.
- The store API (`components/store.tsx`): `const { data, update, uid } = useStore();`
  `update(draft => { ...mutate... })` persists automatically; `uid()` returns a unique id.
- Reusable UI in `components/ui.tsx`: `Sheet`, `Ring`, `SectionHeader`, `statusColor`.
  Icons in `components/icons.tsx`. Date helpers in `lib/dates.ts` (`todayISO`, `daysUntil`,
  `dueLabel`, `prettyDate`, `DAY_SHORT`, etc.). Types in `lib/types.ts`.
- Visual style: cards = `className="card"`, buttons `btn-primary` / `btn-ghost`, inputs `input`,
  pills `pill`. Brand emerald = `brand-500` (#0f8f6f) + `brand-*` scale. Text: `text-ink`,
  `text-ink-soft`, `text-ink-mute`. Pages start with `<div className="px-5 pt-12 pb-28">`. Soft,
  rounded, calm; use `animate-fade-up`. Match Home/Money/Connect exactly.

You MAY edit any file you need (`page.tsx`, `types.ts`, `store.tsx`, `layout.tsx`, `Profile.tsx`,
`BottomNav.tsx`, etc.). The ONLY hard rules: **preserve all existing features and styling**, and
**`npm run build` must pass with zero errors** when you finish. Do not break attendance, money,
connect, business mode, or onboarding.

---

## FEATURE 1 — Notifications & Reminders

Make the app proactive instead of passive. This is the biggest retention lever.

### Honest technical reality (build accordingly)
This is a local PWA with **no backend push server**, so true notifications when the app is fully
closed are NOT reliable. Build a **two-layer** system:
1. **Web Notifications API** — request permission; while the app is open or recently backgrounded,
   fire real OS notifications at the right time (class starting, deadline due). Use the
   `Notification` API and/or the service worker (`public/sw.js` exists — you may extend it).
2. **In-app reminders (the reliable layer)** — an "agenda"/reminders surface that always works:
   on app open, compute what's upcoming and show it. This guarantees value even if OS notifications
   don't fire.

### What to build
- **Permission flow**: a gentle prompt/card to enable notifications (don't spam; ask once, respect
  dismissal, remember choice). Never block the app.
- **Reminder types** (each individually toggleable):
  - **Class reminders** — "DBMS starts in 15 min · Room 204" (lead time configurable: 5/10/15/30 min).
    Source: `data.timetable` (slots have day/start/room/subjectId) + subjects for names.
  - **Deadline reminders** — "Maths assignment due tomorrow" (lead time in days: 1/2/3). Source:
    `data.deadlines` (not done).
  - **Attendance nudge** — if today has classes and attendance isn't marked by evening, remind
    "Mark today's attendance".
  - **Daily agenda (optional, nice)** — a morning summary: today's classes + due items.
- **A Reminders settings screen** — master toggle + per-type toggles + lead-time pickers. Reachable
  from **Profile** (add a "Reminders" / "Notifications" row in Profile's settings list — edit
  `Profile.tsx` cleanly, matching its existing `Row` style) OR a clearly-placed entry on Home.
- **A reminders engine** that runs while the app is open (e.g. a component mounted in
  `app/layout.tsx` or `app/page.tsx`, or a hook) — checks every minute, fires due notifications,
  and avoids duplicates (track already-fired reminder ids for the day, e.g. in state or localStorage).

### Data model to add (to `lib/types.ts`, wire defaults in `emptyData`)
```ts
export interface ReminderSettings {
  enabled: boolean;          // master (permission granted + user on)
  classReminders: boolean;
  classLeadMin: number;      // default 15
  deadlineReminders: boolean;
  deadlineLeadDays: number;  // default 1
  attendanceNudge: boolean;
  dailyAgenda: boolean;
}
// add to AppData:  reminders: ReminderSettings;
// emptyData default: { enabled:false, classReminders:true, classLeadMin:15,
//   deadlineReminders:true, deadlineLeadDays:1, attendanceNudge:true, dailyAgenda:false }
```

---

## FEATURE 2 — Marketplace (replace the ComingSoon placeholder)

A campus marketplace where students buy, sell, and hire. v1 is local-only, so:
- The student can **create & manage their own listings** (real, stored in the store) — this is their
  campus storefront / freelance presence, and conceptually ties to Business mode.
- The **Browse** experience shows a set of realistic **seeded demo listings** (a constant array in
  the component, ~10-12 items across categories) so the marketplace feels alive, not empty. Make it
  visually clear these are sample campus listings (a small "Sample" tag is fine). Real multi-user
  listings come in v2 with a backend — you may add a subtle note to that effect.

### Screens / structure (new `components/Marketplace.tsx`, wired into `page.tsx` for `market` tab)
- **Browse (default view)**:
  - Search bar + category chips (filter): Food, Tutoring, Design, Products, Services, Rentals, Other.
  - A grid/list of listing cards: title, category, price (or "Contact for price"), seller, a category
    emoji/accent. Mix the student's own listings (badge "Yours") with the seeded demo listings.
  - Tap a card → **listing detail**: full description, price, seller, contact (show a "Contact"
    button — since local-only, reveal the contact string / `tel:`/`https://instagram.com/...`).
- **My listings / Sell**:
  - "Create a listing" via a `Sheet`: title, category, price + unit (e.g. "per hour"/"per plate";
    0 = contact for price), description, your name (default from `data.profile.name`), contact
    (phone or insta). Edit + delete your own listings.
- Empty states, `animate-fade-up`, consistent styling.

### Data model to add (to `lib/types.ts`, wire `listings: []` in `emptyData`)
```ts
export type ListingCategory =
  | "food" | "tutoring" | "design" | "products" | "services" | "rentals" | "other";
export interface Listing {
  id: string;
  title: string;
  category: ListingCategory;
  price: number;          // 0 = contact for price
  priceUnit?: string;     // "per hour", "per plate", etc.
  description: string;
  seller: string;
  contact?: string;       // phone or instagram handle
  mine: boolean;          // true if created by this student
  createdAt: string;
}
// add to AppData:  listings: Listing[];
```
Keep seeded demo listings as a `const DEMO_LISTINGS` inside `Marketplace.tsx` (don't write them to
the store). Browse = `[...data.listings, ...DEMO_LISTINGS]`. "My listings" = `data.listings`.

---

## Wiring notes
- In `app/page.tsx`, import `Marketplace` and render it for `tab === "market"` (replacing the
  `ComingSoon tab="market"` line). Leave Home/Money/Connect/Profile as they are.
- Mount the reminders engine so it runs while the app is open (layout or page level), guarded to
  client-side and to run only after onboarding.
- Add reminder settings entry into `Profile.tsx` matching its existing `Row`/`SettingsSheet` style,
  OR a dedicated settings screen component — your call, keep it clean and consistent.

## Acceptance criteria (verify before reporting)
1. `npx tsc --noEmit` → zero errors.
2. `npm run build` → completes with zero errors.
3. Marketplace tab fully works: browse, search, filter by category, view detail, create/edit/delete
   own listing, all persisting across refresh.
4. Reminders: permission flow works; settings toggle and persist; in-app reminders compute correctly
   from timetable + deadlines; OS notifications fire while app is open (best-effort) without
   duplicates. App never crashes if permission is denied.
5. No existing feature broken; visual style matches the rest of the app.

When finished, report what you built for each feature and confirm both `tsc` and `npm run build` are
clean.
