# Antigravity Task — Rework the Profile View (kill the fake Instagram clone)

**Project:** `C:\Dev\Software Services\footfall-student` (Cmpus — Next.js 14 PWA, dark monochrome, brand emerald `#0F8F6F`). Dev: `npm run dev` on port 3200. Demo URL: `?mode=demo`.

## The problem (why we're doing this)

There are **3 different, inconsistent profile views** in the app, and the worst one is a **fake Instagram clone** with hardcoded mock data:

1. `components/Messages.tsx` → `DraggableProfileSheet` (lines ~3498–3749). **THIS IS THE BAD ONE.** It shows **Posts / Media / Links tabs**, hardcoded `142 followers / 98 following`, fake empty post grids, hardcoded `github.com` + `linkedin.com` links, and `isMutual = peer.id === "dp1"`. None of it is real. **Delete it.**
2. `components/Connect.tsx` → the `if (viewProfile)` full-screen sheet (lines ~1234–1373). Shows broadcast/skills/links. Closer to right, but separate code.
3. `components/Profile.tsx` → has its own person-profile rendering too (~line 1300+).

**Cmpus is NOT Instagram.** We do not have posts or media galleries. A profile should show who the person is + how to reach them + their campus business if they have one.

## Goal

Build **ONE shared profile component** — `components/UserProfileView.tsx` — and use it everywhere a profile is opened (vibe card, follow request, DM header, chat info, search result, story tap). Delete the fake Instagram sheet and the duplicated profile markup.

## What a profile must show (top → bottom)

1. **Header:** avatar (or initials), name + verified tick, `@username`, and `college · course · Year N`.
2. **Current vibe** (if broadcasting): the pill/line showing their active signal text (we already pass `content` / `signal`).
3. **Bio:** `profile.bio` free text. If empty, hide the block.
4. **Follow stats:** real Followers / Following counts. In **live mode you MUST use the RPC** `supabase.rpc('get_follow_counts', { profile_id: peer.id })` → returns `[{ followers, following }]`. Do NOT count the `follows` table directly client-side — RLS only exposes rows involving the current user, so a raw count of someone else's followers returns the wrong number (0/1). Show a small **Mutual** pill when both directions are `accepted` (you CAN read your own follow rows to determine mutual). Demo mode may use the seeded mock counts. NO hardcoded numbers in live mode.
5. **Social links** (from `profile.links` jsonb — keys: `instagram`, `linkedin`, `github`, `portfolio`): render only the ones that exist, as tappable chips/rows with the right icon. Instagram → `https://instagram.com/<handle>`, LinkedIn → `https://linkedin.com/in/<handle>`, GitHub → `https://github.com/<handle>`, portfolio → open as-is. NO hardcoded URLs.
6. **Business / Storefront** (the important new bit): if the person has a business, show a "Shop" section:
   - If `profile.business_name` is set → a business card: `business_name`, `business_type` ('sell'|'service'|'club') as a label, and `business_contact`.
   - Query their **active listings** (`listings` where `user_id = peer.id and active = true`) and show them as a **horizontal-scroll mini storefront** (image + title + ₹price). Tap a listing → go to the Market tab opened on that item: `onSwitchTab('market')` then set URL `?tab=market&item=<listingId>` (Marketplace already reads the `item` param — see `LiveMarketplace`, `itemParam`).
   - If no business_name and no listings → hide the whole section.
7. **Action buttons** (state-aware, real follow state — reuse the `followStates`/`handleFollow` logic already in Connect.tsx):
   - `none` → **Follow** (or **Request** if their account is private)
   - `pending` → **Requested** (disabled-look)
   - `following` → **Following** (tap to unfollow)
   - `mutual` → **Message** (opens DM via existing `openDm`/`create_dm`) + **Following**
8. **Private gate:** if `is_private` and you're not following/mutual, show the lock state (bio/links/storefront hidden, only header + Follow). Keep the existing private-gate pattern from Connect.tsx.

NO "Posts" tab. NO "Media" tab. NO tab strip at all — it's a single scrollable sheet.

## Follow-request preview (the second ask)

