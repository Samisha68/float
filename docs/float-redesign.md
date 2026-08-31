# Float — Strategic Redesign

<!-- float-status-banner -->
> **STATUS — August 31, 2026: proposal not adopted, analysis still live.**
> The pivot this document argues for (earned-wage access for stablecoin-paid workers, sold
> through employers) was **not** the direction taken. Float is building on-chain short-term
> working-capital credit for businesses — see the root [README.md](../README.md).
>
> Read it anyway. It remains the sharpest analysis in this repo, and its central argument
> survives the change of customer: **enforcement cannot be solved with information — only
> with control of cash flow, or a court.** That test applies to the business-credit model
> exactly as it applied to the consumer one. §1 (verdict), §7 (collateral) and §14 (honest
> objections) are the sections that still bite.

---

**Prepared as:** fintech founder / crypto credit-risk / consumer-lending operator / protocol designer / pre-seed investor
**Date:** 30 July 2026
**Status:** working document. Regulatory positions are stated as of my information through mid-2026 and must be confirmed with local counsel before anything is signed.

---

# 1. Investment verdict

## **Potentially investible, but only with a major pivot.**

Not "investible after a focused redesign," because the thing that has to change is not the product surface, the ladder calibration, or the messaging. It is the **source of repayment**. Every other flaw in Float is downstream of one unresolved question: *when the borrower does not want to pay, what makes the money come back?* The current answer — "they will want to keep their reputation" — fails arithmetic. Until that answer changes, no amount of UX, tier tuning, or attestation plumbing helps.

Not "abandon," because there is a real, underserved, and currently un-arbitraged asset class hiding inside the pitch. Stablecoin payroll is now a genuine phenomenon: contractors and employees across Latin America, Africa, South and Southeast Asia, and Eastern Europe are paid in USDC/USDT by identifiable corporate payers, on predictable cadences, with the entire payment history publicly verifiable. Those people have real credit need, no credit access, and an income stream that is **observable and interceptable in a way no bank can match**. That is a legitimate lending business, and it is closer to Float's existing prototype than to anything a bank could build. It is just not a credit card, and it is not for anonymous wallets.

### Problem triage

| Problem | Class | Verdict |
|---|---|---|
| Default surplus positive at upper tiers | **Product design** | Solvable. Cap exposure by verified inflow, not by history; bound exposure-at-default per cycle. |
| Bust-out fraud via manufactured history | **Product design** | Solvable. History must never *raise* exposure; only price and friction. |
| First-payment default / synthetic identity | **Product design + partner** | Solvable to ~1–3%, never to zero. Requires binding to an employer or payer record, not a personhood credential. |
| No recovery mechanism | **Legal/institutional** | Requires real identity, an enforceable contract, and a claim on cash flow. Cannot be designed around. |
| Retail lender pool = unregistered securities | **Legal/institutional** | Solvable by not doing it. Institutional capital only. |
| Consumer lending licences | **Legal/institutional** | Solvable, jurisdiction by jurisdiction, at meaningful cost and time. |
| Required borrower APR (45–60%) vs EU/US usury caps | **Structurally fatal in those markets** | Small-ticket short-tenor consumer credit at pre-seed cost of capital is **illegal at the price it needs**. Either change the market or change the fee structure to earned-wage access. |
| Cost of capital 15–18% for a pre-seed originator | **Structurally binding** | Kills any long-duration or large-balance product. Forces short, high-velocity, fee-priced advances. |
| Undercollateralized credit to pseudonymous wallets | **Structurally fatal** | Abandon permanently. Not a calibration problem. |
| Public on-chain repayment history as a moat | **Structurally fatal as stated** | Public data is not proprietary. Moat must move off-chain. |

### The one-sentence diagnosis

Float tried to solve enforcement with information (a reputation score) when enforcement can only be solved with **control of cash flow, or a court**. The redesign gets both: it advances only against wages the employer already owes, collects from the inflow before the borrower sees it, and does it under a real name with a real contract.

---

# 2. Borrower incentive system, rebuilt

## 2.1 The invariant

Define, for any borrower at any moment:

> **Default Surplus (DS)** = Drawn balance − liquidatable collateral value (haircut) − PV of interceptable future inflow claims − expected legal/bureau recovery

**Hard rule: DS ≤ 0 at every point in the lifecycle, for every tier except the top one, where DS ≤ the per-borrower fraud reserve.**

This single constraint invalidates the original ladder immediately. At "Income-proven" (50–60% collateral, $2,000+), DS ≈ +$900 with no interceptable inflow and no legal claim. The redesign satisfies the invariant not by raising collateral but by **shrinking the numerator (exposure at default) and building the subtrahends (inflow claim, legal recovery).**

## 2.2 Nine design rules

**1. Limits are a function of verified inflow, never of repayment count.**
Cap = *k* × verified net monthly inflow, where *k* ∈ [0.2, 0.8] by tier. Repayment history moves *price, tenor, speed, and permitted use* — never the ceiling. This is the structural fix for bust-out: the ceiling is exogenous to anything the borrower can manufacture. Fifty perfect $50 repayments do not unlock $2,000; a verified $1,400/month payroll stream does.

**2. Advance only against value already accrued.**
The core primitive is not a loan against future income. It is an advance against **wages the employer already owes for days already worked**. This changes who the credit risk sits on: primarily the employer's obligation to pay, secondarily the worker. It also means an unemployment shock stops originations *before* it creates losses, rather than after.

**3. Exposure at default is bounded per cycle, not per limit.**
A $1,500 monthly limit drawable at $375/week with weekly settlement has a maximum EAD of roughly $375–$750, not $1,500. Streaming or per-cycle drawdown caps are the cheapest risk control available and cost the borrower almost nothing in utility, because their need is cash-flow timing, not a lump sum.

**4. Assume maximum draw at default.** Model EAD at the tier ceiling every time. Borrowers who intend to default max out first. Every published loss number in this document uses full-utilisation EAD.

**5. History must be loss-bearing to count.**
A repaid loan where collateral ≥ drawn carries **zero credit information** and earns zero underwriting credit. Weight history by (uncollateralized amount at risk × days at risk × cycles survived). Cap limit growth at min(*k* × verified inflow, 1.5 × prior peak *uncollateralized* drawn, tier ceiling).

**6. First cycle carries no cash-out.**
First draw for any new borrower is either fully secured or restricted to merchant/bill settlement. This eliminates the entire economics of identity farming: if a farmed identity's best case is a $150 purchase at an approved merchant with clawback rights, the identity is not worth its acquisition cost.

**7. Identity cost must exceed maximum first-cycle DS.**
This is the anti-Sybil equation, and it is the only one that matters. A proof-of-personhood credential is farmable for roughly $10–50. Therefore first-cycle DS must be ≤ $0. What is *not* cheaply farmable is an **employer-verified employment record with a payer address that has an on-chain history and a corporate counterparty Float has contracted with.** Bind exposure to that, not to a personhood NFT.

**8. Collateral is a commitment device and a price input, not the risk control.** See §7.

**9. Every unsecured dollar has a name attached to it.** No exceptions, no tiers, no "privacy mode." See §3.

## 2.3 Specific attack surfaces and responses

| Attack | Mechanism | Response |
|---|---|---|
| **Bust-out** | Climb tiers on small loans, max out, vanish | Ceilings set by inflow, not history. Per-cycle EAD cap. Limit increases require a *new* verification event (re-liveness, refreshed payroll pull), not just clean cycles. |
| **First-payment default** | Take first draw, never pay | First cycle secured or purchase-only, zero cash-out. FPD tracked as a separate KPI with a hard kill threshold (>2.5% of new-borrower originations). |
| **Identity farming** | Buy/rent verified credentials in bulk | Unsecured exposure requires employer-side verification: named worker on a payroll roster Float has a contract with. Personhood credentials are a *de-duplication* input, never an exposure unlock. |
| **Coordinated Sybil** | Ring of synthetic workers at a fake employer | Per-employer exposure cap during first 90 days ($5k or 3 workers, whichever binds first). Employer onboarding requires corporate KYB, a payer address with ≥6 months of history, and payroll volume that predates Float. Graph monitoring on payer address / device / IP / bank-name-match / withdrawal destination. |
| **Synthetic identity** | Fabricated person passing KYC | Two-vendor KYC with liveness, plus a *third* independent signal: name match against the bank or exchange account receiving the payroll, and against the employer's roster. Synthetic identities fail the tri-party match. |
| **Device farming** | 500 emulated devices | Device attestation (Play Integrity / App Attest), SIM/carrier binding, one active credit line per device-and-payer pair, hard velocity limits per corridor per day. |
| **Account resale** | Sell a seasoned account | The line is non-transferable in substance: repayment is intercepted from the inflow, so a buyer who does not control the payroll gets a liability, not an asset. Plus re-liveness on new device, on limit increase, and on any draw above 50% of ceiling. |
| **Employer collusion** | Fake employer originates against fake workers | Employer is a contracted counterparty with a corporate guarantee and a reconciliation obligation. Losses from employer fraud are the single largest tail risk and are capped by the 15%-per-employer concentration limit (§5). |

## 2.4 Disbursement design — answers to the specified menu

| Mechanism | Use it? | Why |
|---|---|---|
| Free disbursement to wallet | **Only at T2+** | Cash-out is the fraudster's objective. Earn it. |
| Purpose-restricted / merchant-settled | **Yes, T1** | Converts a credit loss into a merchandise/service claim with clawback. Also generates merchant revenue. |
| Escrow | No | Adds cost, no recovery benefit here. |
| Instalments | **Yes** | Repayment in 2–4 cycle-aligned instalments cuts EAD roughly in half vs. balloon. |
| Streaming / delayed drawdown | **Yes** | The single cheapest EAD control. Weekly tranches against accrued wages. |
| Dynamic limits | **Yes** | Recomputed on every verified inflow event; limits *fall* automatically when inflow stops. |
| Programmable credit (spend rules on-chain) | **Yes, selectively** | Genuine blockchain-native advantage: enforce merchant allowlists and settlement routing in the contract, not in a policy document. |
| Unused-limit gating | **Yes** | Advertised ceiling ≠ immediately drawable amount. Reduces bust-out payload without reducing perceived generosity. |

## 2.5 Proposed underwriting ladder

Cost of capital assumed at 16% blended. "EDR" = expected default rate as % of originations in that tier.

