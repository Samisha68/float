import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import idl from "../idl/float.json";
import type { Float } from "../idl/float";
import {
  advancePda,
  businessPda,
  FLOAT_PROGRAM_ID,
  fromBaseUnits,
  toBaseUnits,
  treasuryPda,
  USDC_MINT,
} from "./config";
import type { Advance, Business } from "./domain";
import type { Ledger } from "./ledger";

/** Standalone devnet test ledger. Never sends company names or invoice documents to chain. */
export class OnChainLedger implements Ledger {
  readonly mode = "devnet" as const;
  private program: Program<Float>;
  constructor(
    private connection: Connection,
    private wallet: AnchorWallet,
  ) {
    this.program = new Program(
      idl as Float,
      new AnchorProvider(connection, wallet, { commitment: "confirmed" }),
    );
  }
  async checkDeployment() {
    const account = await this.connection.getAccountInfo(FLOAT_PROGRAM_ID);
    if (!account?.executable)
      throw new Error("The Float program is unavailable on devnet.");
    const programData = new PublicKey(account.data.subarray(4, 36));
    const deployed = await this.connection.getAccountInfo(programData);
    if (!deployed || deployed.data.length < 348512 + 45)
      throw new Error(
        "Devnet still has the older Float program. Update the deployment before using the wallet test flow.",
      );
  }
  async getBusiness(): Promise<Business> {
    const a = await this.program.account.businessProfile.fetchNullable(
      businessPda(this.wallet.publicKey),
    );
    if (!a)
      return {
        authority: this.wallet.publicKey.toBase58(),
        legalName: "Unregistered test wallet",
        advancesTaken: 0,
        advancesRepaid: 0,
        advancesOverdue: 0,
        totalVolumeRepaid: 0,
        registeredAt: Date.now(),
      };
    return {
      authority: a.authority.toBase58(),
      legalName: "Devnet test business",
      advancesTaken: a.advancesTaken,
      advancesRepaid: a.advancesRepaid,
      advancesOverdue: a.advancesOverdue,
      totalVolumeRepaid: fromBaseUnits(a.totalVolumeRepaid.toNumber()),
      registeredAt: a.registeredAt.toNumber() * 1000,
    };
  }
  private map(
    address: PublicKey,
    a: Awaited<ReturnType<typeof this.program.account.advance.fetch>>,
  ): Advance {
    const status =
      "requested" in a.status
        ? "Requested"
        : "active" in a.status
          ? "Active"
          : "overdue" in a.status
            ? "Overdue"
            : "Repaid";
    return {
      id: address.toBase58(),
      businessName: a.borrower.toBase58(),
      amount: fromBaseUnits(a.amount.toNumber()),
      expectedInflow: fromBaseUnits(a.expectedInflow.toNumber()),
      payer: "Off-chain customer",
      feeBps: a.feeBps,
      totalDue: fromBaseUnits(a.totalDue.toNumber()),
      termDays: a.termDays,
      status,
      requestedAt: a.requestedAt.toNumber() * 1000,
      disbursedAt: a.disbursedAt.isZero()
        ? null
        : a.disbursedAt.toNumber() * 1000,
      dueAt: a.dueAt.isZero() ? null : a.dueAt.toNumber() * 1000,
    };
  }
  async listAdvances() {
    const treasury =
      await this.program.account.treasury.fetchNullable(treasuryPda());
    const filters = treasury?.underwriter.equals(this.wallet.publicKey)
      ? []
      : [{ memcmp: { offset: 40, bytes: this.wallet.publicKey.toBase58() } }];
    const rows = await this.program.account.advance.all(filters);
    return rows
      .map(({ publicKey, account }) => this.map(publicKey, account))
      .sort((a, b) => b.requestedAt - a.requestedAt);
  }
  async requestAdvance(input: {
    amount: number;
    expectedInflow: number;
    payer: string;
    termDays: number;
  }) {
    await this.checkDeployment();
    const authority = this.wallet.publicKey,
      business = businessPda(authority);
    if (!(await this.program.account.businessProfile.fetchNullable(business))) {
      await this.program.methods
        .registerBusiness("Devnet test business", Array(32).fill(0))
        .accountsStrict({
          authority,
          business,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }
    const random = crypto.getRandomValues(new Uint8Array(8));
    const nonce = new DataView(random.buffer).getBigUint64(0, true);
    const advance = advancePda(business, nonce);
    const signature = await this.program.methods
      .requestAdvance(
        new BN(nonce.toString()),
        new BN(toBaseUnits(input.amount)),
        new BN(toBaseUnits(input.expectedInflow)),
        input.termDays,
        Array(32).fill(0),
      )
      .accountsStrict({
        authority,
        business,
        advance,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return {
      ...this.map(advance, await this.program.account.advance.fetch(advance)),
      signature,
    };
  }
  async approveAndDisburse(id: string, feeBps: number) {
    await this.checkDeployment();
    const advance = new PublicKey(id),
      a = await this.program.account.advance.fetch(advance),
      treasury = treasuryPda();
    const signature = await this.program.methods
      .approveAndDisburse(feeBps)
      .accountsStrict({
        underwriter: this.wallet.publicKey,
        treasury,
        business: a.business,
        advance,
        usdcMint: USDC_MINT,
        treasuryUsdc: getAssociatedTokenAddressSync(USDC_MINT, treasury, true),
        borrowerUsdc: getAssociatedTokenAddressSync(USDC_MINT, a.borrower),
        borrower: a.borrower,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return {
      ...this.map(advance, await this.program.account.advance.fetch(advance)),
      signature,
    };
  }
  async repay(id: string) {
    await this.checkDeployment();
    const advance = new PublicKey(id),
      a = await this.program.account.advance.fetch(advance),
      treasury = treasuryPda();
    const signature = await this.program.methods
      .repayAdvance()
      .accountsStrict({
        authority: this.wallet.publicKey,
        treasury,
        business: a.business,
        advance,
        usdcMint: USDC_MINT,
        treasuryUsdc: getAssociatedTokenAddressSync(USDC_MINT, treasury, true),
        borrowerUsdc: getAssociatedTokenAddressSync(
          USDC_MINT,
          this.wallet.publicKey,
        ),
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    return {
      ...this.map(advance, await this.program.account.advance.fetch(advance)),
      signature,
    };
  }
}
