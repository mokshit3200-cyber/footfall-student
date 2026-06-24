# Antigravity Task — Full premium UI polish pass (Apple / top-enterprise grade, mobile-first)

## North star
Make Footfall Student feel like a **flagship consumer app** — the quality bar is **Apple, Instagram, Linear, Things**. Right now it reads "hackathon project" mainly because of **236 emoji used as UI icons across 13 files**. That is the #1 thing to kill. After that, tighten spacing, typography, buttons, cards, empty states, and micro-interactions so every screen feels intentional and premium.

**This is a MOBILE app first.** Design for a 390–430px phone viewport (test at 414px). It's a PWA people install on their phone. Desktop is secondary — don't break it, but optimize for mobile.

## Project
- Path: `C:\Dev\Software Services\footfall-student`
- Next.js 14 App Router PWA, TypeScript, Tailwind. Dark monochrome Instagram-style theme already in place.
- Dev: `npx next dev -p 3200`. Demo: append `?mode=demo` (no login). Test EVERYTHING in demo mode.
- Brand: emerald `brand-500` = `#0F8F6F`. Text tokens: `text-ink`, `text-ink-soft`, `text-ink-mute`. Surfaces: `#0c0c0e`, `#1a1a1a`, `bg-white/[0.04]` etc.

## RULE 1 — Kill the emoji (highest priority)
Replace every emoji used as a UI control/icon with the SVG icons in `components/icons.tsx`. I just expanded that file — it now includes:
`PhoneIcon, VideoIcon, CameraIcon, MicIcon, ImageIcon, PaperclipIcon, SmileIcon, PaletteIcon, LockIcon, ShieldIcon, EyeIcon, EyeOffIcon, PinIcon, BellOffIcon, MailIcon, BanIcon, AlertIcon, FlagIcon, SignalIcon, LinkIcon, FileIcon, EditIcon, CheckCheckIcon, MapPinIcon, GraduationIcon` plus the existing `HomeIcon, UsersIcon, StoreIcon, UserIcon, ChatIcon, SearchIcon, SendIcon, DotsIcon, UserPlusIcon, ArrowLeftIcon, CalendarIcon, ClockIcon, CheckIcon, PlusIcon, BookIcon, BriefcaseIcon, ChevronRight, SparkIcon, TrashIcon, XIcon, CampusIcon, BellIcon, GearIcon, WalletIcon, ArrowUp/DownIcon`.

Mapping guide (emoji → icon):
- 📞 → `PhoneIcon`, 📹 → `VideoIcon`, 📷 → `CameraIcon`, 🎤 → `MicIcon`, 🖼️ → `ImageIcon`, 📎 → `PaperclipIcon`, 😊/😄 → `SmileIcon`
- 🎨 → `PaletteIcon`, ⏰ → `ClockIcon`, 🔒 → `LockIcon`, 🛡️ → `ShieldIcon`, 👁️ → `EyeIcon`/`EyeOffIcon`
- 📌 → `PinIcon`, 🔕 → `BellOffIcon`, 🔔 → `BellIcon`, ✉️ → `MailIcon`, 🗑️ → `TrashIcon`, 🚫 → `BanIcon`, ⚠️ → `AlertIcon`, 🚩 → `FlagIcon`
- 📡 → `SignalIcon`, 🔗/🐙/💼 → `LinkIcon` (or keep a tiny brand glyph for github/linkedin if needed), 📄/📎files → `FileIcon`, ✏️ → `EditIcon`, ✓✓ → `CheckCheckIcon`
- 📍 → `MapPinIcon`, 🎓 → `GraduationIcon`, ⚙️ → `GearIcon`, 💰/💵 → `WalletIcon`, ✓ → `CheckIcon`, ＋ → `PlusIcon`, ✕ → `XIcon`, › → `ChevronRight`, ← → `ArrowLeftIcon`
- If an emoji has no matching icon, ADD a new one to `icons.tsx` in the same clean line-art style (stroke `currentColor`, strokeWidth 1.7, 24x24 viewBox, round caps). Don't leave any emoji as a UI control.

