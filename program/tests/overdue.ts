/**
 * The overdue path — the one journey a local validator cannot reach, because
 * it needs the clock to move past a due date. Run under bankrun, which lets
 * the test set the chain clock directly.
 *
 * This covers the "Past due" state in the web app's credit record screen.
 * Written by /qa on 1 Sep 2026.
 */
import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Float } from "../target/types/float";
import { startAnchor, BankrunProvider } from "anchor-bankrun";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  MintLayout,
  AccountLayout,
} from "@solana/spl-token";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import IDL from "../target/idl/float.json";

import { upgradeMetadata } from "./upgrade-authority";

const USDC = 1_000_000;
const dollars = (n: number) => new BN(n).mul(new BN(USDC));
const PROGRAM_ID = new PublicKey(IDL.address);

describe("float — overdue", () => {
  let ctx: any;
  let provider: BankrunProvider;
  let program: Program<Float>;

  const operator = Keypair.generate();
  const borrower = Keypair.generate();
  const mint = Keypair.generate();

  let treasuryPda: PublicKey;
  let businessPda: PublicKey;
  let treasuryUsdc: PublicKey;
  let borrowerUsdc: PublicKey;

  const advancePda = (business: PublicKey, nonce: number) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("advance"), business.toBuffer(), new BN(nonce).toArrayLike(Buffer, "le", 8)],
      PROGRAM_ID
    )[0];

  /** Build a pre-baked SPL mint account so bankrun starts with one. */
  const mintAccount = () => {
    const data = Buffer.alloc(MintLayout.span);
    MintLayout.encode(
      {
        mintAuthorityOption: 1,
        mintAuthority: operator.publicKey,
        supply: BigInt(10_000_000 * USDC),
        decimals: 6,
        isInitialized: true,
        freezeAuthorityOption: 0,
        freezeAuthority: PublicKey.default,
      },
      data
    );
    return { address: mint.publicKey, info: { lamports: LAMPORTS_PER_SOL, data, owner: TOKEN_PROGRAM_ID, executable: false } };
  };

  /** Build a pre-funded SPL token account. */
  const tokenAccount = (owner: PublicKey, amount: number, allowOwnerOffCurve = false) => {
    const address = getAssociatedTokenAddressSync(mint.publicKey, owner, allowOwnerOffCurve);
    const data = Buffer.alloc(AccountLayout.span);
    AccountLayout.encode(
      {
        mint: mint.publicKey,
        owner,
        amount: BigInt(amount),
        delegateOption: 0,
        delegate: PublicKey.default,
        delegatedAmount: BigInt(0),
        state: 1,
        isNativeOption: 0,
        isNative: BigInt(0),
        closeAuthorityOption: 0,
        closeAuthority: PublicKey.default,
      },
      data
    );
    return { address, info: { lamports: LAMPORTS_PER_SOL, data, owner: TOKEN_PROGRAM_ID, executable: false } };
  };

  /** Move the chain clock forward by `seconds`. */
  const advanceClock = async (seconds: number) => {
    const clock = await ctx.banksClient.getClock();
    ctx.setClock(
      new (Object.getPrototypeOf(clock).constructor)(
        clock.slot,
        clock.epochStartTimestamp,
        clock.epoch,
        clock.leaderScheduleEpoch,
        clock.unixTimestamp + BigInt(seconds)
      )
    );
  };

  before(async () => {
    [treasuryPda] = PublicKey.findProgramAddressSync([Buffer.from("treasury")], PROGRAM_ID);
    [businessPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("business"), borrower.publicKey.toBuffer()],
      PROGRAM_ID
    );
    treasuryUsdc = getAssociatedTokenAddressSync(mint.publicKey, treasuryPda, true);
    borrowerUsdc = getAssociatedTokenAddressSync(mint.publicKey, borrower.publicKey);

    ctx = await startAnchor(
      "./",
      [],
      [
        { address: operator.publicKey, info: { lamports: 100 * LAMPORTS_PER_SOL, data: Buffer.alloc(0), owner: anchor.web3.SystemProgram.programId, executable: false } },
        { address: borrower.publicKey, info: { lamports: 100 * LAMPORTS_PER_SOL, data: Buffer.alloc(0), owner: anchor.web3.SystemProgram.programId, executable: false } },
        mintAccount(),
        upgradeMetadata(PROGRAM_ID, operator.publicKey),
        // The treasury's token account is NOT pre-baked: initialize_treasury
        // creates it with `init`, and a pre-existing account makes that fail.
        tokenAccount(borrower.publicKey, 1_000 * USDC),
      ]
    );
    provider = new BankrunProvider(ctx);
    provider.wallet = new anchor.Wallet(operator);
    program = new Program<Float>(IDL as Float, provider);

    await program.methods
      .initializeTreasury()
      .accounts({ operator: operator.publicKey, usdcMint: mint.publicKey })
      .signers([operator])
      .rpc();
    // Now that the program has created the treasury's token account, fund it.
    ctx.setAccount(treasuryUsdc, tokenAccount(treasuryPda, 100_000 * USDC, true).info);

    await program.methods
      .registerBusiness("Northwind Logistics Ltd", Array(32).fill(5))
      .accounts({ authority: borrower.publicKey })
      .signers([borrower])
      .rpc();
    await program.methods
      .requestAdvance(new BN(1), dollars(1_000), dollars(4_000), 30, Array(32).fill(6))
      .accounts({ authority: borrower.publicKey, business: businessPda })
      .signers([borrower])
      .rpc();
    await program.methods
      .approveAndDisburse(250)
      .accounts({
        underwriter: operator.publicKey,
        treasury: treasuryPda,
        business: businessPda,
        advance: advancePda(businessPda, 1),
        usdcMint: mint.publicKey,
        treasuryUsdc,
        borrowerUsdc,
        borrower: borrower.publicKey,
      })
      .signers([operator])
      .rpc();
  });

  it("mark_overdue flags an advance past its due date, and anyone may call it", async () => {
    const stranger = Keypair.generate();
    await advanceClock(31 * 86_400); // one day past a 30 day term

    await program.methods
      .markOverdue()
      .accounts({
        caller: stranger.publicKey,
        business: businessPda,
        advance: advancePda(businessPda, 1),
      })
      .signers([stranger])
      .rpc();

    const a = await program.account.advance.fetch(advancePda(businessPda, 1));
    assert.deepEqual(a.status, { overdue: {} }, "status flipped to Overdue");

    const b = await program.account.businessProfile.fetch(businessPda);
    assert.equal(b.advancesOverdue, 1, "recorded against the business");
  });

  it("mark_overdue cannot be applied twice", async () => {
    try {
      await program.methods
        .markOverdue()
        .accounts({
          caller: operator.publicKey,
          business: businessPda,
          advance: advancePda(businessPda, 1),
        })
        .signers([operator])
        .rpc();
      assert.fail("expected AdvanceNotActive");
    } catch (e: any) {
      assert.include(JSON.stringify(e), "AdvanceNotActive");
    }
  });

  it("an overdue advance can still be repaid, and the overdue mark is permanent", async () => {
    await program.methods
      .repayAdvance()
      .accounts({
        authority: borrower.publicKey,
        treasury: treasuryPda,
        business: businessPda,
        advance: advancePda(businessPda, 1),
        usdcMint: mint.publicKey,
        treasuryUsdc,
        borrowerUsdc,
      })
      .signers([borrower])
      .rpc();

    const a = await program.account.advance.fetch(advancePda(businessPda, 1));
    assert.deepEqual(a.status, { repaid: {} }, "settles even after going overdue");

    const b = await program.account.businessProfile.fetch(businessPda);
    assert.equal(b.advancesRepaid, 1);
    // Deliberate: the record is not erasable. A business that went past due
    // once shows one overdue forever, even having paid in full. The web app
    // must say "1 repaid, 1 previously past due" rather than implying the
    // advance is still outstanding.
    assert.equal(b.advancesOverdue, 1, "overdue count is never decremented");
  });
});
