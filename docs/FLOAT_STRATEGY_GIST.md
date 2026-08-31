# Float Strategy Gist

<!-- float-status-banner -->
> **SUPERSEDED — August 31, 2026.** The first strategic pass, written while the product was
> still consumer-facing. Its most durable contribution is §2, which showed that the
> prototype's USDC-against-USDC collateral leaves the borrower with negative immediate
> liquidity. Current direction: root [README.md](../README.md).

---

Created: June 29, 2026  
Purpose: capture the current strategic thinking around Float so we can revisit the fundamentals inside the Float project.

## 1. Starting Point

Float currently exists as a Solana Mobile / Anchor prototype with two lending modes:

- Classic collateralized installment loans.
- AI-agent managed micro-loans using a shared USDC pool.

The prototype proves that Float can combine:

- Solana mobile wallet signing.
- Onchain loan state.
- Pool liquidity.
- Agent-authorized loan matching.
- Borrower repayment and liquidation flows.

But the current prototype should not define the final company. It was built for a hackathon and uses USDC as both loan and collateral in many flows, which is useful for demo mechanics but weak as a real user problem.

## 2. The Big Confusion We Identified

If a borrower needs $20 and must lock $22 USDC to borrow $20 USDC, the product is not useful.

That flow produces negative immediate liquidity:

| Step | Borrower result |
| --- | ---: |
| Locks collateral | -$22 USDC |
| Receives loan | +$20 USDC |
| Immediate net | -$2 USDC |

So the current USDC-against-USDC collateral model is not the product. It is only a demo shortcut.

The real collateral question is:

> What can a borrower offer as trust?

That trust may come from:

- Crypto collateral such as SOL, JitoSOL, mSOL, or other liquid assets.
- Wallet history.
- Repayment history.
- Future cashflow.
- Community membership.
- Employer/platform verification.
- Pooled guarantees or insurance.

## 3. Current Strategic Reframe

Float should not be defined as:

> A Solana mobile lending app.

Better:

> Float helps onchain users build credit and access short-term stablecoin liquidity, while lenders earn through agent-managed credit pools.

Even sharper:

> Float is the AI credit layer for onchain users.

The interface can be mobile, web, embedded API, wallet integration, or all of them later. The fundamentals are credit, trust, underwriting, repayment, and capital allocation.

## 4. Morpho Lessons

Morpho is not valuable only because it is a lending protocol. The stronger lesson is its risk architecture:

- Markets are isolated.
- Vaults aggregate lender capital.
- Curators manage risk and allocation.
- Parameters such as collateral, loan asset, LTV, oracle, and rate model are explicit.
- Integrators can build products on top.

Float should not copy Morpho directly. Morpho is broad credit infrastructure. Float can borrow the architecture and apply it to mobile-native, agent-managed, short-term credit.

Morpho model:

```text
Markets + Vaults + Curators
```

Float-inspired model:

```text
Micro-markets + Agent pools + AI curators
```

## 5. What Float Can Borrow From Morpho

### Isolated Micro-Markets

Each Float market could be defined by:

```text
Loan asset
Collateral asset
Max loan size
Loan term
Max LTV
Liquidation threshold
Oracle
Interest model
Agent policy
```

Example:

```text
SOL-USDC 7 Day Micro Market
Loan asset: USDC
Collateral: SOL
Term: 7 days
New borrower max LTV: 50%
Repeat borrower max LTV: 65%
Max loan: $100
Oracle: Pyth
Agent: Conservative Agent
```

### Agent Pools

Instead of one pool, lenders choose strategies:

| Pool | Promise |
| --- | --- |
| Safe Pool | Low-risk loans, high collateral, lower yield |
| Balanced Pool | Moderate yield, repeat borrowers allowed |
| Growth Pool | Higher yield, more risk |
| SOL-Backed Pool | Only loans against SOL collateral |
| Repeat Borrower Pool | Better terms for wallets with good repayment history |

### Agents As Curators

Morpho has curators. Float can have agents.

Agent responsibilities:

- Approve or reject loans.
- Enforce hard risk limits.
- Check borrower wallet history.
- Check repayment history.
- Check collateral health.
- Monitor due dates.
- Send reminders.
- Trigger liquidation or default flow.
- Adjust borrower limits over time.

The AI should not be allowed to invent arbitrary risk. It should operate inside hard protocol rules.

## 6. Protocols And Competitors To Study More

The Solana lending space is already active. Float should not assume the lane is empty.

