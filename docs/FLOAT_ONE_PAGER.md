# Float

<!-- float-status-banner -->
> **SUPERSEDED — August 31, 2026.** This describes Float as a consumer "crypto credit
> card": a mobile app where individual borrowers lower their collateral by proving
> trustworthiness. That product is dead and will not be revived. Float is building
> on-chain short-term working-capital credit for **businesses** — see the root
> [README.md](../README.md). Kept as a record of the framing and of the collateral-ladder
> argument, which [float-redesign.md](float-redesign.md) later dismantled.

---

**Float is a mobile app that gives your crypto wallet a real credit line — and
lets other people fund it and earn interest.** Borrowers get short-term cash
against their crypto, and the more they prove they can be trusted, the less they
have to lock up. Lenders supply the money and earn a return, the same way a bank
uses deposits to fund credit cards.

*This page is for someone hearing about Float for the first time.*

---

## The problem

**Crypto has debit cards. It doesn't have a real credit card.**

Think about the cards that exist today. A "crypto rewards card" is just a normal
bank card that pays you a little crypto back — the credit still comes from a bank.
A "spend your crypto" card is really a debit card: you're spending money you
already own. And the closest thing to crypto credit — borrowing against your coins
— works like a pawnshop: to borrow $100 you must lock up $150 of your own crypto
first. If you already have $150, you didn't need the loan.

None of these are what a credit card actually is: **someone extending you money
based on trust, before you've paid a cent.**

The reason crypto can't do this is simple. A crypto wallet is anonymous — just a
string of characters with no name, no history, no way to say "I pay my debts." A
lender has no reason to trust it, so they demand more collateral than the loan is
worth. Every wallet is treated as a stranger, forever.

Real-world credit works the opposite way. Your first credit card has a small
limit. You pay your bills, and over time the limit rises and the rates drop —
because you built a track record. **Crypto has no version of this.** There's no
way for a wallet to build a reputation and earn better terms. That missing piece
is what Float builds.

## What Float is

Float is a two-sided lending app.

**For borrowers:** the collateral you need to put up **goes down as you prove
you're trustworthy.** You start like everyone else, but you can lower your
requirements two ways — by proving things about yourself (that you're a real
person, or that you have real income) using tools that verify these facts
privately, and by building a repayment history, where every loan you pay back on
time earns you better terms on the next one.

**For lenders:** anyone with spare digital dollars can supply money to Float's
pool and earn interest. Their money is what funds the borrowers' credit lines,
and the interest borrowers pay flows back to them. This is exactly how a bank
works — depositors' money funds cardholders' spending, and the depositors earn a
cut — except here it runs on open software instead of a bank, and the rules are
visible to everyone.

### How it works — the ladder

| Borrower standing | What they've shown | Collateral needed | Loan size |
|---|---|---|---|
| New wallet | Nothing yet | 110–150% | up to $100 |
| Verified | A real, unique person | ~80% | up to $500 |
| Income-proven | Provable income or credit | 50–60% | up to $2,000+ |
| Trusted | A clean repayment record with Float | Lowest rates | grows over time |

Float sets hard safety limits in code — loan caps, collateral rules, and an
insurance reserve — so lenders are protected and the system can't be gamed. The
whole reason for the ladder is to make one promise true: that lenders get their
money back, plus interest. The repayment records that build up over time become
Float's most valuable asset — a real credit history for crypto wallets.

## Why now

Three things make this possible today that weren't a year ago:

- **Identity tools went live on Solana.** New services let a wallet carry a
  verified "this is a real person" or "this person has income" stamp — proven
  cryptographically, without handing over the underlying documents.
- **The lane is open.** The big Solana lenders only do the pawnshop model, and
  every startup that tried to build a wallet "credit score" on its own failed —
  because a score is worthless unless it's tied to real loans. Float ties the two
  together from day one.
- **Mobile is unclaimed.** The entire lending market lives on desktop websites
  built for power users. None of it is built for a phone. Float is mobile-first.

## Possible tech stack

- **Blockchain:** Solana — fast and cheap enough for small, frequent loans.
- **Smart contracts:** Anchor (Rust) — the on-chain rules that hold collateral,
  disburse loans, track repayment, pay lenders, and enforce every safety limit.
  *(Prototype already built.)*
- **Mobile app:** React Native + Expo, with Solana Mobile Wallet Adapter for
  secure signing on the phone. *(Prototype already built.)*
- **Price feeds:** Pyth oracle — to value crypto collateral accurately in real time.
- **Identity & proofs:** Solana Attestation Service and Trusta (verified
  person / reputation), plus zkTLS proofs (Reclaim Protocol) for private income
  and credit verification.
- **Reputation:** an on-chain record per wallet, written by the smart contract on
  every repayment — the foundation of the future credit history.
- **Off-chain agent:** a service that reads on-chain and verified signals to
  recommend limits and automate operations, always inside the hard rules the
  contract enforces.

---

**In one sentence:** Float is the missing crypto credit card — borrowers earn
better terms by proving they can be trusted, and everyday lenders fund those
credit lines and earn the interest, all from a phone.
