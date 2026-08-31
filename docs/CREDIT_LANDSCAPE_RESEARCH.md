# On-Chain Credit on Solana — Landscape Research (July 2026)

<!-- float-status-banner -->
> **PARTIALLY LIVE — August 31, 2026.** Competitive research from July 2026, written to
> support a consumer-credit decision that has since been abandoned. The market map
> (overcollateralised lending is a closed lane; standalone credit scores are a graveyard)
> is still accurate and useful. Its conclusions about which consumer product Float should
> build are not. Current direction: root [README.md](../README.md).

---

Purpose: answer "what is the best thing to build in credit score / credit systems
in Solana DeFi?" with evidence, before locking the Float company build plan.
Companion to [FLOAT_STRATEGY_GIST.md](FLOAT_STRATEGY_GIST.md) and
[COMPANY_BUILD_PLAN.md](COMPANY_BUILD_PLAN.md).

## 1. The map — five territories

### 1a. Solana overcollateralized lending: CLOSED lane

- Kamino ~$2.0B TVL, largest unified lending market on Solana.
- Jupiter Lend: $873M TVL within a year of launch (Aug 2025), riding Jupiter
  distribution.
- marginfi ~$450-700M, Save ~$400M, Drift spot ~$300M. Solana DeFi TVL ~$12B+.
- USDC supply yields 4-9% APY through 2026.
- None of them do borrower-level credit. All price risk purely from collateral.

Verdict: do not compete here. A new overcollateralized money market on Solana
has no reason to exist.

### 1b. Standalone credit scores: the GRAVEYARD

| Project | Status (2026) | Lesson |
|---|---|---|
| RociFi (Polygon NFCS) | Stalled, minimal activity since 2023 | Opt-in scores have selection bias; score-first died |
| ARCx "DeFi passport" | Early/stalled | Passport without a lending market = no business |
| Spectral (ETH MACRO) | Active but score-only | Outputs a number, not lending decisions; protocols must do the hard part |
| Masa | Active, structurally gameable | Users share favorable data, withhold bad = upward bias |
| Cred Protocol | Active, ETH lending history; has MCP endpoints for AI agents | Passive scoring works but is data infrastructure, not a product |
| Providence (Cronje, 20 chains) | Active, 60B+ tx dataset | Big data ≠ underwriting; still self-service score presentation |
| ChainAware | Active 4+ yrs, fraud+credit | Credit scoring still ETH-only; fraud signal is the differentiator |

Core lesson: **a credit score without an owned lending loop has no business
model and no defensible data.** Every score-first project stalled or became
someone else's input. On-chain behavior alone is weakly interpretable and
gameable.

### 1c. Who actually survived undercollateralized lending: institutions + legal recourse

- Maple: restructured after the 2022 blowups (Celsius/3AC/Alameda defaults);
  pool delegates now post real first-loss capital; $500M+ cumulative in cash
  management pools by late 2025.
- TrueFi: KYC + legally binding agreements; longest track record.
- Credora: institutional privacy-preserving solvency proofs.
- Moody's ratings went live ON SOLANA (June 17, 2026, via AlphaLedger):
  any wallet/protocol can query real credit ratings from token metadata.

Lesson: undercollateralized lending survived only where there was real-world
recourse and identity. The institutional lane on Solana now has Moody's-grade
rails and incumbent relationships. Not a startup wedge.

### 1d. Cashflow credit: Huma proved it — ON SOLANA

- Huma (PayFi): $4.4B+ transaction volume, 50k+ depositors, $17M annualized
  revenue (Aug 2025, up 16x YoY), Tala partnership targeting $2B+ tokenized
  lending origination in 2026.
- Model: lend against payment flows (settlement financing, BNPL-like), not
  against collateral. Real-world yield, real borrowers.

Lesson: the biggest credit success on Solana lends against **future cashflow
with distribution partners**, not against crypto collateral. Huma has a
multi-year head start in trade/payment financing; don't attack them head-on.

### 1e. The new wave (2025-26): verifiable off-chain trust for retail — NOT yet on Solana

