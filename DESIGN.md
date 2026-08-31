# Design System — Float

*Source of truth for all visual decisions. Supersedes the "Fiduciary Editorial" system
(warm paper / Fraunces / green / orange), which is dead — do not reference it.*

## Product Context
- **What this is:** Mobile-first lending app on Solana. Borrowers climb a credit ladder — collateral drops as trust is proven — and everyday lenders fund agent-managed pools.
- **Who it's for:** Borrowers who need short-term stablecoin liquidity without selling their crypto; lenders who want legible, safe yield.
- **The memorable thing:** **"It trusts me."** Every visual decision serves this.
- **One-liner:** **Build credit with your wallet.**

## The Mark — The Ascending Arcade

A Roman arcade of three bays. Each bay's arch opens **taller and more slender** than the last,
with a cornice over every level. Rome moved water — liquidity — across distance on repeated
arches and stacked them in tiers; that is the credit ladder, in the architecture of the
civilisation that gave us the word *credit* (Latin *credere*, to trust).

- **No base.** The arcade has no plinth and no waterline bar. Decided deliberately (see Decisions Log).
- **Growth happens in the openings, never the blocks.** If the solid masses grow instead of the arches, the mark becomes a bar chart. This is the single rule that keeps it architecture.
- **Cornices overhang** each level. They are what stop it reading as columns on a chart.
- Assets in [docs/brand/](docs/brand/):
  - `float-mark.svg` — the bare mark, `currentColor`, viewBox `2 18 130 74`
  - `float-avatar.svg` / `float-avatar-400.png` — 400×400 social avatar, black ground, white mark
- **Avatar rule:** upload as a **square**; X and most platforms crop to a circle. The mark is sized to sit inside the inscribed circle so the cornices never clip. Do not re-scale it larger.
- **Below ~28px** the three bays compress. If a smaller mark is ever needed, use a compact form (tallest bay only) rather than shrinking the full arcade.

## Color — locked, four values, nothing more

| Token | Hex | Use |
|---|---|---|
| White | `#FFFFFF` | Backgrounds, reversed type, the mark on dark grounds |
| Black | `#000000` | The logo ground (avatar, app icon), primary buttons, maximum-contrast type |
| Dark blue | `#031329` | Brand mass: headers, dark surfaces, marketing grounds, body type on white |
| Grey | `#8A94A6` | Secondary type, captions, borders, dividers, disabled states |

**No fifth colour.** Lighter and darker steps are **opacities of the same grey**, never new hues
(e.g. borders `#8A94A6` at 25%, dividers at 15%). No accent colour. Pink is retired.

**Consequence to design around:** with no semantic red/amber/green, loan states — overdue,
liquidation risk, repaid — must be carried by **text, iconography, and hierarchy**, not colour.
Every status needs an explicit written label. This is a real constraint on the app UI and it is
intentional: it forces legibility over colour-coding and keeps the product free of casino signals.

## Typography

- **Wordmark and display:** Poppins, weights 600–700. Geometric, single-storey `a`, circular `o`. Set tight (`letter-spacing: -0.035em`). The wordmark is always lowercase: **float**.
- **UI and body:** Poppins 400–600, or a neutral grotesk with tabular figures for data views.
- **Numerals:** tabular lining figures everywhere money appears.
- *Status: in use across all current assets. Not yet explicitly signed off — revisit before production and convert the wordmark to outlines for any exported logo file.*

## Layout & Motion
- **Base unit:** 4px. Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- **Radius:** sm 6px · md 10px · lg 14px · avatar/icon 23% of side.
- **Motion:** things settle and level. Ease-out on entry, 150–350ms. No bounce, no spin, no confetti.

## Social — X / Twitter
- **Avatar:** `float-avatar-400.png` (black ground, white mark).
- **Handle:** `@floatcredit` (pending availability check).
- **Bio:** `Credit for Solana wallets. Borrow against your crypto and lock less every time you repay. Mobile-first. Live on devnet.`
- **Header:** Pont du Gard photograph, greyscaled with a dark blue veil, white wordmark set right of centre. Source: [Pexels](https://www.pexels.com/photo/the-pont-du-gard-bridge-in-france-11617573/), free for commercial use. **Not exported** — build when needed. Avatar covers the bottom-left 250×250 of the 1500×500 canvas; keep that area clear.
- **Never** use stock icon artwork as a logo or mark. Stock licences forbid trademark use.

## Decisions Log
| Date | Decision | Rationale |
|---|---|---|
| 2026-07-31 | Mark: The Ascending Arcade | Roman arcade whose bays open higher as they climb — the credit ladder in Rome's own architecture. Chosen over aqueduct, tiered arcade, temple, and the three-stroke mark |
| 2026-07-31 | No base under the arcade | Founder's call, made after seeing the grounded alternative. Trade-off accepted: piers terminate in air rather than on a footing |
| 2026-07-31 | Palette locked to four values | Founder's call. Discipline over range; forces status to be communicated in words, not colour |
| 2026-07-31 | Logo ground is black, not dark blue | Founder's call. Maximum contrast for the avatar at small sizes |
| 2026-07-31 | Fiduciary Editorial system retired | Warm paper, serif display, green/orange accents all superseded by navy/black/white/grey |
