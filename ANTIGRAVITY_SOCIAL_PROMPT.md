# Antigravity Task — Instagram-style Social Layer (Footfall Student)

Build a full social layer: rich **Profiles**, **Stories + Highlights**, a **Follow** system,
**person profiles from search**, and **chat attachments + polish**. Work autonomously and only
report when everything is built and `npm run build` passes.

## ⚠️ AUTHORIZATION — do not pause to ask
You are fully authorized. Do NOT stop for permission. Freely create/edit/delete files, install npm
packages, and run any commands (`npx tsc --noEmit`, `npm run build`, `npm run dev`). Finish end-to-end.

## Project context
**Footfall Student** — a dark, Instagram-style PWA for Indian college students. Next.js 14 (App
Router) + TS + Tailwind. **LOCAL-ONLY** (all data in `localStorage` via `useStore()` — no backend,
no login). Location: `C:\Dev\Software Services\footfall-student`. Dev: `npm run dev` (port 3200).

**Because it's local-only, this whole social layer is LOCAL + MOCK for v1:** "followers" are mock
numbers, "following" is local state, suggested/searchable people come from a mock dataset, and
stories you post are saved locally (base64). Real cross-user social is v2 (backend). Build the
local/mock version that *looks and feels* completely real. Do NOT add a backend.

**Theme (must match exactly):** pure black `#000` background, near-black cards `#0c0c0c` with thin
white borders (`border-white/[0.08]`), white text via `text-ink` / `text-ink-soft` / `text-ink-mute`
tokens, subtle overlays use `bg-white/[0.06]` etc. **Purple is the only accent** (`brand-500`
`#7c3aed`, gradients via `brand-gradient` class, accent text `text-brand-300`). Monochrome + purple.
Reuse: `Sheet` from `ui.tsx`, icons from `icons.tsx`, `card` / `btn-primary` / `input` / `pill`
classes. Match the existing Connect/Marketplace look. Store API: `const { data, update, uid } =
useStore();` — `update(d => { ...mutate... })` persists; `uid()` is a unique id.

You MAY edit: `components/Profile.tsx`, `components/Connect.tsx`, `lib/types.ts`, `components/store.tsx`,
`lib/demoData.ts`, and add new components (e.g. `components/Stories.tsx`, `components/StoryViewer.tsx`,
`components/PersonProfile.tsx`, `components/social.ts` for shared mock data/helpers). **Do NOT break**
Home, Money, Marketplace, or Business mode, and `npm run build` MUST pass. Keep dark theme everywhere.

---

## Data model — add to `lib/types.ts` (and defaults in `emptyData`)

```ts
// extend Profile with:
avatar?: string;     // base64 profile photo
username?: string;   // @handle, e.g. "aarav.k"
course?: string;     // "CSE · 2nd year"
bio?: string;
followers?: number;  // mock count (seed ~120)

// extend GroupMessage with:
image?: string;      // base64 image attachment (optional)

export interface Story { id: string; image: string; at: string; } // image = base64/url
export interface Highlight { id: string; title: string; cover: string; images: string[]; }

// add to AppData (defaults: stories: [], highlights: [], following: []):
stories: Story[];        // the current user's active stories
highlights: Highlight[]; // saved story highlights
following: string[];     // ids of people the user follows
```

Also update `store.tsx` load() to default these (`stories: parsed.stories || []`, etc.) so old saves
don't break.

## Mock people dataset — create `components/social.ts`
A `PEOPLE: Person[]` array of ~12 believable students. Use Unsplash avatar URLs
(`https://images.unsplash.com/photo-XXXX?auto=format&fit=crop&w=200&q=60` — portrait photos) and
story image URLs. Include the existing suggested names (Rohan Mehta, Priya Sharma, Karan Patel,
Ananya Rao, Dev Kapoor, Meera Nair) plus more.

```ts
export interface Person {
  id: string; name: string; username: string; course: string;
  avatar: string; bio: string; followers: number; following: number;
  mutuals: number; stories: string[]; // current story image urls (0-2)
}
```
Also export small helpers reused across components: `initials(name)`, `colorFor(name)` (avatar
fallback color), and an `<Avatar>` that shows the photo if present, else colored initials.

---

## FEATURE 1 — Profile tab (Instagram-style)
Redesign `Profile.tsx` to lead with an Instagram profile, while keeping the existing utilities reachable.
- **Header:** large round avatar (tap → upload/change photo, resized to base64), name, `@username`,
  `course`, `bio`. An **Edit profile** button opens a sheet to edit name/username/course/bio/photo.
