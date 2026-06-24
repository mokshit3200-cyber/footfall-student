# Antigravity Master Spec — Frequency Redesign (live campus radar + cross-campus network)

## North star
Turn **Frequency** from a passive status list into the reason students open the app every day: a **live campus radar** of what's happening *right now* + one tap to jump in, plus an **All-Campuses network** for help, teammates, events and selling. Every interaction must feel **smooth, premium, and connected** — Apple / Instagram / Linear grade. Mobile-first (test at 414px). Every feature must actually work, in demo mode (no login) AND live.

## Project facts
- Path: `C:\Dev\Software Services\footfall-student`. Next.js 14 App Router PWA, TS, Tailwind, Supabase (project `footfall-student`, `https://fqvrqegauytsfltkptyh.supabase.co`).
- Dev: `npx next dev -p 3200`. Demo: `?mode=demo` → `isDemo()` from `@/lib/config`, NO Supabase user; everything must work with in-memory fake data and never prompt login or error.
- Files in scope: `components/Connect.tsx` (the Frequency feed), `components/Messages.tsx` (DM inbox/chat + the top Frequency strip + Requests), `components/icons.tsx` (add icons), `supabase/migrations/` (add ONE new migration).
- Brand emerald `#10b981` / `brand-500 #0F8F6F`. Dark theme. Text tokens `text-ink`/`text-ink-soft`/`text-ink-mute`. Surfaces `#0c0c0e`, `#141416`, `#1a1a1a`.

---

## 1. The intent system (the backbone)
Every signal has an **intent** — a vibe that makes the feed scannable, colorful, and filterable. Six intents:

| intent | label | color | icon (icons.tsx) | reach |
|--------|-------|-------|------------------|-------|
| `free` | Free now | `#22c55e` green | CoffeeIcon | **campus only (locked)** |
| `study` | Studying | `#3b82f6` blue | BookIcon | campus default, may choose all |
| `help` | Need help | `#f59e0b` amber | HelpIcon | may choose all |
| `looking` | Looking for | `#8b5cf6` purple | UsersGroupIcon | user picks (local sport vs remote teammate) |
| `event` | Event | `#ec4899` pink | ConfettiIcon | may choose all |
| `sell` | Sell | `#14b8a6` teal | TagIcon | may choose all |

Each intent renders as a small colored chip (icon + label) and an avatar **ring** in that color.

## 2. Reach
Each signal has `reach`: `'campus'` or `'all'`.
- `free` is locked to `campus` (it's inherently local — don't offer the "all" option for it).
- All others default to `campus` but the broadcaster may toggle to `all`.
- The feed has a **My campus ↔ All campuses** toggle. My campus shows `reach='campus'` signals from your college. All campuses shows `reach='all'` signals from every college.

## 3. The two views (same engine, different character)

### My Campus = the live radar (now, proximity, jump in)
- Header: "Frequency" + live line **"● N broadcasting now"** (emerald pulse dot, N = active signals on your campus).
- Broadcast composer card at top ("what's your signal right now?" → opens composer).
- Intent filter tabs (horizontal scroll): **All · Free · Study · Help · Looking · Event** — color-coded, the active one filled emerald. Tapping filters the feed.
- **Overlap/serendipity banner** (emerald-tinted) when relevant: e.g. you're `free` and others are too → "you're free right now — **3 others** are too". Or "**2 others** are studying DBMS". Compute from current signals; hide if none.
- Signal cards (see §5). Show **countdown** ("2h left") and **online pulse** dot. Location intents feel immediate.

### All Campuses = the network (opportunities, help, reach)
- Header: "Frequency" + "across N campuses".
- Filter tabs skew to what travels: **All · Help · Looking for · Event · Sell** (no Free/local-only).
- Cross-campus highlight banner (purple-tinted) when relevant: "**4 hackathon teams** are looking for members this week".
- Each card shows a **college badge** (e.g. "BITS Pilani Hyd") next to the intent chip.
- Cards de-emphasize urgency; emphasize discovery. Primary action label adapts (see §5). Add a **bookmark/save** tertiary icon to save an opportunity.

