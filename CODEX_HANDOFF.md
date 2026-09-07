# Handover to Codex — Float

Written 1 September 2026 by a Claude Code session. Every claim below was verified
against the machine on that date, not copied from an earlier document. Where a fact
could not be verified it says so.

Read `CLAUDE.md` first for ground rules, then this, then `BORNEO.md` for the plan.

---

## 1. What Float is

On-chain short-term working-capital credit for small businesses whose money is
delayed. A supplier invoices a customer on 60-day terms; payroll is on the 28th. Float
advances USDC against that specific invoice, never more than the invoice is worth, and
records the loan and its repayment on Solana.

Three parties, and the naming in code is confusing enough that it is worth stating:

| Role | Demo value | What they do |
|---|---|---|
| Float | — | Lends the money |
| **The business** (borrower) | Meridian Supply Co. | Is owed money, needs cash now |
| **The payer** (their customer) | Northwind Logistics Ltd | Owes the business, pays in 60 days |

`payer` in the code means **the borrower's customer** — the third-party debtor. It does
not mean the borrower and it does not mean anyone paying Float. The industry term is
"account debtor"; a rename to `debtor` was discussed and is **not** decided.

**Deadline: Startup Village Borneo, Kuching, 5–9 September 2026.** Deck uploads Tue
8 Sept 18:00 MYT, hard cutoff. Public demo Wed 9 Sept 10:30. Judges include two Solana
Foundation people.

---

## 2. Ground rules that will save you time

- **`archive/` is dead code.** March 2026 hackathon build, a *consumer mobile* app. Not
  the product. Do not build on it, copy from it, or fix it.
- **Docs in `docs/` deliberately contradict each other.** Superseded ones carry a
  `<!-- float-status-banner -->`. Read the banner before trusting a file.
- **`BUILD.md` and `HANDOFF.md` are both stale and both lack a banner.** They state the
  deadline as ~4 September, which is wrong. `BORNEO.md` supersedes them.
- **`docs/COMPETITIVE_EVIDENCE_2026.md` does not exist** but is cited three times as
  the evidence base for the pitch. See §6 — this is an open item, not a missing file to
  go create from imagination.
- `DESIGN.md` is authoritative for anything visual. Four colours, no fifth, no
  red/amber/green. Loan status is carried in **words**. Its "Product Context" section
  describes the abandoned consumer product — ignore that part, the visual system is live.

---

## 3. State, verified 1 Sept 2026

### Git
Branch `chore/repo-cleanup`, **in sync with origin, clean tree**, 8 commits ahead of
`main`. Not merged. Repo is private and should stay private.

```
e4c52b5 docs(qa): QA report and plan updates
25470a7 docs(qa): QA report, refreshed IDL, and plan updates
3c667d8 test(qa): cover the overdue path under bankrun
6dab6f9 fix(qa): ISSUE-001 — reject over-ceiling advances at request time
f11737b fix(qa): ISSUE-002 — pay a borrower who has never held USDC
3040051 test(qa): QA suite for the advance program — 20 tests, 2 bugs reproduced
ee35af9 docs: mark B3 done in BORNEO.md
805c47f feat: unblock the MVP — Anchor 0.31.1, IDL, devnet deploy, Borneo plan
```

Git identity is not configured globally. Commit with
`git -c user.name="Samisha68" -c user.email="samishaofficial68@gmail.com"`.

### Program — works
`program/programs/float/src/lib.rs`, 607 lines, Anchor 0.31.1, rustc 1.95.

**24/24 tests passing**, all 7 instructions covered:
- `tests/float.ts` — 21 tests, local validator
- `tests/overdue.ts` — 3 tests, bankrun (needs clock control)

```bash
cd program && anchor test --provider.cluster localnet
```

### Web — works
`web/`, Vite 6 + React 18 + Tailwind 4. `npm run build` clean: 160KB JS, 51KB gzipped,
~440ms. Four screens: Request an advance, Your advances, Underwriting queue, Credit
record.

