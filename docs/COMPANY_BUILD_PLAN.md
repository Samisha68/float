<!-- float-status-banner -->
> **SUPERSEDED — August 31, 2026.** A four-phase plan for the mobile-first consumer
> product ("AI credit layer for onchain users", SOL-collateralised micro-loans, reputation
> ladder). That direction is dead — see the root [README.md](../README.md). The phase
> structure, the exit-criteria discipline and the "what NOT to build" list are still worth
> reading; the product they describe is not.

---

<!-- /autoplan restore point: /Users/samisha/.gstack/projects/Samisha68-float-app/main-autoplan-restore-20260720-194816.md -->
# Float — Company Build Plan (DeFi)

Status: DRAFT — under /autoplan review
Inputs: [FLOAT_STRATEGY_GIST.md](FLOAT_STRATEGY_GIST.md), the March 2026 hackathon prototype (removed from the tree; see git history)
Date: July 20, 2026

## Thesis

> Float is the AI credit layer for onchain users.

Most DeFi lending asks "how much collateral do you have?" Float asks "can this
wallet be trusted to repay?" The wedge is mobile-native, short-term,
SOL-collateralized USDC micro-loans that generate wallet-level repayment
history. The company is the reputation and underwriting network that history
powers.

## Premises

- **P1 — Borrower demand exists.** There are Solana users who hold SOL/LSTs and
  periodically need short-term USDC liquidity without selling ($10-$500 for
  3-30 days).
- **P2 — Repayment history is a usable signal.** Repayment behavior on
  overcollateralized micro-loans carries underwriting signal that transfers to
  progressively less-collateralized terms.
- **P3 — Mobile is an acquirable channel.** Solana dApp Store + Seeker
  distribution can acquire the first 1,000 borrowers cheaper than competing for
  DeFi power users against Kamino/Jupiter.
- **P4 — Lender supply follows transparent risk.** Retail/degen lenders will
  deposit into pools if terms, caps, and realized default data are visible.
- **P5 — Agent-inside-guardrails is a durable differentiator.** AI agents
  operating within hard on-chain policy rules produce better risk/UX than
  static parameter lending, and this compounds with data.
- **P6 — The prototype is scaffolding, not the product.** USDC-vs-USDC flows
  are discarded; MWA integration, program patterns, and screens are reusable.

## Phase A (months 0-3): The credible wedge — "Borrow USDC against SOL from your phone"

