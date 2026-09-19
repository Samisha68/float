import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_MARGIN,
  RECORD_STEPS,
  addDays,
  advanceTo,
  baseRate,
  checkBusiness,
  checkRequest,
  initial,
  isoDate,
  marginRequired,
  quote,
  repayments,
  sampleDocuments,
  sampleEvidence,
  respond,
  seasoned,
  stageLabel,
  stages,
  startAgain,
} from './prototype.ts';

test('published rates hold, and terms in between are interpolated', () => {
  for (const [days, rate] of [[7, 0.6], [14, 1], [30, 1.8], [45, 2.5], [60, 3.2]]) {
    assert.equal(baseRate(days), rate);
  }
  assert.equal(baseRate(22), 1.4);
  assert.deepEqual(quote(10000, 30), { base: 1.8, rate: 1.8, discount: 0, fee: 180, total: 10180 });
});

test('a record lowers the price, never raises the amount', () => {
  const fresh = quote(10000, 30, 0);
  const earned = quote(10000, 30, RECORD_STEPS);
  assert.equal(earned.rate, 1.2);
  assert.equal(earned.fee, 120);
  assert.ok(earned.rate < fresh.rate);
  assert.equal(earned.total - 10000, earned.fee);
  // Beyond the cap nothing more is earned.
  assert.deepEqual(quote(10000, 30, RECORD_STEPS + 20), earned);
});

test('the fee discount never exceeds half the published rate', () => {
  for (const days of [1, 7, 14, 30, 45, 60]) {
    const { base, rate } = quote(5000, days, RECORD_STEPS);
    assert.ok(rate >= base / 2, `${days} days fell below half the base rate`);
    assert.ok(rate > 0);
  }
});

test('collateral margin falls with the record and then stops', () => {
  assert.equal(marginRequired(0), BASE_MARGIN);
  assert.equal(marginRequired(RECORD_STEPS), 120);
  assert.equal(marginRequired(RECORD_STEPS + 5), 120);
});

test('repaying adds one entry to the record, and only one', () => {
  const funded = advanceTo(initial(), 'active');
  assert.ok(funded.fundedOn);
  const repaid = advanceTo(funded, 'repaid');
  assert.equal(repayments(repaid), 1);
  assert.equal(repayments(advanceTo(repaid, 'repaid')), 1);
  assert.equal(repaid.history[0].fee, quote(repaid.request.amount, repaid.request.days, 0).fee);
});

test('the agreed price is locked at approval and survives repayment', () => {
  const approved = advanceTo(initial(), 'offered');
  assert.deepEqual(approved.agreed, quote(10000, 30, 0));
  const repaid = advanceTo(advanceTo(approved, 'active'), 'repaid');
  // The record now earns a cheaper rate, but this advance still cost what was agreed.
  assert.equal(repaid.agreed.rate, 1.8);
  assert.equal(repaid.history[0].fee, 180);
  assert.equal(quote(10000, 30, repayments(repaid)).rate, 1.7);
  // Going back to a pre-offer stage drops the agreed price.
  assert.equal(advanceTo(repaid, 'requested').agreed, undefined);
});

test('rewinding clears the funding dates but keeps the record', () => {
  const repaid = advanceTo(advanceTo(initial(), 'active'), 'repaid');
  const back = advanceTo(repaid, 'requested');
  assert.equal(back.fundedOn, undefined);
  assert.equal(back.repaidOn, undefined);
  assert.equal(repayments(back), 1);
});

test('starting again keeps the business and the record, clears the request', () => {
  const again = startAgain(advanceTo(advanceTo(initial(), 'active'), 'repaid'));
  assert.equal(again.stage, 'draft');
  assert.equal(repayments(again), 1);
  assert.equal(again.business.name, initial().business.name);
  assert.equal(again.request.payer, '');
  assert.equal(again.evidence.length, 0);
  assert.ok(quote(10000, 30, repayments(again)).rate < quote(10000, 30, 0).rate);
});

test('a seasoned business is priced at the fully earned terms', () => {
  const state = seasoned(initial());
  assert.equal(repayments(state), RECORD_STEPS);
  assert.equal(marginRequired(repayments(state)), 120);
});

test('dates stay correct across month and year ends', () => {
  assert.equal(addDays('2026-09-08', 30), '2026-10-08');
  assert.equal(addDays('2026-12-29', 7), '2027-01-05');
});

test('the business step asks for what it needs and nothing else', () => {
  const state = initial();
  assert.deepEqual(Object.keys(checkBusiness(state.business, sampleDocuments)), []);
  const missing = checkBusiness({ ...state.business, name: ' ', email: 'not-an-email' }, []);
  assert.ok(missing.name && missing.email && missing.documents);
  assert.equal(missing.country, undefined);
});

test('the request must be covered by the incoming payment', () => {
  const request = { ...initial().request, expected: isoDate(10) };
  assert.deepEqual(Object.keys(checkRequest(request, sampleEvidence)), []);
  assert.ok(checkRequest({ ...request, incoming: 500 }, sampleEvidence).incoming);
  assert.ok(checkRequest({ ...request, expected: isoDate(-1) }, sampleEvidence).expected);
  assert.ok(checkRequest({ ...request, amount: 100 }, sampleEvidence).amount);
  assert.ok(checkRequest(request, []).evidence);
});

test('every stage the API can return has a screen and a label', () => {
  const apiStatuses = ['Requested', 'NeedsInformation', 'Rejected', 'Offered', 'Accepted', 'Declined', 'Active', 'Repaid'];
  assert.equal(stages.length, apiStatuses.length + 1); // plus draft, which the API never stores
  for (const stage of stages) assert.ok(stageLabel[stage], `${stage} has no label`);
});

test('an information request pauses the application without losing it', () => {
  const asked = advanceTo(advanceTo(initial(), 'requested'), 'information');
  assert.ok(asked.note, 'the borrower is told what is missing');
  const answered = respond(asked, 'Sending the signed agreement.');
  assert.equal(answered.stage, 'requested');
  assert.equal(answered.reply, 'Sending the signed agreement.');
  assert.equal(answered.note, undefined);
  assert.equal(answered.request.amount, initial().request.amount);
});

test('rejection and decline are dead ends that keep nothing on the record', () => {
  for (const stage of ['rejected', 'declined']) {
    const state = advanceTo(advanceTo(initial(), 'requested'), stage);
    assert.equal(repayments(state), 0);
    assert.equal(state.fundedOn, undefined);
  }
  assert.ok(advanceTo(initial(), 'rejected').note, 'a rejection always carries a reason');
});

test('accepting fixes the price but not the funding date', () => {
  const accepted = advanceTo(advanceTo(initial(), 'offered'), 'accepted');
  assert.deepEqual(accepted.agreed, quote(10000, 30, 0));
  assert.equal(accepted.fundedOn, undefined);
  assert.ok(advanceTo(accepted, 'active').fundedOn);
});
