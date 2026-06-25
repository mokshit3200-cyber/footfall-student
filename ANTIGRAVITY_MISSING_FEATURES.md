# Antigravity Task — All Missing Basic Features

**Project:** `C:\Dev\Software Services\footfall-student`
**Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase
**Dev port:** 3200
**Theme:** Dark monochrome, brand emerald `#0F8F6F`

This prompt covers every missing basic feature across the entire app.
Build them all. tsc --noEmit must pass 0 errors when done.

---

## TASK 1 — Delete own message in DM (`components/Connect.tsx`)

In the DM chat screen (the `if (activeDmId && activePeer)` early return block),
each message bubble needs a delete button visible only on your own messages.

**How it works:**
- Long-press OR tap a small trash icon that appears on hover/tap on own message bubbles
- Own messages: `m.sender_id === user?.id` (live) or `m.sender_id === "me"` (demo)
- Tapping delete: confirm with a small inline "Delete?" + "Yes / No" — no browser confirm()
- Live mode: `supabase.from("messages").delete().eq("id", m.id)`
- Demo mode: remove from local `messages` state array + update `localStorage` key `demo_messages_${activeDmId}`
- After delete, remove from the `messages` state array immediately (optimistic)

**UI:** On your own message bubble, show a small red trash icon button to the left of the bubble (outside the bubble). Only show it on tap (use a `selectedMsgId` state, tap message → select, tap elsewhere → deselect). Show a tiny "Delete?" pill with "Yes" / "No" buttons when selected.

---

## TASK 2 — Private profile privacy gate (`components/Connect.tsx`)