Runs entirely on `DemoLedger` — in-memory, no network. `web/src/lib/ledger.ts` defines
a `Ledger` interface; `App.tsx` only ever talks to that. `OnChainLedger` slots in behind
it with no changes to `App.tsx`. **`OnChainLedger` does not exist yet.**

### Devnet — deployed but STALE
```
Program Id:   6NjXwwwuFNWV3MBk2r2wv68hDde1snEiMMfwrvQ31Db8
Authority:    Acxpe4sqgBUZvUEk1Vqk85UnACSouTABMRWGMsAZDKGJ
Data Length:  325792 bytes   ← the OLD 0.30 build
```

Local build is **348,512 bytes** and `approve_and_disburse` now takes **11 accounts,
up from 9**. The deployed binary and the current IDL are **not compatible**.

---

## 4. THE BLOCKER — read this before starting anything

**The devnet program must be redeployed before `OnChainLedger` can be written.**

Wallet balance is **1.152 SOL**. A redeploy needs roughly 2.4 SOL because the new
binary is larger than the allocated ProgramData account. Devnet airdrop is rate-limited
and has been refusing.

```bash
solana airdrop 2 --url devnet          # or https://faucet.solana.com if refused
solana program extend 6NjXwwwuFNWV3MBk2r2wv68hDde1snEiMMfwrvQ31Db8 40000 --url devnet
solana program deploy program/target/deploy/float.so \
  --program-id program/target/deploy/float-keypair.json --url devnet
```

**Before redeploying, save a copy of the currently-deployed binary.** There is no backup
of the working 0.30 build; if the redeploy goes wrong there is nothing to roll back to.

---

## 5. What this session did

### Fixed the build and shipped the MVP scaffold (commit `805c47f`)
- **IDL generation was broken.** `anchor-syn 0.30.1` calls `proc_macro2::Span::source_file()`,
  removed in modern proc-macro2. **Do not try to pin `proc-macro2` — that path is closed
  from both ends** (older versions do not compile on rustc 1.95; older rustc lacks
  `edition2024` which `cpufeatures` now needs). The fix was aligning Anchor to 0.31.1 in
  both `Anchor.toml` and `Cargo.toml`. Zero source changes.
- Rebuilt `web/src/lib/config.ts` to use `Uint8Array`/`TextEncoder`, not `Buffer` — Vite
  does not polyfill Node globals, so the original compiled and then threw in the browser.
- Dropped `@solana/wallet-adapter-wallets`; modern `wallet-adapter-react` auto-detects
  Wallet Standard wallets from an empty array. Took the dependency audit from 106
  vulnerabilities (1 critical) to 25.

### QA on the program — 0 to 24 tests, 2 real bugs found and fixed
Full report: `.gstack/qa-reports/qa-report-float-program-2026-09-01.md`. Health 45 → 88.

**ISSUE-001 (`6dab6f9`)** — `request_advance` accepted up to $25,000 while
`approve_and_disburse` rejected anything over $5,000. Anything between was accepted,
shown as "Awaiting review", and could then never be approved or cancelled. Fixed by
enforcing the tier-1 ceiling at request time.

**ISSUE-002 (`f11737b`)** — `approve_and_disburse` required the borrower's USDC token
account to already exist. A first-time borrower has never held USDC, so the underwriter
could not pay them at all. **This hit every first-time borrower including the demo
business — the demo path was the broken path.** Fixed with `init_if_needed`. This is why
the account count went 9 → 11.

**OBS-001, deliberate, not a bug** — `advances_overdue` is never decremented on
repayment. A business that went past due once carries the mark forever. Kept: the record
should not be erasable. The UI already renders this correctly as "Ever past due".

### Architecture design (not code)
A full backend architecture was produced covering what has to exist off-chain: KYB,
evidence storage, payer confirmation, underwriting, chain writer, indexer, keeper,
collection at source. Published at
`https://claude.ai/code/artifact/8389dafc-8fa0-4072-bc51-4978ca291674`.
Nothing in it is built. **The program is roughly a tenth of the system.**

