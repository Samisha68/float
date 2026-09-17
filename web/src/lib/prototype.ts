/* Front-end prototype for the Float borrower journey.
   No backend, no wallet, no money. Everything here is local state.

   The one rule this model exists to express: a repayment record does not buy a
   bigger advance, it buys a better price. Fee discount and collateral margin
   both improve with the record; the advance stays sized to the incoming money. */

/* These mirror the API's application statuses one for one, so wiring the
   prototype to `web/server` is a rename and nothing more:
   draft (not yet created), Requested, NeedsInformation, Rejected, Offered,
   Accepted, Declined, Active, Repaid. */
export type Stage =
  | "draft"
  | "requested"
  | "information"
  | "rejected"
  | "offered"
  | "accepted"
  | "declined"
  | "active"
  | "repaid";

export const stages: Stage[] = [
  "draft",
  "requested",
  "information",
  "rejected",
  "offered",
  "accepted",
  "declined",
  "active",
  "repaid",
];

/* Status is always carried in words, never colour. */
export const stageLabel: Record<Stage, string> = {
  draft: "Not submitted",
  requested: "Submitted",
  information: "Needs information",
  rejected: "Not approved",
  offered: "Offer ready",
  accepted: "Accepted",
  declined: "Offer declined",
  active: "Active",
  repaid: "Repaid",
};

/* Once an offer exists the price is fixed; once funded the dates are fixed.
   Membership, not order, because rejected and declined are dead ends. */
const OFFERED: Stage[] = ["offered", "accepted", "active", "repaid"];
const FUNDED: Stage[] = ["active", "repaid"];

export type Business = {
  name: string;
  country: string;
  representative: string;
  email: string;
};

export type Request = {
  amount: number;
  days: number;
  kind: string;
  payer: string;
  incoming: number;
  expected: string;
};

export type Advance = {
  amount: number;
  days: number;
  fee: number;
  repaidOn: string;
};

export type Quote = {
  base: number;
  rate: number;
  discount: number;
  fee: number;
  total: number;
};

export type State = {
  started: boolean;
  step: number;
  business: Business;
  documents: string[];
  request: Request;
  evidence: string[];
  stage: Stage;
  /* The price agreed at approval. Once an offer is made it never moves, even
     as later repayments make the next advance cheaper. */
  agreed?: Quote;
  /* What Float asked for, or why it said no. Written by the operator. */
  note?: string;
  /* The borrower's answer to an information request. */
  reply?: string;
  fundedOn?: string;
  repaidOn?: string;
  history: Advance[];
};

export const MIN_AMOUNT = 1000;
export const MAX_AMOUNT = 50000;
export const MIN_DAYS = 1;
export const MAX_DAYS = 60;
export const TERMS = [7, 14, 30, 45, 60];

export const PAYMENT_KINDS = [
  "Customer invoice",
  "Investor transfer",
  "Marketplace payout",
  "Contract payment",
  "Other receivable",
];

export const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Singapore",
  "India",
  "Malaysia",
  "Australia",
  "Other",
];

export const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);