## 4. The broadcast composer
Bottom sheet (match existing sheet style in the files). Fields:
1. **Note** text (≤80 chars), live char count.
2. **Intent** picker — the 6 chips, single-select, color highlights when chosen.
3. **Reach** — segmented "My campus / All campuses" (hidden/locked to campus when intent=`free`).
4. **Duration** — how long it stays live: 1h / 4h / today (sets `expires_at`). Default 4h.
5. Buttons: **Clear** + **Broadcast signal** (primary).
Saving writes the signal (one active signal per user — upsert on `user_id`). Live preview of the card at the top of the sheet is a nice touch.

## 5. Signal card + the actions (CRITICAL — get this exactly right)
Card contents:
- Avatar with **intent-colored ring** + green **online pulse** dot (if user active < 15 min).
- Name + verified check + (All-campuses only) college badge chip.
- Colored **intent chip** (icon + label).
- **Countdown** "Nh left" / "Nm left" (top-right, clock icon) — My campus emphasizes this.
- Signal note text (readable, may wrap 2 lines).
- Meta line: course · year · college (My campus omits college).
- **Raise count / social proof**: stacked responder avatars + "Priya +2 are in" (from signal_raises).

**Actions row — exactly TWO actions + one tertiary (NOT three primary buttons):**
1. **Primary button (opens the DM, label ADAPTS to intent):**
   - `free`/`looking`/`event` → **"I'm in"**
   - `study` → **"Join"**
   - `help` → **"Help out"**
   - `sell` → **"I'm interested"**
   - fallback → **"Connect"**
   Tapping it = raise your hand (optimistic count++ on the card) **AND** open/seed a DM with the host (see §6). One tap → you're registered as interested AND in a conversation. This merges "I'm in" + "Connect" into one button — do NOT add a separate Connect button (redundant).
2. **Share** (secondary): opens a Share sheet to send this signal to a friend (§7). Viral loop — keep it.
3. **Bookmark/save** (tertiary, icon-only, All-campuses cards especially): saves the signal to a "Saved" list.

If the viewer already raised their hand, the primary button shows a filled/active state ("You're in ✓") and tapping again opens the existing DM (doesn't double-raise).

## 6. The connect flow + MESSAGE REQUESTS (must build this fully)
Tapping the primary action creates/opens a 1:1 DM with the host, seeded with the signal as context:
> ✋ **{you} raised a hand on {host}'s signal**
> *"{signal note}"*

Routing depends on the relationship:
- **Mutual follow** (you follow each other) → DM thread is `accepted` → lands in the host's **main inbox**.
- **Not mutual** → DM thread is `pending` → lands in the host's **Requests**, NOT their main inbox. It's tagged **"responding to your signal"** with a hand icon + the signal quote, and grouped/prioritized above generic requests so it reads as *invited*, not cold spam. Host taps **Accept** (→ moves to main inbox, becomes a normal thread) or **Decline** (→ thread removed).

### Messages tab changes (build these)
- Add a **Requests** entry point at the top of the Messages inbox (e.g. a "Requests (N)" row/pill above the conversation list). Tapping opens the **Requests screen**.
- **Requests screen**: list of pending incoming threads. Each row shows the requester avatar/name, and if it came from a signal, the **"✋ responding to your signal: '…'"** context line. Actions per row: **Accept** / **Decline** (and a **Block** option). Accept → thread becomes accepted and appears in the main inbox; Decline → removed.
- **Main inbox** shows only `accepted` threads (plus threads you initiated). Pending incoming threads are hidden from the main list and only in Requests.
- Sent side: when YOU raise a hand on a non-mutual's signal, the thread shows in your normal sent list (you can keep chatting; they just haven't accepted yet — optionally show a subtle "Request sent" hint until accepted).

## 7. Share to a friend
Share sheet (bottom sheet): a searchable list of your friends (your DM peers + accepted follows). Selecting one (or more) forwards the signal as a message into that DM ("Thought of you — {host} is {intent label}: '{note}'", with a tappable reference). Also offer native `navigator.share` for external share if available. Demo mode: show DEMO friends; forwarding shows a success toast and adds the message to that demo thread.

