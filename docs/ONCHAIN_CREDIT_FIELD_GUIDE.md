# On-Chain Credit Field Guide

Status: Learning document, not a Float product decision  
Updated: August 25, 2026

## Purpose

This guide synthesizes recurring ideas across traditional-credit material, DeFi lending documentation, on-chain private-credit protocols, podcasts, research reports, and regulatory sources.

It is meant to help answer three questions before deciding what Float should become:

1. What is credit, economically and operationally?
2. What does putting credit on-chain genuinely improve?
3. Which hard problems remain off-chain?

The guide deliberately avoids selecting a customer, jurisdiction, collateral model, or protocol design.

## The shortest useful definition

Credit is the transfer of purchasing power today in exchange for a contractual claim on future repayment.

Every credit system must answer:

- Who supplies the capital?
- Who receives it?
- Why should the borrower repay?
- Where will repayment money come from?
- Who decides that the risk is acceptable?
- Who absorbs the first loss?
- What happens when repayment does not occur?

Blockchain changes how some of these answers are recorded and enforced. It does not eliminate the questions.

## The common anatomy of a credit system

Nearly every system in the source material contains the same economic roles, even when protocols use different names.

```text
Capital provider
      │
      │ supplies money and accepts risk
      ▼
Pool / lender / balance sheet
      │
      │ allocates capital
      ▼
Originator and underwriter
      │
      │ selects borrower and sets terms
      ▼
Borrower
      │
      │ uses money and generates repayment cash flow
      ▼
Servicer
      │
      │ collects, reconciles and reports repayment
      ▼
Capital provider receives principal and yield

If repayment fails:

Borrower → collections / collateral / restructuring / legal recovery
         → reserve or first-loss capital
         → senior capital losses if protection is exhausted
```

One company or protocol may perform several roles. Separating them conceptually is still important because each role introduces a different incentive and failure mode.

## Twelve principles repeated across the material

### 1. Yield is payment for bearing risk and giving up liquidity

Lender yield is not created by a token or smart contract. It ultimately comes from a borrower, collateral strategy, trading activity, subsidy, or another identifiable source.

A quoted return should be decomposed into:

```text
Gross borrower payments
- expected credit losses
- unused-capital drag
- servicing and compliance costs
- protocol and manager fees
- reserve contributions
= expected lender return
```

High yield usually signals one or more of high credit risk, illiquidity, leverage, operational complexity, token incentives, or temporary market imbalance.

### 2. Collateral lending and credit underwriting solve different problems

Overcollateralized DeFi asks:

> Is there enough liquid collateral to close the loan automatically?

Business credit asks:

> Will this borrower generate or receive enough cash to repay, and what can the lender do if that forecast is wrong?

Collateralized protocols can serve pseudonymous borrowers because they rely primarily on assets and liquidation. Undercollateralized credit relies more heavily on identity, information, contracts, monitoring, and recovery.

### 3. Repayment capacity and repayment willingness are separate

A borrower may want to repay but lack cash. Another may have cash but choose not to repay.

Underwriting therefore evaluates both:

- Capacity: cash flow, assets, incoming payments, liabilities and runway.
- Willingness: incentives, reputation, guarantees, legal obligations and prior behaviour.

Wallet activity can contribute evidence, but it cannot by itself establish the financial condition of a legal business.

### 4. Underwriting continues after loan approval

Good credit management is not a one-time score. It includes:

- Initial due diligence.
- Verification of loan purpose and repayment source.
- Ongoing monitoring.
- Covenant checks.
- Early-warning detection.
- Impairment before formal default.
- Restructuring or collection after distress.

Maple's distinction between impairment and default illustrates this: risk can become visible before a contractual payment is missed.

### 5. Defaults are expected system states, not exceptional bugs

A serious system defines in advance:

- When a loan becomes late.
- When it is impaired.
- When it is in default.
- Who may restructure it.
- How collateral or guarantees are enforced.
- Which reserve absorbs losses first.
- How pool value is reduced.
- How investors are informed.

If the product explains yield but not loss allocation, it is incomplete.

### 6. Pooling diversifies some risks and creates others