Icon usage pattern (inherits color + size from parent):
```tsx
import { PaletteIcon } from "./icons";
<span className="text-brand-300"><PaletteIcon className="w-5 h-5" /></span>
```
For the settings rows in `ChatInfoScreen` that currently have a colored rounded square with an emoji, keep the colored square but put the SVG icon inside it (white icon on the colored tile) — that's the premium pattern.

### What MUST stay emoji (do NOT replace):
- **Message reactions** (❤️ 😂 😮 😢 😡 👍) — reactions are meant to be emoji.
- **User-typed content** — notes, messages, signals, group names. Never touch user data.
- The brand "F" logo glyph.

## RULE 2 — Premium visual polish (after emoji are gone)
Go screen by screen. For each, raise it to flagship quality:

- **Spacing & rhythm**: consistent padding scale (use multiples — 12/16/20/24). Generous whitespace. Align everything to a grid. No cramped or random gaps.
- **Typography**: clear hierarchy. Titles bold and confident, secondary text in `text-ink-mute`. Consistent sizes (don't mix 5 random font sizes per screen). Tight `leading` on headings, relaxed on body.
- **Buttons**: one consistent system — primary (`btn-primary` emerald), secondary (subtle `bg-white/[0.05]`), destructive (red). Consistent height, radius, `active:scale-95` press feedback on everything tappable. Min 44px touch targets (Apple HIG).
- **Cards & surfaces**: consistent radius (rounded-2xl / rounded-3xl for sheets), subtle borders `border-white/[0.06]`, no harsh lines. Soft, layered, premium.
- **Empty states**: every list/screen with no data gets a tasteful empty state (icon + short heading + one line + a CTA). No blank voids.
- **Loading states**: skeletons or subtle spinners, never a jarring flash.
- **Micro-interactions**: smooth transitions (`transition`, 150–250ms), `active:scale` on press, gentle fades for sheets/modals. Tasteful, not bouncy/childish.
- **Bottom nav & headers**: pixel-tight, icons optically centered, safe-area padding respected (`env(safe-area-inset-bottom)` already used — keep it).
- **Color discipline**: emerald is the ONE accent. Status colors (green/amber/blue/red for availability) are allowed where they encode meaning. Otherwise stick to the monochrome + emerald system. No random rainbow.

## Screens to cover (all of `components/`)
Home, Money, Connect, Messages (+ ChatInfoScreen + all its sheets), Marketplace, Profile, Business, Onboarding, AuthGate, AttendanceDetail, CampusMap, MyCampus, Notifications/Reminders. Plus `BottomNav`, `DesktopSidebar`.

Do it in **batches by screen** (e.g. batch 1: Messages+ChatInfo, batch 2: Home, batch 3: Connect, ...). Commit each batch separately with a clear message. After each batch: run `npx tsc --noEmit` (must be 0 errors) and verify in `?mode=demo` with no console errors. Hand each batch back to Claude for review before moving on.

## Hard constraints
- **Demo mode must keep working** with no login and no console errors.
- **Don't change behavior/logic** — this is a visual/icon pass. Don't break the Frequency feature, Chat Info settings, attendance math, billing, etc.
- `npx tsc --noEmit` = 0 errors after every batch.
- Keep the dark theme and emerald brand — don't reinvent the palette, elevate the execution.
- Mobile-first: verify at 414px width. Nothing should overflow horizontally; everything thumb-reachable.

## Acceptance
- [ ] Zero emoji used as UI icons anywhere (reactions + user content excepted). `grep` for emoji should only hit reactions/content.
- [ ] Every screen feels consistent: same button system, spacing scale, radii, type hierarchy.
- [ ] Every empty/loading state handled gracefully.
- [ ] Smooth press/transition feedback on all interactive elements, 44px+ targets.
- [ ] tsc clean, demo mode clean, no horizontal overflow at 414px.
- [ ] Looks like something you'd be proud to ship on the App Store.

Start with **batch 1 = Messages.tsx + ChatInfoScreen + its sheets** (that's the screen we've been perfecting), since the icons for it are already in `icons.tsx`. Then move outward.
