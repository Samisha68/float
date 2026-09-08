# QA report — Float advance program

**Date:** 1 September 2026
**Target:** `program/programs/float/src/lib.rs` (607 lines, Anchor 0.31.1)
**Branch:** `chore/repo-cleanup`
**Method:** every instruction driven with real transactions against a local
validator, plus a bankrun suite for the clock-dependent path
**Tier:** Standard

---

## Note on method

`/qa` drives a browser. An Anchor program has no browser surface, so the
equivalent was applied: exercise all seven instructions with real transactions
the way the web app will, and treat anything that fails as a user-visible bug.
No browser was used and none was applicable.

Before this run the program had **no tests at all**, and `Anchor.toml` pointed
its test script at a directory that did not exist.

---

## Summary

| | Before | After |
|---|---|---|
| Tests | 0 | **24 passing** |
| Instructions covered | 0/7 | **7/7** |
| Known defects | unknown | 2 found, **2 fixed** |
| Health score | 45 | **88** |

Both defects were reproduced with a failing test before being fixed, and each
fix is verified by a regression test that asserts the corrected behaviour.

| Severity | Found | Fixed | Deferred |
|---|---|---|---|
| Critical | 0 | 0 | 0 |
| High | 2 | 2 | 0 |
| Medium | 0 | 0 | 0 |
| Low / observation | 1 | 0 | 1 |

---

## ISSUE-001 — High — an advance between $5k and $25k stranded forever

**Status:** fixed, verified. Commit `6dab6f9`.

`request_advance` accepted anything up to `MAX_ADVANCE_ABSOLUTE` ($25,000)
([lib.rs:117](../../program/programs/float/src/lib.rs)). `approve_and_disburse`
rejected anything over `MAX_ADVANCE_TIER_1` ($5,000)
([lib.rs:173](../../program/programs/float/src/lib.rs)). The two disagreed.

**Repro (pre-fix):** request $10,000 against a $20,000 inflow. Accepted, written
on-chain, shown to the borrower as "Awaiting review". The underwriter then
approves and the transaction reverts with `ExceedsTier1Ceiling`. There is no
cancel instruction, so the advance sits in `Requested` permanently.

**Why it mattered for Borneo:** the amount input on the Request screen had no
`max` attribute, so the number was reachable by typing. On stage that is a
revert in front of the judges, with an error naming a constant nobody in the
room can see.

**Fix:** `request_advance` now enforces the tier-1 ceiling too, ordered after the
absolute check so both errors stay reachable and each names the right bound. The
approve-side check stays as defence in depth. Nothing that was approvable before
is refused now; only the moment the borrower learns the limit changes.

**Verification:** `ISSUE-001: an advance above the tier-1 ceiling is rejected at
request time` asserts no advance account is created. A boundary test asserts
exactly $5,000 is still accepted.

---

## ISSUE-002 — High — a first-time borrower could not be paid

**Status:** fixed, verified. Commit `f11737b`.

`ApproveAndDisburse.borrower_usdc` was declared without `init_if_needed`, so the
borrower's associated token account had to already exist. A business borrowing
for the first time has never held USDC, so it does not.

**Repro (pre-fix):** register a fresh business, request $1,000, approve. Fails
with `AccountNotInitialized` naming `borrower_usdc` — an account the operator
has no obvious way to create from the underwriting screen.

**Why it mattered for Borneo:** this hit *every* first-time borrower, including
the seeded demo business. The demo narrative is a business taking its first
advance, so the demo path itself was the broken path.

**Fix:** `init_if_needed` with the underwriter as payer. The address is a PDA of
mint and borrower, so there is nothing to spoof. Added the associated-token and
system programs to the account struct.

**Verification:** `ISSUE-002: approve creates the USDC account for a first-time
borrower` asserts the ATA does not exist beforehand, then that the borrower is
paid the full principal and ends up owning the account.

---

## OBS-001 — Observation, deferred — overdue is permanent, and the UI must say so