Pools can spread exposure across many borrowers and make capital allocation simpler. They also introduce:

- Concentration risk.
- Contagion between loans or collateral assets.
- Withdrawal runs.
- Maturity mismatch.
- Dependence on a pool manager or governance process.
- Difficulty showing each investor exactly which risk they own.

Isolation limits contagion but fragments liquidity. Shared pools improve capital efficiency but increase blast radius.

### 7. Liquid loans cannot be funded safely by pretending capital is always liquid

If lenders can withdraw instantly while borrowers repay in 30, 90, or 365 days, the system has a maturity mismatch.

It must resolve that mismatch through one or more of:

- Idle liquidity buffers.
- Withdrawal queues.
- Fixed lock periods.
- Secondary markets.
- Committed credit facilities.
- Gating or prorating withdrawals during stress.

The word `stablecoin` describes the unit of account, not the liquidity of the loan portfolio.

### 8. Risk limits are as important as borrower selection

Recurring controls include:

- Per-borrower exposure limits.
- Per-industry and jurisdiction limits.
- Deposit and borrow caps.
- Collateral eligibility rules.
- Maximum loan duration.
- Minimum reserve levels.
- Maximum pool utilization.
- Oracle and price-confidence requirements.
- Limits on connected borrowers.

A good borrower can still become a dangerous position if the pool lends too much to it.

### 9. On-chain transparency is useful but incomplete

Blockchain can make these facts independently verifiable:

- Assets in a vault.
- Loan disbursements.
- Repayments.
- Pool share supply.
- Current on-chain utilization.
- Contract parameters.
- Recorded impairments and defaults.

It cannot independently prove:

- That an invoice is genuine.
- That a bank balance belongs to the borrower.
- That the borrower has not pledged the same receivable elsewhere.
- That financial statements are accurate.
- That a legal guarantee is enforceable.
- That an off-chain payment will arrive.

On-chain records improve auditability. They do not automatically make off-chain claims true.

### 10. Human control does not disappear; it moves

Even protocols marketed as decentralized depend on people or institutions for some combination of:

- Listing assets.
- Setting risk parameters.
- Selecting borrowers.
- Upgrading contracts.
- Pausing markets.
- Declaring impairments.
- Negotiating restructurings.
- Managing recoveries.

The useful question is not simply whether a system is decentralized. It is:

> Who can make which decision, under what constraints, with what transparency and accountability?

### 11. Legal rights and smart-contract rights must agree

For real-world or business credit, a token or pool share may represent a legal economic interest. The documents must define:

- The legal lender and borrower.
- Ownership of the loan claim.
- Governing law.
- Payment obligations.
- Events of default.
- Investor seniority.
- Collateral or guarantee rights.
- Servicing authority.
- Insolvency treatment.

If the smart contract says one thing and the legal agreement says another, the discrepancy becomes a source of risk.

### 12. Credit data becomes valuable only when tied to real outcomes

An on-chain credit score has limited meaning without observed loans and repayments.

Useful history records facts such as:

- Amount borrowed.
- Scheduled and actual repayment dates.
- Late days.
- Restructurings.
- Defaults.
- Recoveries.
- Cumulative exposure.

The system can later derive a score from those facts. Recording a score without preserving its evidence creates opacity rather than trust.

## The main credit models

### Model A: Overcollateralized DeFi lending

Examples include Kamino, marginfi and Aave-style markets.

```text
Borrower deposits liquid crypto worth more than the loan
                     ↓
             borrows another asset
                     ↓
       health is monitored continuously
                     ↓
collateral sold if liquidation threshold is crossed
```

Strengths:

- Permissionless access.
- Deterministic enforcement.
- Limited need for borrower identity.
- Fast origination.

Weaknesses:

- Capital inefficient.
- Depends on liquid collateral and trustworthy prices.
- Exposed to oracle, liquidity and liquidation failures.
- Does not create ordinary cash-flow-based business credit.

### Model B: Permissioned on-chain private credit

Maple-style pools are a useful reference.

```text
Verified lenders → managed pool → underwritten borrowers
                              ↘ legal agreements
                               ↘ monitoring and recovery
```

Strengths:

