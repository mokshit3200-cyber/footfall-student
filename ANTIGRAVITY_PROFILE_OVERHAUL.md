# Antigravity Task — Make the Profile tab FULLY FUNCTIONAL (like Instagram)

**Project:** `C:\Dev\Software Services\footfall-student` (Next.js 14 App Router PWA, TypeScript, Tailwind, Supabase). Dev: `npm run dev` → http://localhost:3200. App name **Cmpus**. Dark monochrome theme. Brand emerald `#0F8F6F` / `brand-500`.

**Goal in one line:** Take the Profile tab and make **every feature and every button actually work** — like Instagram's profile screen — fully wired to the store + Supabase, no dead buttons, no placeholders, bugs fixed. **UI polish is NOT the focus now — functionality is.**

**Main file:** `components/Profile.tsx` (the user's OWN profile, 5th bottom-nav tab). Supporting: `lib/types.ts`, `components/store.tsx`, `lib/dbActions.ts`, `lib/supabase.ts`.

> DO NOT touch `Connect.tsx`, `Home.tsx`, or the bottom nav. The "view another user" screen in Connect is already fine.

---

## 1. REMOVE the fake Instagram media (we have no posts/stories feed)

Delete from `Profile.tsx`: the **story ring** avatar + `hasStories`/`activeUserStories` logic, the **"+ Add Story"** button, the entire **"Highlights"** rail, and the story machinery — state `createStoryOpen`, `createHighlightOpen`, `activeStoriesToView`; the function components `CreateStoryOpenSheet` and `CreateHighlightSheet`; and Profile's usage of `StoryViewerModal`.

- Grep `StoryViewerModal` across the repo first. If only Profile uses it, delete the definition too; if Home/Connect use it, keep the definition, just remove Profile's usage.
- Remove now-unused imports/vars. Keep the **"My Listings"** block (real data).

---

## 2. Every button on Profile must be FUNCTIONAL

Audit and wire each interactive element. None may be a dead/no-op button:

- **Avatar** → tap opens Edit Profile.
- **Listings stat** → tap scrolls to / opens the My Listings section.
- **Followers stat** → tap opens a **Followers list** screen/sheet showing the real people who follow you (query Supabase `follows` where `following_id = me AND status = accepted`, join `profiles`). Each row: avatar, name, @username, and a Follow/Following button. Tapping a row can open that person's mini profile (reuse Connect's pattern or a simple read-only sheet). In demo mode, show seeded demo followers.
- **Following stat** → same, but people YOU follow (`follower_id = me`). Allow **Unfollow** from here (updates `follows`, decrements count).
- **Edit Profile** → §3, full cloud save.
- **Private/Public toggle** → already persists to `profiles.is_private`; verify it actually saves and reflects on reload.
- **Verify Student ID** → confirm the existing `VerifyIdSheet` flow works end-to-end and updates `verified`.
- **My Listings rows** → make each listing **tappable**: open a sheet to **edit** (title, price, unit, image) or **delete** the listing. Persist to store (and Supabase if listings are stored there — check `lib/dbActions.ts`/schema; if local-only, persist to store and note it).
- **Settings rows** → each opens its working sheet and saves (see §4).
- **Sign Out** and **Reset all data** → keep working.
- **Business bridge card** → keep; confirm it opens the Business dashboard.

For every button, after the action: state updates immediately (optimistic) AND persists (store + Supabase where a table exists), and survives a page reload.

---

## 3. Edit Profile — every field, saved to the cloud

Extend the existing `EditProfileSheet` so it edits **all** real profile fields and saves to **both** the local store (`update()`) and Supabase (`dbUpdateProfile`) when `!isDemo() && user`:

Fields: **Display name** (required), **College**, **Year/Semester**, **Course/Department**, **Bio** (150 char), **Skills** (chips add/remove), **Social links** (github/linkedin/instagram/portfolio), **Avatar** (emoji grid + custom photo upload). Username stays **read-only**.

- Add `year?: number` to `Profile` in `lib/types.ts` and to the demo seed default in `store.tsx`.
- **Supabase:** `year int` column ALREADY EXISTS in the `profiles` table (confirmed in schema). Just include `year` in `dbUpdateProfile` so it saves to the cloud. No migration needed.
- Also check: `is_private` column. The current Profile.tsx calls `supabase.from("profiles").update({ is_private: next })` but `is_private` is NOT in the schema. Add it: run this SQL (include in your summary for the user to run):
  ```sql
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;
  ```
- Pre-fill all fields on open; trim on save; optimistic local write + Supabase write; guard with `isDemo()` so demo never hits the network; close on success; header reflects changes instantly.

---

## 4. Settings — grouped and every toggle persists

Reorganize the Settings card into labeled sections, all functional and persisted (keep existing `SettingsSheet`/`RemindersSheet` save logic):

- **Account:** Edit Profile · Account privacy (Private/Public) · Verify Student ID (if unverified)
- **Academic:** Attendance target (slider) · Grade system (GPA-10 / %)
- **Money:** Monthly budget
- **Notifications:** Reminders (opens RemindersSheet, shows On/Off) · Sound effects toggle
- **About:** App version "Cmpus v1.0" · Terms (`/terms`) · Privacy (`/privacy`) · "Powered by Footfall & Co"
- **Danger zone:** Sign Out · Reset all data (red)

Each row must open a working sheet and actually save.

---

## Acceptance (must all pass before you call it done)
- `npx tsc --noEmit` → **0 errors**. No unused imports/vars.
- **Demo mode** (`?mode=demo`) works fully; all Supabase writes guarded by `isDemo()`.
- **No dead buttons** — every tap does something real and persists across reload.
- Followers/Following lists load real data (and demo data in demo mode); Unfollow works.
- Edit Profile saves all fields to store + Supabase (`year` included after the ALTER).
- Listings are editable/deletable.
- Manually click through every button and fix any console errors / bugs you hit.

**When done, report:** which blocks/components you deleted, the new Followers/Following list components, what you wired for listings edit/delete, the fields added to Edit Profile, and confirm you added the `year` column + that `tsc` passes and you clicked through every button without errors.