When someone requests to follow you, you must be able to **open their full profile (bio, links, business, everything) BEFORE accepting/declining** — like every real social app.

- The Follow Requests sheet already exists in `Connect.tsx` (banner + bottom sheet, `followRequests`, `acceptRequest`, `declineRequest`). Tapping a requester already calls `openViewProfile`.
- Make tapping a requester open the **new `UserProfileView`** with **Accept / Decline** buttons shown inline at the top of the actions area (since their relationship to you is "pending incoming request"), in addition to being able to view all their info.
- **This was failing because of the DATABASE, not the UI** — see DB section below. The same-college RLS hid cross-campus requesters. The migration fixes it.

## DATABASE — run this first (already written)

Run `supabase/migrations/008_profile_visibility.sql` in the Supabase SQL Editor (footfall-student project, ap-south-1). It adds two RLS policies:
- View the profile of anyone who has a follow row with you (pending or accepted, either direction) → fixes the "can't see requester before accepting" bug, including cross-campus.
- View active listings of your follow relationships → so the storefront isn't empty for cross-campus mutuals.

No new columns are needed — `profiles` already has `bio`, `links`, `business_name`, `business_type`, `business_contact`. **Tell Mokshit when this SQL has been run.**

## Implementation steps

1. **Create `components/UserProfileView.tsx`** — a single component:
   - Props: `{ peer, open, onClose, demo, currentUserId, onSwitchTab, onOpenDm, followState, onFollow, onAccept?, onDecline?, mode?: 'view' | 'request' }`.
   - Fetch on open (live mode): full profile by id, follower/following counts, and active listings for storefront. In demo mode, read from the existing demo seeds (DEMO_SEARCH_PEOPLE, DEMO listings, etc.) — keep demo working with no network.
   - Render the sections above. Use existing brand styles (cards, pills, `text-ink`, `bg-brand-500`, etc.).
   - **Hooks rule:** declare ALL hooks at the top, before any `if (!open) return null`. (We just fixed a "Rendered fewer hooks than expected" crash caused by a hook after an early return — do not reintroduce it.)
2. **Replace `DraggableProfileSheet` in `Messages.tsx`** with `UserProfileView`. Delete the old component body (3498–3749). Wire `onStartChat` → existing DM open logic; pass real `followState`.
3. **Replace the `if (viewProfile)` block in `Connect.tsx`** (1234–1373) with `UserProfileView`. Keep `openViewProfile`'s data-loading but render via the shared component. Follow requests pass `mode="request"` with `onAccept`/`onDecline`.
4. **Replace the person-profile markup in `Profile.tsx`** (~1300+) with the shared component too, so there is exactly one profile UI.
5. Make sure every entry point (vibe card, search result, DM header tap, chat info "view profile", story avatar tap, follow request row) opens the SAME `UserProfileView`.
6. Remove now-unused imports (`ImageIcon`, mock link blocks, etc.).

## Acceptance criteria (test in `?mode=demo` AND a real account)

- [ ] No "Posts/Media/Links" tabs anywhere. No hardcoded 142/98 counts. No hardcoded github/linkedin URLs.
- [ ] Opening a profile from a **vibe card**, **search**, **DM header**, **chat info**, **story**, and **follow request** all show the same component.
- [ ] Bio, real social links, and (if present) business storefront render; tapping a storefront item opens that item in Market.
- [ ] Follow button reflects real state (none/pending/following/mutual); Message only for mutuals.
- [ ] A **follow request from another college** opens with full bio/links/business visible, with Accept/Decline. (Requires 008 migration applied.)
- [ ] No client-side crash; `npm run build` passes; all hooks declared before early returns.

## Notes
- Vercel is NOT git-auto-deployed. After building, deploy with `npx vercel --prod --yes` from the project root, OR tell Mokshit to.
- Keep the dark monochrome theme + emerald accents. Match the polish of the rest of the app (rounded cards, soft borders `border-white/[0.06]`, `active:scale-95`).
- The service worker is now network-first for JS (cmpus-v4) — a hard refresh once after deploy picks up changes.
