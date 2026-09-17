/* What an advance costs, and what a repayment record earns.

   PROVISIONAL. These numbers are placeholders chosen to make the shape of the
   model visible; the real curve is a credit decision and has not been made.
   Change them here and nowhere else.

   The rule the shape encodes: a record buys a better price, never a bigger
   advance. The advance stays capped by the incoming payment, in the API's
   `expectedInflow` check. `web/src/lib/prototype.ts` carries a copy of this
   maths for the offline prototype, and `pricing.test.mjs` fails if the two
   ever disagree. */

const round2 = (n) => Math.round(n * 100) / 100;

/* Published fee by term, interpolated in between. Percent of the advance. */
const RATE_POINTS = [
  [0, 0],
  [7, 0.6],
  [14, 1],
  [30, 1.8],
  [45, 2.5],
  [60, 3.2],
];

export function baseRate(days) {
  const index = RATE_POINTS.findIndex((point) => point[0] >= days);
  const high = RATE_POINTS[Math.max(1, index)];
  const low = RATE_POINTS[Math.max(0, index - 1)];
  return round2(low[1] + ((high[1] - low[1]) * (days - low[0])) / (high[0] - low[0]));
}

/* Each repayment earns 0.1 points off the fee and 5 points off the collateral
   margin, up to six. The fee discount never exceeds half the published rate, so
   a clean record makes credit cheaper without ever making it free. */
export const RECORD_STEPS = 6;
export const BASE_MARGIN = 150;
const FEE_STEP = 0.1;
const MARGIN_STEP = 5;

export function marginRequired(repayments) {
  return BASE_MARGIN - Math.min(repayments, RECORD_STEPS) * MARGIN_STEP;
}

export function quote(amount, days, repayments = 0) {
  const base = baseRate(days);
  const earned = Math.min(repayments, RECORD_STEPS) * FEE_STEP;
  const rate = round2(Math.max(base - earned, base / 2));
  const discount = round2(base - rate);
  const fee = Math.round(amount * rate) / 100;
  return { base, rate, discount, fee, total: round2(amount + fee) };
}

/* The operator sets the fee, in basis points. This is what the queue suggests
   from the borrower's record; it is a starting point, not a decision. */
export function suggestedFeeBps(days, repayments = 0) {
  return Math.round(quote(100, days, repayments).rate * 100);
}

/* How many advances this borrower has repaid. The record is a count of
   settled loans, never a score we invented. */
export function repaymentsFor(db, userId) {
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM applications WHERE user_id=? AND json_extract(data,'$.status')='Repaid'")
    .get(userId);
  return row?.n ?? 0;
}