**Protocol (rebuild, don't patch):**
- Kill USDC-against-USDC entirely.
- Isolated micro-markets, Morpho-inspired. A market =
  `{loan_asset, collateral_asset, term_range, max_ltv, liq_threshold, oracle, rate_model, agent_policy}`.
- Launch markets: SOL/USDC and JitoSOL/USDC, 3-30 day terms, $10-$500.
- New-borrower max LTV 50%; liquidation threshold 75%.
- Pyth oracle integration; staleness and confidence-interval checks.
- Permissionless liquidation with keeper incentive (liquidator bonus bps) +
  our own keeper bot as backstop.
- Fixed origination fee + flat term fee (no APR confusion at this loan size).
- **Reputation primitive from day 1:** `BorrowerProfile` PDA per wallet —
  loans taken, repaid on time, repaid late, defaulted, cumulative volume.
  Written by the program on every repay/liquidate, not by any off-chain actor.
- Deterministic on-chain policy engine enforces all caps. The AI agent is
  advisory/off-chain only in Phase A — no LLM in the money path.
- Security: audit before mainnet, program caps (global TVL cap, per-market cap),
  admin multisig, emergency pause.

**Mobile app:**
- Keep the MWA signing stack (it works and is the hard part).
- Cut to three core flows: Borrow, Repay, Positions. Lender UI ships Phase B.
- Price display, health factor, liquidation warning, due-date push
  notifications.

**Exit criteria for Phase A:** audited program on mainnet with caps, 100 real
loans, ≥90% on-time repayment, zero bad debt from oracle/liquidation failures.

## Phase B (months 3-6): Reputation starts paying

- Repeat-borrower terms enforced on-chain from `BorrowerProfile`: LTV 50% → 65%,
  fee discounts after N clean repayments.
- Lender side opens: one conservative pool, transparent dashboard (utilization,
  realized defaults, realized yield, loan book).
- Due-date automation loops (notifications, auto-repay opt-in).
- Validation sprint result gates scope: 20+ borrower interviews decide which
  loan shapes/terms to expand.

## Phase C (months 6-12): Agent pools — curators as a marketplace

- Multiple pools with distinct policies (Safe / Balanced / Growth / SOL-only).
- Agents as curators: allocate pool capital across micro-markets inside hard
  guardrails; performance fee (10-20% of interest) accrues to Float + agent.
- AI moves from advisory to allocating — still bounded by on-chain policy;
  every decision logged and auditable.
- Read-only Credit API v0: repayment score per wallet for other apps/wallets.

## Phase D (months 12+): Embedded credit + undercollateralized experiments

- Embedded credit SDK for wallets and apps (partner rev share).
- Partial-collateral loans for top-reputation cohort: capped cohort exposure,
  insurance fund seeded from fees, explicit loss budget.
- Cashflow-backed credit exploration (Huma-style) only after reputation data
  proves predictive.

## Business model

- Origination fee (10-50 bps) + flat term fee on borrower side.
- 10-20% of pool interest as agent/strategy fee (Phase C+).
- Partner revenue share for distribution (Phase D).
- Long-term: Credit/reputation API licensing.

## Go-to-market

- Solana dApp Store listing + Seeker-native launch.
- First-borrower persona hypothesis (to validate, not assume): active Solana
  users who hold SOL and hit recurring short-term cash needs — traders bridging
  settlements, creators/gig workers awaiting payouts, emerging-market holders
  avoiding forced selling.
- Pre-mainnet validation sprint: 20 interviews with target borrowers; kill or
  reshape loan terms based on findings.

## What NOT to build (inherited from strategy gist)

- Generic Solana lending app; USDC-against-USDC anything.
- Manual P2P offerbook; NFT lending as wedge.
- Trader leverage as core product.
- AI that rubber-stamps collateral rules.
- Broad protocol before knowing the first borrower deeply.

## NOT in scope (v1)

- Multi-chain. Governance token. NFT/RWA collateral. Institutional pools.
- LLM execution authority over funds (advisory only until Phase C, bounded
  allocation after).

## Risks / open questions

1. Cold start: reputation signal from overcollateralized loans may be weak
   (people repay to reclaim collateral). Mitigation: treat Phase A data as
   experiment; define signal-quality metrics up front.
2. Liquidity bootstrap: who funds the first pool? (Likely: own treasury +
   small LP round with caps.)
3. Competition response: Kamino/Jupiter could ship micro-loans; moat must be
   reputation data + mobile UX, not the loan itself.
4. Oracle/liquidation risk at small loan sizes: keeper economics for $50
   loans need explicit fee design.
5. Regulatory: consumer-credit adjacency; needs counsel before undercollateralized phase.

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|----------|----------|
| 1 | 0 | Skip /office-hours prerequisite offer | Mechanical | P6 | FLOAT_STRATEGY_GIST.md already provides problem statement, premise challenge, and explored alternatives | Re-running office-hours |
| 2 | 0 | Author plan file from strategy gist + analysis | Mechanical | P6 | /autoplan needs a plan file; user asked "how should this be built" | Reviewing strategy gist raw |
| 3 | 1 | CEO mode = SELECTIVE EXPANSION | Mechanical | — | Mandated by /autoplan override rules | — |
| 4 | 0.5 | Degrade dual voices to subagent-only | Mechanical | — | Codex CLI not installed on this machine | — |
