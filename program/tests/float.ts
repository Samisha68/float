/**
 * QA suite for the Float advance program.
 *
 * Drives every instruction with real transactions against a local validator,
 * the way the web app will drive them on stage. Written by /qa on 1 Sep 2026.
 *
 * Run: anchor test --provider.cluster localnet
 */
import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Float } from "../target/types/float";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { Keypair, PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

const USDC = 1_000_000; // 6 decimals
const dollars = (n: number) => new BN(n).mul(new BN(USDC));

describe("float", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Float as Program<Float>;
  const conn = provider.connection;

  const operator = (provider.wallet as anchor.Wallet).payer;
  const underwriter = Keypair.generate();
  const borrower = Keypair.generate();
  const outsider = Keypair.generate();

  let usdcMint: PublicKey;
  let wrongMint: PublicKey;
  let treasuryPda: PublicKey;
  let treasuryUsdc: PublicKey;
  let businessPda: PublicKey;
  let borrowerUsdc: PublicKey;

  const advancePda = (business: PublicKey, nonce: number) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("advance"), business.toBuffer(), new BN(nonce).toArrayLike(Buffer, "le", 8)],
      program.programId
    )[0];

  const fund = async (kp: Keypair, sol = 2) => {
    const sig = await conn.requestAirdrop(kp.publicKey, sol * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig, "confirmed");
  };

  /** Assert a transaction fails, and return the Anchor error code. */
  const expectError = async (p: Promise<any>, expected: string) => {
    try {
      await p;
      assert.fail(`expected ${expected}, but the transaction succeeded`);
    } catch (e: any) {
      const code = e?.error?.errorCode?.code ?? "";
      const msg = `${code} ${e?.message ?? ""} ${JSON.stringify(e?.logs ?? [])}`;
      assert.include(msg, expected, `expected ${expected}, got: ${msg.slice(0, 400)}`);
      return code;
    }
  };

  before(async () => {
    await Promise.all([fund(underwriter), fund(borrower, 5), fund(outsider)]);

    usdcMint = await createMint(conn, operator, operator.publicKey, null, 6);
    wrongMint = await createMint(conn, operator, operator.publicKey, null, 6);

    [treasuryPda] = PublicKey.findProgramAddressSync([Buffer.from("treasury")], program.programId);
    treasuryUsdc = getAssociatedTokenAddressSync(usdcMint, treasuryPda, true);
    [businessPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("business"), borrower.publicKey.toBuffer()],
      program.programId
    );
  });

  // ── Setup journey ───────────────────────────────────────────

  it("initialize_treasury stands up the treasury and its USDC account", async () => {
    await program.methods
      .initializeTreasury()
      .accounts({ operator: operator.publicKey, usdcMint })
      .rpc();

    const t = await program.account.treasury.fetch(treasuryPda);
    assert.equal(t.operator.toBase58(), operator.publicKey.toBase58());
    assert.equal(t.usdcMint.toBase58(), usdcMint.toBase58());
    assert.equal(t.advancesFunded.toNumber(), 0);
    assert.equal(t.principalOutstanding.toNumber(), 0);

    // Fund the treasury so it can actually disburse.
    await mintTo(conn, operator, usdcMint, treasuryUsdc, operator, 100_000 * USDC);
    const bal = await getAccount(conn, treasuryUsdc);
    assert.equal(Number(bal.amount), 100_000 * USDC);
  });

  it("set_underwriter rejects anyone who is not the operator", async () => {
    await expectError(
      program.methods
        .setUnderwriter(outsider.publicKey)
        .accounts({ operator: outsider.publicKey, treasury: treasuryPda })
        .signers([outsider])
        .rpc(),
      "Unauthorized"
    );
  });

  it("set_underwriter records the underwriter", async () => {
    await program.methods
      .setUnderwriter(underwriter.publicKey)
      .accounts({ operator: operator.publicKey, treasury: treasuryPda })
      .rpc();
    const t = await program.account.treasury.fetch(treasuryPda);
    assert.equal(t.underwriter.toBase58(), underwriter.publicKey.toBase58());
  });

  it("register_business rejects an empty legal name", async () => {
    await expectError(
      program.methods
        .registerBusiness("", Array(32).fill(0))
        .accounts({ authority: borrower.publicKey })
        .signers([borrower])
        .rpc(),
      "EmptyLegalName"
    );
  });

  it("register_business rejects a legal name over 64 chars", async () => {
    await expectError(
      program.methods
        .registerBusiness("x".repeat(65), Array(32).fill(0))
        .accounts({ authority: borrower.publicKey })
        .signers([borrower])
        .rpc(),
      "LegalNameTooLong"
    );
  });

  it("register_business creates the credit record", async () => {
    await program.methods
      .registerBusiness("Meridian Supply Co.", Array(32).fill(7))
      .accounts({ authority: borrower.publicKey })
      .signers([borrower])
      .rpc();

    const b = await program.account.businessProfile.fetch(businessPda);
    assert.equal(b.legalName, "Meridian Supply Co.");
    assert.equal(b.advancesTaken, 0);
    assert.equal(b.advancesRepaid, 0);
    assert.equal(b.advancesOverdue, 0);
  });

  // ── Request validation ──────────────────────────────────────

  it("request_advance rejects an amount above the verified inflow", async () => {
    await expectError(
      program.methods
        .requestAdvance(new BN(90), dollars(3000), dollars(1000), 30, Array(32).fill(1))
        .accounts({ authority: borrower.publicKey, business: businessPda })
        .signers([borrower])
        .rpc(),
      "AdvanceExceedsInflow"
    );
  });

  it("request_advance rejects a zero amount", async () => {
    await expectError(
      program.methods
        .requestAdvance(new BN(91), new BN(0), dollars(1000), 30, Array(32).fill(1))
        .accounts({ authority: borrower.publicKey, business: businessPda })
        .signers([borrower])
        .rpc(),
      "InvalidAmount"
    );
  });

  it("request_advance rejects a term of 0 days and 61 days", async () => {
    await expectError(
      program.methods
        .requestAdvance(new BN(92), dollars(1000), dollars(5000), 0, Array(32).fill(1))
        .accounts({ authority: borrower.publicKey, business: businessPda })
        .signers([borrower])
        .rpc(),
      "InvalidTerm"
    );
    await expectError(
      program.methods
        .requestAdvance(new BN(93), dollars(1000), dollars(5000), 61, Array(32).fill(1))
        .accounts({ authority: borrower.publicKey, business: businessPda })
        .signers([borrower])
        .rpc(),
      "InvalidTerm"
    );
  });

  it("request_advance rejects an amount above the absolute ceiling", async () => {
    await expectError(
      program.methods
        .requestAdvance(new BN(94), dollars(25_001), dollars(50_000), 30, Array(32).fill(1))
        .accounts({ authority: borrower.publicKey, business: businessPda })
        .signers([borrower])
        .rpc(),
      "ExceedsAbsoluteCeiling"
    );
  });

  it("request_advance rejects a caller who is not the business authority", async () => {
    await expectError(
      program.methods
        .requestAdvance(new BN(95), dollars(1000), dollars(5000), 30, Array(32).fill(1))
        .accounts({ authority: outsider.publicKey, business: businessPda })
        .signers([outsider])
        .rpc(),
      "Unauthorized"
    );
  });

  // ── ISSUE-001 regression ────────────────────────────────────
  // Regression: ISSUE-001 — request_advance accepted up to $25,000 while
  // approve_and_disburse capped at $5,000, so anything in between was
  // accepted and then stranded in Requested with no way forward and no way
  // to cancel. Found by /qa on 2026-09-01.
  // Report: .gstack/qa-reports/qa-report-float-program-2026-09-01.md

  it("ISSUE-001: an advance above the tier-1 ceiling is rejected at request time", async () => {
    borrowerUsdc = getAssociatedTokenAddressSync(usdcMint, borrower.publicKey);
    await createAssociatedTokenAccount(conn, borrower, usdcMint, borrower.publicKey);

    // $10,000 sits between the tier-1 ($5,000) and absolute ($25,000)
    // ceilings. It must be refused now, not after an underwriter review.
    await expectError(
      program.methods
        .requestAdvance(new BN(50), dollars(10_000), dollars(20_000), 30, Array(32).fill(1))
        .accounts({ authority: borrower.publicKey, business: businessPda })
        .signers([borrower])
        .rpc(),
      "ExceedsTier1Ceiling"
    );

    // Nothing was written, so there is no stranded advance to clean up.
    const adv = advancePda(businessPda, 50);
    assert.isNull(await conn.getAccountInfo(adv), "no advance account created");
  });

  it("ISSUE-001: exactly the tier-1 ceiling is still allowed", async () => {
    await program.methods
      .requestAdvance(new BN(51), dollars(5_000), dollars(9_000), 30, Array(32).fill(1))
      .accounts({ authority: borrower.publicKey, business: businessPda })
      .signers([borrower])
      .rpc();
    const a = await program.account.advance.fetch(advancePda(businessPda, 51));
    assert.equal(a.amount.toNumber(), 5_000 * USDC, "boundary value accepted");
  });

  // ── ISSUE-002 regression ────────────────────────────────────
  // Regression: ISSUE-002 — a first-time borrower has no USDC account, and
  // ApproveAndDisburse had no init_if_needed, so the underwriter could not
  // pay them at all. Found by /qa on 2026-09-01.
  // Report: .gstack/qa-reports/qa-report-float-program-2026-09-01.md

  it("ISSUE-002: approve creates the USDC account for a first-time borrower", async () => {
    const fresh = Keypair.generate();
    await fund(fresh, 2);
    const [freshBiz] = PublicKey.findProgramAddressSync(
      [Buffer.from("business"), fresh.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .registerBusiness("Harbour Foods PLC", Array(32).fill(3))
      .accounts({ authority: fresh.publicKey })
      .signers([fresh])
      .rpc();
    await program.methods
      .requestAdvance(new BN(1), dollars(1000), dollars(4000), 30, Array(32).fill(2))
      .accounts({ authority: fresh.publicKey, business: freshBiz })
      .signers([fresh])
      .rpc();

    // Precondition: the borrower has never held USDC, so the ATA does not exist.
    const freshAta = getAssociatedTokenAddressSync(usdcMint, fresh.publicKey);
    assert.isNull(await conn.getAccountInfo(freshAta), "precondition: no borrower ATA");

    await program.methods
      .approveAndDisburse(250)
      .accounts({
        underwriter: underwriter.publicKey,
        treasury: treasuryPda,
        business: freshBiz,
        advance: advancePda(freshBiz, 1),
        usdcMint,
        treasuryUsdc,
        borrowerUsdc: freshAta,
        borrower: fresh.publicKey,
      })
      .signers([underwriter])
      .rpc();

    // The account now exists and holds the principal.
    const acct = await getAccount(conn, freshAta);
    assert.equal(Number(acct.amount), 1000 * USDC, "first-time borrower was paid");
    assert.equal(acct.owner.toBase58(), fresh.publicKey.toBase58());
  });

  // ── Happy path ──────────────────────────────────────────────

  it("the full journey: request, approve, disburse, repay", async () => {
    const nonce = 1;
    const amount = 2_400;
    const feeBps = 250;

    await program.methods
      .requestAdvance(new BN(nonce), dollars(amount), dollars(7_800), 30, Array(32).fill(9))
      .accounts({ authority: borrower.publicKey, business: businessPda })
      .signers([borrower])
      .rpc();

    const adv = advancePda(businessPda, nonce);
    const before = Number((await getAccount(conn, borrowerUsdc)).amount);
    // Treasury counters are shared across tests, so assert deltas not absolutes.
    const tBefore = await program.account.treasury.fetch(treasuryPda);

    await program.methods
      .approveAndDisburse(feeBps)
      .accounts({
        underwriter: underwriter.publicKey,
        treasury: treasuryPda,
        business: businessPda,
        advance: adv,
        usdcMint,
        treasuryUsdc,
        borrowerUsdc,
        borrower: borrower.publicKey,
      })
      .signers([underwriter])
      .rpc();

    const afterDisburse = Number((await getAccount(conn, borrowerUsdc)).amount);
    assert.equal(afterDisburse - before, amount * USDC, "borrower receives the principal");

    let a = await program.account.advance.fetch(adv);
    assert.deepEqual(a.status, { active: {} });
    const expectedFee = (amount * feeBps) / 10_000;
    assert.equal(a.totalDue.toNumber(), (amount + expectedFee) * USDC, "principal + 2.5% fee");
    assert.equal(a.dueAt.toNumber() - a.disbursedAt.toNumber(), 30 * 86_400, "30 day term");

    let t = await program.account.treasury.fetch(treasuryPda);
    assert.equal(
      t.advancesFunded.toNumber() - tBefore.advancesFunded.toNumber(),
      1,
      "one more advance funded"
    );
    assert.equal(
      t.principalOutstanding.toNumber() - tBefore.principalOutstanding.toNumber(),
      amount * USDC,
      "outstanding principal rose by the advance"
    );

    // The borrower needs the fee on top of the principal to repay.
    await mintTo(conn, operator, usdcMint, borrowerUsdc, operator, expectedFee * USDC);

    await program.methods
      .repayAdvance()
      .accounts({
        authority: borrower.publicKey,
        treasury: treasuryPda,
        business: businessPda,
        advance: adv,
        usdcMint,
        treasuryUsdc,
        borrowerUsdc,
      })
      .signers([borrower])
      .rpc();

    a = await program.account.advance.fetch(adv);
    assert.deepEqual(a.status, { repaid: {} });

    const b = await program.account.businessProfile.fetch(businessPda);
    assert.equal(b.advancesTaken, 1);
    assert.equal(b.advancesRepaid, 1);
    assert.equal(b.totalVolumeRepaid.toNumber(), amount * USDC, "credit record updated");

    t = await program.account.treasury.fetch(treasuryPda);
    assert.equal(
      t.principalOutstanding.toNumber(),
      tBefore.principalOutstanding.toNumber(),
      "outstanding principal back where it started"
    );
  });

  // ── Post-repayment and authorisation ────────────────────────

  it("repay_advance cannot be called twice", async () => {
    await expectError(
      program.methods
        .repayAdvance()
        .accounts({
          authority: borrower.publicKey,
          treasury: treasuryPda,
          business: businessPda,
          advance: advancePda(businessPda, 1),
          usdcMint,
          treasuryUsdc,
          borrowerUsdc,
        })
        .signers([borrower])
        .rpc(),
      "AdvanceNotRepayable"
    );
  });

  it("approve_and_disburse rejects anyone who is not the underwriter", async () => {
    const nonce = 2;
    await program.methods
      .requestAdvance(new BN(nonce), dollars(500), dollars(2_000), 15, Array(32).fill(4))
      .accounts({ authority: borrower.publicKey, business: businessPda })
      .signers([borrower])
      .rpc();

    await expectError(
      program.methods
        .approveAndDisburse(250)
        .accounts({
          underwriter: outsider.publicKey,
          treasury: treasuryPda,
          business: businessPda,
          advance: advancePda(businessPda, nonce),
          usdcMint,
          treasuryUsdc,
          borrowerUsdc,
          borrower: borrower.publicKey,
        })
        .signers([outsider])
        .rpc(),
      "Unauthorized"
    );
  });

  it("approve_and_disburse rejects a fee above the 1000 bps cap", async () => {
    await expectError(
      program.methods
        .approveAndDisburse(1001)
        .accounts({
          underwriter: underwriter.publicKey,
          treasury: treasuryPda,
          business: businessPda,
          advance: advancePda(businessPda, 2),
          usdcMint,
          treasuryUsdc,
          borrowerUsdc,
          borrower: borrower.publicKey,
        })
        .signers([underwriter])
        .rpc(),
      "FeeTooHigh"
    );
  });

  it("approve_and_disburse rejects a mint that is not the treasury mint", async () => {
    const wrongAta = getAssociatedTokenAddressSync(wrongMint, borrower.publicKey);
    await createAssociatedTokenAccount(conn, borrower, wrongMint, borrower.publicKey);
    await expectError(
      program.methods
        .approveAndDisburse(250)
        .accounts({
          underwriter: underwriter.publicKey,
          treasury: treasuryPda,
          business: businessPda,
          advance: advancePda(businessPda, 2),
          usdcMint: wrongMint,
          treasuryUsdc,
          borrowerUsdc: wrongAta,
          borrower: borrower.publicKey,
        })
        .signers([underwriter])
        .rpc(),
      "WrongMint"
    );
  });

  it("mark_overdue refuses an advance that is not yet due", async () => {
    // nonce 2 is still Requested, so status guard fires first.
    await expectError(
      program.methods
        .markOverdue()
        .accounts({
          caller: outsider.publicKey,
          business: businessPda,
          advance: advancePda(businessPda, 2),
        })
        .signers([outsider])
        .rpc(),
      "AdvanceNotActive"
    );

    // Disburse it, then try again: now Active but inside its term.
    await program.methods
      .approveAndDisburse(200)
      .accounts({
        underwriter: underwriter.publicKey,
        treasury: treasuryPda,
        business: businessPda,
        advance: advancePda(businessPda, 2),
        usdcMint,
        treasuryUsdc,
        borrowerUsdc,
        borrower: borrower.publicKey,
      })
      .signers([underwriter])
      .rpc();

    await expectError(
      program.methods
        .markOverdue()
        .accounts({
          caller: outsider.publicKey,
          business: businessPda,
          advance: advancePda(businessPda, 2),
        })
        .signers([outsider])
        .rpc(),
      "NotYetOverdue"
    );
  });

  it("repay_advance rejects a caller who is not the business authority", async () => {
    // Give the outsider a real USDC account first, otherwise the account
    // constraint fires before the authorisation check and the test proves
    // nothing about authorisation.
    const outsiderUsdc = getAssociatedTokenAddressSync(usdcMint, outsider.publicKey);
    await createAssociatedTokenAccount(conn, outsider, usdcMint, outsider.publicKey);

    await expectError(
      program.methods
        .repayAdvance()
        .accounts({
          authority: outsider.publicKey,
          treasury: treasuryPda,
          business: businessPda,
          advance: advancePda(businessPda, 2),
          usdcMint,
          treasuryUsdc,
          borrowerUsdc: outsiderUsdc,
        })
        .signers([outsider])
        .rpc(),
      "Unauthorized"
    );
  });
});
