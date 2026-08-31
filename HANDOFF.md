# Session handoff — 31 August 2026

Everything decided and built in the Cowork session, so a Claude Code session can
pick up cold. Read `CLAUDE.md` first for the ground rules, then this.

---

## 1. What Float is

On-chain short-term working-capital credit for small and medium businesses whose
money is delayed — an unsettled customer invoice, a cross-border investor payment
in flight, a temporary banking block — while payroll and vendors still come due.

A verified business applies with evidence of its incoming funds. Float underwrites
and, on approval, disburses **USDC** in hours rather than days. The loan, schedule
and repayment status are recorded on **Solana**. Repayment builds a portable credit
history. Capital providers get underwritten business-credit exposure.

Tagline in use: *"Float helps businesses turn tomorrow's revenue into today's opportunity."*

**Decided 31 Aug 2026 by the founder. This supersedes every earlier direction.**
The consumer crypto-credit-card idea and the mobile-first app are dead.

## 2. Why the repo used to be confusing

The code, the docs and the brand described three different companies. Fixed this
session:

| Date | Direction | Status |
|---|---|---|
| Jun 2026 | Hackathon: consumer mobile crypto lending | Dead — now in `archive/` |
| Jul 2026 | "AI credit layer for onchain users", mobile-first | Dead |
| Jul 30 2026 | `float-redesign.md` — earned-wage access via employers | Proposed, **not taken** |
| Aug 1 2026 | Designer brief — invoice factoring for payroll firms | Not taken; brief still useful |
| **Aug 31 2026** | **B2B working capital (above)** | **CURRENT** |

Every superseded doc now carries a `<!-- float-status-banner -->` at the top saying
what is dead and what is still live. **Add one to any doc that gets superseded.**

`docs/float-redesign.md` is still the sharpest analysis in the repo even though its
pivot was rejected. Its central argument survives every change of customer:
**enforcement cannot be solved with information — only with control of cash flow, or
a court.**

## 3. Competitive research — the evidence base

Full detail in `docs/COMPETITIVE_EVIDENCE_2026.md`. The three findings that matter:

1. **Nobody is doing exactly this.** Closest: **MANSA** (Tether-backed; the buyer pays
   MANSA directly — real payment interception), **Jia** (Philippines SMEs, $500–5k
   tickets, <1% losses, advances in 30 minutes), **Huma/Arf** (~$17B cumulative on
   Solana but lends to licensed payment institutions, not SMEs).
2. **The graveyard is full and investors know it.** Goldfinch wound down June 2026 —
   $56M stuck, ~$18M losses, token −99.8%, and a16z had put in $25M. TrueFi's parent
   filed Chapter 11. Centrifuge exited SME receivables. Maple survived only by
   abandoning the model for 150%+ overcollateralised crypto lending.
3. **"On-chain credit history" as a moat has zero documented successes.** Not one
   verified case of a repayment record being consumed by a *different* lender for
   better terms. Spectral raised $29.75M and quit; RociFi's domain is now a casino
   affiliate page; Cred Protocol sells a score for $0.10 an API call.

**The one variable that separated survivors from casualties: whether the lender
controls the incoming payment.** Fasanara (collections into accounts it controls,
originator locked out) — under 1% losses for nine years. First Brands' US factors,
where the borrower collected — $1.9bn vanished. Percent's own numbers: asset-based
lending defaults 2.05%, corporate lending 11.84%, same platform.

## 4. Repo layout

```
Float/
├── CLAUDE.md      ground rules — read first
├── DESIGN.md      visual system. Authoritative. Four colours, no fifth.
├── BUILD.md       MVP run commands and day plan
├── HANDOFF.md     this file
├── program/       NEW Anchor program (the MVP)
├── web/           NEW Vite + React app (the MVP)
├── archive/       DEAD hackathon code — read archive/README.md before touching
├── docs/          strategy + research; check each file's status banner
└── promo/         Remotion brand trailer
```

The website is a **separate repo** at `~/Projects/Float_website`
(github.com/Samisha68/Float_website, deployed by Vercel). It is **live** — do not
edit it as part of unrelated work.

## 5. Git state

Branch **`chore/repo-cleanup`**, five commits, **not merged to main**:

| Commit | What |
|---|---|
| `00476b1` | Docs reset to the business-credit direction |
| `62e83e0` | Hackathon build moved to `archive/` |
| `3f1e043` | Website moved out to its own folder |
| `432e422` | **MVP scaffold — program + web app** |
| `fbe00f8` | Program id wired into the web app |

**The last two are not pushed.** `git push` to send them.

`float-app` on GitHub is now **private** — it was public, and the strategy docs
were briefly exposed when the branch was first pushed. Keep it private.

Git identity is not configured globally on the machine; commits were made with
`git -c user.name="Samisha68" -c user.email="samishaofficial68@gmail.com"`.

## 6. The MVP — what exists

**Deadline: Startup Village Borneo, ~4 September 2026.** Scope was cut to one
borrower journey: request an advance → underwriter approves → USDC disburses →
repay → credit record updates.

