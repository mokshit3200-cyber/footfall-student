# Antigravity Task — Marketplace: fix image bug + add edit/delete for own listings

**Project:** `C:\Dev\Software Services\footfall-student` (Next.js 14 App Router PWA, TypeScript, Tailwind, Supabase). Dev: `npm run dev` → http://localhost:3200. App name **Cmpus**. Dark monochrome theme.

**Goal:** The Marketplace tab already creates listings to Supabase (real). But there are two problems: (1) a bug means listing images NEVER save to the DB, and (2) a user cannot edit or delete their own listings. Fix both.

**File to work in:** `components/Marketplace.tsx` only.  
**DO NOT touch:** Home.tsx, Money.tsx, Profile.tsx, Connect.tsx, the bottom nav.

---

## Bug 1 — Image column name mismatch (images never save)

In `LiveListingSheet.save()` (~line 129), the insert does:
```ts
image_url: image || null,
```
But the Supabase `listings` table schema has column `images text[]` (an array), NOT `image_url`. So the image is silently dropped (Supabase ignores unknown columns by default).

**Fix:** Change the insert to use the correct column:
```ts
images: image ? [image] : [],
```
And when reading listings back in `LiveMarketplace.fetchListings`, change everywhere that references `item.image_url` to `item.images?.[0]` (it's an array, take the first).

Search for every `item.image_url` or `listing.image_url` reference in Marketplace.tsx and replace with `item.images?.[0]` or `(item.images ?? [])[0]`.

---

## Bug 2 — No edit or delete for own listings

When a logged-in user views the Marketplace, they can see their own listings (the query already returns them with `user_id`). But tapping one only shows a detail view — there's no way to edit title/price/description or delete the listing.

**Fix:** In the listing detail view (the `sel` / selected listing sheet), when `sel.user_id === user?.id` (it's the logged-in user's own listing), show two extra buttons: **Edit** and **Delete**.

### Delete
Simple: confirm dialog → `supabase.from("listings").delete().eq("id", sel.id).eq("user_id", user.id)` → close detail sheet → refetch listings. Show a brief "Deleting…" state.

### Edit
Open a pre-filled edit sheet (can reuse/extend `LiveListingSheet` or make a separate `EditListingSheet` — your choice). Pre-fill title, category, price, description, image from the selected listing. On save:
```ts
await supabase.from("listings").update({
  title: title.trim(),
  description: description.trim(),
  price: contactForPrice ? 0 : Number(price) || 0,
  category,
  images: image ? [image] : existing_images,
}).eq("id", sel.id).eq("user_id", user.id);
```
On success: close sheet → refetch listings.

### "My Listings" badge
In the listing card grid, if `item.user_id === user?.id`, show a small "Mine" badge (e.g. a tiny brand-green dot or "Your listing" label) so the user can distinguish their own.

---

## Minor bugs to fix while you're here

1. **College guard on post:** The save button in `LiveListingSheet` is disabled if `!profile?.college`. If profile hasn't loaded yet, user sees a permanently disabled button. Add a helper message: `"Set your college in Profile to post listings."` below the button when this condition is true.

2. **Delete own listing from Profile tab:** The Profile tab shows "My Listings" from the local store (`data.listings`). After this task, real listings come from Supabase. The Profile tab's "My Listings" section may show stale local data. That's OK for now — note it in your summary. (We'll fix Profile separately.)

---

## Acceptance
- `npx tsc --noEmit` → 0 errors
- Post a listing with a photo → reload → photo appears (image saved to DB).
- Own listing shows Edit + Delete buttons. Editing updates the listing. Deleting removes it and it disappears from the grid.
- Other people's listings: no Edit/Delete buttons visible.
- Demo mode: show demo listings as before, no write calls.
- No console errors.

Report: exact fix for the image column, how you implemented Edit/Delete, and whether you shared a component or made a separate EditListingSheet.