### CEO/strategy review — started, INTERRUPTED, incomplete
Got through the system audit, premise challenge, and all 11 review sections. Did not
finish the decision gates or write its report. Findings in §6 and §7 are its output.

---

## 6. Open items the review surfaced, in priority order

**P1 — The pitch's central fact is wrong and its source does not exist.**
`BORNEO.md` §7 says Goldfinch "wound down in June 2026 with $18M of losses". Verified
independently: a16z's $25M is correct, June 2026 wind-down is correct, −99.8% token is
correct. **The loss figure is not.** Public reporting says ~$50M of defaults on ~$100M
originated, with depositors reporting a real loss rate near 70% against the protocol's
own 20% dashboard figure. The correct number is *worse*, which helps the argument. Fix
the line and create `docs/COMPETITIVE_EVIDENCE_2026.md` so the claim has a source.

**P1 — Error handling will show raw blockchain errors on stage.**
`App.tsx` has three `catch (e) { setNotice((e as Error).message) }` sites. Against
`DemoLedger` those messages are hand-written English. Against Anchor they are strings
like `custom program error: 0x1`. Ten distinct failure paths are unhandled, all
reachable during a live demo: wallet not connected, user rejects the signature (normal,
but looks like a crash), nonce collision, over ceiling, wrong signer, treasury
underfunded, expired blockhash, borrower short of the fee, RPC 429, RPC timeout.
Needs a translation layer from error code to plain sentence.

**P1 — The borrower cannot repay without extra USDC.**
They receive the principal but owe principal + fee. `DemoLedger` never notices. On
devnet the repay step fails with an SPL insufficient-funds error unless the demo wallet
is pre-funded with the fee. The QA tests had to mint the fee explicitly to make repayment
work. Not currently in the plan.

**P1 — The DemoLedger toggle does not exist.**
`App.tsx:8` hardcodes `new DemoLedger()`. The plan's entire fallback strategy ("if
devnet misbehaves, ship the demo ledger") depends on a toggle nobody has built, and task
B12 verifies it. Build the toggle; it is the rollback plan.

**P2 — Transaction signatures are never shown.**
`Advance.signature` exists in the type and `DemoLedger` populates it, but no screen
renders it. A real explorer link is the most convincing artefact available to a judge,
and the data model already has the field.

**P2 — Double-click fires two transactions.**
`ApplyScreen` has a `busy` guard. Approve and Repay do not. A nervous double-click on
"Approve and disburse" sends two transactions; the second fails and prints raw.

**P2 — `getProgramAccounts` will hit rate limits.**
`listAdvances()` on devnet means a filtered `getProgramAccounts` call after every
action. Public devnet RPC throttles that hard. Consider a paid RPC endpoint for the demo.

**P2 — Dates cannot be backdated on devnet.**
`DemoLedger` seeds a 96-day credit history. On devnet `requested_at` is always "now", so
seeded advances all show as created and repaid today. Switching to `OnChainLedger`
therefore *degrades* the credit-record screen, which is the screen that argues for the
whole company.

**P3 — Plan file contains five stale self-contradictions.**
`BORNEO.md` §2 claims the IDL is wire-compatible with the deployed binary (no longer
true, §A2b says the opposite). §5 ENG-3 says not to attempt the Anchor 0.31 alignment
(it was already done, and is how the IDL got generated). §6 and §8 still list ENG-3 and
ENG-4 as deferred; both are done.

---

## 7. Decisions — settled and open

