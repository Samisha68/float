import test from 'node:test';
import assert from 'node:assert/strict';
import { current, latestNote, repaidCount, stageOf, toAdvance } from './journey.ts';
import { stageLabel, stages } from './prototype.ts';

const base = {
  id: 'a1',
  businessName: 'Forma Studio',
  payer: 'Northstar Technologies',
  invoiceNumber: 'NS-2048',
  invoiceDue: '2026-10-11',
  amount: 10000,
  expectedInflow: 18000,
  termDays: 30,
  feeBps: 0,
  totalDue: 0,
  status: 'Requested',
  requestedAt: Date.UTC(2026, 8, 16, 12),
  dueAt: null,
  documentName: 'invoice.pdf',
  events: [],
};

test('every API status maps to a stage the journey can draw', () => {
  const statuses = ['Requested', 'NeedsInformation', 'Rejected', 'Offered', 'Accepted', 'Declined', 'Active', 'Repaid'];
  for (const status of statuses) {
    const stage = stageOf({ ...base, status });
    assert.ok(stages.includes(stage), `${status} mapped to an unknown stage`);
    assert.ok(stageLabel[stage], `${status} has no label`);
  }
  assert.equal(new Set(statuses.map((status) => stageOf({ ...base, status }))).size, statuses.length);
});

test('no price is shown before Float has offered one', () => {
  const requested = toAdvance(base);
  assert.equal(requested.offered, false);
  assert.equal(requested.rate, 0);
  assert.equal(requested.fee, 0);
  assert.equal(requested.total, 0);
});

test('the offered price comes from the server, never from a local calculation', () => {
  const offered = toAdvance({ ...base, status: 'Offered', feeBps: 170, totalDue: 10170 });
  assert.equal(offered.offered, true);
  assert.equal(offered.rate, 1.7);
  assert.equal(offered.fee, 170);
  assert.equal(offered.total, 10170);
});

test('the due date appears only once the advance is funded', () => {
  assert.equal(toAdvance(base).dueOn, null);
  const funded = toAdvance({ ...base, status: 'Active', dueAt: Date.UTC(2026, 9, 16, 12) });
  assert.equal(funded.dueOn, '2026-10-16');
  assert.equal(funded.requestedOn, '2026-09-16');
});

test("Float's latest message travels with the application", () => {
  const asked = {
    ...base,
    status: 'NeedsInformation',
    events: [
      { at: 1, actor: 'Business', message: 'Application submitted with invoice.' },
      { at: 2, actor: 'Float', message: 'Send a version showing the due date.' },
      { at: 3, actor: 'Business', message: 'Sending it now.' },
    ],
  };
  assert.equal(latestNote(asked), 'Send a version showing the due date.');
  assert.equal(toAdvance(asked).note, 'Send a version showing the due date.');
  assert.equal(latestNote(base), '');
});

test('the record counts settled advances only', () => {
  const list = [
    { ...base, status: 'Repaid' },
    { ...base, status: 'Active' },
    { ...base, status: 'Repaid' },
    { ...base, status: 'Rejected' },
    { ...base, status: 'Declined' },
  ];
  assert.equal(repaidCount(list), 2);
  assert.equal(repaidCount([]), 0);
});

test('the open application is the one the borrower is dealing with', () => {
  const open = { ...base, id: 'open', status: 'Offered' };
  const done = { ...base, id: 'done', status: 'Repaid' };
  assert.equal(current([done, open]).id, 'open');
  // Newest first: with nothing open, the most recent one is shown.
  assert.equal(current([done, { ...base, id: 'older', status: 'Declined' }]).id, 'done');
  assert.equal(current([]), null);
});
