# CMPUS Logo System v1 (reference spec)

> Source: ChatGPT, provided by Mokshit. This is the canonical geometry +
> design DNA for the Cmpus mark. The shipped app icons in `/public` were
> built from the user-provided transparent master (`source/mark-transparent.png`)
> which follows this system. Keep any future regeneration consistent with the
> construction guide below.

## Core concept
- Brand: **CMPUS**
- Meaning: campus presence, real-time signals, human connection, social radar, live campus activity
- Visual metaphor: **person + signal waves**

## Geometry
- **Head:** perfect circle (solid dot)
- **Arms:** one wide upward arc beneath the head (raised arms)
- **Waves:** 2 nested strokes below, pointing gently downward
- Perfectly symmetrical · identical stroke width · rounded caps · rounded joins · optical balance

## SVG construction guide (units = head radius `x`)
| Element      | Width | Stroke |
|--------------|-------|--------|
| Head         | r=1x  | solid  |
| Top arc      | 5x    | 0.7x   |
| Middle wave  | 7x    | 0.7x   |
| Bottom wave  | 9x    | 0.7x   |
- Spacing between elements: 0.8x
- Corner radius: 100% (fully rounded caps)
- Aligned on vertical axis, optically centered

## App icon
- Background: **#0B6B52** emerald
- Foreground: pure white signal-person mark
- ~20% safe padding, rounded-square tile
- Flat, high contrast. No shadows / gradients / glassmorphism / 3D.

## Wordmark
- Text: `cmpus` (lowercase)
- Geometric sans, weight 600, rounded terminals, wide counters
- Reference fonts: Circular Std / Satoshi / Product Sans / Avenir Next Rounded / SF Pro Rounded
- Color: **#1A1D1B**, tracking +4 to +8, on **#F7F6F2**

## Horizontal lockup
- Icon left, `cmpus` right, gap = 1.2× icon width, optically centered. Color #1A1D1B on #F7F6F2.

## Design DNA
- Feels like: Snapchat location sharing, Apple Find My, Nothing, Linear, Notion
- Should feel: alive, social, friendly, trustworthy, modern, Gen Z
- Should NOT feel: corporate, academic, old-school, government, enterprise
