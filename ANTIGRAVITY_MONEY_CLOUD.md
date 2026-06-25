# Antigravity Task — Money tab: make expenses & splits cloud-backed

**Project:** `C:\Dev\Software Services\footfall-student` (Next.js 14 App Router PWA, TypeScript, Tailwind, Supabase). Dev: `npm run dev` → http://localhost:3200. App name **Cmpus**. Dark monochrome theme.

**Goal:** Every expense and bill split the user adds in the **Money tab** must save to Supabase immediately, and load back on next login from any device. Right now expenses load from Supabase on login (`dbLoadAll`) but all adds/deletes go to localStorage only — so data is lost if localStorage is cleared or user logs in on a new phone.

**Files to work in:**
- `lib/dbActions.ts` — add `dbSaveExpense`, `dbDeleteExpense`, `dbSaveSplit`, `dbDeleteSplit`, and update `dbLoadAll` to load splits
- `components/Money.tsx` — wire the new functions after every local `update()` write
- `lib/auth.ts` — (read only, to understand `useAuth()`)

**DO NOT touch:** Home.tsx, Connect.tsx, Profile.tsx, Marketplace.tsx, the bottom nav.

---

## Supabase tables (already exist — no schema changes needed)

**`expenses`:** `id uuid, user_id uuid, amount numeric, category text, note text, date date`  
**`splits`:** `id uuid, user_id uuid, description text, total_amount numeric, split_with jsonb, date date`

Both tables have RLS: own rows only.

---

## What to add to `lib/dbActions.ts`

```ts
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
      split_with: split.people, // jsonb array of names
      date: split.date,
    },
    { onConflict: "id" }
  );
}

export async function dbDeleteSplit(splitId: string) {
  await supabase.from("splits").delete().eq("id", splitId);
}
```

## What to fix in `dbLoadAll`

`dbLoadAll` currently loads expenses but does NOT load splits. Add splits loading:
```ts
supabase.from("splits").select("*").eq("user_id", userId)
// In the update block, after expenses:
const splitsData = splitsRes.data;
if (splitsData && splitsData.length > 0) {
  d.splits = splitsData.map((s) => ({
    id: s.id,
    total: Number(s.total_amount),
    people: (s.split_with as string[]) ?? [],
    paidBy: "me", // paidBy not stored in DB, default to "me"
    date: s.date,
    note: s.description ?? undefined,
  }));
}
```

## What to wire in `components/Money.tsx`

In `Money.tsx`, find every place that modifies `d.expenses` or `d.splits` in the store and add the Supabase call immediately after. Pattern for each:

```ts
// 1. Expenses — find the "add expense" handler (look for d.expenses.push(...))
// After: update((d) => { d.expenses.push(newExpense); })
// Add:   if (!isDemo() && user) dbSaveExpense(user.id, newExpense);

// 2. Expenses — find the "delete expense" handler (look for expenses.filter or splice)
// After: update((d) => { d.expenses = d.expenses.filter(e => e.id !== id) })
// Add:   if (!isDemo() && user) dbDeleteExpense(id);

// 3. Splits — find the "add split" handler (d.splits.push(...))
// After: update((d) => { d.splits.push(newSplit); })
// Add:   if (!isDemo() && user) dbSaveSplit(user.id, newSplit);

// 4. Splits — find the "delete split" handler (d.splits.filter(...))
// After local delete, add:   if (!isDemo() && user) dbDeleteSplit(id);
```

Money.tsx does NOT import `useAuth` yet — add it:
```ts
import { useAuth } from "@/lib/auth";
import { isDemo } from "@/lib/config";
// In component:
const { user } = useAuth();
```

Also import the new db functions from `@/lib/dbActions`.

---

## Acceptance
- `npx tsc --noEmit` → 0 errors
- Real login: add an expense → reload page → expense still there (loaded from Supabase). Delete it → gone after reload.
- Add a split → reload → still there.
- Demo mode (`?mode=demo`): no network writes, demo data unchanged.
- No console errors.

Report: which Money.tsx lines you wired (add/delete for both expense and split), and confirm dbLoadAll now loads splits.