### `program/` — Anchor 0.30.1, ~600 lines
Builds clean. `float.so` is 318KB. Program id
**`6NjXwwwuFNWV3MBk2r2wv68hDde1snEiMMfwrvQ31Db8`**.

Instructions: `initialize_treasury`, `set_underwriter`, `register_business`,
`request_advance`, `approve_and_disburse`, `repay_advance`, `mark_overdue`.
State: `Treasury`, `BusinessProfile` (the credit record), `Advance`.

Policy enforced in code:
- Tier-1 ceiling **$5,000** without a pledge; absolute ceiling $25,000
- **An advance may never exceed the verified expected inflow** — the ceiling moves
  with something the borrower cannot manufacture, so repayment history moves price
  and speed but never the limit. This is the bust-out defence and the answer to
  "how are you not Goldfinch"
- Term 1–60 days; fee cap 1,000 bps
- `mark_overdue` is permissionless — the record cannot be suppressed by the borrower
  *or* the operator

Deliberately **off-chain**: KYB, evidence verification, payer confirmation, payment
routing. That is where the real credit work happens.

### `web/` — Vite 6 + React 18 + Tailwind 4
Verified building: `tsc` clean, `vite build` 619ms. Four screens — Request an
advance, Your advances, Underwriting queue, Credit record.

Built to `DESIGN.md`: four-value palette, Poppins, tabular figures. Because the
palette has no red/amber/green by design, **status is carried in words** —
"Awaiting review", "Funded — repayment due", "Past due".

**Key architecture decision:** `web/src/lib/ledger.ts` defines a `Ledger` interface.
The UI never talks to Solana directly. `DemoLedger` implements it in memory and runs
the entire journey with no network — deliberate stage insurance. `OnChainLedger`
slots in behind the same interface with no changes to `App.tsx`. If time runs out,
shipping the demo ledger alone tells the same story.

Solana deps were removed from `web/package.json` to make installs fast; the full
list is preserved in `web/package.full.json`.

## 7. Known issues

1. **The IDL did not generate.** `program/target/idl/` is empty despite
   `idl-build` being in `Cargo.toml` and the `anchor-lang-idl` crates compiling.
   Diagnose with `anchor build 2>&1 | tail -40`. The web app needs the IDL to call
   the program through Anchor's `Program` class.
2. **Deploy unverified.** Check with
   `solana program show 6NjXwwwuFNWV3MBk2r2wv68hDde1snEiMMfwrvQ31Db8 --url devnet`.
   Devnet deploys of this size need ~3 SOL; the airdrop is rate-limited, so use
   faucet.solana.com if the CLI refuses. If a deploy dies partway,
   `solana program show --buffers` then `solana program close --buffers` reclaims SOL.
3. **Two commits unpushed.**
4. **Circle devnet USDC is `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`.** The
   archived code uses a different, wrong mint and mislabels it as Circle's. Do not
   copy it.

## 8. Open decisions — these are yours, not settled

I built the scaffold and made product calls that were the founder's to make. They
are cheap to change; flag them rather than inheriting them silently.

1. **The policy numbers** ($5,000 / $25,000 / 1–60 days / 1,000 bps) were derived
   from the research, not chosen by the founder.
2. **The demo narrative** — currently borrower-first. A two-sided version (adding a
   capital-provider view) or an underwriting-first version are both defensible.
3. **The three trigger cases are not the same asset.** Only the *customer invoice*
   has a third-party debtor whose obligation can be verified and attached. A delayed
   *investor payment* and a *banking block* have no attachable obligation — those
   would be unsecured lending against a promise. Decide whether they belong in v1.
4. **Repayment control is still unresolved**, and everything hangs off it: whether
   the payer remits to an account Float controls, or the borrower is trusted to
   remit on receipt. The research says this single variable separates every survivor
   from every casualty.
5. **The moat.** "On-chain credit history" has never worked for anyone. The
   defensible version is the off-chain layer — evidence bundles, rejected
   applications, fraud labels, loss curves.

## 9. Next steps

```bash
# run the demo — works today, no chain needed
cd ~/Projects/Float/web && npm install && npm run dev

# diagnose the IDL
cd ~/Projects/Float/program && anchor build 2>&1 | tail -40

# confirm deployment
solana program show 6NjXwwwuFNWV3MBk2r2wv68hDde1snEiMMfwrvQ31Db8 --url devnet
```

Then: write `web/src/lib/onchain.ts` implementing `Ledger` against the program,
restore the Solana deps from `package.full.json`, add wallet connect, seed a demo
business, rehearse — and **record a backup video**, because live demos fail on
conference wifi.

## 10. For the pitch

The question every judge asks is why this does not go the way of the other on-chain
lenders. The answer in one line:

> Goldfinch had a16z's $25M and wound down in June 2026 with $18M of losses because
> it substituted reputation for control. We bind every advance to a verified inbound
> payment, enforced in the contract, and we are building toward collecting it at
> source.

## 11. gstack

Installed on this Mac at `~/.claude/skills/gstack`, upgraded to 1.77.0.0. It works
in **Claude Code only** — it was never available in the Cowork session, which loads
skills from a different registry. Worth running `/review` on
`program/programs/float/src/lib.rs` — 600 lines of Rust that has had no independent
pass.