export const date = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysBetween(from: string, to: string) {
  const ms = new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/* Fee before any record discount, interpolated between published points. */
const RATE_POINTS: [number, number][] = [
  [0, 0],
  [7, 0.6],
  [14, 1],
  [30, 1.8],
  [45, 2.5],
  [60, 3.2],
];

export function baseRate(days: number) {
  const index = RATE_POINTS.findIndex((point) => point[0] >= days);
  const high = RATE_POINTS[Math.max(1, index)];
  const low = RATE_POINTS[Math.max(0, index - 1)];
  return round2(low[1] + ((high[1] - low[1]) * (days - low[0])) / (high[0] - low[0]));
}

/* Each repayment earns 0.1 points off the fee and 5 points off the collateral
   margin, up to six repayments. The fee discount never exceeds half the base,
   so a clean record makes credit cheaper without ever making it free. */
export const RECORD_STEPS = 6;
export const BASE_MARGIN = 150;
const FEE_STEP = 0.1;
const MARGIN_STEP = 5;

export function marginRequired(repayments: number) {
  return BASE_MARGIN - Math.min(repayments, RECORD_STEPS) * MARGIN_STEP;
}

export function quote(amount: number, days: number, repayments = 0): Quote {
  const base = baseRate(days);
  const earned = Math.min(repayments, RECORD_STEPS) * FEE_STEP;
  const rate = round2(Math.max(base - earned, base / 2));
  const discount = round2(base - rate);
  const fee = Math.round(amount * rate) / 100;
  return { base, rate, discount, fee, total: round2(amount + fee) };
}

/* What one more repayment would change, used to show the reward honestly. */
export function nextStep(repayments: number) {
  if (repayments >= RECORD_STEPS) return null;
  return { fee: FEE_STEP, margin: MARGIN_STEP };
}

export const sampleBusiness: Business = {
  name: "Forma Studio",
  country: "United States",
  representative: "Alex Morgan",
  email: "alex@forma.studio",
};

export const sampleRequest: Request = {
  amount: 10000,
  days: 30,
  kind: "Customer invoice",
  payer: "Northstar Technologies",
  incoming: 18000,
  expected: isoDate(25),
};

export const sampleDocuments = ["Certificate-of-incorporation.pdf", "Director-identification.pdf"];
export const sampleEvidence = ["Northstar-invoice-NS2048.pdf"];

export const initial = (): State => ({
  started: false,
  step: 0,
  business: { ...sampleBusiness },
  documents: [],
  request: { ...sampleRequest },
  evidence: [],
  stage: "draft",
  history: [],
});

export const repayments = (state: State) => state.history.length;

export const isFunded = (state: State) => FUNDED.includes(state.stage);

/* What Float asks for when it needs more, and why it declines. In the wired
   app both come from the operator; here they stand in for that copy. */
export const SAMPLE_INFORMATION_NOTE =
  "The invoice you attached doesn’t show the payment terms. Send a version that shows the due date, or the signed agreement behind it.";
export const SAMPLE_REJECTION_NOTE =
  "We couldn’t verify the payer on this one. That’s about this invoice, not about your business.";

export function dueDate(state: State) {
  return addDays(state.fundedOn ?? isoDate(), state.request.days);
}

/* Moving to a stage is the only way state changes shape, so every entry point
   (the borrower's own actions and the demo controls) stays consistent. */
export function advanceTo(state: State, stage: Stage): State {
  const next: State = { ...state, stage };

  next.agreed = OFFERED.includes(stage)
    ? state.agreed ?? quote(state.request.amount, state.request.days, repayments(state))
    : undefined;
  next.fundedOn = FUNDED.includes(stage) ? state.fundedOn ?? isoDate() : undefined;

  /* Float's message belongs to the state that produced it. */
  if (stage === "information") next.note = state.note ?? SAMPLE_INFORMATION_NOTE;
  else if (stage === "rejected") next.note = state.note ?? SAMPLE_REJECTION_NOTE;
  else next.note = undefined;

  if (stage !== "information") next.reply = undefined;

  if (stage === "repaid") {
    const agreed = next.agreed ?? quote(state.request.amount, state.request.days, repayments(state));
    next.repaidOn = state.repaidOn ?? isoDate();
    next.history =
      state.stage === "repaid"
        ? state.history
        : [
            ...state.history,
            { amount: state.request.amount, days: state.request.days, fee: agreed.fee, repaidOn: next.repaidOn },
          ];
  } else {
    next.repaidOn = undefined;
  }

  return next;
}

/* Starting again keeps the record and the business, which is the whole point:
   the second advance is priced better than the first. */
export function startAgain(state: State): State {
  return {
    ...state,
    stage: "draft",
    step: 1,
    agreed: undefined,
    note: undefined,
    reply: undefined,
    fundedOn: undefined,
    repaidOn: undefined,
    evidence: [],
    request: { ...state.request, payer: "", incoming: 0, expected: "" },
  };
}

/* Answering an information request puts the application back in the queue,
   which is exactly what `respond` does on the server. */
export function respond(state: State, reply: string): State {
  return { ...advanceTo(state, "requested"), reply };
}

/* A business that has been with Float a while, for showing what a record buys. */
export function seasoned(state: State): State {
  const history: Advance[] = Array.from({ length: RECORD_STEPS }, (_, index) => ({
    amount: 8000 + index * 500,
    days: 30,
    fee: quote(8000 + index * 500, 30, index).fee,
    repaidOn: isoDate(-((RECORD_STEPS - index) * 34)),
  }));
  return { ...state, history };
}

export type Errors = Record<string, string>;

const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function checkBusiness(business: Business, documents: string[]): Errors {
  const errors: Errors = {};
  if (!business.name.trim()) errors.name = "We need the name your business trades under.";
  if (!business.representative.trim()) errors.representative = "Who should we speak to about this application?";
  if (!email.test(business.email)) errors.email = "Use a work email we can reach you on.";
  if (!documents.length) errors.documents = "Add one document, or use the sample ones.";
  return errors;
}

export function checkRequest(request: Request, evidence: string[]): Errors {
  const errors: Errors = {};
  if (!request.payer.trim()) errors.payer = "Tell us who owes you this money.";
  if (!(request.incoming > 0)) errors.incoming = "How much is coming in?";
  else if (request.incoming < request.amount)
    errors.incoming = `This has to cover the ${money(request.amount)} you're asking for.`;
  if (!request.expected) errors.expected = "When do you expect to be paid?";
  else if (daysBetween(isoDate(), request.expected) < 0) errors.expected = "Pick a date in the future.";
  if (request.amount < MIN_AMOUNT || request.amount > MAX_AMOUNT)
    errors.amount = `Advances run from ${money(MIN_AMOUNT)} to ${money(MAX_AMOUNT)}.`;
  if (request.days < MIN_DAYS || request.days > MAX_DAYS)
    errors.days = `Terms run from ${MIN_DAYS} to ${MAX_DAYS} days.`;
  if (!evidence.length) errors.evidence = "Attach the invoice or agreement, or use the sample.";
  return errors;
}