| Protocol | Why it matters |
| --- | --- |
| Morpho | Best reference for modular credit markets, vaults, and curators. |
| Kamino | Major Solana lending/liquidity protocol with strong UX and risk infrastructure. |
| Jupiter Lend | Jupiter distribution plus lending/borrowing. Dangerous if Float is too generic. |
| Jupiter Offerbook | Fixed-term USDC loans against Solana collateral; very relevant. |
| Rain.fi | P2P token/NFT lending and custom pools on Solana. |
| Lulo | Simple stablecoin yield UX, protected yield, performance-fee business model. |
| Save / Solend | Older Solana algorithmic lending reference. |
| marginfi | Risk-engine and liquidation-system reference. |
| Huma | PayFi and cashflow-backed credit inspiration. |
| Maple | Institutional credit, underwriting, and lender pool inspiration. |

Important takeaway:

> Borrow USDC against SOL is not enough as a company thesis.

Float needs to be better at borrower-level underwriting, agent-managed lending, repayment reputation, or embedded credit distribution.

## 7. Product Directions Worth Exploring

### Direction A: Crypto Pawnshop

Borrow stablecoins against crypto collateral.

Pros:

- Simple.
- Easy to understand.
- Buildable with current prototype.

Cons:

- Crowded.
- Mostly collateral/liquidation game.
- Weak moat.

This can be a V1 wedge, not the final company.

### Direction B: AI Offerbook

Borrowers and lenders do not manually negotiate. Agents match them.

Pros:

- Differentiated versus manual P2P lending.
- AI agent becomes real product surface.
- Can start with collateralized loans.

Cons:

- Needs excellent risk controls.
- Needs liquidity on both sides.

### Direction C: Repayment Reputation Network

Small loans create wallet-level repayment history.

Pros:

- Strong long-term moat.
- Enables better terms for repeat borrowers.
- Can power other protocols later.

Cons:

- Needs volume and time.
- First users must be acquired some other way.

### Direction D: Cashflow-Based Credit

Float lends against future income, invoices, creator payouts, merchant revenue, or gig payments.

Pros:

- Much bigger real-world problem.
- Less crowded than overcollateralized DeFi.

Cons:

- Operationally harder.
- More compliance and fraud risk.
- Needs offchain integrations.

## 8. Current Leaning

Do not decide yet, but the strongest combined thesis is:

> Float starts with collateralized short-term micro-loans to generate repayment history, then evolves into an AI underwriting and credit reputation network.

Possible sequence:

```text
Collateralized micro-loans
→ repeat borrower history
→ better terms for good borrowers
→ agent-managed lender pools
→ embedded credit in wallets/apps
→ partially collateralized or cashflow-backed loans
```

## 9. Company-Level Thesis

The best company thesis so far:

> Onchain wallets will need credit histories, not just asset balances.

Most DeFi lending asks:

> How much collateral do you have?

Float can ask:

> Can this wallet be trusted to repay?

That is a more interesting company.

## 10. Revenue Models

Potential profit models:

| Revenue model | How it works | Notes |
| --- | --- | --- |
| Origination fee | Small fee when borrower takes a loan | Simple, but must not feel extractive. |
| Interest spread | Borrower pays X, lender earns Y, Float keeps spread | Strong but needs transparency. |
| Agent performance fee | Float takes % of interest earned by agent pools | Best aligned with AI pool thesis. |
| Partner revenue share | Wallets/apps earn for bringing borrowers or lenders | Important for distribution. |
| Premium agent strategies | Higher-quality agents charge higher fees | Later-stage model. |
| Credit/reputation API | Other apps pay to use Float repayment score | Long-term moat if data compounds. |

Favorite early model:

```text
Borrower pays small origination fee + fixed interest.
Lender earns yield.
Float takes 10-20% of generated interest as agent/strategy fee.
Partners receive revenue share when they bring users.
```

## 11. What Not To Build

Avoid:

- Generic Solana lending app.
- USDC-against-USDC lending.
- Manual P2P lending offerbook.
- NFT lending as the main wedge.
- DeFi trader leverage as the core product.
- AI that simply rubber-stamps collateral rules.
- Broad protocol before knowing the first borrower deeply.

## 12. Fundamental Questions To Keep Thinking About

1. Who is the first borrower?
2. Why do they need short-term stablecoin liquidity?
3. What do they offer as trust?
4. Who is the first lender?
5. Why would lenders trust Float agents?
6. What risk does Float manage better than existing protocols?
7. What data does Float generate that compounds over time?
8. What is Float's moat after the first 1,000 loans?
9. Is the first wedge crypto collateral, repayment reputation, or cashflow?
10. What should the company be known for in one sentence?

## 13. Current Best One-Liners

Product:

> Float helps onchain users borrow short-term stablecoins and build repayment reputation.

Lender side:

> Deposit into AI-managed credit pools and earn from short-term onchain loans.

Company:

> Float is the AI credit layer for onchain users.

More grounded V1:

> Borrow short-term USDC without selling your crypto.

More ambitious long-term:

> Build credit with your wallet.

