import { test } from "node:test";
import assert from "node:assert/strict";
import { BASE_MARGIN, RECORD_STEPS, baseRate, marginRequired, quote, suggestedFeeBps } from "./pricing.mjs";
import * as client from "../src/lib/prototype.ts";

test("published rates hold and terms in between are interpolated", () => {
  for (const [days, rate] of [[7, 0.6], [14, 1], [30, 1.8], [45, 2.5], [60, 3.2]])
    assert.equal(baseRate(days), rate);
  assert.equal(baseRate(22), 1.4);
});

test("a record lowers the price and the margin, then stops", () => {
  assert.deepEqual(quote(10000, 30, 0), { base: 1.8, rate: 1.8, discount: 0, fee: 180, total: 10180 });
  assert.deepEqual(quote(10000, 30, RECORD_STEPS), { base: 1.8, rate: 1.2, discount: 0.6, fee: 120, total: 10120 });
  assert.deepEqual(quote(10000, 30, RECORD_STEPS + 40), quote(10000, 30, RECORD_STEPS));
  assert.equal(marginRequired(0), BASE_MARGIN);
  assert.equal(marginRequired(RECORD_STEPS + 3), 120);
});

test("the fee never falls below half the published rate, however long the record", () => {
  for (const days of [1, 7, 14, 30, 45, 60]) {
    const { base, rate } = quote(5000, days, 99);
    assert.ok(rate >= base / 2 && rate > 0, `${days} days priced below the floor`);
  }
});

test("the suggested fee is the borrower's rate in basis points, under the program cap", () => {
  assert.equal(suggestedFeeBps(30, 0), 180);
  assert.equal(suggestedFeeBps(30, RECORD_STEPS), 120);
  for (const days of [1, 30, 60])
    for (const record of [0, 3, RECORD_STEPS])
      assert.ok(suggestedFeeBps(days, record) <= 1000, "program rejects fees above 1000 bps");
});

/* The prototype runs offline with its own copy of this maths. If the two ever
   disagree, a borrower is shown a price the server will not honour. */
test("the offline prototype prices exactly as the server does", () => {
  for (const amount of [1000, 7500, 10000, 50000])
    for (const days of [1, 7, 14, 22, 30, 45, 60])
      for (const record of [0, 1, 3, RECORD_STEPS, 20]) {
        assert.deepEqual(
          client.quote(amount, days, record),
          quote(amount, days, record),
          `drift at ${amount}/${days}d/${record} repayments`,
        );
        assert.equal(client.marginRequired(record), marginRequired(record));
      }
  assert.equal(client.RECORD_STEPS, RECORD_STEPS);
  assert.equal(client.BASE_MARGIN, BASE_MARGIN);
});