## 8. Data model — write ONE new migration `002_frequency.sql`
```sql
-- Signals: add intent + reach
alter table signals add column if not exists intent text
  check (intent in ('free','study','help','looking','event','sell'));
alter table signals add column if not exists reach text
  check (reach in ('campus','all')) default 'campus';

-- Hand raises (responder interest on a signal)
create table if not exists signal_raises (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references signals(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(signal_id, user_id)
);
alter table signal_raises enable row level security;
-- RLS: a raise is visible to the raiser and to the signal owner; any auth user may insert their own raise.
create policy "raises insert own" on signal_raises for insert
  with check (auth.uid() = user_id);
create policy "raises visible to owner or raiser" on signal_raises for select
  using (auth.uid() = user_id
    or auth.uid() = (select user_id from signals where signals.id = signal_raises.signal_id));
create policy "raises delete own" on signal_raises for delete using (auth.uid() = user_id);

-- DM threads: request status for message-requests (Instagram-style)
alter table groups add column if not exists request_status text
  check (request_status in ('pending','accepted')) default 'accepted';
alter table groups add column if not exists requested_by uuid references profiles(id);
alter table groups add column if not exists origin_signal_id uuid references signals(id);

-- Saved signals (bookmark)
create table if not exists signal_saves (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references signals(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(signal_id, user_id)
);
alter table signal_saves enable row level security;
create policy "saves own" on signal_saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```
(Confirm the real table/column names against `supabase/migrations/000_schema.sql` before writing — adjust `groups`/`signals` references to match. Tell the user to run the migration; it must NOT break demo mode.)

Helper: a `create_signal_dm(host_id uuid, signal_id uuid)` RPC (or inline logic) that creates/returns the DM group, sets `request_status` based on mutual-follow, records `requested_by` + `origin_signal_id`, and inserts the seed context message. Mutual-follow check = both directions `accepted` in `follows`.

## 9. Keep the Messages top Frequency strip in sync
The strip at the top of the Messages inbox should reflect the new model: each person's avatar uses their signal's **intent-colored ring**, and "Your signal" opens the SAME composer (§4). Don't let the strip and the Connect feed drift apart — both read the signals table (or the shared demo data).

## 10. Premium "smooth + connected" feel (non-negotiable polish)
- **Optimistic updates** everywhere: raising a hand bumps the count instantly; broadcasting shows the card immediately.
- **Micro-interactions**: primary button `active:scale-95`, the raise animates (count ticks, subtle pop), pulse dots animate, countdown updates live, smooth tab/filter transitions (150–250ms), sheet slide-ups, fade-ins.
- **Skeletons** for loading, graceful **empty states** per filter ("No one's free right now — be the first" with a Broadcast CTA).
- No layout shift; no horizontal overflow at 414px; 44px+ touch targets.
- Use SVG icons from `icons.tsx` — **never emoji as UI icons** (reactions + user-typed signal text may keep emoji). Add any missing icons (HandRaiseIcon ✋, CoffeeIcon, HelpIcon, UsersGroupIcon, ConfettiIcon, TagIcon, BookmarkIcon, ShareIcon, BoltIcon, SparklesIcon, BuildingIcon) in the existing clean line-art style (stroke currentColor, strokeWidth 1.7, 24×24, round caps).

## 11. Demo mode (must be fully functional, no login)
- Seed varied demo signals across all 6 intents and both reaches, with realistic notes, some with raises and responder avatars, some with countdowns.
- "I'm in" in demo → increments count locally + navigates to a demo DM thread seeded with the signal context.
- Requests in demo → seed 2–3 pending requests (at least one "responding to your signal") in the Messages Requests screen; Accept/Decline mutate local state.
- Share in demo → friend list + success toast.
- Bookmark in demo → toggles saved state locally.
Nothing touches Supabase in demo; nothing asks the user to log in.