- Can finance real businesses or institutions.
- On-chain capital and accounting remain visible.
- Professional underwriting can use off-chain evidence.

Weaknesses:

- Depends on centralized judgment and legal processes.
- Investor access may be restricted.
- Loans are less liquid than tokens suggest.
- Managers can make poor credit decisions.

### Model C: Payment financing or PayFi

Huma describes this category as financing payment flows such as cross-border settlements, card payments and payroll advances.

```text
A payment is expected later
          ↓
capital advances settlement now
          ↓
expected payment repays financing
```

Strengths:

- Repayment can be linked to a specific flow.
- Short duration can reduce exposure time.
- Stablecoins can improve settlement speed.

Weaknesses:

- The payment evidence may be false, delayed or disputed.
- The same receivable may be financed more than once.
- Payment processors and banking partners introduce counterparty risk.
- Cross-border and lending rules still apply.

### Model D: Tokenized real-world credit

```text
Off-chain loans or receivables
          ↓ legal structuring and verification
On-chain tokens representing economic interests
          ↓
Investors obtain exposure and reporting
```

Strengths:

- Improves transferability and reporting.
- Connects on-chain capital with existing credit assets.
- Can automate distributions.

Weaknesses:

- The underlying asset remains legally and operationally off-chain.
- Token holders depend on issuers, servicers, trustees and custodians.
- Securities and fund rules often apply.

## A generic credit lifecycle

```text
PROSPECT
   │ application and evidence
   ▼
UNDERWRITING
   ├── reject ───────────────────────────────► CLOSED
   └── approve
          ▼
DOCUMENTATION
   ├── conditions not met ──────────────────► EXPIRED
   └── signed and verified
          ▼
FUNDED
   │ monitoring and servicing
   ▼
ACTIVE
   ├── paid as agreed ──────────────────────► REPAID
   ├── warning signal ──────────────────────► IMPAIRED
   │                                             ├── cured ─► ACTIVE
   │                                             └── missed payment
   └── missed payment ────────────────────────────────► LATE
                                                        ▼
                                                     DEFAULT
                                                        ├── recovery
                                                        ├── restructuring
                                                        └── write-off
```

On-chain programs can record and constrain this lifecycle. Off-chain actors usually supply much of the evidence and perform recovery.

## What blockchains genuinely improve

The sources broadly support these benefits:

### Settlement

Stablecoin disbursements and repayments can settle globally at blockchain speed without waiting for banking hours.

### Shared accounting

Borrowers, lenders, managers and auditors can observe the same transaction history.

### Programmable controls

Contracts can enforce caps, eligibility attestations, fee distribution, withdrawal queues and loss waterfalls.

### Composability

Verified financial positions can interact with other applications, subject to legal and risk constraints.

### Auditability

Pool balances and repayment events can be independently checked rather than accepted from a manager's spreadsheet.

## What blockchains do not solve

- Finding borrowers with genuine demand.
- Determining whether a business is creditworthy.
- Preventing falsified off-chain documents.
- Preventing duplicate financing across unrelated lenders.
- Producing legally enforceable contracts automatically.
- Collecting from a company with no on-chain assets.
- Resolving insolvency.
- Eliminating regulation.
- Guaranteeing stablecoin redemption.
- Making an illiquid loan liquid.
- Aligning the incentives of managers and investors.

## Repeated failure patterns

### Weak underwriting hidden by a rising market

Loans appear healthy until asset prices or revenue fall. Past repayment during easy conditions may not predict repayment during stress.

### Collateral that cannot be liquidated at its quoted price

Oracle value is not the same as executable market value. Thin liquidity, bridges and correlated assets can produce sudden bad debt.

### Shared-pool contagion

One risky asset or borrower can damage every depositor when risks are not isolated.

### Maturity mismatch

Investors expect immediate withdrawals while borrowers hold capital for longer periods.

### Concentration

A pool appears diversified by wallet count while a small number of borrowers, depositors or strategies dominate exposure.

### Hidden leverage

Recursive borrowing or rehypothecation makes the same economic capital appear multiple times.

### Subsidized yield mistaken for sustainable yield

Token rewards temporarily hide weak borrower demand or poor unit economics.

