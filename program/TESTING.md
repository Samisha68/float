# Program verification

Build the program with `anchor build`, then run `npm run test:bankrun` for the nine clock-controlled and initialization regression tests. The runner transpiles TypeScript without type-checking; `anchor build` checks Rust and regenerates the IDL.

Run `anchor test --provider.cluster localnet` for the validator transaction suite plus the bankrun suite. Use a fresh validator: the integration suite initializes the singleton treasury and assumes empty state. Treasury initialization now requires the program's current upgrade authority and its canonical loader-owned ProgramData account. Initialize before revoking upgrade authority. The treasury account layout is unchanged.

Verified on 6 September 2026: 21 validator tests and nine bankrun tests pass. Tests cover authorized initialization, rejection of unauthorized and foreign-metadata initialization, revoked authority, repayment before/at/after the deadline, and no double counting after an overdue flag.

These fixes apply to newly executed instructions after deployment. They do not repair historical overdue counters or replace an already initialized treasury operator. The updated program was deployed to devnet on 8 September 2026; the deployed binary matches this source byte for byte.