In the `viewProfile` early return block (where other users' profiles are shown), currently skills and links are not gated at all.

**Rule:** If `profileData.is_private === true` AND `state !== "following"` AND `state !== "mutual"` → show a lock wall instead of their skills/links.

**What to add after the Follow/Message buttons row:**

```tsx
{profileData.is_private && state !== "following" && state !== "mutual" ? (
  <div className="mt-8 text-center px-4">
    <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-3">
      <LockIcon className="w-7 h-7 text-ink-mute" />
    </div>
    <p className="text-sm font-bold text-ink">This account is private</p>
    <p className="text-xs text-ink-mute mt-1 leading-relaxed">Follow to see their skills, links, and full profile</p>
  </div>
) : (
  <>
    {/* Skills */}
    {profileData.skills?.length > 0 && (
      <div className="mt-5 px-1">
        <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider mb-2">Skills</p>
        <div className="flex flex-wrap gap-2">
          {profileData.skills.map((s: string) => (
            <span key={s} className="px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-medium text-ink-soft">{s}</span>
          ))}
        </div>
      </div>
    )}
    {/* Links */}
    {profileData.links && Object.values(profileData.links).some(Boolean) && (
      <div className="mt-4 px-1">
        <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider mb-2">Links</p>
        <div className="space-y-2">
          {Object.entries(profileData.links).map(([label, url]) => url && (
            <a key={label} href={url as string} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-brand-300 font-medium active:opacity-70">
              <span className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-[10px] shrink-0 capitalize">{label[0].toUpperCase()}</span>
              <span className="truncate">{url as string}</span>
            </a>
          ))}
        </div>
      </div>
    )}
  </>
)}
```

Also load `profileData.skills` and `profileData.links` from Supabase when opening a viewed profile. Right now the viewed profile only has data from the signal card (no skills/links). When `setViewProfile(sig)` is called, do a secondary fetch:

```typescript
// After setting view profile from signal click, fetch full profile data
async function openViewProfile(partialProfile: any) {
  setViewProfile(partialProfile); // show immediately with what we have
  if (!demo && partialProfile.id) {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url, college, course, year, verified, is_private, skills, links, bio")
      .eq("id", partialProfile.id)
      .single();
    if (data) setViewProfile((prev: any) => ({ ...prev, ...data }));
  }
}
```

Replace all `setViewProfile(sig)` calls with `openViewProfile(sig)` and `setViewProfile(p)` for search results with `openViewProfile(p)`.

---

## TASK 3 — Block user

### 3a. Block from DM chat header (`components/Connect.tsx`)

In the DM chat screen header (where the back button and peer name are), add a `⋯` (three dots) button on the right. Tapping opens a small action sheet with:
- **Block [name]** (red) → confirm inline ("Block this user? They won't be able to message you." + "Block / Cancel")

**Block action (live):**
```typescript
await supabase.from("blocks").insert({ blocker_id: user!.id, blocked_id: activePeer.id });
// Then close DM: setActiveDmId(null); setActivePeer(null);
```

**Block action (demo):** Just close the DM and show a toast "User blocked".

### 3b. Block from viewed profile sheet (`components/Connect.tsx`)

In the `viewProfile` block, add a `⋯` button in the top-right of the profile header. Same action sheet: **Block [name]** → confirms → runs block insert → closes profile.

**After blocking:** Remove that user's signals from the feed: `setSignals(prev => prev.filter(s => s.user_id !== blockedId))`.

Note: The `blocks` table already exists (migration 003 created it). Schema: `blocker_id uuid, blocked_id uuid`.

---

## TASK 4 — Remove follower (`components/Profile.tsx`)

In the **SocialListSheet** (followers list, `socialSheetType === "followers"`), each row has a "Follow back" / "Following" button. Add a **"Remove"** button (small, secondary) next to each follower row.

**Action:**
```typescript
// Remove a follower (they follow you, you are removing them)
await supabase.from("follows")
  .delete()
  .eq("follower_id", person.id)
  .eq("following_id", user!.id);
// Then remove from socialPeople list + decrement followerCount
```

**Demo mode:** Just remove from `socialPeople` state and decrement `followerCount`.

**UI:** Small ghost button "Remove" in red/muted color to the right of each follower row. Show a brief inline confirmation: change button to "Sure?" → tap again to confirm.

---

## TASK 5 — Mark listing as Sold (`components/Marketplace.tsx`)

In the **EditListingSheet** (where the user edits their own listing), add a "Mark as Sold" button above the Delete button.

**What it does:**
- Sets `listing.sold = true` (or `listing.active = false`)
- In Supabase: `supabase.from("listings").update({ active: false }).eq("id", listing.id)`
- In store: `update(d => { const l = d.listings.find(x => x.id === listing.id); if (l) l.active = false; })`
- Closes the sheet and shows a toast "Marked as sold ✓"
- On the listing card in the browse view, show a "SOLD" badge overlay (grey overlay + "SOLD" text) on the listing image if `listing.active === false` or `listing.sold === true`

**Demo mode:** Just update the store state + show toast.

**UI of button:**
```tsx
<button
  onClick={markAsSold}
  className="w-full py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-ink-soft font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
>
  <span>✓</span>
  <span>Mark as Sold</span>
</button>
```

Also update the `Listing` type in `lib/types.ts` if it doesn't have a `sold` or `active` field — add `active?: boolean`.

---

## TASK 6 — DM seller from Marketplace (`components/Marketplace.tsx`)

In the listing detail modal/sheet (where you see the full listing with contact info), replace or supplement the "Contact" text with an **"Message Seller"** button that opens a DM.

**Problem:** Marketplace doesn't have access to `openDm` from Connect. Solution: emit an event or use a callback prop.

**Implementation:** Add an optional prop to Marketplace: `onOpenDm?: (peerId: string, peerName: string) => void`. Pass it from the parent page/shell that renders both Connect and Marketplace tabs. When tapped, call `onOpenDm(listing.userId, listing.seller)`.

In the listing detail view, show:
```tsx
{onOpenDm && listing.userId && !listing.mine && (
  <button
    onClick={() => onOpenDm!(listing.userId!, listing.seller)}
    className="btn-primary w-full flex items-center justify-center gap-2 mt-3"
  >
    <ChatIcon className="w-4 h-4" />
    <span>Message Seller</span>
  </button>
)}
```

If `listing.userId` is not currently stored on the Listing type, add it: `userId?: string` in `lib/types.ts`. When loading listings from Supabase, include `user_id` in the select and map it to `userId`.

**Demo mode:** `onOpenDm` will be null for demo, so the button won't show — that's fine.

---

## TASK 7 — Edit expense & edit split (`components/Money.tsx`)

Currently expenses and splits can only be deleted, not edited.

### 7a. Edit expense

When tapping an expense row (or a small pencil icon), open an "Edit Expense" bottom sheet pre-filled with the existing amount, category, date, note. On save:
- Update in `data.expenses` store array
- `supabase.from("expenses").update({ amount, category, date, note }).eq("id", expense.id)`

Re-use the same form UI as the existing "Add Expense" sheet. Add an `editingExpense` state: `const [editingExpense, setEditingExpense] = useState<Expense | null>(null)`. If `editingExpense` is set, show the sheet pre-filled and "Save" → update instead of insert.

### 7b. Edit split

Same pattern for splits. `editingSplit` state. Pre-fill the split sheet with existing total, people, date, note. On save:
- Update in `data.splits` store array
- `supabase.from("splits").update({ total_amount, split_with, date, description }).eq("id", split.id)`

**Demo mode:** Just update the store state.

---

## TASK 8 — Leave / Delete DM conversation (`components/Connect.tsx`)

In the `⋯` action sheet added in Task 3a (DM chat header), add a second option:

**"Delete conversation"** → confirm inline → deletes the conversation:
- Live: `supabase.from("groups").delete().eq("id", activeDmId)` (cascade deletes members + messages via FK)
- Demo: Remove from `demo_groups` localStorage + clear `demo_messages_${activeDmId}` localStorage
- Then: `setActiveDmId(null); setActivePeer(null); onChatOpen?.(false)`

---

## Summary of files to touch

| File | Changes |
|---|---|
| `components/Connect.tsx` | Tasks 1, 2, 3a, 3b, 8 |
| `components/Profile.tsx` | Task 4 |
| `components/Marketplace.tsx` | Tasks 5, 6 |
| `components/Money.tsx` | Task 7 |
| `lib/types.ts` | Add `active?: boolean` to Listing, `userId?: string` to Listing |
| Parent shell/page that renders tabs | Pass `onOpenDm` prop to Marketplace |

---

## Acceptance criteria

- `tsc --noEmit` → 0 errors
- Delete message: appears on own messages only, confirms inline, removes from UI immediately
- Private profile: lock wall shown to non-followers, skills/links loaded and shown to followers
- Block: works from DM header and from viewed profile, signal disappears from feed
- Remove follower: two-tap confirm, updates count
- Mark as sold: SOLD badge appears on listing card, button in edit sheet
- Message seller: button appears in listing detail for non-own listings (live mode only)
- Edit expense/split: pre-fills form, saves correctly
- Delete conversation: removes from inbox, closes chat
- Demo mode handled for all features (no Supabase writes)

## DO NOT touch
- `components/Home.tsx`
- `components/StoryViewer.tsx`
- `components/AuthGate.tsx`
- `components/PWA.tsx`
- `supabase/migrations/` (no new migrations needed — blocks table already exists from migration 003)

## Report back
1. `tsc --noEmit` result
2. Files changed + line ranges
3. Any decisions made not specified here