- **Stats row:** Posts · Followers · Following (followers = mock count; following = `following.length`).
- **Story Highlights row:** horizontal circles with cover images + a **"New"** (+) circle to create a
  highlight (pick a title + cover image). Tapping a highlight opens the Story Viewer with its images.
- **"Add to story"** entry (a + on your avatar or a button) → pick image → adds to `data.stories`.
- **Keep accessible (don't delete):** the **Business mode** switch (existing gradient card) and
  **Settings** (attendance target, grade system, budget, reminders, reset). Put settings behind a gear
  icon in the top-right or a row list below the profile. Don't lose any existing setting.
- Optional nice-to-have: a 3-column **posts grid** placeholder ("No posts yet" empty state).

## FEATURE 2 — Stories (Instagram stories)
- **Story tray in Connect:** REPLACE the current "Suggested for you" avatar row with a **Stories row**:
  first item = **"Your story"** (your avatar with a + badge; tap to add a story, or view yours if you
  have one), then friends' stories. **Ring states:** unseen = purple→magenta gradient ring, seen = gray
  ring. Keep it horizontally scrollable.
- **Story Viewer (full screen):** tap a story → full-screen viewer with **segmented progress bars** at
  top (one per story), **tap right half = next, left half = previous**, hold to pause, **X / swipe-down
  to close**, auto-advance after ~4s. Show the poster's avatar + name + time top-left. Mark stories as
  "seen" (local set) so the ring turns gray after viewing.
- **Story reply:** a "Reply…" input at the bottom of the viewer → sends a DM to that person (opens/creates
  the DM thread with the typed message). Nice tie-in to chat.

## FEATURE 3 — Follow + person profiles
- **Search** (in Connect): typing shows matching **PEOPLE** with a **Follow / Following** toggle button
  and a tap-to-open profile.
- **Suggested:** when search is empty, show suggested people (not following yet) with Follow buttons too
  (can live under the stories row or in search).
- **Person profile view:** tapping a person opens their Instagram-style profile — avatar, name,
  @username, course, bio, **followers/following counts**, their **highlights**, a **Follow/Following**
  button, and a **Message** button (opens/creates a DM). Following toggles `data.following` and updates
  the count. Show a "Followed by Priya + 3 others" mutuals line for realism.

## FEATURE 4 — Chat polish + attachments
- **Attachment button** in the composer (a + or paperclip left of the input) → pick an image → send it
  as an **image message** (base64, resized). Render image messages as rounded image bubbles (tap to view
  full screen).
- **Polish the thread:** keep it clean and simple — tidy header (avatar + name + active status), proper
  bubble grouping, timestamps (show on tap or subtly), smooth auto-scroll, and a "Seen" indicator under
  your last sent message in DMs (cosmetic). Keep the full-screen layout with the composer pinned bottom.
- Keep the inbox below the stories row (DMs + group chats, as it is now).

---

## MY SUGGESTIONS — please include these (they make it feel real)
1. **Unseen vs seen story rings** (gradient vs gray) — already specified, important.
2. **Story reply → DM** — already specified, great tie-in.
3. **"Active now" / online green dots** on avatars (some people online).
4. **Read receipts** ("Seen 2:14 PM") under your last DM message — cosmetic.
5. **Double-tap a message to ❤️ react** (store a reaction on the message) — optional but delightful.
6. **Mutual followers line** on profiles ("Followed by … + N others").
7. **Department/year badge** pill on profiles (from `course`).
8. **"Your story" always first** in the tray with the + to add.
9. (Optional) **Share profile** action that copies a `student.footfallco.com/u/username` style link.

Prioritize: Profile + Stories + Follow + Chat attachments are the must-haves. The numbered extras are
nice-to-haves — add as many as you cleanly can without breaking the build.

## Acceptance criteria (verify before reporting)
- `npx tsc --noEmit` → zero errors. `npm run build` → zero errors.
- Profile shows avatar/username/course/bio, followers/following, highlights, add-to-story, and still
  has Business switch + all settings.
- Stories: tray with ring states, full-screen viewer with progress bars + tap nav + add story + reply.
- Follow: search → people with Follow buttons → person profile → Follow toggles + Message opens DM.
- Chat: image attachments send + render; thread is polished; composer pinned at bottom.
- Everything dark-themed, purple accent only, nothing else in the app broken.

When done, report what you built for each feature and confirm `tsc` + `npm run build` are clean.
