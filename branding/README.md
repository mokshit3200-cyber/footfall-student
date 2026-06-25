# Cmpus — Brand Assets

Source logo renders + exported app assets live here.

## Folder layout
- `source/` — raw high-res renders straight from the AI generator (keep originals, never edit in place)
- `export/` — final cleaned/vectorized assets that go into the app

## Naming convention (save each render into `source/` with these exact names)

| # | What it is                                  | Save as                         |
|---|---------------------------------------------|---------------------------------|
| 1 | Master mark — charcoal on off-white         | `source/mark-charcoal.png`      |
| 2 | Mark in emerald — emerald on off-white      | `source/mark-emerald.png`       |
| 3 | App icon tile — white mark on emerald tile  | `source/icon-tile.png`          |
| 4 | Reverse — white mark on transparent         | `source/mark-white.png`         |
| 5 | Wordmark lockup — mark + "cmpus"            | `source/wordmark.png`           |

## Brand colors
- Charcoal (mark): `#1A1D1B`
- Emerald (primary): `#0F8F6F`
- Deep emerald (icon tile bg): `#0B6B52`
- Mint (accent): `#5EE6B3`
- Off-white (bg): `#F5F7F2`

## Status
- [ ] 1. mark-charcoal
- [ ] 2. mark-emerald
- [ ] 3. icon-tile
- [ ] 4. mark-white
- [ ] 5. wordmark

Once the masters are in `source/`, hand off to Claude to vectorize into SVG +
export every app-icon size into `export/` and wire into the app
(`public/icon.svg`, manifest, AuthGate, sidebar).
