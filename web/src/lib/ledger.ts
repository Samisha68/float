import { Advance, Business, POLICY } from "./domain";

/** The app talks to this interface, never to Solana directly.
 *
 *  Two implementations:
 *    - DemoLedger      : in-memory, deterministic, always works. Use on stage
 *                        if the network is against you.
 *    - OnChainLedger   : real devnet transactions (see onchain.ts).
 *
 *  Keeping the seam here means the UI is finished and demoable before the
 *  program is deployed, and a devnet outage costs you nothing on the day. */
export interface Ledger {
  readonly mode: "demo" | "devnet";
  getBusiness(): Promise<Business>;
  listAdvances(): Promise<Advance[]>;
  requestAdvance(input: {
    amount: number;
    expectedInflow: number;
    payer: string;
    termDays: number;
  }): Promise<Advance>;
  approveAndDisburse(id: string, feeBps: number): Promise<Advance>;
  repay(id: string): Promise<Advance>;
}

const now = () => Date.now();
let seq = 0;

export class DemoLedger implements Ledger {
  readonly mode = "demo" as const;
  private business: Business;
  private advances: Advance[];

  constructor() {
    this.business = {
      authority: "Demo7v...q4Kt",
      legalName: "Meridian Supply Co.",
      advancesTaken: 2,
      advancesRepaid: 2,
      advancesOverdue: 0,
      totalVolumeRepaid: 6_200,
      registeredAt: now() - 86_400_000 * 96,
    };
    // Two settled advances so the credit record is not empty on stage.
    this.advances = [
      {
        id: "adv-001", businessName: "Meridian Supply Co.", amount: 2_400, expectedInflow: 7_800,
        payer: "Northwind Logistics Ltd", feeBps: 250, totalDue: 2_460, termDays: 30,
        status: "Repaid", requestedAt: now() - 86_400_000 * 92,
        disbursedAt: now() - 86_400_000 * 92, dueAt: now() - 86_400_000 * 62,
      },
      {
        id: "adv-002", businessName: "Meridian Supply Co.", amount: 3_800, expectedInflow: 11_500,
        payer: "Harbour Foods PLC", feeBps: 225, totalDue: 3_885, termDays: 30,
        status: "Repaid", requestedAt: now() - 86_400_000 * 45,
        disbursedAt: now() - 86_400_000 * 45, dueAt: now() - 86_400_000 * 15,
      },
    ];
  }

  async getBusiness() { return { ...this.business }; }
  async listAdvances() { return [...this.advances].reverse(); }

  async requestAdvance(input: { amount: number; expectedInflow: number; payer: string; termDays: number }) {
    if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Advance amount must be greater than zero.");
    if (input.amount > POLICY.MAX_ADVANCE_TIER_1)
      throw new Error(`Advance exceeds the tier-1 ceiling of ${POLICY.MAX_ADVANCE_TIER_1.toLocaleString()} USDC.`);
    if (!Number.isFinite(input.expectedInflow) || input.amount > input.expectedInflow)
      throw new Error("An advance may not exceed the verified expected inflow.");
    if (!Number.isInteger(input.termDays) || input.termDays < POLICY.MIN_TERM_DAYS || input.termDays > POLICY.MAX_TERM_DAYS)
      throw new Error(`Term must be between ${POLICY.MIN_TERM_DAYS} and ${POLICY.MAX_TERM_DAYS} days.`);

    const advance: Advance = {
      id: `adv-${String(++seq + 2).padStart(3, "0")}`,
      businessName: this.business.legalName,
      amount: input.amount,
      expectedInflow: input.expectedInflow,
      payer: input.payer,
      feeBps: 0,
      totalDue: 0,
      termDays: input.termDays,
      status: "Requested",
      requestedAt: now(),
      disbursedAt: null,
      dueAt: null,
    };
    this.advances.push(advance);
    return advance;
  }

  async approveAndDisburse(id: string, feeBps: number) {
    if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > POLICY.MAX_FEE_BPS) throw new Error("Fee must be between 0 and 1,000 basis points.");
    const a = this.mustFind(id);
    if (a.status !== "Requested") throw new Error("This advance is not awaiting review.");
    a.feeBps = feeBps;
    a.totalDue = Math.round(a.amount * (1 + feeBps / 10_000) * 100) / 100;
    a.disbursedAt = now();
    a.dueAt = now() + a.termDays * 86_400_000;
    a.status = "Active";
    a.signature = `demo${a.id}Disburse`;
    this.business.advancesTaken += 1;
    return { ...a };
  }

  async repay(id: string) {
    const a = this.mustFind(id);
    if (a.status !== "Active" && a.status !== "Overdue") throw new Error("This advance is not repayable.");
    a.status = "Repaid";
    a.signature = `demo${a.id}Repay`;
    this.business.advancesRepaid += 1;
    this.business.totalVolumeRepaid += a.amount;
    return { ...a };
  }

  private mustFind(id: string) {
    const a = this.advances.find((x) => x.id === id);
    if (!a) throw new Error("Advance not found.");
    return a;
  }
}