### Governance too slow for crisis response

Markets can move faster than a vote, multisig or risk committee.

### Smart contract and legal documents disagree

Unclear claim ownership makes recovery difficult when it matters most.

### Fraud and duplicate claims

Invoices, identities, bank statements or receivables can be fabricated or pledged to multiple lenders.

## Metrics that matter

### Borrower and loan metrics

- Approval rate.
- Average principal.
- Weighted-average duration.
- On-time repayment rate.
- Days past due.
- Default rate by number and principal.
- Recovery rate.
- Loss given default.
- Repeat-borrower performance.
- Exposure by borrower, sector and jurisdiction.

### Pool metrics

- Available liquidity.
- Utilization.
- Weighted-average maturity.
- Concentration.
- Reserve coverage.
- Gross yield.
- Net realized yield.
- Realized losses.
- Pending withdrawals.
- Difference between promised and available liquidity.

### Underwriting metrics

- Predicted versus observed default rate.
- Time from application to decision.
- Fraud detection rate.
- Frequency of covenant breaches.
- Performance by evidence type.
- Performance by underwriter or model version.

## Vocabulary

**APR:** Annualized simple interest rate, normally excluding compounding.

**APY:** Annualized return including compounding assumptions.

**Borrower:** Party receiving principal and owing repayment.

**Capital provider:** Party whose funds ultimately finance loans.

**Collateral:** Asset a lender can claim or liquidate after specified conditions.

**Concentration risk:** Risk created by excessive exposure to one borrower, asset, sector, strategy or capital provider.

**Covenant:** Contractual promise or restriction that permits monitoring or intervention before missed payment.

**Credit enhancement:** Protection that reduces losses for another capital provider, such as guarantees or first-loss capital.

**Default:** Contractually defined failure that gives the lender specified remedies.

**Expected loss:** Probability of default multiplied by exposure and loss severity.

**First-loss capital:** Capital that absorbs losses before senior investors.

**Impairment:** Recognition that a loan may not repay fully or on time before formal default.

**Liquidation:** Sale of collateral to repay debt.

**Liquidity:** Ability to convert an asset or position into spendable funds without a large loss.

**Loss given default:** Percentage of exposure not recovered after default and collection.

**Maturity:** Date on which repayment is due.

**Origination:** Process of sourcing, evaluating, documenting and funding a loan.

**Recovery rate:** Percentage of defaulted exposure eventually collected.

**Servicing:** Monitoring, collecting, reconciling and reporting loan payments.

**Underwriting:** Deciding whether to extend credit and on what terms.

**Utilization:** Share of pool capital currently borrowed.

## Questions to use when studying any protocol

### Demand

1. Who needs the loan, and why?
2. What does the borrower do today instead?
3. Is the demand for productive capital, liquidity management or leverage?

### Capital

4. Who supplies funds?
5. What return do they expect?
6. Can they withdraw before loans mature?
7. Are returns paid by borrowers or subsidies?

### Underwriting

8. What evidence supports repayment?
9. Who verifies that evidence?
10. Who can approve or reject a loan?
11. How is fraud or duplicate financing detected?

### Risk

12. Who takes the first loss?
13. What is the largest possible single loss?
14. Can one position damage unrelated lenders?
15. Which assumptions fail during market stress?

### Default

16. What legally and technically constitutes default?
17. Who declares impairment or default?
18. What assets or legal claims can be recovered?
19. How long does recovery take?

### On-chain value

20. Which facts can a third party verify directly?
21. Which facts still require trust?
22. Would the product still work without a blockchain?
23. What becomes faster, cheaper or safer specifically because of Solana?

### Governance and regulation

24. Who can change parameters or upgrade contracts?
25. Who can pause the system?
26. Who knows the legal identities behind wallets?
27. What regulated activity is being performed?

## Research worksheet

Use one copy per company or protocol.

```text
Name:
Category:
Chain:

Borrower:
Borrower problem:
Loan purpose:
Loan size and duration:

Capital provider:
Source of yield:
Investor eligibility:
Withdrawal terms:

Collateral or repayment source:
Underwriting evidence:
Underwriter:
Servicer:

First-loss party:
Default definition:
Recovery mechanism:
Known defaults or impairments:

On-chain components:
Off-chain components:
Human control points:
Legal structure:

Reported return:
Reported losses:
Unverified claims:

What blockchain improves:
What blockchain does not improve:
Most important lesson:
Questions still unanswered:
```

