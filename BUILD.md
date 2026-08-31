# Float MVP — 4-day build

Target: a working demo of one borrower journey — request an advance against a
delayed payment, underwriter approves, USDC disburses, business repays, credit
record updates.

## Run it now

```bash
cd web && npm install && npm run dev
```

The UI is complete and runs on `DemoLedger` — in-memory, deterministic, no
network. **This is your stage insurance.** If devnet or the wallet misbehaves on
the day, the demo still works.

## Deploy the program (on your Mac — the bridge VM has no Rust toolchain)

```bash
cd program
avm install 0.30.1 && avm use 0.30.1     # if your local anchor is still 0.29
anchor build
anchor keys sync                          # rewrites the placeholder declare_id!
anchor build
anchor deploy --provider.cluster devnet
```

Then fund the treasury with devnet USDC from https://faucet.circle.com
(Circle devnet USDC is `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` — the
archived code used the wrong mint, do not copy it).

## Day plan

| Day | Goal |
|---|---|
| **1** | Program deployed to devnet. `npm run dev` running. Walk the four screens. |
| **2** | Write `web/src/lib/onchain.ts` implementing `Ledger` against the program. Add the Solana deps back from `package.full.json`. Wallet connect. |
| **3** | Swap the ledger behind a toggle, run the full loop on devnet, seed a business with two settled advances so the credit record is not empty. |
| **4** | Rehearse. **Record a backup video.** Write the pitch. |

Cut day 2–3 entirely if time runs short: the demo ledger tells the same story,
and a working demo beats a broken chain call.

## Architecture

`web/src/lib/ledger.ts` defines the `Ledger` interface. The UI only ever talks
to that. `DemoLedger` implements it in memory; `OnChainLedger` will implement it
against the program. Nothing in `App.tsx` needs to change when you swap them.

## The policy, and why it is in the contract

`program/programs/float/src/lib.rs` enforces:

- **Tier-1 ceiling $5,000** — the largest advance without a pledge.
- **An advance may never exceed the verified expected inflow.** This is the
  control that matters: the ceiling moves with something the borrower cannot
  manufacture, so repayment history can move price and speed but never the limit.
  That is the defence against bust-out fraud.
- Term 1–60 days. Fee capped at 1,000 bps.
- `mark_overdue` is permissionless — the record cannot be suppressed by the
  borrower or the operator.

Not modelled on-chain, deliberately: KYB, evidence verification, payer
confirmation, payment routing. Those are off-chain and are where the real credit
work happens. See `docs/COMPETITIVE_EVIDENCE_2026.md` for why.

## For the pitch

The question every judge asks is why this does not go the way of the other
on-chain lenders. The answer, in one line: **Goldfinch had a16z's $25M and wound
down in June 2026 with $18M of losses because it substituted reputation for
control — we bound every advance to a verified inbound payment and are building
toward collecting it at source.** Detail in `docs/COMPETITIVE_EVIDENCE_2026.md`.
