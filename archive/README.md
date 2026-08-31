# Archive — dead code. Do not build on this.

Everything in this directory belongs to a product Float no longer builds.

It was the **MONOLITH Solana Mobile Hackathon** entry (March 2026): a consumer mobile
app where an individual borrower locked crypto collateral and an AI agent matched small
short-term loans. Float now builds **on-chain short-term working-capital credit for
businesses** with delayed inbound payments. See the root [README.md](../README.md).

Nothing here is maintained, and nothing here is a statement of product intent.

## Why it is kept

Deleting it would gain nothing — git history holds it either way — and it is the only
worked example in the repo of Anchor account layout, PDA seed design, and vault/treasury
CPI signing. Keep it as reference until the new program is written, then delete it.

## Do not do these things

- **Do not upgrade it.** It is several major versions behind (Anchor 0.29 against a
  post-1.0 Anchor; Expo SDK 51 against SDK 56). Upgrading produces a modern build of the
  wrong product. If you are tempted, read "What is wrong with it" below first.
- **Do not copy its business logic.** The 150% LTV rule, the $100 / 1–7 day / 110%
  micro-loan caps, and the 3/6/12-month EMI schedule describe consumer crypto lending.
  None of them describe advancing against a business's incoming invoice.
- **Do not copy `app/src/theme/theme.ts`.** It fails DESIGN.md on every axis. The audit
  is in that file's header.
- **Do not reuse the mobile wallet adapter layer.** Business users work at a desktop.

## What is worth reading

| Path | Why |
|---|---|
| `program/programs/float/src/lib.rs` | Account structs, PDA seeds, CPI signing, the repay → status → withdraw state machine, checked arithmetic throughout |
| `program/tests/float.ts` | How the flows were exercised |
| `program/scripts/ai-agent.js` | How an off-chain agent was wired to on-chain execution |
| `app/src/hooks/useWallet.ts` | Solana Mobile Wallet Adapter integration, if mobile ever returns |

## What is wrong with it, concretely

Recorded so nobody rediscovers these the hard way:

1. **Version mismatch inside the repo.** `program/package.json` wants
   `@coral-xyz/anchor ^0.30.1`; `Anchor.toml` and `Cargo.toml` pin `0.29.0`; the app pins
   `0.29.0`. Mismatched client/program versions cause IDL and deserialization failures.
2. **Wrong USDC mint.** Every script and `app/src/utils/constants.ts` default to
   `7whbViYZqoGxZ7B32crtGEcyCJEDZNPrqSQxm9LUUtGX`, and the constant is labelled "Circle's
   official devnet USDC", which it is not. Circle's devnet USDC is
   `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`. The root SHIPPING_CHECKLIST.md claimed
   this was fixed; it was not.
3. **Deployment unverified.** The program ID `AeWSncwhRY2TyRnM7UByjhmmcgE8rrbMs9y8vwJomgmX`
   is declared, but the shipping checklist lists deploy as blocked, and devnet accounts are
   purged periodically. Assume it is not deployed until you confirm it.
4. **No oracle.** Collateral and loan are assumed to be the same denomination, which is why
   the demo lends USDC against USDC — a flow that leaves the borrower with less money than
   they started with. This was always a demo shortcut, never a product.
5. **Flat interest, not amortised.** The code comment describes the EMI formula; the
   implementation charges flat interest.

## Prototype documentation

The original README is preserved at [docs/PROTOTYPE.md](../docs/PROTOTYPE.md), and setup
steps at [docs/AI_MICRO_LENDING_SETUP.md](../docs/AI_MICRO_LENDING_SETUP.md). Both are
labelled archived.
