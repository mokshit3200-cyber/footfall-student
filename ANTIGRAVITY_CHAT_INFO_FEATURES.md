# Antigravity Task — Make Chat Info settings fully functional (Instagram-grade)

## Project
- Path: `C:\Dev\Software Services\footfall-student`
- Stack: Next.js 14 App Router PWA, TypeScript, Tailwind, Supabase (project "footfall-student", `https://fqvrqegauytsfltkptyh.supabase.co`)
- Dev server: `npx next dev -p 3200`
- Demo mode: append `?mode=demo` to the URL. `isDemo()` from `@/lib/config`. In demo mode there is NO Supabase user — everything must work locally with fake/in-memory state. NEVER ask the user to log in or show errors in demo mode.

## Where the work is
All of this lives in **`components/Messages.tsx`**. The `ChatInfoScreen` function component (search for `function ChatInfoScreen`) is the full-screen Instagram-style "Chat Info" panel that opens when you tap the chat header / the ⋮ button inside a DM.

It currently renders 5 settings rows that are **placeholders** (they look right but do nothing except the local `muted`/`disappearing` toggles). Your job is to make every row a real, working feature. Keep the existing premium dark visual style (emerald `brand-500` accents, `#0c0c0e` surfaces, rounded cards) — do NOT restyle, just add functionality. Match the look of the existing bottom sheets in the file (compose sheet, signal sheet, actions sheet) for any new sub-screens/sheets you add.

Props ChatInfoScreen already receives: `peer`, `convo`, `messages`, `onBack`, `onSwitchTab`, `onViewProfile`, `onCreateGroup`. The Profile button and "Create a group chat" are ALREADY wired — leave them. Build the rest.

## Build these — each must actually work (demo + live)

### 1. 🎨 Theme  (currently shows "Default" + a dot)
- Tapping opens a theme picker (a bottom sheet over the Chat Info screen, same style as the other sheets in the file).
- Offer ~6 chat color themes (e.g. Default emerald, Ocean blue, Sunset orange/pink, Purple, Mono/graphite, Rose). Each is a swatch.
- Selecting a theme:
  - Updates the "Default" subtitle text to the chosen theme name + recolors the dot preview.
  - **Actually recolors the chat bubbles** for THIS conversation — the sent-message bubble color (`SwipeMessageBubble`, the `mine` branch uses `bg-brand-500`). Drive it from a per-conversation theme value (CSS variable or a color prop threaded down to the bubbles). The user must SEE the bubbles change color when they go back to the chat.
  - Persists per `group_id`: demo → in-memory state (lost on refresh is fine for demo); live → store on the `groups` row (add a `theme text` column via migration) or localStorage keyed by group_id. Pick the simplest robust approach and note it.

### 2. ⏰ Disappearing messages  (currently a dumb Off/On toggle)
- Tapping opens a small sheet with options: Off / 24 hours / 7 days / 90 days (Instagram-style).
- When ON: show a subtle banner/pill at the top of the chat ("Disappearing messages: 24h") and visually mark messages with a small ⏳ indicator. For demo, you don't need real deletion timers — but the setting must persist for the session and the chat must reflect it. For live, store the value on the group row.
- Subtitle under the row reflects the current choice ("Off", "24 hours", etc).

### 3. 🔒 Privacy and safety  (currently does nothing)
- Tapping opens a sub-screen (full screen, same back-button pattern as ChatInfoScreen) with working toggles:
  - "Read receipts" (on/off)
  - "Show activity status" (on/off)
  - "Restrict" (explain: they won't know they're restricted)
  - "Block" — confirms, then removes the conversation from the inbox and returns to inbox (demo: filter it out of `convos`; live: also write to a `blocks` table or a `blocked_users` array).
  - "Report" — opens a reason picker (Spam / Harassment / Fake account / Other), then shows a "Thanks, we'll review this" confirmation toast.
- Toggles persist for the session; live mode writes to Supabase where a table exists, otherwise localStorage.

### 4. 😄 Nicknames  (currently does nothing)
- Tapping opens a sheet to set a custom nickname for the peer (and for "You").
- Saving a nickname:
  - **Replaces the displayed name** for that peer in the chat header AND the inbox row AND message clusters (thread the nickname through, or store a `nickname` map keyed by user/group id).
  - Persists: demo → in-memory; live → a `nickname text` field somewhere sensible (e.g. a `conversation_nicknames` table or a JSON column on group_members). Simplest robust approach, note it.
  - Includes a "Reset to real name" action.

### 5. Shared media tabs (Photos & Videos / Links / Files)
- Make the **Links** tab actually scan `messages` for URLs (reuse the URL regex already in `SwipeMessageBubble` → `renderContent`) and list the real links found in this conversation, newest first, each opening in a new tab. If none, keep the empty state.
- Photos & Videos / Files can stay as graceful empty states for now (no media pipeline yet) — but wire them to real message attachments later if/when attachments exist.

## Migrations
If you add Supabase columns/tables (theme, disappearing, nickname, blocks), write a single new SQL migration file under the existing `supabase/migrations` (or wherever migrations live in this repo — check first) and tell the user to run it. Do NOT break demo mode — every feature must work with `?mode=demo` and no auth.

## Acceptance checklist (test all in `?mode=demo`)
- [ ] Theme picker changes the actual sent-bubble color in the chat, persists in session, subtitle + dot update.
- [ ] Disappearing messages picker sets a duration, chat shows the banner/indicator, subtitle updates.
- [ ] Privacy sub-screen toggles work; Block removes the chat and returns to inbox; Report shows confirmation.
- [ ] Nicknames update the name everywhere (header, inbox, clusters) and can be reset.
- [ ] Links tab lists real URLs found in the conversation messages.
- [ ] `npx tsc --noEmit` passes with zero errors.
- [ ] No console errors in demo mode. Nothing asks the user to log in.

## Style rules
- Keep it premium/enterprise-grade, identical visual language to the rest of Messages.tsx.
- Reuse existing patterns: bottom sheets (`fixed inset-0 bg-black/70 ... rounded-t-[32px]`), back-button sub-screens (`fixed inset-0 z-50 bg-black flex flex-col`), `brand-500` accents, `ink`/`ink-soft`/`ink-mute` text tokens.
- Touch-friendly, `active:scale-95` press feedback, smooth.

Commit in logical chunks. After you're done, run tsc, verify in demo, and hand back to Claude for review before deploy.