## Suggested source order

### Foundations

1. [Yale Financial Markets](https://online.yale.edu/courses/financial-markets)
2. [The Practice of Lending](https://link.springer.com/book/10.1007/978-3-030-32197-0)
3. [Private Credit Markets: Theory, Evidence and Emerging Frontiers](https://arxiv.org/abs/2603.14491)

### Crypto lending overview

1. [Galaxy: The State of Crypto Lending](https://www.galaxy.com/insights/research/the-state-of-crypto-lending)
2. [DeFiLlama: The Return of Uncollateralised Lending](https://defillama.com/research/report/the-return-of-uncollateralised-lending-in-crypto-a-sector-of-risk-and-reward)
3. [EBA and ESMA report on DeFi lending](https://www.eba.europa.eu/sites/default/files/2025-01/5fe168a2-e5a6-41a1-a1b4-87a35ecebb5c/Joint%20Report%20on%20recent%20developments%20in%20crypto-assets%20%28Art%20142%20MiCAR%29.pdf)

### Solana collateralized lending

1. [Kamino Borrow](https://kamino.com/docs/products/borrow)
2. [Kamino concepts](https://kamino.com/docs/products/borrow/concepts)
3. [Kamino Lend litepaper](https://kamino.com/docs/kamino-lend-litepaper)
4. [marginfi documentation](https://docs.marginfi.com/)

### On-chain private credit and payment financing

1. [Huma documentation](https://docs.huma.finance/about-huma/what-is-huma)
2. [Huma 2.0 overview](https://docs.huma.finance/products/huma-2.0/overview)
3. [Maple lending](https://docs.maple.finance/maple-for-lenders/lending)
4. [Maple defaults and impairments](https://docs.maple.finance/maple-for-lenders/defaults-and-impairments)
5. [Galaxy: The New Age in Onchain Credit](https://www.galaxy.com/insights/perspectives/the-new-age-in-onchain-credit-markets)

### Podcasts

1. [Sid Powell of Maple on Validated](https://open.spotify.com/episode/063r1fEZiB7lO52ixcky8V)
2. [DeFi Lending and Borrowing with Joe Flanagan](https://podcasts.apple.com/us/podcast/defi-lending-borrowing-revolution-with-with-joe-flanigan/id1511665533?i=1000704810688)
3. [Stani Kulechov on Aave](https://podcasts.apple.com/us/podcast/stani-kulechov-on-why-aave-is-so-successful/id1123922160?i=1000509226258)
4. [Why Aave's Unified Pool Produced Bad Debt](https://podcasts.apple.com/us/podcast/3-why-aaves-unified-pool-turned-a-bridge-hack-into/id1123922160?i=1000763705324)
5. [Private Credit Defaults and Recoveries](https://podcasts.apple.com/us/podcast/ep-24-behind-the-headlines-private-credit-defaults/id1681021634?i=1000772052338)

## A lightweight study process

For each source:

1. Spend no more than 60 minutes on the first pass.
2. Complete the research worksheet.
3. Write one claim you believe.
4. Write one claim you doubt.
5. Write one question the source did not answer.
6. Compare it with at least one source that has different incentives.

Protocol documentation explains intended behaviour. Independent research and postmortems show observed behaviour. Both are necessary.

## What should be clear before choosing what to build

Do not choose a Float model until there are evidence-backed answers to:

1. Which borrower has an urgent, repeated problem?
2. What is the exact source of repayment?
3. Why is Solana materially better than ordinary fintech infrastructure?
4. Who supplies initial capital?
5. Who underwrites and services each loan?
6. Who absorbs expected and unexpected losses?
7. What is the withdrawal promise to capital providers?
8. What happens operationally and legally after default?
9. Which jurisdiction permits the first version?
10. What information or distribution advantage could compound over time?

These questions are not a product decision. They are the minimum evidence required to make one responsibly.
