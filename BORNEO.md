# Borneo — the plan

**Startup Village Borneo, Kuching, Sarawak. 5–9 September 2026.**
Superteam Malaysia × SOCOE. Float Finance is registered in the **DeFi track, 1 member**.

Written 1 September 2026. Supersedes the day plan in `BUILD.md` and the deadline in
`HANDOFF.md`, both of which were wrong.

---

## 0. The correction that changes everything

`HANDOFF.md` and `BUILD.md` both say the deadline is **~4 September** and plan four days
of work. The real schedule, from [stmy.fun/borneo/schedule](https://stmy.fun/borneo/schedule):

| Day | Date | What it is |
|---|---|---|
| 1 | Sat 5 Sept | Amazing Race, 08:00–18:00. Welcome dinner. **No build time.** |
| 2 | Sun 6 Sept | Opening, workshops. Build 14:15–16:00. **Roast My Pitch R1, 16:00.** |
| 3 | Mon 7 Sept | Workshops. **First-10-users field work 14:30–16:30.** Regroup 16:30. |
| 4 | Tue 8 Sept | Deck clinic 13:30. Roast R2 15:00–17:30. **HARD CUTOFF 18:00 MYT.** |
| 5 | Wed 9 Sept | Tech check 10:00. **Public Demo Day 10:30–12:30**, live pitch + Q&A. |

**Two deadlines, not one.** The pitch deck uploads by **Tue 8 Sept 18:00 MYT — nothing
accepted after**. The demo is **Wed 9 Sept 10:30**.

That is eight days, not three. It makes the full live devnet loop achievable. It does not
make it leisurely, because on-site build time is only about seven hours across Days 2–4,
and every one of those hours competes with a pitch obligation.

**The rule this produces: the code ships before you fly.** After Fri 4 Sept, engineering is
bug-fixing only. Days 5–9 are for users, story, and rehearsal.

### Prize pool and judges

$10,000. 1st $3,000 / 2nd $2,000 / 3rd $1,000 / 2× honourable mention $500 /
sustainability 2×$500 / content 10×$100 / race 2×$500.

Judges: **Sam** (SOCOE), **Chaerin** (Solana Foundation), **Seraphim** (Solana Foundation),
**Anatoly** (No Limit Holdings).

**Seraphim runs the "RWA & Institutional" workshop on Day 3, 11:45–12:15, and judges on
Day 5.** That is the single highest-leverage hour of the week for Float. Go, ask the
repayment-control question out loud, and arrive at Demo Day as a team that judge has
already thought about.

---

## 1. Decisions taken (founder, 1 Sept)

| # | Decision | Chosen |
|---|---|---|
| D1 | Event format | Judged pitch + deck submission + mentor dry runs + field user research |
| D2 | Chain scope | **Full live devnet loop** (over the recommended hybrid) |
| D3 | v1 trigger case | **Invoice-only.** Investor payments and banking blocks become roadmap |
| D4 | Repayment-control claim | **Honest roadmap** — inflow ceiling today, collection-at-source next |

D2 was an override. The recommendation was a hybrid — deploy, show one real explorer
transaction, keep the demo ledger on stage. The founder chose the full loop. With eight
days instead of three that is defensible, and the plan below carries the recommendation
forward as a **safety net rather than a substitute**: the demo-ledger toggle and the backup
video stay mandatory deliverables, so a bad-wifi Demo Day is survivable.

### D5 — closed, 1 Sept: not a concern

**Founder call: the product is allowed to change and judges won't hold the directory entry
against it.** Recorded below for context, not as an action item. The one thing it still
buys you: if a judge does raise it, "we pivoted on 31 August and here's why" is a stronger
answer than being surprised by the question.

**The listing.** On
[stmy.fun/borneo/teams](https://stmy.fun/borneo/teams), Float Finance reads:

> "Float is payroll financing for businesses the banking system can't see. We underwrite
> against verified **on-chain revenue** instead of bank statements."

Two mismatches with the 31 Aug direction:

1. **"Payroll financing"** vs working-capital credit against a delayed inbound payment.
   Adjacent, not identical — payroll is the *use of funds*, not the *asset*.
2. **"Underwrite against verified on-chain revenue"** directly contradicts the current
   model, which underwrites **evidence of an off-chain receivable with a named third-party
   debtor**. "On-chain revenue" is the abandoned July direction: it assumes the business
   already transacts on-chain, which no Kuching SME does.

Judges read the directory. If your deck says one thing and the listing says another, that
is the first question you get. Options: update the listing (sign in at
`/borneo/login`), or keep it and open the pitch by naming the change. Either works.
Silently diverging does not.

---

## 2. What is actually true about the code right now

Verified on the machine 1 Sept, not taken from the handoff.

| Claim in `HANDOFF.md` | Reality |
|---|---|
| "The UI is complete and runs on `DemoLedger` — this is your stage insurance" | **`npm run dev` does not start.** `Cannot find module @rollup/rollup-darwin-arm64` |
| "`tsc` clean, `vite build` 619ms" | **`npm run build` fails**, 5 TypeScript errors |
| "Deploy unverified" | **Not deployed.** `solana program show` → "Unable to find the account" |
| "The IDL did not generate" (cause unknown) | **Cause found.** `anchor-syn 0.30.1` calls `proc_macro2::Span::source_file()`, removed in proc-macro2 ≥1.0.9x; your lockfile has 1.0.107 |
| Two commits unpushed | **Three** unpushed |

What *is* good: the Anchor program compiles to a 326KB `float.so`, the policy logic is
sound, the `Ledger` seam in `web/src/lib/ledger.ts` is the right abstraction, and your
devnet wallet `Acxpe4sq…` holds **3.42 SOL** — enough for the deploy.

### The IDL — solved, 1 Sept

The `proc-macro2` pin does **not** work, and nor does any host-toolchain pin. Recorded so
nobody burns an hour rediscovering it:

- `proc-macro2 1.0.86/1.0.91` — has `source_file()`, but **will not compile on rustc 1.95**,
  which removed `SourceFile` from the compiler's own `proc_macro` crate.
- `proc-macro2 1.0.107` — compiles, but dropped the method `anchor-syn 0.30.1` calls.
- **rustc 1.79** — has `SourceFile`, but its cargo predates `edition2024`, which
  `cpufeatures 0.3.1` now requires.
- **rustc 1.87** — has `edition2024`, but had already renamed `source_file` to `source`.

The window closed from both ends. **The fix was the alignment, not a pin.**

```bash
# programs/float/Cargo.toml: anchor-lang and anchor-spl 0.30.1 -> 0.31.1
# Anchor.toml: anchor_version -> 0.31.1
anchor build
```

**Zero source changes required.** `target/idl/float.json` (7 instructions, 3 accounts) and
`target/types/float.ts` now generate, and both are copied into `web/src/idl/`.

Verified: every instruction and account discriminator in the generated IDL matches
`sha256("global:<name>")[..8]` / `sha256("account:<Name>")[..8]`, which is the same scheme
Anchor 0.30 used. **The IDL is wire-compatible with the 0.30 binary currently on devnet**,
so `OnChainLedger` can be written against it immediately.

---

## 3. Phase A — home, 1–4 September. Build and freeze.

About 23 working hours. Everything here must be done before you board.

### A0 · DONE, 1 Sept · Unbreak the build

Dependencies reinstalled from scratch, which cleared the rollup native-binary fault.
`config.ts` rewritten to use `Uint8Array`/`TextEncoder` instead of `Buffer` — Vite does not
polyfill Node globals, so the original would have compiled and then thrown in the browser.
Solana packages restored from `package.full.json`, **minus `@solana/wallet-adapter-wallets`**:
modern `wallet-adapter-react` auto-detects Wallet Standard wallets (Phantom, Solflare) from
an empty `wallets` array, and dropping it took the dependency audit from **106
vulnerabilities including 1 critical, down to 25** and removed the WalletConnect/viem tree.

`npm run dev` serves 200. `npm run build` is clean: 160KB JS, 51KB gzipped, 231ms.

### A1 · DONE, 1 Sept · Generate the IDL

See §2. Anchor 0.31.1 alignment, no source changes. IDL and types are in `web/src/idl/`.

### A2 · DONE, 1 Sept · Deploy to devnet

**Live.** Verify any time:

```bash
solana program show 6NjXwwwuFNWV3MBk2r2wv68hDde1snEiMMfwrvQ31Db8 --url devnet
```

```
Program Id:        6NjXwwwuFNWV3MBk2r2wv68hDde1snEiMMfwrvQ31Db8
ProgramData:       5iwKbpgQqxzh5PnWV8u9HJgdH1rdCUrTZnUCsso2Hf6e
Authority:         Acxpe4sqgBUZvUEk1Vqk85UnACSouTABMRWGMsAZDKGJ
Deployed in slot:  491112875
Data Length:       325792 bytes
```

Deploy signature `2HERcMPeRFhJkPS5ZVWMKsAZuumjFar3NSkgoRREKQfLT7iV61wMWfknd61NbPb3cNynm5Qx6gqWPGCmZ9WqZV9g`.

**One open item — A2b, needs your hands.** The deployed binary is the 0.30.1 build. The
0.31.1 rebuild is 339,440 bytes, larger than the 325,792-byte ProgramData account, so
upgrading needs `solana program extend` plus a ~2.3 SOL buffer. Balance after deploy is
**1.15 SOL** and the devnet airdrop is rate-limited (both 2 SOL and 1 SOL refused).

Not a blocker — the discriminators match, so the IDL drives the deployed binary correctly.
But do this before the demo, tomorrow, when the cooldown resets:

```bash
solana airdrop 2 --url devnet     # or https://faucet.solana.com if refused
solana program extend 6NjXwwwuFNWV3MBk2r2wv68hDde1snEiMMfwrvQ31Db8 20000 --url devnet
solana program deploy target/deploy/float.so \
  --program-id target/deploy/float-keypair.json --url devnet
```

### A3 · Wed 2 Sept, ~5 hours · `OnChainLedger`

Restore the Solana packages from `web/package.full.json`. Write `web/src/lib/onchain.ts`
implementing the existing `Ledger` interface. Wallet connect. **Nothing in `App.tsx`
changes** — that is what the seam was for. Keep `DemoLedger` selectable by a query
parameter or an env flag; do not delete it.

### A4 · Wed 2 Sept, ~2 hours · Bring the treasury to life

`initialize_treasury`, `set_underwriter`, then fund the treasury account with Circle devnet
USDC from [faucet.circle.com](https://faucet.circle.com). The mint is
`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`. The faucet rate-limits at roughly two hours
between requests, so start this early on Wednesday, not late on Thursday.

### A5 · Thu 3 Sept, ~3 hours · Seed the story

Run the full loop on devnet end to end. Then seed the demo business with **two settled
advances** so the credit-record screen is not an empty state on stage. A credit history
with nothing in it argues against you.

### A6 · Thu 3 Sept, ~2 hours · Fix the ceiling bug (see §5, ENG-1)

### A7 · Thu 3 Sept evening, ~2 hours · Insurance

Record the **backup video** of the complete journey. Verify the demo-ledger toggle works
with the network physically off — turn off wifi and click through all four screens. This is
not optional and it is not a fallback for a weak demo; it is what you play when Voco's wifi
drops during a 10-minute slot you do not get back.

### A8 · Fri 4 Sept · Story, not code

The one-slide for Roast R1. Deck v1. The pitch script. Then pack. **No commits on Friday.**

---

## 4. Phase B — Kuching, 5–9 September

### Day 1 · Sat 5 Sept · Amazing Race

No build. Two things that pay:

- **Content Task 1, "first impressions of Kuching", is due 6 Sept.** Post it during the
  race. Tag `@superteamMY`, `@solana`, and SOCOE. 10 pts per qualifying member post, and
  it feeds the 10×$100 content award.
- The **"teach, don't sell"** station is the highest-value single race station at 10 pts.
  Teach one person a wallet, document what confused them. For Float specifically this is
  free product research: if onboarding a wallet confuses a Kuching local, that is your
  borrower's first experience of your product.

### Day 2 · Sun 6 Sept · Roast My Pitch, Round 1

**90 seconds. One slide. Problem and solution only.** No demo, no architecture, no
Goldfinch. Draft it Friday:

> Small businesses in Sarawak don't fail for lack of revenue. They fail because a customer
> pays in 60 days and payroll is on the 28th. Float advances against that invoice in
> hours — never more than the invoice is worth — and records every repayment on Solana.

Build slot 14:15–16:00 is for fixing whatever R1 breaks. Evening after 19:30 is real
working time.

### Day 3 · Mon 7 Sept · The ten users — the most valuable two hours of the week

11:45 — **Seraphim's RWA & Institutional workshop.** Attend. Ask the question.

14:30–16:30 — field work. Prepare the script **before you fly**, because two hours is
nothing. Kuching targets, in order of likelihood: F&B suppliers to restaurants, logistics
and freight forwarders, construction subcontractors, tourism operators with corporate
accounts. All of them invoice and all of them wait.

Ask these, and write down the answers verbatim:

1. When a customer owes you money, how long does it actually take?
2. What do you do in the meantime when payroll is due?
3. Have you ever borrowed against an invoice? From whom, at what cost?
4. Would you show us the invoice to get paid on it tomorrow?

Question 4 is the one that matters. Willingness to hand over the document is the entire
underwriting model in one question.

Two other teams — **mypengu** (Sarawak local shops) and **F&B Deals** — are already
talking to local merchants. Ask them for introductions at breakfast.

16:30 regroup: "What did you learn from real users?" Have a number and a quote.

### Day 4 · Tue 8 Sept · Submit

Deck clinic 13:30–15:00. Roast R2 15:00–17:30, full dry run with mentors.
**Upload by 16:00, not 17:59.** The cutoff is absolute and you will be mid-roast at 17:30.

### Day 5 · Wed 9 Sept · Demo Day

Tech check 10:00 — bring your own hotspot and test the backup video on the room's
projector, not just your laptop. Pitch 10:30–12:30.

---

## 5. Review findings

Reviewed single-model: `codex` is not installed on this machine and no review subagents
were spawned. There was no independent adversarial pass. Treat the findings below as one
reviewer's, not consensus.

### CEO / strategy

**Premises tested.**

- *"Businesses fail because revenue arrives late, not because it is absent."* Holds. This is
  the standard working-capital thesis and it is why factoring exists.
- *"On-chain credit history is the compounding asset."* **Challenged, and you already know
  it.** Your own research found zero documented cases of one lender consuming another's
  on-chain repayment record. Do not put this on a slide as the moat. The moat is the
  off-chain evidence layer — rejected applications, fraud labels, loss curves.
- *"USDC disbursement in hours is the wedge."* Holds for cross-border. Weaker in-market,
  where a Malaysian SME's alternative is DuitNow, which settles instantly. **Know this
  before a Malaysian judge says it.** Your answer is that speed is the feature and the
  *availability of credit at all* is the product.

**Six-month regret scenario.** The most likely one is not technical. It is having built
a working advance product with no borrowers, because the off-chain work — KYB, invoice
verification, payer confirmation — is where the actual company is, and none of it exists.
Day 3's field work is the cheapest possible hedge against that, which is why §4 gives it
the weight it does.

**Not in scope for Borneo, deliberately:** capital-provider view, KYB flow, invoice
verification, payment routing, partial repayment, multi-currency, mainnet, audit.

### Design

Reviewed against `DESIGN.md`. The four-value palette with status carried in words rather
than red/amber/green is a genuinely good decision and it survives projector colour shift,
which most demos do not. Findings:

- **DESIGN-1 (fix in A6).** The Request screen's amount input has no `max`
  ([web/src/App.tsx:220](web/src/App.tsx:220)) while term and fee both do. Inconsistent,
  and it is the front half of ENG-1.
- **DESIGN-2 (fix in A5).** The credit-record screen is the argument for the whole company
  and it renders empty until advances settle. Seeding two is a design requirement, not
  a nicety.
- **DESIGN-3 (accepted, no fix).** Four tabs put the underwriting queue — an internal
  operator view — beside three borrower views. Confusing as a product, correct for a demo
  where you must show both sides in ten minutes. Keep it. Say "switching to the
  underwriter's view" out loud when you cross over.

### Engineering

**ENG-1 · P1 · Ceiling inconsistency will strand an advance on stage.**
`request_advance` accepts up to `MAX_ADVANCE_ABSOLUTE` ($25,000)
([lib.rs:114](program/programs/float/src/lib.rs:114)) but `approve_and_disburse`
unconditionally rejects anything over `MAX_ADVANCE_TIER_1` ($5,000)
([lib.rs:164](program/programs/float/src/lib.rs:164)). Any request between $5,000 and
$25,000 is accepted, then can never be approved — it sits in "Awaiting review" forever
with no explanation.

Live-demo failure mode: someone types 10000, you approve, the transaction reverts with
`ExceedsTier1Ceiling`, and you are debugging in front of judges. Fix all three layers in
A6: `max={POLICY.MAX_ADVANCE_TIER_1}` on the input, a pre-submit check in `onchain.ts`, and
either move the tier-1 check into `request_advance` or make the absolute ceiling reachable.

**ENG-2 · P2 · Overdue is permanent even after repayment.** `repay_advance` increments
`advances_repaid` but never decrements `advances_overdue`
([lib.rs:250](program/programs/float/src/lib.rs:250)), so a late-but-settled advance counts
against the business forever. `was_late` is emitted in the event but never recorded on
`BusinessProfile`. Defensible as a policy — the record should not be erasable — but decide
it deliberately, because a judge who reads the code will ask whether it is intent or a bug.
Cheapest correct fix: keep the counter, add `advances_repaid_late`.

**ENG-3 · P2 · Toolchain mismatch is the root cause.** `Anchor.toml` pins 0.30.1,
`Cargo.toml` pins `anchor-lang 0.30.1`, the installed CLI is 0.31.1, rustc is 1.95. That
combination is what breaks the IDL. The `proc-macro2` pin in §2 is a patch; aligning on
0.31.1 is the real fix. **Do not attempt the real fix before Borneo** — it is a two-hour
job that can become six, and you cannot afford six.

**ENG-4 · P3 · No tests.** `program/tests/` does not exist and `Anchor.toml` points its
test script at files that are not there. Correct to skip before the conference; note it
before anyone asks. The backup video is standing in for a test suite, which is a trade you
are making knowingly.

**Architecture** — the seam is right, and it is why the D2 override is survivable:

```
App.tsx  ──►  Ledger (interface)  ──┬──►  DemoLedger    in-memory, offline
                                    └──►  OnChainLedger  devnet ──► float program
                                                                     ├─ Treasury
                                                                     ├─ BusinessProfile
                                                                     └─ Advance
```

**DX review: skipped.** Float is not a developer tool and exposes no API, CLI, or SDK. No
developer-facing surface to review.

---

## 6. Task list

| # | When | P | Task |
|---|---|---|---|
| ~~B1~~ | A0 | P1 | **DONE** — deps reinstalled, `npm run dev` serves 200 |
| ~~B2~~ | A0 | P1 | **DONE** — `config.ts` de-Buffered, `npm run build` clean |
| B3 | A0 | P2 | `git push` — four unpushed commits |
| ~~B4~~ | A1 | P1 | **DONE** — via Anchor 0.31.1 alignment; IDL in `web/src/idl/` |
| ~~B5~~ | A2 | P1 | **DONE** — live on devnet, verified |
| B6 | A3 | P1 | `web/src/lib/onchain.ts` implementing `Ledger`; wallet connect (deps already restored) |
| B5b | A2b | P1 | Get devnet SOL, `program extend`, redeploy the 0.31.1 binary |
| B7 | A4 | P1 | `initialize_treasury`, `set_underwriter`, fund with Circle devnet USDC |
| B8 | A5 | P1 | Full devnet loop end to end |
| B9 | A5 | P1 | Seed two settled advances (DESIGN-2) |
| B10 | A6 | P1 | ENG-1 ceiling fix, all three layers |
| B11 | A7 | P1 | **Record the backup video** |
| B12 | A7 | P1 | Verify demo-ledger toggle with wifi physically off |
| B13 | A8 | P1 | One-slide for Roast R1 |
| B14 | A8 | P1 | Deck v1 + pitch script |
| B15 | A8 | P2 | Day-3 user-research script, printed |
| B16 | Day 1 | P2 | Content Task 1 posted, tagged |
| B17 | Day 3 | P1 | Ten user conversations, answers written down |
| B18 | Day 4 | P1 | **Deck uploaded by 16:00 MYT** |
| — | closed | — | ~~D5: team listing~~ — founder call 1 Sept: product may change, not a concern |
| — | deferred | P3 | ENG-2 overdue counter; ENG-3 Anchor 0.31 alignment; ENG-4 tests |

---

## 7. The pitch, given D3 and D4

**Problem.** A Sarawak supplier invoices a customer on 60-day terms. Payroll is on the
28th. The money is earned and unavailable at the same time.

**Product.** Float advances against that specific invoice. **Never more than the invoice is
worth** — the contract enforces it. Approve, disburse USDC in hours, record the schedule
and the repayment on Solana.

**Why not the graveyard.** The line, unchanged:

> Goldfinch had a16z's $25M and wound down in June 2026 with $18M of losses because it
> substituted reputation for control. We bind every advance to a verified inbound payment,
> enforced in the contract.

**Then, before a judge makes you say it** (this is D4, and it is the sentence that earns
the room):

> We do not yet collect at source. The borrower still receives the payment and remits.
> That is the single variable that separated every survivor from every casualty in this
> category, and it is the next thing we build.

**Invoice-only** (D3). If asked about investor payments or frozen accounts: those have no
attachable obligation, so they are unsecured lending against a promise, and they are on the
roadmap behind collection-at-source — not in v1.

**If asked about the on-chain credit record**, do not oversell it. Nobody has made portable
credit history work. Say the durable asset is the underwriting layer: the evidence bundles,
the applications you rejected, the loss curves.

---

## 8. Decision audit trail

| # | Phase | Decision | Class | Principle | Rationale |
|---|---|---|---|---|---|
| 1 | Intake | Verify handoff claims against the machine | Mechanical | P1 completeness | Three claims were false; planning on them would have failed |
| 2 | Intake | Fetch the real schedule | Mechanical | P1 | Deadline was 5 days later than assumed; changes the whole shape |
| 3 | CEO | Invoice-only v1 | **Founder** | — | D3 |
| 4 | CEO | Honest roadmap on control | **Founder** | — | D4 |
| 5 | CEO | Full devnet loop | **Founder override** | — | D2; recommendation was hybrid, retained as safety net |
| 6 | CEO | Freeze code before flying | Mechanical | P6 bias to action | Only ~7 on-site hours, all contested |
| 7 | CEO | Day-3 field work is P1, not a chore | Taste | P1 | Highest-leverage hedge against the real 6-month risk |
| 8 | Design | Keep the 4-tab layout | Taste | P5 explicit | Wrong as product, right for a 10-minute demo |
| 9 | Design | Seeding the credit record is required | Mechanical | P1 | Empty state argues against the thesis |
| 10 | Eng | ENG-1 fixed at all three layers | Mechanical | P1 | Live-demo failure mode |
| 11 | Eng | ENG-2 deferred, decision surfaced | Taste | P3 pragmatic | Policy question, not a crash |
| 12 | Eng | ENG-3 patched not fixed | Mechanical | P6 | Real fix is 2–6h with no ceiling; cannot afford it |
| 13 | Eng | ENG-4 no tests before the event | Taste | P3 | Backup video substitutes; flagged as a known trade |
| 14 | DX | Skip DX review | Mechanical | — | No developer-facing surface |

---

## 9. Concerns I am carrying

1. **The D2 override is the live risk.** Full devnet means A3–A5 must land by Thursday
   night. If Wednesday slips, you fly with a half-wired app. **Trigger to fall back: if
   `OnChainLedger` is not doing a real disbursement by Thursday 3 Sept 18:00, stop, ship the
   demo ledger with the deploy plus one manually-run explorer link, and spend Friday on the
   deck.** Decide that in advance, not at midnight on Thursday.
2. **Reviewed by one model.** No codex, no subagents, no independent pass. The Rust holds
   funds and has had exactly one reviewer. `/review program/programs/float/src/lib.rs` is
   worth an hour on Wednesday.
3. **The listing mismatch (D5) is unresolved** and judges read the directory.
4. **Ten users in two hours in a city you have never been to** is optimistic. Line up
   introductions through mypengu and F&B Deals on Day 2, not Day 3.