- 3Jane (Ethereum, $5.2M seed from Paradigm + Coinbase Ventures): unsecured
  credit lines for retail, underwritten by the 3CA algorithm combining
  on-chain data (Cred Protocol) with **zkTLS-proven off-chain data** —
  VantageScore via Credit Karma, bank balances via Plaid, proven with Reclaim
  Protocol without exposing raw data. Off-chain debt recovery auctions for
  defaults. Whitepaper explicitly targets "cryptonative sole proprietors,
  businesses, and AI agents."
- Enabling rails now live on Solana:
  - **Solana Attestation Service (SAS)**, mainnet since May 2025 (Civic,
    Solid, Trusta Labs, Solana.ID): reusable, signed attestations binding
    off-chain facts (KYC, accreditation, credit) to wallets without exposing
    the data.
  - **Trusta Labs**: MEDIA wallet score, Proof-of-Humanity AND
    Proof-of-AI-Agent attestations; 3M+ attestations issued, 500k+ MAU.
  - zkTLS (Reclaim) works chain-agnostically.

Lesson: the architecture for **importing real-world trust into a wallet** is
proven (3Jane) and the Solana-native rails exist (SAS, Trusta, Reclaim), but
**nobody has assembled them into a consumer credit product on Solana**. This
lane is open.

### 1f. Emerging demand side: AI agents — greenfield, early

- x402 (HTTP-native stablecoin payments for AI agents): hundreds of millions
  of cumulative transactions settling mostly on **Base and Solana**; ~75M tx /
  $24M volume per 30 days (July 2026); backed by a foundation including Visa,
  Mastercard, Ripple; AWS shipped Bedrock AgentCore Payments (May 2026).
- Agents today are prepaid-only: they pay per request from a topped-up wallet.
  No agent credit market exists. Volume per tx is tiny ($0.32 avg) and one
  Coindesk piece (Mar 2026) notes demand is still forming — early, but the
  slope is steep and Solana is one of the two settlement homes.
- Trusta already issues Proof-of-AI-Agent attestations; 3Jane names agents as
  future borrowers; Cred exposes MCP endpoints for agents.

Lesson: **credit for AI agents** (working-capital lines so agents can consume
paid APIs/compute and settle periodically) is a genuinely unoccupied lane that
matches Float's agent DNA. Risk: market timing — real but small today.

## 2. Gap analysis — what is actually open on Solana

| Lane | Status | Open? |
|---|---|---|
| Overcollateralized money market | Kamino/Jupiter/marginfi | ❌ Closed |
| Institutional private credit | Maple/Credora + Moody's rails | ❌ Taken |
| PayFi / cashflow trade financing | Huma + Tala | ❌ Big head start |
| Standalone credit score / passport | Graveyard evidence | ❌ Bad business |
| **Attestation-underwritten consumer credit (3Jane-for-Solana, mobile)** | Rails live, no assembled product | ✅ **Open** |
| **Credit for AI agents (x402-native)** | No player anywhere on Solana | ✅ Open, early |
| Reputation data layer feeding lenders | Only works after owning a loan book | ⚠️ Sequenced, not first |

## 3. What the graveyard + winners teach (design rules)

1. **Own the lending loop.** Score-first dies; lend-first generates the
   proprietary repayment data that becomes the score (RociFi vs Maple).
2. **Trust must be imported, not only earned.** On-chain-behavior-only
   underwriting is weak and gameable. zkTLS proofs + SAS attestations import
   real-world trust on day 1 and solve the cold-start problem that pure
   repayment-reputation models face.
3. **Recourse matters at low collateral.** 3Jane built recovery auctions;
   Maple required first-loss capital. Any step below ~100% collateral needs a
   loss budget, insurance fund, or recovery mechanism designed up front.
4. **Distribution beats protocol.** Jupiter Lend hit $873M in a year on
   distribution alone; Huma scales through Tala. Float's equivalent asset is
   mobile + dApp Store — lean on it.
5. **Deterministic rules on-chain, AI advisory off-chain.** Every surviving
   lender keeps hard limits in code. AI compounds value in underwriting
   analytics and ops, not as an unconstrained decision-maker.

## 4. Recommendation — what Float should build

