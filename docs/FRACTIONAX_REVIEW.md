# Fractionax fit for Float

Inspected 6 September 2026, source commit `95780e4835e25cd9f048714aa4275daa73e281ea`. This was a bounded source review, not a security audit or build verification. No Fractionax code was copied or executed.

Fractionax is useful as a reference for a future asset-investment/compliance layer. It does not supply the invoice-underwriting system Float currently needs.

- The [README](https://github.com/nizarsyahmi37/Fractionax/blob/95780e4835e25cd9f048714aa4275daa73e281ea/README.md) describes fractional real-estate and asset investment on Core. The repository also contains Anchor programs for ERC-3643-style identity and transfer controls on Solana.
- The [compliance registry](https://github.com/nizarsyahmi37/Fractionax/blob/95780e4835e25cd9f048714aa4275daa73e281ea/programs/erc3643-anchor/src/state/compliance.rs) models country restrictions, holding/transfer limits, lock periods, investor counts, and identity requirements. These are useful design references for controlling who can hold or transfer a token.
- The [database schema](https://github.com/nizarsyahmi37/Fractionax/blob/95780e4835e25cd9f048714aa4275daa73e281ea/db/schema.tsx) concerns investments, users, interest, waitlists, and newsletters. I found no invoice verification, debtor payment assessment, cash-flow analysis, credit-decision model, or collections workflow in the inspected source/search results.
- A concrete implementation limitation: [`Claim::validate_signature`](https://github.com/nizarsyahmi37/Fractionax/blob/95780e4835e25cd9f048714aa4275daa73e281ea/programs/erc3643-anchor/src/state/claims.rs#L149) checks that signature and data are non-empty, then returns true. Its comments explicitly defer cryptographic signature verification. This code cannot establish the authenticity of a claim as written.
- No repository-level license file was found. Confirm reuse permission with the owner before incorporating code.

For Float, keep building the evidence-and-review workspace: verified business identity, invoice authenticity and duplication checks, customer payment confirmation, repayment capacity, exposure limits, human decision notes, and repayment tracking. Token-transfer eligibility does not establish that an invoice will be paid. Fractionax may become relevant when Float designs tokenized collateral or a capital-provider layer, after independent validation of any adopted components.