## 12. Guardrails (learned from prior batches — follow exactly)
- `npx tsc --noEmit` = 0 errors AND `npm run build` passes after the work.
- NO invalid Tailwind sizes (`w-4.5`, `w-5.5`, `h-4.5`, `h-5.5` don't exist — use `w-4`/`w-5` or arbitrary `w-[18px]`). Grep to confirm none.
- Only import icons you use; no unused imports.
- Do NOT leave scratch/helper scripts (e.g. `replace_emojis.js`) anywhere in the project folder.
- Don't break existing features (Chat Info settings, themes, nicknames, attendance, billing, follow system).
- Build in logical commits. Verify in `?mode=demo` at 414px with zero console errors before reporting.

## 13. Acceptance checklist
- [ ] Both views work: My Campus (radar: live count, pulse, countdown, overlap banner) and All Campuses (network: college badges, travel intents, bookmark).
- [ ] Intent filters + reach toggle filter correctly.
- [ ] Broadcast composer sets intent + reach + duration; signal appears instantly; `free` locked to campus.
- [ ] Signal card: adaptive primary (I'm in/Help out/Join/I'm interested/Connect) + Share + bookmark; raise count + responder avatars; already-raised state.
- [ ] Tapping primary raises hand (optimistic) AND opens a DM seeded with signal context.
- [ ] Message requests: non-mutual → host's Requests (tagged "responding to your signal"), mutual → main inbox. Requests screen with Accept/Decline/Block. Accept moves to inbox.
- [ ] Share forwards a signal to a friend.
- [ ] Messages top strip uses intent rings + same composer.
- [ ] Fully working in `?mode=demo` (no login, no console errors), and live with the migration.
- [ ] tsc + build clean, no `w-4.5`/`w-5.5`, no emoji-as-icons, no scratch files, no horizontal overflow at 414px.

Build it in stages (data model + composer → card + raise/connect → requests in Messages → All-Campuses view → share/bookmark → polish), commit each stage, verify, and report back for review before moving on.

---

## STAGE 4 (final) — All Campuses + Share + bookmark + IA cleanup + polish

### 4a. Information-architecture cleanup (do this as part of Stage 4)
Two kinds of "Requests" currently confuse users. Fix the placement:

- **Remove the "Requests" tab from `Connect.tsx` entirely.** Connect becomes purely the Frequency feed + the My Campus / All Campuses toggle. Delete the Requests tab UI, its state, and move the follow-request logic out (see next bullet). Do NOT delete the `acceptReq`/`declineReq` logic — relocate it.
- **Move FOLLOW requests into the Home notifications bell.** `Home.tsx` already has a notification bell (top-right) opening `NotificationsSheet` backed by `data.notifications`. Surface pending follow requests there as actionable items: avatar + "{name} requested to follow you" + **Accept** / **✕ Decline** inline. Accept → `follows.status='accepted'`; Decline → delete the `follows` row. The bell's unread badge count should include pending follow requests. In demo, seed 1–2 follow requests into the notifications list (reuse the old `DEMO_REQUESTS`).
- **Leave MESSAGE requests exactly where they are** (Messages tab → Requests sub-screen, built in Stage 3). Do not move them to Connect. The main inbox stays clean; accepted threads already auto-graduate into the inbox.
- Net result: Connect = feed only; follow requests = Home notifications; message requests = Messages Requests screen.

### 4b. All Campuses network view
Per §3 of this spec: when the toggle is on All Campuses, show `reach='all'` signals from every college; each card shows a **college badge**; filters skew to travel intents (Help/Looking/Event/Sell — drop Free); add the cross-campus highlight banner; the primary action label still adapts (Connect/Help out/I'm interested); add the **bookmark/save** tertiary on cards.

### 4c. Share to a friend
Per §7: Share sheet with a searchable friend list (your DM peers + accepted follows); selecting forwards the signal as a message into that DM; offer `navigator.share` fallback; demo shows friends + success toast.

### 4d. Final polish
Skeletons, empty states per filter, optimistic updates, smooth micro-interactions (active:scale, transitions), countdown ticking, online pulse. 414px, no overflow, 44px targets.

### Stage 4 acceptance
- [ ] Connect has NO Requests tab — just the feed + campus toggle.
- [ ] Follow requests appear in Home notifications with working Accept/Decline; bell badge counts them.
- [ ] Message requests still work in Messages (unchanged from Stage 3).
- [ ] All Campuses view: college badges, travel intents, highlight banner, bookmark, adaptive primary.
- [ ] Share forwards a signal to a friend.
- [ ] Demo fully works (no login, no console errors); tsc + build clean; no `w-4.5`/`w-5.5`; SVG icons only; no scratch files; 414px no overflow.