**Build: the attestation-underwritten credit line for Solana — mobile-first.**
Working name: "credit line that grows as your wallet proves itself."

Mechanism (the collateral ladder):
- Rung 0 (day 1, anyone): 110-150% collateralized micro-loan — current
  prototype mechanics, real from launch.
- Rung 1: + SAS/Trusta attestations (proof-of-humanity, KYC-once, wallet
  reputation) → collateral requirement drops (e.g. 80%).
- Rung 2: + zkTLS proofs (bank balance / income / credit score via Reclaim)
  → 50-60% collateral, higher limits.
- Rung 3: + Float repayment history (BorrowerProfile PDA) → best terms;
  history compounds into the moat.
- Hard caps at every rung: per-loan, per-cohort exposure, pool insurance fund
  seeded from origination fees. Deterministic on-chain policy engine; AI does
  underwriting analytics, limit recommendations, and ops automation.

Why this wins the open lane:
- It is 3Jane's proven architecture, first to Solana, with a mobile
  distribution wedge nobody in credit has.
- It solves the cold-start flaw in the pure reputation thesis: trust is
  imported via attestations immediately, then refined by repayment data.
- It composes existing rails (SAS, Trusta, Reclaim, Pyth) instead of
  building identity infrastructure — Float's build surface stays the lending
  loop + mobile UX, which it already has in prototype form.
- The repayment data generated becomes the long-term asset (Credit API,
  Phase C+), which the graveyard shows only works AFTER owning the loop.

**Second act (tracked, not built yet): agent credit.** x402 settles on Solana;
agents are prepaid-only today; Trusta's Proof-of-AI-Agent + operator
attestations + Float's ladder mechanics extend naturally to agent
working-capital lines. Revisit when x402 monthly volume supports it; owning
consumer ladder mechanics first makes Float the obvious player.

## 5. Sources

- [Moody's ratings live on Solana (CoinDesk, Jun 17 2026)](https://www.coindesk.com/business/2026/06/17/moody-s-rolls-out-credit-ratings-on-solana-in-tokenized-asset-push)
- [7 crypto-native credit score projects 2026 (mpost)](https://mpost.io/7-projects-building-crypto-native-credit-scores-in-2026/)
- [DeFi credit score platforms compared (ChainAware)](https://chainaware.ai/blog/defi-credit-score-comparison/)
- [State of DeFi lending 2026 (Yellow Research)](https://yellow.com/research/defi-lending-forces-reshaping-decentralized-credit-markets)
- [Huma PayFi keynote — $4.4B volume (Solana Compass)](https://solanacompass.com/learn/breakpoint-25/product-keynote-huma-finance)
- [Huma x Tala tokenized lending on Solana (SolanaFloor)](https://solanafloor.com/news/huma-finance-and-tala-partner-to-launch-scalable-tokenized-lending-platform-on-solana)
- [3Jane whitepaper](https://www.3jane.xyz/pdf/whitepaper.pdf) · [Paradigm-led 3Jane analysis (PANews)](https://www.panewslab.com/en/articles/ac3fc7da-0e2c-4519-8333-c40d0060f52f)
- [Solana Attestation Service announcement](https://solana.com/news/solana-attestation-service) · [attest.solana.com](https://attest.solana.com/)
- [Trusta Labs TrustScan / MEDIA score](https://www.trustalabs.ai/trustscan)
- [x402 backed by Visa/Mastercard/Ripple, 75M tx/30d (CoinDesk, Jul 15 2026)](https://www.coindesk.com/tech/2026/07/15/visa-mastercard-and-ripple-join-the-standard-letting-ai-agents-pay-in-stablecoins)
- [x402 agentic payments adoption (Chainalysis)](https://www.chainalysis.com/blog/x402-agentic-payments-adoption/)
- [AWS Bedrock AgentCore Payments + x402](https://aws.amazon.com/blogs/industries/x402-and-agentic-commerce-redefining-autonomous-payments-in-financial-services/)
- [Kamino/Jupiter/marginfi TVL state 2026 (Eco)](https://eco.com/support/en/articles/13225733-best-defi-apps-on-solana-2026-tvl-categories-growth)
