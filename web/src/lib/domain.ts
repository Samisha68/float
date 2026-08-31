/** Mirrors the on-chain policy in program/programs/float/src/lib.rs.
 *  Keep these in sync — the program enforces them, this file only displays them. */
export const POLICY = {
  MAX_ADVANCE_TIER_1: 5_000,
  MAX_ADVANCE_ABSOLUTE: 25_000,
  MIN_TERM_DAYS: 1,
  MAX_TERM_DAYS: 60,
  MAX_FEE_BPS: 1_000,
} as const;

export type AdvanceStatus = "Requested" | "Active" | "Repaid" | "Overdue";

/** DESIGN.md removes red/amber/green deliberately, so every status must say
 *  what it means in words. This is the single vocabulary for the whole app —
 *  nothing anywhere else may invent a status string. */
export const STATUS_COPY: Record<AdvanceStatus, { label: string; detail: string }> = {
  Requested: { label: "Awaiting review", detail: "Submitted. An underwriter is checking the evidence." },
  Active:    { label: "Funded — repayment due", detail: "USDC disbursed. Repay in full by the due date." },
  Repaid:    { label: "Repaid in full", detail: "Settled on time. Recorded against your credit history." },
  Overdue:   { label: "Past due", detail: "The due date has passed and this is recorded against the business." },
};

export interface Business {
  authority: string;
  legalName: string;
  advancesTaken: number;
  advancesRepaid: number;
  advancesOverdue: number;
  totalVolumeRepaid: number;
  registeredAt: number;
}

export interface Advance {
  id: string;
  businessName: string;
  amount: number;
  expectedInflow: number;
  payer: string;
  feeBps: number;
  totalDue: number;
  termDays: number;
  status: AdvanceStatus;
  requestedAt: number;
  disbursedAt: number | null;
  dueAt: number | null;
  signature?: string;
}

export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export const shortDate = (ms: number) =>
  new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const daysUntil = (ms: number) => Math.ceil((ms - Date.now()) / 86_400_000);