### Settled by the founder
| # | Decision | Note |
|---|---|---|
| D1 | Event format: judged pitch + deck + mentor dry runs + field research | |
| D2 | **Full live devnet loop**, over the recommended hybrid | Founder override |
| D3 | v1 is **invoice-only**; investor payments and banking blocks are roadmap | Only an invoice has an attachable third-party obligation |
| D4 | **Honest roadmap** on repayment control | Say out loud that collection-at-source is not built |
| — | Sequence stays as planned: chain work first, pitch after | Founder chose this over a story-first reordering |
| — | **Names belong off-chain, in the database, not on the blockchain** | Settled 1 Sept |
| — | Acceptance bar: full stack + program **ready and showcase-able**. "Need not have a working model but MVP should be amazing" | Founder's words. Live devnet is upside, not the pass/fail line |

### Open — do not decide these unilaterally
1. **The borrower's company name is written to the public blockchain.**
   `BusinessProfile.legal_name` is a public, permanent string sitting next to the
   repayment record, so anyone can look up a business and see it borrowed and paid late.
   This contradicts the decision above that names live off-chain. Fixing it means a
   program change plus a redeploy, on top of the one mandatory redeploy. **Asked, not
   answered — the founder stopped the question.** Recommendation was to defer it past
   Borneo and use it as a talking point, but that is not a decision.
2. **Rename `payer` to `debtor`.** Discussed, not decided.
3. **Which wallet signs the approval on stage.** One wallet for both borrower and
   underwriter is theatre a judge can see through; two means switching mid-demo.
4. **How the request nonce is generated.** If derived from `advances.length`, one failed
   transaction desyncs it and every later request collides. Use a random `u64` or read
   the count from chain state.

---

## 8. Traps that will waste your time

- `anchor-bankrun@0.5.0` peers on Anchor 0.30 but the project is on 0.31. Install with
  `--legacy-peer-deps`. It is test-only tooling and cannot reach the program.
- `startAnchor` requires a `[programs.localnet]` entry in `Anchor.toml`. It is there now.
- `solana-test-validator` cannot move its clock, so due-date paths are untestable there.
  That is why `tests/overdue.ts` uses bankrun.
- Circle devnet USDC is `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`. The archived code
  uses a different mint and mislabels it as Circle's. Do not copy it.
- `initialize_treasury` creates the treasury token account with `init`. Pre-creating it
  in a test fixture makes the instruction fail.
- The `payer` field is **UI-only**. The program does not store it. `OnChainLedger` cannot
  read it back from chain.
- `web/package.full.json` holds the full Solana dependency list, deliberately kept out of
  `package.json` to make installs fast.
- `codex` is not installed on this machine, so nothing here has had an independent
  cross-model review. The Rust holds funds and has had exactly one reviewer, though it
  now has 24 tests behind it.

---

## 9. Suggested order of work

1. Save a copy of the deployed `.so`, get devnet SOL, `program extend`, redeploy. Nothing
   else can proceed. (§4)
2. Build the `DemoLedger` / `OnChainLedger` toggle. It is the rollback plan and it is
   five minutes. (§6)
3. Write `web/src/lib/onchain.ts` against the `Ledger` interface. `tests/float.ts`
   already drives the full journey through the same client — it is close to a
   transcription.
4. Add the error translation layer before any live demo. (§6)
5. Pre-fund the demo wallet with the repayment fee, then run the full loop end to end.
6. Fix the Goldfinch number and write the evidence doc. (§6)
7. Surface explorer links. Cheap, and it is the most convincing thing on screen. (§6)

---

## 10. Verification commands

```bash
# tests — expect 24 passing
cd program && anchor test --provider.cluster localnet

# web build — expect clean, ~160KB JS
cd web && npm run build

# is the deployed program current?  325792 = stale, 348512 = current
solana program show 6NjXwwwuFNWV3MBk2r2wv68hDde1snEiMMfwrvQ31Db8 --url devnet

# can we afford a redeploy?  needs ~2.4 SOL
solana balance --url devnet

# does the local IDL match the deployed binary?  11 = local, deployed expects 9
jq -r '[.instructions[]|select(.name=="approve_and_disburse")|.accounts[].name]|length' \
  program/target/idl/float.json
```