### T0 — Secured Builder
| | |
|---|---|
| **Max exposure** | $250 |
| **Collateral** | 105% of drawn, in SOL/USDC, locked |
| **Verification** | Wallet + sanctions/OFAC screen + device attestation + email. No KYC. |
| **History required** | None |
| **Permitted use** | Any, including cash-out |
| **Expected default** | 0.2–0.6% (operational, oracle, and liquidation-slippage loss only) |
| **Recovery** | Automated liquidation at 115% trigger, two-oracle confirmation |
| **Why repay** | Repaying costs less than forfeiting over-collateral; unlocks price improvement and access to T1 |
| **Purpose** | A funnel and a credit-building surface, not a profit centre. Contribution ≈ break-even. Never treat T0 repayment as evidence of credit quality (rule 5). |

### T1 — Verified Purchase Credit
| | |
|---|---|
| **Max exposure** | $300 ceiling; **max EAD $150** (weekly drawdown cap) |
| **Collateral** | 50–70% of drawn |
| **Verification** | Full KYC (gov ID, DOB, liveness, two vendors), sanctions/PEP, ownership match on the account receiving income |
| **History required** | None, or 2 T0 cycles |
| **Permitted use** | Approved merchants and bill payments only. **No cash-out.** |
| **Expected default** | 2–4% |
| **Recovery** | Collateral liquidation → merchant clawback/service suspension → bureau report where available → third-party collections |
| **Why repay** | DS ≤ 0 by construction (collateral + recoverable goods ≥ drawn), plus a real credit file with their real name on it |

### T2 — Accrued-Wage Advance *(the beachhead product)*
| | |
|---|---|
| **Max exposure** | min(40% of verified net monthly inflow, $1,500), and never more than wages **already accrued** in the current pay period |
| **Collateral** | 0–25% (optional, price-reducing) |
| **Verification** | T1 + one of: payroll-provider API confirmation, employer roster confirmation under a signed employer agreement, or ≥3 consecutive months of inflow from a stable, KYB'd payer address |
| **History required** | 2 on-time T1 or T2 cycles for the first limit step; none for entry at a reduced ceiling (20% of inflow, $300) |
| **Permitted use** | Any, including cash-out, from cycle 2 |
| **Expected default** | 1–3% with payroll-deduction integration; **5–9% without it** (bank/wallet pull only). This gap is the entire business case for the employer relationship. |
| **Recovery** | **Deduction or first claim at source** on next payroll settlement, executed before funds reach the borrower's discretionary control; then bureau, then collections |
| **Why repay** | They largely do not choose to. The money is netted from an inflow they cannot reroute mid-cycle. Layered on top: they use the product 2× a month and losing it is expensive; and their employer knows. |

### T3 — Revolving Line with Inflow Assignment
| | |
|---|---|
| **Max exposure** | min(80% of verified net monthly inflow, $5,000) |
| **Collateral** | 0% |
| **Verification** | T2 + independent employment verification + 6 months verified inflow + bureau file where the jurisdiction has one + signed assignment/mandate |
| **History required** | 6+ on-time cycles, ≥3 of them uncollateralized, ≥$1,000 cumulative uncollateralized amount-at-risk |
| **Permitted use** | Any |
| **Expected default** | 3–6% |
| **Recovery** | Source deduction → bureau furnishing → licensed collections → small-claims/arbitration in-jurisdiction |
| **Why repay** | Legal recourse against a named person, a reported credit file, and the loss of the largest credit line they have access to. This is the first tier where DS is positive, and it is deliberately gated behind everything above. |

### T4 — SME / On-Chain Revenue Facility *(optional, later)*
| | |
|---|---|
| **Max exposure** | 20% of trailing-90-day verified on-chain revenue, cap $50k |
| **Collateral** | 0%, but settlement-address control (lockbox sweep) |
| **Verification** | KYB, UBO KYC, 6 months revenue history, counterparty concentration analysis |
| **History required** | None (relationship-underwritten) |
| **Permitted use** | Working capital |
| **Expected default** | 2–5% |
| **Recovery** | Lockbox sweep → corporate guarantee → **personal guarantee from principals** → arbitration |
| **Why repay** | Named entity, personal guarantees, and the sweep takes revenue before they see it |
| **Caveat** | §6 shows this does not clear at pre-seed cost of capital below ~$100k average tickets. Park it. |

### What is absent from this ladder, deliberately
There is **no tier for a pseudonymous wallet with undercollateralized exposure**. That product does not exist in this design, at any level of reputation, ever. That is the pivot.

---

# 3. Privacy versus enforceability

## 3.1 The honest answer to the central question

> *Is meaningful undercollateralized credit possible without full identity, legal agreements, and collection rights?*

**No — with one narrow and important exception.**

Undercollateralized credit requires that the lender's expected recovery exceeds zero. Recovery comes from exactly four places: seizable assets, a court, a credit bureau, or **control of the borrower's inflow**. The first three all require legal identity and an enforceable agreement. Only the fourth does not, and only partially: if repayment is netted from an incoming payment stream before the borrower controls it, you can lend somewhat undercollateralized to a pseudonym.

But that exception collapses under scrutiny, because to make the interception reliable you need a contract with the *payer* — and payers are companies with legal identities, KYB obligations, and no interest in transacting with anonymous counterparties. So even the pseudonymous case routes through a named institution. The pseudonymity you can genuinely preserve is **public** pseudonymity, not pseudonymity *from the lender*.

This is still a real and marketable privacy story. It is just a different one from the pitch: **nobody watching the chain learns who you are or what you earn; the regulated entity that must know, knows.**

## 3.2 The information architecture