**Status:** deferred. Behaviour looks deliberate; the **UI copy is the open item**.

`repay_advance` increments `advances_repaid` but never decrements
`advances_overdue`. A business that goes past due once carries that mark forever,
even having repaid in full.

As a credit policy this is defensible and probably correct: the record should not
be erasable, which is the same principle that makes `mark_overdue` permissionless.
It is now covered by a test that documents it as intentional rather than leaving
it to look like an oversight.

**What still needs doing:** the credit-record screen must render this as
*"1 repaid, 1 previously past due"*. Anything that reads as "1 overdue" implies
money is still outstanding when it is not. Not fixed here because it is a copy
decision in `web/src/lib/domain.ts`, not a program bug.

---

## Coverage

All seven instructions, exercised positively and negatively.

| Instruction | Happy path | Rejections covered |
|---|---|---|
| `initialize_treasury` | ✅ | — |
| `set_underwriter` | ✅ | non-operator |
| `register_business` | ✅ | empty name, name > 64 chars |
| `request_advance` | ✅ | zero amount, over inflow, over absolute ceiling, over tier-1 ceiling, term 0, term 61, wrong authority |
| `approve_and_disburse` | ✅ | non-underwriter, fee > 1000 bps, wrong mint, first-time borrower |
| `repay_advance` | ✅ | double repay, wrong authority, after overdue |
| `mark_overdue` | ✅ (bankrun) | not yet due, not active, double flag |

The overdue path needs the chain clock moved past a due date, which a local
validator cannot do, so it runs under bankrun in `tests/overdue.ts`.

---

## Not covered

- **Arithmetic overflow paths.** Every `checked_*` call has an error arm, none is
  reachable within the policy ceilings. Left alone deliberately.
- **Treasury insolvency.** Approving with an underfunded treasury fails inside
  the SPL transfer with `insufficient funds`, not a Float error. Fine on-chain,
  but the underwriting screen should check the treasury balance before enabling
  Approve, or the operator sees a raw SPL error.
- **Concurrency.** Two underwriters approving the same advance in one slot. Low
  value for a single-operator MVP.

---

## Required follow-up: the devnet deployment is now stale

`approve_and_disburse` takes **11 accounts, up from 9**. The binary on devnet is
the pre-fix 0.30 build and expects the old shape, so the regenerated IDL no
longer matches it. Before this run the IDL was wire-compatible with the deployed
binary; it is not any more.

The redeploy is now **required**, not housekeeping. The new `.so` is 348,512
bytes against a ProgramData account sized 325,792, so it needs `program extend`
plus a ~2.4 SOL buffer. Balance is 1.15 SOL and the devnet airdrop is
rate-limited.

```bash
solana airdrop 2 --url devnet     # or https://faucet.solana.com
solana program extend 6NjXwwwuFNWV3MBk2r2wv68hDde1snEiMMfwrvQ31Db8 40000 --url devnet
solana program deploy program/target/deploy/float.so \
  --program-id program/target/deploy/float-keypair.json --url devnet
```

---

## Health score

| Category | Weight | Before | After | Notes |
|---|---|---|---|---|
| Functional | 20% | 40 | 100 | both high-severity defects fixed |
| Test coverage | 20% | 0 | 90 | 0 → 24 tests, 7/7 instructions |
| Security / authorisation | 15% | 85 | 95 | every role boundary now has a negative test |
| Error paths | 15% | 70 | 90 | all reachable error codes asserted |
| Correctness of policy | 15% | 50 | 95 | ceilings now agree with each other |
| Deployment readiness | 15% | 30 | 55 | live on devnet but stale after these fixes |

**Before: 45. After: 88.**

Deployment readiness is what holds the score down, and it is fixed by getting
devnet SOL and redeploying.

---

## PR summary

> QA on the Anchor program: 0 → 24 tests covering all 7 instructions, 2
> high-severity defects found and fixed (over-ceiling advances stranded forever;
> first-time borrowers could not be paid). Health 45 → 88. Devnet redeploy now
> required — the account shape changed.