| Bucket | Contents | Mechanism |
|---|---|---|
| **Public on-chain** | A non-transferable credential per borrower: tier, cumulative on-time cycle count, current-delinquency flag, aggregate uncollateralized amount-at-risk band (e.g. "$500–1k"). No amounts, no employer, no identity, no inflow figures. | SPL token-extension credential, contract-written on each settlement |
| **Known to Float** | Pseudonymous risk record: subject ID, tier, limits, inflow band and cadence, payer ID (hashed to a KYB'd employer record), device/graph signals, full repayment ledger, delinquency status | Float's own database; encrypted at rest; no raw government ID |
| **Held by a regulated partner** | Raw PII: government ID images, DOB, address, liveness capture, sanctions/PEP results, tax ID, bank details | KYC/IDV vendor and/or the licensed lending partner acts as identity custodian. Float holds a subject ID and an attestation, not the documents. This is a real design decision, not a formality: it shrinks Float's data-breach surface, its GDPR/DPDP controller obligations, and its regulatory footprint. |
| **Proven privately (attestation / ZK)** | "Income ≥ $X/month," "employed by an entity in Float's KYB'd set," "unique human," "not previously defaulted with Float," "resident of an eligible jurisdiction" | On-chain attestations from the identity custodian; zkTLS-style proofs (Reclaim-type) for bank/exchange statement *acquisition*. See the limitation below. |
| **Disclosed only after default/fraud** | Legal name, contact details, employer, bank details — released from escrow to the collections agent | **Identity escrow**: at origination the borrower signs a disclosure trigger — 30+ days past due, or confirmed fraud, releases identity from the custodian to a named collections partner and (where applicable) to credit bureaus. Trigger conditions are in the loan agreement *and* the release is operationally gated by the custodian, not by Float's discretion. |

## 3.3 What ZK proofs actually buy you, and what they do not

Be precise here, because this is where the original pitch overreached.

**They do buy:** cheaper and more consent-respecting data acquisition in markets with no open-banking rails; a way to publish standing without publishing amounts; portable "I am a unique human who has not defaulted" claims; and a genuinely better privacy posture than a screenshot upload.

**They do not buy:** enforceability. A zkTLS proof of a bank balance is not a lien, not a mandate, not admissible evidence, and not a bureau record. It is also snapshot-in-time and forgeable at the source in adversarial conditions (the prover controls the session). Underwriting on it alone is underwriting on an attestation about a number the borrower chose to reveal.

**They also create a compliance problem nobody in crypto mentions:** if you lend to consumers in the US you owe ECOA/Reg B adverse-action notices with *specific principal reasons*; the CFPB has been explicit that complex or opaque models do not excuse this. If your only input is a ZK proof you cannot decompose, you cannot write a compliant denial. Design the model so every decision is attributable to a nameable factor.

## 3.4 Structures assessed

| Structure | Verdict |
|---|---|
| Full KYC + privacy-preserving on-chain credentials | **Adopt as the core.** Best available reconciliation of the two goals. |
| Identity escrow with disclosure triggers | **Adopt.** Essential to the honest privacy narrative. |
| Regulated lending partner | **Adopt in the US and EU.** Optional in the launch jurisdiction (§9). |
| Credit bureau reporting | **Adopt where a bureau exists and furnishing is feasible.** Materially changes willingness to pay; also a genuine borrower benefit and the only truthful version of "build credit." |
| Employer / payroll partnership | **Adopt. This is the load-bearing element.** It supplies verification, distribution, and recovery simultaneously. |
| Bank cash-flow underwriting | **Adopt as a secondary input** where open banking exists. |
| Exchange-linked repayment | Secondary. Useful for the T1 tier; exchanges are unlikely to grant the necessary controls early. |
| Stablecoin salary deduction | **Adopt — this is the recovery mechanism.** Netting at source. |
| Merchant-specific credit | **Adopt for T1.** Turns credit loss into goods recovery. |
| Revenue-based repayment | For T4 only. |
| Guarantors | Skip at pre-seed. High friction, weak enforcement in target corridors. |
| Insurance | Not available at credible pricing for a new originator's first-loss. Do not put it in the deck. |
| First-loss capital | **Adopt — Float/founders/equity provides it.** Alignment is the point (§5). |
| Institutional borrower agreements | For T4 only. |

## 3.5 Minimum viable identity and legal framework

1. Full KYC on every borrower with any unsecured exposure, held by a regulated custodian, dual-vendor with liveness.
2. A written, jurisdiction-specific loan or advance agreement, electronically executed, with: a payment-at-source authorisation, a disclosure trigger, a data-sharing consent, and a dispute forum.
3. A signed employer or payroll-provider agreement covering roster verification, deduction/netting mechanics, and reconciliation.
4. KYB on every payer/employer, plus UBO screening.
5. A licensed collections partner in each corridor, retained *before* the first loan is written, not after the first default.
6. Bureau furnishing agreement where a bureau exists.

Anything less and the unsecured tiers should not open.

---

# 4. The correct initial customer

## 4.1 Segment scoring

Scored 1–5. For CAC, fraud risk, default risk, and regulatory complexity, **5 = favourable** (i.e. low cost, low risk). Weighted total emphasises the four things that kill pre-seed lenders: data reliability, recovery, fraud, and CAC.

| Segment | Credit need | Ability to repay | Data quality | Fraud (5=low) | Default (5=low) | CAC (5=low) | Reg. (5=simple) | Avg loan | Freq. | APR tolerance | Recovery | **Weighted** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Pseudonymous retail | 5 | 1 | 1 | 1 | 1 | 3 | 2 | $150 | High | High | 1 | **1.5** |
| KYC'd crypto consumers | 3 | 3 | 2 | 3 | 2 | 2 | 3 | $400 | Med | Med | 2 | **2.5** |
| **Stablecoin earners, verified payroll** | **5** | **4** | **5** | **4** | **4** | **5** | **3** | **$250** | **Very high** | **High** | **5** | **4.4** |
| Freelancers paid in stablecoins | 5 | 3 | 4 | 3 | 3 | 3 | 3 | $500 | High | High | 3 | **3.4** |
| Employees of partner companies | 4 | 5 | 5 | 5 | 5 | 5 | 3 | $300 | High | Med | 5 | **4.6** |
| Traders w/ exchange balances | 2 | 4 | 3 | 3 | 3 | 2 | 3 | $2,000 | Med | Low | 3 | **2.8** |
| On-chain SMEs | 4 | 3 | 4 | 3 | 3 | 3 | 4 | $25,000 | Low | Med | 4 | **3.5** |
| Market makers / prof. firms | 3 | 5 | 4 | 5 | 4 | 2 | 5 | $500k | Low | Very low | 4 | **3.6** |
| Merchants (embedded credit) | 4 | 3 | 3 | 3 | 3 | 2 | 3 | $1,000 | Med | Med | 3 | **3.0** |
| Cross-border workers, salary advance | 5 | 4 | 4 | 3 | 3 | 4 | 2 | $200 | Very high | Very high | 4 | **3.7** |
| Approved-merchant-only borrowers | 3 | 3 | 3 | 4 | 4 | 3 | 4 | $200 | Med | Med | 4 | **3.4** |
| Existing users of a wallet/exchange/payroll app | 4 | 3 | 4 | 4 | 3 | **5** | 3 | $300 | High | Med | 3 | **3.7** |

## 4.2 Why the losers lose

- **Pseudonymous retail** — the original plan. Zero recovery, zero data, maximum adverse selection. It scores 1.5 out of 5 and should never be revisited.
- **Traders** — the group with the *least* credit need. Anyone holding $3,000 of exchange collateral does not need a $2,000 loan; they need leverage, which Kamino and every perp venue already provides more cheaply. Low APR tolerance and sophisticated, price-shopping users.
- **Professional firms / market makers** — excellent credit, but they will not pay above ~10–12% and Float's cost of capital is 15–18%. **Negative spread by construction.** This is not a pre-seed business.
- **On-chain SMEs** — genuinely attractive on risk and enforceability, and the second-best option. But §6 shows it needs $100k+ average tickets and sub-12% capital to clear, both of which are unavailable at pre-seed. It is the right *seed-stage* expansion, not the wedge.
- **Merchants / embedded credit** — requires the merchant network to exist first. Chicken-and-egg with no chicken.

## 4.3 The chosen beachhead

> **Employees and long-term contractors who are paid in stablecoins by an identifiable corporate payer, reached through their employer or payroll provider, in 2–3 specific corridors.**

Rows 3 and 5 of the table are the same customer approached from two directions; combining them is the wedge. Concretely, for the pilot: workers paid in USDC by companies using stablecoin payroll rails, resident in 2–3 of {Philippines, Nigeria, Argentina, Vietnam, India-as-inbound}, earning $400–$2,500/month.

**Why Float can win here — six reasons, in order of strength:**

1. **The repayment source is interceptable.** The employer or payroll provider nets the advance out of the next settlement. Willingness-to-pay stops being the dominant risk variable. Loss rates fall from "subprime unsecured" (8–15%) to "payroll-integrated EWA" (1–3%). This is the single largest value driver in the entire redesign, and it is worth more than every other feature combined.
2. **The data is better than a bank's.** Payer address, exact amount, exact cadence, multi-year history, cryptographically verifiable, available without a screen-scrape or an open-banking licence. A bank in Lagos cannot see a USDC payroll stream at all. Float can see it perfectly.
3. **CAC is near-zero.** One employer signature acquires 20–500 workers. Payroll-provider distribution acquires thousands. Compare crypto consumer CAC, which is routinely $50–200 and often worse than the lifetime contribution of a $250 borrower.
4. **The need is acute and the alternative is worse.** These workers face pay-cycle gaps, thin or no bank credit, and informal lenders at 5–15% *per month*. A 1.5–2% fee for early access to money they have already earned is a genuine improvement, not predation.
5. **Banks cannot serve them.** No verifiable income in the banking system, often no domestic credit file, and cross-border stablecoin inflows that most banks treat as a red flag rather than an underwriting input.
6. **DeFi cannot serve them.** Kamino and Aave have no legal counterparty, no employer contract, no ability to hold PII, and no collections function. The gap is not technical; it is institutional, and institutional gaps are the ones startups can actually hold.

**The honest counter-argument:** this makes Float a B2B2C fintech with a crypto-native data advantage, not a DeFi protocol. Employer sales cycles are slow, corridor-by-corridor licensing is a grind, and the beachhead is narrow. Accept all of that. Narrow and defensible beats broad and uninvestible.

---

# 5. The lender side, rebuilt

## 5.1 Should Float accept retail money? No.

Not "not yet." **Not at all, under this corporate structure, until there is a licensed vehicle for it.** Four independent reasons, any one of which is sufficient:

1. **Securities law.** A pooled product where retail depositors hand over stablecoins in exchange for a promised or expected yield generated by the issuer's lending activity is a security under *Howey* and *Reves* in the US, and almost certainly a collective investment scheme or deposit-taking activity in the EU, UAE, and India. The enforcement record is not ambiguous: BlockFi settled for $100M in February 2022 over exactly this product; the SEC charged Genesis and Gemini over Gemini Earn in January 2023, with Genesis settling for $21M; Celsius and Voyager both ended in bankruptcy with retail creditors impaired. A pre-seed company cannot carry this.
2. **Diversification.** A $500k book across a handful of employers cannot honestly be sold to retail. One employer failure is a double-digit-percent loss to depositors who were told they were earning interest.
3. **Asset-liability mismatch.** Retail expects on-demand withdrawal. Loans are not on-demand. That gap *is* the Celsius failure mode, and no reserve sized by a seed-stage team closes it.
4. **Fundraising.** The retail-pool design is a red flag to every serious credit investor and to every acquirer. Removing it makes the company more fundable, not less.

## 5.2 Capital source comparison

| Source | Cost | Speed to close | Diligence burden | Verdict |
|---|---|---|---|---|
| Retail pool | ~8–15% | Fast | None | **No.** Securities/deposit-taking risk. |
| Accredited individuals | 15–20% | Medium | Low | Viable bridge; messy cap table of note-holders. |
| Crypto credit funds | 14–20% | 2–4 months | High (they will want loan-tape access, borrowing-base reporting, audit rights) | **Primary. Do this.** Their diligence is free underwriting review. |
| Family offices | 12–18% | 3–6 months | Medium | Good at seed, slow at pre-seed. |
| Traditional credit funds | 10–14% | 6–12 months | Very high (want 12+ months of loan tape) | Right answer at Series A. Not now. |
| Market makers | 15–25% | Fast | Low | Expensive and short-tenor; only as emergency liquidity. |
| DAO treasuries | 6–12% | Unpredictable | Governance theatre | Cheap on paper, unreliable in practice. Not for a book you must fund reliably. |
| Regulated lending institutions | 8–12% | 9–18 months | Extreme | The end state. Requires a track record you do not have. |
| Balance sheet (equity) | Cost of equity | Immediate | None | **Yes for the pilot.** $250–500k of equity as the first loan book is the correct pre-seed choice — it is cheap relative to the diligence cost of raising debt against zero history. |
| Warehouse facility | 12–16% + fees | 4–8 months | High | The seed-stage goal. |
| **Senior institutional + founder/investor first-loss** | Blended 15–18% | 3–6 months | High | **Target structure.** |

## 5.3 The capital stack

Bankruptcy-remote SPV holding the loan assets. Float (OpCo) is servicer and originator, not the obligor to lenders.

| Layer | Size (at $2M book) | Position | Return | Terms |
|---|---|---|---|---|
| Senior | $1.6M (80%) | First out, secured by the loan portfolio | **Fixed 14–16%**, paid monthly | 12-month committed, borrowing-base tested weekly, advance rate 80% on eligible receivables, no on-demand withdrawal, 60-day notice, amortising wind-down on trigger breach |
| Junior / first-loss | $300k (15%) | Absorbs losses first, up to exhaustion | Residual, target 25–35% | Provided by Float equity + founders + specialist junior investors |
| Founder skin | $50k of the junior | Pari passu with junior | Residual | Non-negotiable. If the founders will not sit in first-loss, no senior lender should. |
| Liquidity reserve | $200k (10% of book) | Cash at a regulated custodian, T-bill-backed or bank-held | 4–5% | Never lent. Covers settlement timing and one cycle of employer non-payment. |
| Fraud reserve | $100k (5% of book) | Segregated, funded from equity | — | Sized to the modelled coordinated-bust-out scenario (§6.4), not picked because 5% sounds prudent. |

**Loss waterfall, stated plainly:** losses hit the fraud reserve, then the junior tranche, then the senior. Senior is impaired only after a **20% cumulative loss on the book** — roughly 8× the modelled base case and 2.5× the worst modelled stress. That is the sentence that gets a credit fund to the second meeting.

### Portfolio rules, hard-coded in the facility agreement

| Rule | Limit |
|---|---|
| Single borrower | ≤ 0.5% of book |
| Single employer / payer | ≤ 15% of book (≤ 5% in first 90 days of that employer) |
| Single corridor / country | ≤ 25% |
| Single stablecoin | ≤ 35% |
| Weighted-average loan tenor | ≤ 21 days |
| Uncollateralized share of book | ≤ 70% at pilot, stepping up on performance |
| Minimum active borrowers | ≥ 150 before the senior facility draws |
| Max expected loss (base) | 2.6% of average book / 7 bps of origination volume |
| Stress-loss assumption (used for tranche sizing) | 8% of average book |
| Catastrophic assumption | 20% of average book — the senior attachment point |

**Lender return:** fixed for senior, residual for junior. Not floating, not performance-based, and *not* variable-rate-linked-to-utilisation. Utilisation-linked floating rates are a DeFi convention that exists to clear an anonymous pool; here they simply transfer volatility to the party least able to price it, and they make the product look like a yield security. Fixed coupon, monthly, with covenant triggers, is what credit investors actually want.

## 5.4 How this is not Celsius / BlockFi / Voyager / Gemini Earn

Point by point, because this comparison will be made in every meeting.

| Failure mode of 2022 | Float's structure |
|---|---|
| Retail depositors as the funding base | **No retail liabilities. None.** Institutional and accredited only, under negotiated facilities. |
| On-demand withdrawal against illiquid assets | Assets: 10–21 days. Liabilities: 12 months committed, 60-day notice. Duration mismatch is **inverted**, not mitigated. |
| Rehypothecation of customer collateral | Collateral is held in a non-custodial contract, never rehypothecated, never lent, and never touched by OpCo. |
| Proprietary token propping up the balance sheet | No token. No token is planned. If a token appears in a future deck, that is a reason to stop investing. |
| Directional trading and yield farming with lender funds | Prohibited in the facility documents. The SPV originates loans and holds cash. That is all it is permitted to do. |
| Opaque balance sheet | Weekly borrowing-base certificate, monthly loan tape to senior lenders, annual audit, third-party backup servicer named in year one. |
| Regulatory arbitrage as a business model | Licensed or partner-licensed in every market where it lends. See §9. |
| Commingled corporate and customer funds | Bankruptcy-remote SPV; OpCo is servicer with a servicing fee, not the counterparty to lenders. |

Float is structurally a **specialty finance originator with a warehouse line**, not a crypto yield platform. That framing should be in the first paragraph of the deck.

---

# 6. The credit-risk model

## 6.1 Framework and cost inputs

Expected loss: **EL = PD × LGD × EAD**, with PD stated per *borrower-year* (not per loan — per-loan PD multiplied by turn count is the single most common modelling error in short-tenor lending, in both directions).

| Input | Assumption | Basis |
|---|---|---|
| Blended cost of capital | **16%** | 80% senior @15%, 15% junior @25%, 5% equity |
| Servicing | $0.20–0.35 per advance | Automated flows, manual exceptions |
| Verification | $8 one-time (dual-vendor KYC + liveness + KYB attribution), amortised at $4/yr over a 24-month life | Vendor pricing in target corridors |
| Collections | 25% of amounts recovered post-default | Agency fee in emerging corridors |
| Liquidity cost | 0.4% of book/yr | 10% reserve at 4% opportunity cost |
| Fraud loss | 0.15% of originations (T2), 0.4% (T1), 0.3% (T3) | Payroll-attributed origination is the control |
| EAD | **Always modelled at the tier ceiling** | Defaulters max out first |

## 6.2 Sample economics — three borrower types

### Type A — T1 Purchase Credit
$300 ceiling, $180 average balance, 10 cycles/yr, $1,800 annual originations, 60% collateral, merchant-settled.

| Line | $/borrower-yr |
|---|---|
| Interest revenue @ 36% APR | 64.80 |
| Merchant fee @ 1.5% of volume | 27.00 |
| **Total revenue** | **91.80** |
| Expected loss (PD 8% × EAD 250 × LGD 45%) | (9.00) |
| Fraud | (7.20) |
| Cost of capital | (28.80) |
| Servicing | (3.00) |
| Verification | (4.00) |
| Collections | (2.75) |
| Liquidity | (0.72) |
| **Contribution** | **+36.33 (40% margin)** |

**Fragility:** strip the merchant fee and contribution falls to $9.33. T1 only works if merchants pay, or if APR rises to ~48% — which is unlawful in the EU and in roughly a third of US states. T1 is a funnel and a credit-building product, not the profit engine.

### Type B — T2 Accrued-Wage Advance *(the core product)*
$400 advance, semi-monthly (24/yr), ~10 days outstanding, $250 average balance, $9,600 annual originations, 0% collateral, payroll-netted repayment.

| Line | $/borrower-yr |
|---|---|
| Fee revenue @ 1.75% per advance ($7.00 × 24) | 168.00 |
| Expected loss (PD 2% × EAD 400 × LGD 80%) | (6.40) |
| Fraud | (14.40) |
| Cost of capital | (40.00) |
| Servicing | (4.80) |
| Verification | (4.00) |
| Collections | (0.40) |
| Liquidity | (1.00) |
| **Contribution** | **+97.00 (58% margin)** |

**Critical pricing finding:** at a flat US-style fee of $2.99 per transfer, revenue is $71.76 and contribution is **$0.76** — effectively zero. DailyPay and Payactiv can charge flat low fees because they have near-zero cost of capital and enormous scale. Float has neither. **Float must price as a percentage of the advance (1.25–2%), or get the employer to pay part of it.** An employer-subsidised variant — employer pays $3/worker/month, worker pays 1% — yields $132 revenue and $61 contribution with materially better retention and a much cleaner regulatory story.

### Type C — T3 Revolving Line
$2,000 ceiling, $1,200 average balance, $9,600 annual drawn volume, 0% collateral.

| Line | $/borrower-yr |
|---|---|
| Interest @ 34% APR | 408.00 |
| Expected loss (PD 5% × EAD 2,000 × LGD 70%) | (70.00) |
| Fraud | (28.80) |
| Cost of capital | (192.00) |
| Servicing, verification, collections, liquidity | (30.30) |
| **Contribution** | **+86.90 (21% margin)** |

**Breaks at PD ≈ 13%** and at cost of capital ≈ 25%. Both are plausible in a stress. T3 should not open until the book has 12+ months of vintage data and the senior rate has fallen below 12%.

## 6.3 Loan-size sensitivity (T2)

| Advance size | Avg balance | Annual originations | Revenue @1.75%/1.5% | Total cost | **Contribution** |
|---|---|---|---|---|---|
| $100 | $63 | $2,400 | $42.00 | $24.43 | **+$17.57** |
| $400 | $250 | $9,600 | $168.00 | $71.00 | **+$97.00** |
| $1,200 | $750 | $28,800 | $432.00 | $195.40 | **+$236.60** |

**Counterintuitive but important:** the smallest advances are the *worst* economics, because servicing and verification are fixed per borrower and consume 36% of cost at $100 tickets. Float should target stablecoin workers earning **$1,500–3,000/month**, not the smallest earners. The "financial inclusion at the bottom" framing is emotionally appealing and economically wrong at this stage; it becomes viable only once per-borrower fixed cost falls below ~$0.25 per advance.

## 6.4 Stress testing — $500k book, 2,000 active borrowers, base contribution $194k/yr

| Scenario | Mechanism | Annual credit loss | Contribution | Survives? |
|---|---|---|---|---|
| **Base** | PD 2%, LGD 80% | $12.8k (2.6% of book, 7bps of origination) | +$194k | ✅ |
| **High default** — PD 8% | Corridor stress, weaker employers | $51.2k | +$156k | ✅ |
| **Severe default** — PD 20% | Multiple employer failures | $128k | +$79k | ✅ |
| **Crypto crash −30/−50/−70%** | Collateral ≤25% at T2, 0% at T3; repayment in stablecoin from wages | **~$0** | +$194k | ✅ |
| *(Same crash, original design)* | *$500k drawn at 55% collateral; −50% leaves $137k of $275k* | *$362k = 72% of book* | *insolvent* | ❌ |
| **Liquidity run** | No retail liabilities; assets 10–21d vs liabilities 12m committed | n/a | unaffected | ✅ Structurally impossible |
| **Oracle failure** | Affects T0 secured only; circuit breaker halts draws, no single-feed liquidation | ≤$7.5k | +$187k | ✅ |
| **Identity vendor failure** | Dual-vendor; both down → degrade to secured-only | $0 credit loss | Origination halt: −$28k/mo of contribution | ✅ Revenue risk, not credit risk |
| **Stablecoin depeg to $0.90** | Book and funding in same asset → largely matched; residual on reserve | ~$5k | +$189k | ✅ |
| **Coordinated bust-out** | 200 synthetic workers × $400 EAD × 80% LGD = $64k gross intent; capped by $300 first-cycle limit and $5k/90-day per-employer cap → ring must compromise 16+ KYB'd employers | **$15–20k realistic; $64k absolute worst** | +$130k to +$174k | ✅ Fraud reserve absorbs it |
| **Recession / mass unemployment** | Originations stop automatically — no accrued wages, no advance. Loss confined to in-flight cycle, bounded by 15% employer concentration | ~$60k | +$134k | ✅ |

**The headline result:** because exposure at default is one pay cycle and repayment is netted at source, the redesigned book stays contribution-positive at a 20% borrower default rate and is *structurally indifferent to crypto price*. The original design was insolvent at a 50% drawdown. That is the difference between a lending business and a leveraged collateral bet.

## 6.5 What makes the model viable or unviable

| Variable | Viable | Marginal | Unviable |
|---|---|---|---|
| **Loss rate (% of book)** | <5% | 5–12% | >20% (senior impaired) |
| **Fee / APR** | ≥1.5% per advance | 1.0–1.5% | ≤$3 flat fee, or <1.0% |
| **CAC** | <$50 (employer/payroll channel: $10–25) | $50–90 | **>$90 — and direct crypto-consumer CAC is routinely $50–200, which is why direct acquisition is not viable at all** |
| **Cost of capital (T2)** | up to 40% still positive ($37 contribution) | — | Not the binding constraint for T2 |
| **Cost of capital (T3)** | <18% | 18–24% | **>25% → negative** |
| **Break-even scale** | ~4,200 active borrowers at $97 contribution vs ~$410k of pre-seed opex | — | Below ~1,500 borrowers the company is a science project |

The clearest single insight: **the ratio of average outstanding balance to annual origination volume determines whether this business survives expensive capital.** T2 turns its book 38× a year and earns a fee each time, so a 16% or even 40% cost of capital is survivable. T3 turns its book 8× and earns a spread, so it dies at 25%. Every product decision should be tested against that ratio.

---

# 7. Reconsidering collateral

## 7.1 What collateral is for

Crypto collateral should be, in this order:

1. **A behavioural commitment device and price input at the entry tier** — primary role.
2. **A secondary recovery source** — never the primary one.
3. **Not the main risk control.** The main risk control is *control of the inflow plus advancing only accrued value.*
4. **Not removed entirely** — it has real value as a self-selection filter and as the mechanism for a genuinely useful credit-building product.

The original framing — "reduce collateral from 150% to 50% as trust grows" — is the wrong axis. Moving along that axis increases default surplus monotonically while adding correlated market risk. **You cannot make an unsecured loan safer by making it partially secured with a volatile asset; you make it a leveraged bet on that asset plus an unsecured loan.**

## 7.2 The structure to adopt

> **100% collateral where collateral exists, but the credit line exceeds immediately withdrawable cash — combined with payroll-netted repayment and purpose restriction on the first cycles.**

Three components:

**(a) The Builder Line (T0/T1).** Borrower locks $250 of SOL. They receive a $250 spending line usable at merchants and for bills, repayable from their next payroll inflow. The collateral stays locked and stays theirs, appreciating or depreciating with the market. They get liquidity *without selling* — a real benefit with real tax consequences avoided in several jurisdictions — and they build a repayment record. Float's exposure is fully secured. Loss rate approaches zero. This is not the pointless "lock $150 to borrow $100" of the original pitch, because the borrower was never trying to raise $100 cash; they were trying to spend without selling.

**(b) Gradual unlock, not gradual undercollateralization.** As the record builds, collateral does not fall below drawn. Instead, the *withdrawable* portion of the collateral rises, and the ratio of line-to-locked-collateral rises only in step with **verified inflow** — never with history alone.

**(c) Cash-flow control replaces the missing collateral at T2+.** Once inflow is verified and netting is contractually in place, collateral requirements can go to zero, because the recovery mechanism is now the payroll settlement, not liquidation.

## 7.3 Alternatives assessed

| Alternative | Verdict |
|---|---|
| 100% collateral, line > withdrawable cash | **Adopt as the entry product.** Zero credit risk, real utility, honest credit-building. |
| Collateral + payroll-linked repayment | **Adopt as the transition tier.** |
| Purchase-only credit | **Adopt for cycles 1–2.** Converts credit loss into a goods claim. |
| Merchant-settled loans | **Adopt** — also unlocks merchant-side revenue, which T1 needs to clear. |
| Gradual collateral unlock | **Adopt** — better incentive geometry than gradual undercollateralization. |
| Non-fully-drawable limits | **Adopt everywhere.** Cheapest EAD control in existence. |
| Earned wage access | **Adopt as the core product.** |
| Revenue-share repayment | T4 only. |
| Dynamic margining | Yes for T0/T1 collateral, with two-oracle confirmation and no single-feed liquidation. |
| Receivables / invoice financing | Good business, different company. Revisit at seed. |
| Partial guarantees / first-loss sponsor | Float's own equity provides first-loss. Employer guarantees only where the employer is genuinely willing — do not build the model on the assumption that they will be. |
| Social / employer guarantees | Employer *verification and netting*: essential. Employer *guarantee of worker debt*: rarely obtainable, do not assume it. |
| BNPL for crypto-native merchants | Adjacent, plausible, requires a merchant network that does not yet exist. |
| Remove collateral entirely | Only at T2+ where netting is live. Never as a general policy. |

---

# 8. Product positioning

## 8.1 The correct category

Of the options listed, Float is:

> **Embedded credit infrastructure for stablecoin payroll** — an earned-wage-access and purchase-credit product delivered through employers and payroll providers, with the underwriting, servicing, and identity rails to run it.

It is **not** a crypto credit card, not a stablecoin credit line for the open market, not a reputation layer, and not a credit passport. Two of those, "credit OS for wallets" and "underwriting/identity layer," are what Float might become in year three *after* it has proprietary loss data — and infrastructure-first is a well-known way to raise a pre-seed and never originate a loan. Originate first; sell the rails later.

## 8.2 The written positioning

**One line:**
> Float lets people paid in stablecoins draw the wages they have already earned, and gives their employers and lenders the underwriting and collection rails that make it safe.

**One paragraph:**
> Millions of workers are now paid in stablecoins by companies abroad — and no lender can see that income. Their banks do not recognise it, their countries have no credit file for them, and their only short-term credit costs 5–15% a month. Float integrates with the employers and payroll providers that pay them, verifies income directly from the payment stream, and advances wages that have already been earned — repaid automatically out of the next payroll settlement before the money reaches the worker's discretionary control. Because repayment is netted at source and exposure never exceeds one pay cycle, Float can lend without meaningful collateral at loss rates in the low single digits, funded by institutional credit capital sitting behind Float's own first-loss. Every repaid advance builds a portable, privacy-preserving credit record that the worker owns and that Float's own future underwriting — and eventually other lenders' — can price against.

**Borrower value proposition:** *"Get paid the day you earn it, for about 1.5%, without selling your crypto, without a bank, and without a 15%-a-month moneylender. Every advance you repay makes the next one cheaper and larger."*

**Capital-provider value proposition:** *"Short-duration, self-liquidating consumer receivables with repayment netted at source, 15% first-loss beneath you, a 20% cumulative-loss attachment point, weekly borrowing-base reporting, and no exposure to crypto price. Fixed 14–16%, monthly, into a bankruptcy-remote SPV."*

## 8.3 Why blockchain — the defensible version

Not "because trust is decentralised." Three specific, falsifiable reasons:

1. **The income stream is already on-chain, and it is invisible to every other lender.** A USDC payroll deposit from a known corporate payer is a better income signal than a bank statement: real-time, tamper-evident, multi-year, verifiable without the payer's cooperation and without an open-banking licence that does not exist in most of these corridors. This is a genuine information asymmetry created by the rail, not a narrative.
2. **Settlement routing can be programmatic rather than contractual.** The worker's payroll can land in a program-controlled settlement account that nets the outstanding advance and forwards the remainder — enforced in code, not by a debit mandate that can be revoked, and not dependent on a domestic banking relationship the worker may not have.
3. **The credit record is portable and borrower-owned.** A non-transferable on-chain credential means a worker who changes employers, countries, or lenders keeps their standing. That is real for this population in a way it never was for a bank customer.

**Why Solana, honestly:** transaction cost. At 24 advances and 24 settlements per borrower per year, a $0.30 fee costs $14.40 per borrower-year — 15% of contribution. Sub-cent fees make it a rounding error. Add confidential-transfer token extensions for salary privacy, a maturing mobile wallet stack, and concentration of stablecoin payment volume. But state it plainly: **Solana is a cost and latency decision, not a moat.** A founder who claims Solana is the moat should not be funded.

**The version that does not overclaim:**
> Float is not a credit card. Float is a wage advance and purchase-credit line for people paid in stablecoins, repaid automatically from their next paycheque.

---

# 9. Regulation, jurisdiction by jurisdiction

Positions as of mid-2026; all require confirmation with local counsel, and the US EWA position in particular has been unusually fluid.

## 9.1 India

| Area | Position |
|---|---|
| Lending licence | Lending as a business requires an NBFC registration; under scale-based regulation the minimum net owned fund for an NBFC-ICC is on a glide path to ₹10 crore. Prohibitive at pre-seed. |
| Digital lending | RBI's Digital Lending Guidelines (Sept 2022) require **all disbursals and repayments to flow directly between the borrower's bank account and the regulated entity's bank account, with no pass-through or pool account of a lending service provider.** This is not a friction — it is **directly incompatible with on-chain disbursement and on-chain netting.** |
| Default loss guarantee | DLG/FLDG capped at 5% of the loan portfolio (RBI, June 2023) — caps the first-loss structure Float would use as an LSP. |
| Crypto treatment | VDAs are not legal tender. 30% flat tax on gains with no loss set-off, plus 1% TDS on transfers. A 1% TDS on every advance and every repayment destroys a product priced at 1.5%. |
| AML | VDA service providers are reporting entities under PMLA (2023 notification). |
| Data | DPDP Act 2023 — consent, purpose limitation, data-principal rights. |
| Credit reporting | CIC furnishing requires being (or partnering with) a regulated entity. |
| Usury | No statutory cap, but RBI supervisory pressure on high APRs and on LSP-driven models is real and increasing. |
| **Practical structure** | **Do not launch a lending product in India.** Viable roles: engineering and operations base; India as a *destination* corridor for inbound stablecoin salaries where the lending entity and the borrower relationship sit offshore — and even that needs FEMA analysis. |

**Verdict: not a launch market.** The digital-lending disbursement rule alone rules out the architecture.

## 9.2 United States

| Area | Position |
|---|---|
| Lending licence | State-by-state consumer lender licensing, or a bank-partnership model — and "true lender" challenges to partnership structures have been actively litigated. Direct licensing across even 10 states is a multi-year, seven-figure exercise. |
| Consumer credit | TILA/Reg Z; open-end credit brings periodic statements and credit-card-specific rules; CARD Act ability-to-pay provisions. |
| EWA | Earned wage access has its own emerging state regimes (Nevada and Missouri first in 2023, with more states since). Federal treatment of EWA as credit under Reg Z has moved back and forth — the CFPB's July 2024 proposed interpretive rule was subsequently withdrawn amid a broader change in the Bureau's posture. **Treat the federal position as unsettled and design to be compliant either way.** California's DFPI has treated income-based advances as loans. |
| Fair lending | ECOA/Reg B adverse-action notices with specific principal reasons; the CFPB has stated that model complexity is not a defence. Constrains opaque or ZK-only underwriting inputs. |
| Credit reporting | FCRA obligations attach the moment Float uses consumer reports or furnishes data. |
| Money transmission | Handling customer stablecoins likely triggers state MTL analysis and FinCEN MSB registration. |
| Stablecoins | The GENIUS Act (July 2025) governs payment stablecoin issuance and prohibits issuers from paying interest — relevant to how any yield is described. |
| Lender side | Retail yield products are the enforcement graveyard (§5.1). Institutional/accredited only, under Reg D. |
| Usury | 36% MAPR for servicemembers under the MLA; state caps commonly 36% and lower. **Float's required pricing exceeds several state caps as interest** — which is precisely why the EWA fee structure matters. |
| **Practical structure** | **Float as software provider + servicer + underwriter to a licensed lending partner**, or as an employer-integrated EWA provider under state EWA regimes. Not as a direct lender at pre-seed. |

**Verdict: the big prize, entered second, through a partner.**

## 9.3 European Union

| Area | Position |
|---|---|
| Crypto | MiCA applies to issuance and CASP services and has been in force for CASPs since 30 December 2024 — but **MiCA does not regulate crypto lending or borrowing.** Lending falls to national law, which means 27 answers. |
| Consumer credit | **CCD2 (Directive 2023/2225)** — transposition due November 2025, application from November 2026 — removes the old lower thresholds, expressly covers BNPL and small-value credit, and mandates a creditworthiness assessment. Small short-tenor consumer advances are squarely in scope. |
| Usury | Effective APR caps in many member states in the 15–25% range. **Float's required economics are unlawful as interest in much of the EU.** |
| Data | GDPR, including Article 22 on automated decision-making and the associated explanation and human-review rights. |
| Stablecoins | EMT rules under MiCA; issuer authorisation requirements have already reshaped which stablecoins are available in the EEA. |
| Lender side | Collective investment / deposit-taking analysis per member state; retail is not available. |
| **Practical structure** | Regulated lending partner in one member state with passporting where available, or do not operate. |

**Verdict: last. The APR ceiling and CCD2 together make the unit economics of small short-tenor consumer credit unworkable at a pre-seed cost of capital.**

## 9.4 United Arab Emirates

| Area | Position |
|---|---|
| Crypto | VARA in Dubai licenses virtual asset activities including lending and borrowing; ADGM (FSRA) and DIFC (DFSA) run their own virtual asset frameworks. |
| Lending | Onshore consumer lending is Central Bank territory and effectively closed to a startup. In ADGM/DIFC, "providing credit" is a regulated activity typically oriented toward business and professional clients — **which fits a B2B2C model where the contracting counterparties are employers, and the consumer product is delivered as an employer-sponsored benefit.** |
| AML | Robust and enforced; FATF-aligned. Expect real compliance cost. |
| Data | ADGM/DIFC data protection regimes, GDPR-adjacent. |
| Stablecoins | Central Bank payment token framework governs dirham-denominated tokens; USD stablecoin usage is workable in the free zones. |
| Credit reporting | Al Etihad Credit Bureau covers UAE residents; not useful for offshore workers, so bureau leverage is limited in the pilot. |
| Usury | No consumer usury cap of the EU type; UAE Central Bank has historically constrained personal loan pricing onshore. Sharia-compliant fee structures are well understood and map naturally onto a fee-per-advance product. |
| **Practical structure** | **ADGM entity as originator/servicer + VARA-licensed partner if any retail-facing virtual asset service is provided in Dubai + employer agreements as the contracting layer.** |

**Verdict: launch here.**

## 9.5 Recommended launch structure

| Element | Recommendation |
|---|---|
| Jurisdiction | **ADGM (Abu Dhabi Global Market)**, with a VARA-licensed partner for any Dubai retail-facing VA service |
| Entities | ADGM HoldCo (equity, IP) → ADGM OpCo (originator, servicer, employer contracts) → bankruptcy-remote SPV (loan assets, senior facility) |
| Role | **Float as originator and servicer to employers**, with the worker product delivered as an employer-sponsored earned-wage benefit — not as open-market consumer credit |
| Borrowers | Restricted to employees and long-term contractors of contracted employers, in an explicit eligible-jurisdiction list. Geo-fenced, and enforced at KYC, not by a terms-of-service clause. |
| Lenders | Professional and institutional only. No retail. No exceptions. |
| Sequence | UAE/ADGM (months 0–12) → US via licensed partner or state EWA regimes (12–24) → selected EU member state (24–36) → India only if the digital-lending disbursement rule changes |

---

# 10. The moat

## 10.1 Assume all on-chain data is public — then what is left?

The original claim, "repayment records become Float's most valuable asset," is false as stated. On-chain records are readable by every competitor at zero cost, and a portable credential is by design portable *away* from Float. If the data is valuable, publishing it is a subsidy to whoever monetises it better.

What can actually become proprietary, ranked by durability:

| Asset | Durability | Why it holds |
|---|---|---|
| **Employer and payroll-provider integrations** | **High** | Contractual, operationally sticky, and the sales cycle is the barrier. A competitor must re-sign each employer and rebuild each reconciliation flow. This is the primary moat. |
| **Off-chain accrual and repayment data** | **High** | Days-worked, accrued-but-unpaid balances, deduction outcomes, delinquency cures, employer payment behaviour. None of it is on-chain. It is contractually Float's. It is the actual underwriting alpha. |
| **Fraud graph** | **High** | Employer × worker × device × payer-address × withdrawal-destination tuples, and the confirmed-fraud labels attached to them. Labels are the scarce asset; only an originator that has taken losses has them. |
| **Loss-performance data by corridor** | High | Vintage curves per corridor, per employer type, per pay cadence. This is what a warehouse lender underwrites, and it is what lowers cost of capital — which is itself a compounding moat. |
| **Regulatory licences and partner network** | Medium-high | Slow, expensive, and a genuine barrier to fast followers. |
| **Capital-provider relationships** | Medium-high | Cost of capital falling from 16% to 10% is worth more than any product feature, and it accrues only to whoever has the track record. |
| **Servicing and collections infrastructure per corridor** | Medium | Unglamorous, hard to replicate, and the thing that actually determines LGD. |
| **Identity resolution across payer/worker/device** | Medium | Improves with volume. |
| **Underwriting models** | Low-medium alone | Models are commoditised; the labelled data behind them is not. |
| **Distribution embedded in wallets/payroll apps** | Medium, with an asterisk | Real, but it makes Float dependent on partners who could disintermediate. Mitigate with multi-partner breadth and exclusivity where obtainable. |
| **On-chain repayment credential** | **None** | Public. Do not claim it. |

## 10.2 Why Kamino, Aave, or a major exchange cannot easily copy this

**Kamino / Aave / any DeFi protocol — structurally cannot:**
- No legal counterparty to a borrower, so no enforceable agreement and no recourse.
- Cannot hold PII: a DAO or protocol cannot be a data controller, a KYC obligor, or an FCRA furnisher.
- No collections function and no ability to build one.
- Cannot sign an employer agreement — there is no entity to sign it, and no employer will contract with governance.
- Token-governed protocols treat consumer-lending liability as radioactive, correctly. Approving unsecured retail credit through a governance vote is not something their legal counsel will permit.
- Their business is over-collateralized, liquidation-driven lending against volatile assets. This is a different business with a different risk function, a different regulator, and a different customer.

**A major exchange — genuinely could, and this is the real threat.** Coinbase, Binance, and the large regional exchanges already have KYC, custody, licences, and users. The honest defences:
1. They do not have the **employer relationships**, and building B2B payroll distribution is culturally alien to a consumer exchange.
2. Sub-$500 unsecured consumer credit in emerging corridors is a regulatory and reputational headache with immaterial revenue for a company of their size. They will do collateralized lending because it is easy and safe.
3. Speed: Float can sign 50 employers and 3 payroll providers before an exchange finishes a risk review.
4. Their most likely move is to **buy** the capability, not build it.

**The stablecoin payroll providers themselves are the most dangerous competitor** — Rise, Toku, Bitwage, Deel-adjacent products, and whoever emerges. They have the distribution and the data already. The defences: they do not want the credit risk on their balance sheet, they do not want the lending licence, and they do not want the collections function. Float's correct posture is to be the **credit layer they plug in** rather than the app that competes for their users — which reframes the moat as multi-partner embedded distribution plus the loss data no single partner can accumulate.

## 10.3 The honest assessment

**At pre-seed, Float has no moat.** It has an Anchor contract and a React Native app, both of which are a weekend for a competent team. Every moat listed above is *built*, not owned, and the first two — employer integrations and off-chain accrual data — are the only ones worth building deliberately in year one.

This does not disqualify the company; it describes almost every fintech at pre-seed. But it does dictate the architecture: **Float must be a licensed originator and servicer with contractual distribution, not a protocol.** If the founders' instinct is to build a permissionless protocol with a public reputation layer, they are building the version with no moat, no recourse, and no revenue, and this document does not apply to it.

---

# 11. The smallest investible MVP

## 11.1 Design principle

The MVP must not demonstrate that a mobile app can display a credit line. It must demonstrate that **real money lent to real people comes back, that the netting mechanism works when a borrower does not want to pay, and that someone pays a fee for it.** Everything else is decoration.

## 11.2 Specification

| Parameter | Value |
|---|---|
| Employers | **2–3 signed employer agreements**, plus 1 payroll-provider LOI |
| Borrowers | **60 in cohort 1, 150 by day 90** |
| Loan book (peak outstanding) | **$75k–$150k** |
| Advance size | $50–$400 (average ~$220), capped at 40% of accrued-but-unpaid wages |
| Duration | 7–21 days, always settling on the next payroll date |
| Price | **1.75% flat fee per advance**, disclosed in currency terms and as an APR equivalent. Test a 1.0% + employer-subsidy variant on one employer. |
| Collateral | 0% for accrued-wage advances; a parallel 105%-collateral Builder Line offered to 20 crypto-holding users as a control cell |
| Identity | Full KYC, dual vendor, liveness, sanctions/PEP, name match against employer roster and receiving account |
| Capital | **$250k of equity/founder capital.** No third-party debt in the pilot. No retail capital, ever. |
| First loss | 100% — Float bears it all. This is the point. |
| Max acceptable defaults | ≤3% of originations cumulative; ≤2.5% first-payment default on new borrowers; **any single fraud loss >$2,000 triggers a full stop and review** |

## 11.3 On-chain vs off-chain vs manual

| Layer | Where |
|---|---|
| **On-chain** | Disbursement, repayment routing through the program-controlled settlement address, the collateral vault for the Builder Line, and the non-transferable standing credential. Nothing else. |
| **Off-chain** | KYC and all PII (at the vendor, not at Float), underwriting decisions and their audit trail, employer contracts and reconciliation, accrual data, collections, pricing, fraud graph. |
| **Manual in the pilot** | Underwriting committee reviews every limit increase; employer reconciliation in a spreadsheet; collections by phone; fraud review by a human on every new employer's first 5 workers. **Automate nothing until you have seen 20 defaults.** Manual operations at 150 borrowers are cheap and are the fastest way to learn what the model must eventually encode. |

## 11.4 Metrics

| Category | Metric | Target by day 90 |
|---|---|---|
| Demand | Activation rate of eligible workers | **≥40%** |
| Demand | Advances per active worker per month | ≥1.5 |
| Demand | Share of accrued wages drawn | 25–45% (higher suggests distress; lower suggests weak need) |
| Credit | On-time settlement rate | **≥97%** |
| Credit | First-payment default rate | ≤2.5% |
| Credit | Loss as % of originations | ≤1.0% |
| Credit | Netting success rate (deduction executed as designed) | **≥98% — the single most important number in the pilot** |
| Fraud | Attempts detected / attempts succeeded | Documented; ≥1 real attempt observed is a *positive* signal of learning |
| Economics | Contribution per active borrower, annualised | ≥$60 |
| Economics | CAC via employer channel | ≤$25 |
| Retention | Cohort-1 borrowers still active in month 3 | ≥60% |
| Capital | Term sheet or credible indication from ≥1 credit fund | 1 signed indication |

## 11.5 Kill criteria — pre-agreed, written down before starting

Stop the company, or pivot, if any of these occur:

1. Activation among eligible workers **<25%** across two employers → the need is not what you think it is.
2. Netting success **<90%** → the recovery mechanism does not work, and without it this is the original Float.
3. Loss **>6% of originations** by week 10 → underwriting or fraud control has failed at trivial scale.
4. **Any employer refuses the deduction/netting clause and cannot be replaced** → the model has no distribution.
5. Contribution negative at a 2% fee → there is no price at which this clears.
6. Two or more corridors turn out to be legally unavailable → market too small.

## 11.6 The 90-day pilot plan

| Week | Milestone |
|---|---|
| **1** | ADGM entity formation started. Counsel engaged in the launch jurisdiction and 2 corridors. Outreach list of 40 employers and 6 payroll providers built. |
| **2** | KYC/IDV vendors selected and contracted (two). Loan/advance agreement drafted. Employer agreement drafted with the netting clause as its centre. |
| **3** | **First employer signed.** Roster and accrual-data integration specified. Corridor legality memo delivered for 3 candidate corridors. |
| **4** | Settlement-address program deployed to devnet. Collections partner identified in corridor 1. Bureau furnishing feasibility confirmed or ruled out. |
| **5** | KYC flow live end-to-end. First 15 workers onboarded and verified. **Zero loans yet.** |
| **6** | **First 10 advances, $50 cap, employer-netted, hand-operated.** Watch the settlement, not the app. |
| **7** | First settlement cycle completes. Reconcile every cent by hand. Publish an internal post-mortem on every exception. |
| **8** | Raise caps to $200. Cohort 1 to 40 workers. Second employer signed. Underwriting committee cadence established. |
| **9** | Fraud red-team: attempt 10 synthetic onboardings against your own controls. Document what got through. |
| **10** | Cohort 1 to 60 workers. First deliberate delinquency test — identify a genuine non-payer and run the full recovery path end to end. **Measure netting success rate.** |
| **11** | Third employer or first payroll-provider integration live. Raise caps to $400 for seasoned borrowers only. Builder Line control cell (20 users) live. |
| **12** | Full unit-economics reconciliation against §6 model. Variance analysis on every line item. Begin credit-fund conversations with the actual loan tape. |
| **13** | Cohort to 150 borrowers, $100k+ peak book. Pilot report produced: activation, on-time, FPD, netting success, loss, contribution, CAC, fraud log. **Go / no-go against §11.5.** |

---

# 12. Evidence required before fundraising

## 12.1 Pre-seed — what moves a skeptical investor from "meeting, no check" to "possible investment"

| Area | Specific proof point |
|---|---|
| Borrower demand | ≥40% activation among eligible workers at ≥2 employers; ≥1.5 advances/worker/month |
| Repayment | ≥97% on-time across ≥300 advances; ≥250 fully settled cycles |
| **Netting** | **≥98% netting success, including at least 3 documented cases where the borrower did not want to pay and the deduction executed anyway.** This is the single highest-value data point in the entire pilot. |
| Willingness to pay | ≥300 advances taken at a real 1.5–2% fee, with the APR equivalent disclosed. Free-tier usage proves nothing. |
| Default | Loss ≤1% of originations; FPD ≤2.5%; ≥5 defaults actually observed (zero defaults at this scale means you have not lent to anyone real) |
| Fraud resistance | A written red-team report with attempts, detections, and at least one documented failure and the control built in response |
| Underwriting lift | Evidence that your accrual/inflow signals separate risk: a decile chart, however crude, showing default rate varying by the factors you underwrite on |
| Collections | Recovery rate on the defaults you have, and a signed collections partner in ≥1 corridor |
| Acquisition | Employer-channel CAC ≤$25, with the arithmetic shown |
| Contribution margin | ≥$60 annualised per active borrower, reconciled line-by-line to actuals rather than to a model |
| Regulatory | A counsel memo for the launch jurisdiction and each corridor, plus a formed entity. Not a slide saying "regulatory strategy." |
| Partner interest | 2–3 signed employer agreements **with the netting clause intact**, plus 1 payroll-provider LOI |
| Lender demand | One credit fund's written indication of interest, with an indicative rate and advance rate |
| Team | Evidence someone on the team has priced credit risk, or run collections, or held a lending licence. If nobody has, hire or advise for it before raising — this is the most common reason lending pre-seeds are declined. |

## 12.2 Seed

- 2,000–5,000 active borrowers; $1.5–3M peak book.
- **12 months of vintage data with cohort curves** — the thing no crypto lending pitch ever has and the thing every credit investor asks for first.
- Loss ≤3% of average book; FPD ≤1.5%; ≥6 months at stable or improving loss rates.
- A signed warehouse facility, priced, with a borrowing base and covenants.
- ≥10 employers or ≥2 payroll providers live; no single employer >20% of the book.
- Contribution margin ≥$90/borrower/yr, and a credible path through fixed costs.
- Licensed or partner-licensed in market 2.
- A named backup servicer and a completed audit.
- Demonstrated underwriting lift: your model beats a naive "advance 30% of last month's inflow" baseline on realised losses. If it does not, you do not have a model.

## 12.3 Before opening to retail lenders — at all

Only after **all** of the following:

1. A licensed or exempt vehicle in the specific jurisdiction, confirmed by counsel, permitting retail participation.
2. ≥24 months of loss history through at least one adverse period.
3. ≥$25M book across ≥5,000 borrowers and ≥50 employers, with enforced concentration limits.
4. A senior tranche held by institutions, with retail strictly senior to nothing and never in first-loss.
5. Fixed-term instruments with no on-demand withdrawal, and disclosure documents that state the risk of principal loss on the first page.
6. Independent audit, third-party administrator, and monthly public reporting.

**Until then, the answer to "can retail lend on Float?" is no.** That sentence should be in the deck, because saying it is a credibility asset.

---

# 13. Alternative pivots, ranked

Scored 1–5, higher is better; "Default risk" and "Capital intensity" scored so that 5 = favourable.

| Pivot | Urgency | Reg. feasibility | Default risk | Distribution | Capital intensity | Defensibility | Revenue | Prototype fit | Raisability | **Total** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Payroll-linked credit for distributed workers (employer-integrated)** | 5 | 3 | 5 | 5 | 4 | 4 | 4 | 4 | 4 | **38** |
| Stablecoin salary advances (direct-to-worker, no employer integration) | 5 | 3 | 4 | 4 | 4 | 3 | 4 | 4 | 4 | **35** |
| Fraud & identity-risk infrastructure for crypto lenders | 3 | 5 | 5 | 2 | 5 | 3 | 3 | 2 | 3 | **31** |
| Loan-servicing infrastructure for stablecoin lenders | 3 | 4 | 5 | 2 | 5 | 3 | 3 | 3 | 3 | **31** |
| B2B credit for on-chain businesses | 4 | 4 | 3 | 3 | 2 | 3 | 4 | 3 | 3 | **29** |
| Receivables / invoice financing | 4 | 4 | 3 | 3 | 2 | 3 | 4 | 2 | 3 | **28** |
| Merchant-specific credit | 3 | 3 | 4 | 2 | 3 | 3 | 3 | 3 | 3 | **27** |
| Credit underwriting infrastructure for wallets | 2 | 5 | 5 | 2 | 5 | 2 | 2 | 3 | 2 | **28** |
| Secured credit-building card for crypto users | 2 | 3 | 5 | 2 | 4 | 2 | 2 | 4 | 2 | **26** |
| Credit passport used by regulated lenders | 2 | 4 | 5 | 1 | 5 | 2 | 2 | 3 | 2 | **26** |

### Notes on the near-misses

- **Underwriting infrastructure / credit passport (26–28).** These score well on regulatory and capital because they involve no lending — which is also why they fail. **You cannot sell an underwriting model without loss data, and you cannot get loss data without lending.** Every "credit score for wallets" company died on this. Infrastructure is the *year-three* business, unlocked by originating first. Leading with it is how a team raises a pre-seed and has nothing to show in eighteen months.
- **B2B / receivables (28–29).** Genuinely better risk and enforceability than consumer. But §6 shows it needs $100k+ average tickets and sub-12% capital to clear, neither available at pre-seed. Correct **seed-stage expansion**, wrong wedge.
- **Fraud/servicing infrastructure (31).** Real businesses, low capital, but there are not yet enough stablecoin lenders to buy from you. Too early.

### Recommendation

**Pivot.** Preserve the ambition — credit for people the banking system cannot see, with a portable record they own — and replace the mechanism entirely. Keep the Anchor settlement logic and the mobile app; discard the pseudonymous ladder, the retail lender pool, the reputation-as-collateral thesis, and the credit-card framing.

---

# 14. Float, redesigned

## 14.1 The company

| Element | Specification |
|---|---|
| **Initial customer** | Employees and long-term contractors paid in stablecoins by identifiable corporate payers, earning $1,500–3,000/month, in 2–3 corridors, reached through their employer or payroll provider |
| **Exact product** | An advance of 20–40% of wages already accrued in the current pay period, delivered in stablecoin, repaid by netting from the next payroll settlement. Plus a fully-collateralized Builder Line for crypto holders who want liquidity without selling. |
| **Source of repayment** | **The employer's next payroll settlement, netted at source before the worker has discretionary control.** Not willingness to pay. Not collateral. Not reputation. |
| **Source of capital** | $250–500k of equity for the pilot → a $2–5M senior facility from one crypto credit fund at 14–16%, with 15% first-loss from Float and its investors → a traditional warehouse line at Series A |
| **Legal structure** | ADGM HoldCo → ADGM OpCo (originator/servicer, employer contracts) → bankruptcy-remote SPV (loan assets). Licensed partner in the US; no retail lenders anywhere. |
| **Risk controls** | Inflow-derived limits; advance only against accrued wages; per-cycle EAD caps; first-cycle purpose restriction and no cash-out; concentration limits (0.5% borrower / 15% employer / 25% corridor / 35% stablecoin); dual-vendor KYC with tri-party name match; employer KYB with a 90-day exposure cap; fraud graph; identity escrow with disclosure on 30+ dpd |
| **Role of collateral** | Entry-tier commitment device and price input. Secondary recovery. **Never the primary control, and never below 100% at the tiers where it is used.** |
| **Role of identity** | Mandatory and full for every unsecured dollar, held by a regulated custodian, proven on-chain by attestation, disclosed only on default or fraud. Public pseudonymity, not lender-facing pseudonymity. |
| **Role of Solana** | Sub-cent settlement makes 48 transactions per borrower per year economically irrelevant; program-controlled settlement routing enforces netting in code; confidential transfers protect salary privacy; portable credential is borrower-owned. A cost and mechanism choice, not a moat. |
| **Role of the mobile app** | Distribution and UX for a population that is mobile-only. Necessary, not differentiating. It is the least important asset in the company. |
| **Business model** | 1.25–2% fee per advance (worker-paid), optionally plus $2–4/worker/month employer subscription; merchant fees on the purchase-credit tier; net interest margin on the Builder Line |
| **Pricing** | $7 on a $400 advance over ~10 days. Disclosed in currency and as an APR equivalent. Compared honestly in-product against the borrower's real alternative (5–15%/month informal credit). |
| **Moat** | Employer and payroll-provider integrations; off-chain accrual and repayment data; labelled fraud graph; corridor loss curves that lower cost of capital; licences; servicing and collections capability |
| **Initial market** | UAE-domiciled and global employers paying workers in 2–3 corridors; ~150 borrowers at day 90, ~5,000 at month 18 |

## 14.2 Twelve-month roadmap

| Quarter | Objectives |
|---|---|
| **Q1** | Entity, counsel, KYC vendors, 3 employer agreements with netting clauses, settlement program live, 150 borrowers, $100–150k book, pilot report against kill criteria |
| **Q2** | 500 borrowers, $400k book, first payroll-provider integration, collections partner live in 2 corridors, credit-fund diligence opened with a real loan tape, first 6-month vintage curve |
| **Q3** | 1,500 borrowers, $1M book, senior facility signed and first draw, T1 purchase-credit tier launched with 5+ merchants, US regulatory path selected (partner vs state EWA), bureau furnishing live where feasible |
| **Q4** | 3,000–5,000 borrowers, $2–3M book, 10+ employers or 2+ payroll providers, contribution margin ≥$90/borrower, 12-month vintage data, seed raise on evidence rather than narrative |

## 14.3 Main risks, ranked

1. **Employer distribution does not scale.** Slow sales cycles are the most likely cause of death. Mitigation: lead with payroll providers, who aggregate hundreds of employers per signature.
2. **Payroll providers build it themselves or partner with an incumbent lender.** The most dangerous competitive scenario. Mitigation: be the credit layer they plug in, sign early, seek exclusivity where possible, accumulate the loss data no single partner has.
3. **The netting mechanism proves leaky in practice** — workers reroute payroll, employers pay late or off-cycle, corridors change rails. This is the technical risk that would invalidate the whole thesis, which is why §11 makes netting success rate the pilot's primary metric.
4. **Regulatory whiplash on EWA classification**, particularly in the US. Mitigation: design to be compliant as credit *and* as EWA; do not build economics that depend on the arbitrage surviving.
5. **Market size.** Honest arithmetic: at 5M people globally paid in stablecoins and 5% penetration, 250k borrowers × $97 contribution = ~$24M — a real business, not obviously a billion-dollar one. Venture scale requires the underlying stablecoin-payroll population to keep compounding, plus ARPU expansion (larger advances, cards, FX, merchant credit) and eventually becoming the credit rail across many providers.
6. **Cost of capital stays above 16%**, capping the T3 and B2B expansion indefinitely.
7. **Team lacks credit-lending experience.** Solvable by hiring, but not by ignoring.

## 14.4 Fundraising narrative

> Stablecoin payroll became real, and it created an income stream that no lender in the world can see. We can see it perfectly — and, more importantly, we can be paid out of it before the borrower ever touches it. We advance wages people have already earned, netted automatically from their next paycheque. Exposure never exceeds one pay cycle, so we stay profitable at a 20% default rate and we are indifferent to the price of crypto. We do not take retail deposits, we sit in first-loss beneath our own lenders, and we are building the accrual data and employer integrations that make us the credit layer for stablecoin payroll globally.

**Revised one-sentence pitch:**
> Float advances stablecoin-paid workers the wages they have already earned, repaid automatically out of their next paycheque — the first credit product that can actually underwrite the world's fastest-growing invisible income stream.

**Revised one-paragraph pitch:** (see §8.2)

## 14.5 Pre-seed investor memo outline

1. **The invisible income stream** — how many people are paid in stablecoins, by whom, on what cadence, and why every existing lender is blind to it.
2. **Why they cannot borrow** — no bank-visible income, no domestic credit file, informal credit at 5–15%/month.
3. **The mechanism** — advance against accrued wages; netting at source; one-cycle exposure. One diagram.
4. **Why this works when crypto credit has not** — the default-surplus invariant, and the arithmetic showing why reputation-based lending fails and netting does not.
5. **Pilot results** — activation, on-time rate, netting success, FPD, loss, contribution, CAC, fraud log. Actuals, not projections.
6. **Unit economics** — the §6 tables, reconciled to pilot actuals.
7. **Stress tests** — including the side-by-side against the collateral-based model at a 50% drawdown.
8. **Capital structure** — SPV, tranching, first-loss, the 20% senior attachment point, and the explicit anti-Celsius table.
9. **Regulatory map and launch structure** — jurisdiction by jurisdiction, with counsel memos attached.
10. **Moat** — employer integrations, accrual data, fraud labels, loss curves. Stated with the honest admission that none of it exists yet.
11. **Team** — and specifically who has priced credit risk before.
12. **Use of funds and 12-month milestones**, tied to the §12 seed evidence list.
13. **Risks and kill criteria** — written by the founders, not extracted by the investor.

## 14.6 Reasons not to invest — brutally honest

1. **This is a B2B2C emerging-market fintech with a crypto data advantage, not a protocol.** Crypto funds will find it unsexy; fintech funds will find the crypto exposure alarming. It may fall between two sets of investors.
2. **Distribution is the whole company, and it is a slow enterprise sale** run by founders who are probably not enterprise salespeople.
3. **Payroll providers are both the best distribution and the most likely competitor.** Float may be building a feature.
4. **The market may be too small for venture returns.** ~$24M contribution at 250k borrowers is a good company and possibly not a venture-scale one. The bull case depends on stablecoin payroll compounding for years, which is an assumption, not a fact.
5. **No moat exists today**, and the ones that matter take 18–24 months and real losses to build.
6. **Regulatory surface is genuinely wide**: consumer credit, EWA classification, money transmission, data protection, and collections, across multiple corridors, with a US position that has already reversed once.
7. **Nobody on the team has run a loan book.** Lending companies fail from credit and collections, not from code.
8. **Break-even is ~4,200 active borrowers**, which requires distribution that does not yet exist and roughly 18–24 months of runway to reach.
9. **Corridor and employer concentration** at pilot scale means one employer failure is a double-digit loss on the book.
10. **Non-trivial chance the founders drift back to the original idea** because "credit card for crypto" raises money more easily than "wage advance netted from payroll." That drift would be fatal, and it is the risk an investor should probe hardest in the meeting.

## 14.7 Milestones that would invalidate those objections

| Objection | Invalidating milestone |
|---|---|
| Not fundable by either camp | A lead from a fintech-credit fund plus a crypto fund co-investing on the same terms |
| Distribution too slow | 3 employers signed inside 90 days, and 1 payroll-provider integration inside 180 |
| Payroll providers will build it | A signed integration with revenue share and a 12-month exclusivity, or 2 providers live simultaneously |
| Market too small | Verified stablecoin payroll volume growth in the target corridors, plus ARPU >$150/borrower/yr from the second product |
| No moat | 12 months of corridor-level loss curves that measurably lower the senior rate, plus a labelled fraud graph with documented catch rates |
| Regulatory surface | Counsel memos and a formed licensed or partner-licensed structure in two markets |
| No lending experience | A credit lead with a real loan-book track record, on the cap table or the payroll |
| Break-even too far | Contribution ≥$90/borrower/yr at 1,000 borrowers, with CAC ≤$25 |
| Concentration | No employer >15% of the book at 1,000 borrowers |
| Founders will drift | Kill criteria published, and the word "credit card" absent from every document |

## 14.8 Investibility score

| | Score | Reasoning |
|---|---|---|
| **Float as originally described** | **2 / 10** | The core mechanism makes default the rational endgame at the upper tiers; the recovery mechanism does not exist; the lender side replicates a structure with a documented enforcement history; the required APR is unlawful in the markets implied; and the stated moat is public data. Not a calibration problem — a mechanism problem. The single point above zero is for identifying a real gap and building a working prototype. |
| **Float redesigned** | **6 / 10** | Repayment source is interceptable and modelled; loss rates are defensible and stress-tested; the capital structure is one a credit fund can actually underwrite; the regulatory path is specific; the beachhead has near-zero CAC and no incumbent. Held back from higher by unproven distribution, an unproven team on credit, a moat that must be built rather than owned, and genuine uncertainty about terminal market size. **6/10 at pre-seed is a real check** — it is the score of a company where the mechanism is sound and the execution risk is honest. |

## 14.9 The one thing to internalise

The original Float asked: *how do we make a wallet trustworthy enough to lend to?*

The redesigned Float asks: **how do we get paid before the borrower decides whether to pay us?**

Only the second question has an answer, and the answer is a payroll integration — not a reputation layer.
