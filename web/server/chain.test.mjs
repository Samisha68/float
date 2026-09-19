import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { Keypair, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, businessPda, decodeAdvanceRepaid, isValidSignature, verifyRepayment } from "./chain.mjs";

/* Builds the log line the program really emits, from the IDL's own layout:
   discriminator, advance, business, total_due, was_late, advances_repaid,
   total_volume_repaid. */
function repaidEvent({ advance, business, totalDue, wasLate = false, advancesRepaid = 1 }) {
  const body = Buffer.alloc(32 + 32 + 8 + 1 + 4 + 8);
  new PublicKey(advance).toBuffer().copy(body, 0);
  new PublicKey(business).toBuffer().copy(body, 32);
  body.writeBigUInt64LE(BigInt(Math.round(totalDue * 1e6)), 64);
  body[72] = wasLate ? 1 : 0;
  body.writeUInt32LE(advancesRepaid, 73);
  body.writeBigUInt64LE(BigInt(Math.round(totalDue * 1e6)), 77);
  const discriminator = createHash("sha256").update("event:AdvanceRepaid").digest().subarray(0, 8);
  return `Program data: ${Buffer.concat([discriminator, body]).toString("base64")}`;
}

const wallet = Keypair.generate().publicKey.toBase58();
const other = Keypair.generate().publicKey.toBase58();
const advance = Keypair.generate().publicKey.toBase58();

const transaction = ({ signer = wallet, business = businessPda(wallet), totalDue = 2545, err = null, logs } = {}) => ({
  slot: 4321,
  blockTime: 1_790_000_000,
  meta: {
    err,
    logMessages: logs ?? [
      `Program ${PROGRAM_ID} invoke [1]`,
      "Program log: Instruction: RepayAdvance",
      repaidEvent({ advance, business, totalDue }),
      `Program ${PROGRAM_ID} success`,
    ],
  },
  transaction: { message: { accountKeys: [{ pubkey: signer, signer: true }, { pubkey: PROGRAM_ID, signer: false }] } },
});

test("the event decoder reads exactly what the program emits", () => {
  const line = repaidEvent({ advance, business: businessPda(wallet), totalDue: 2545, wasLate: true, advancesRepaid: 3 });
  const event = decodeAdvanceRepaid(line.slice("Program data: ".length));
  assert.equal(event.advance, advance);
  assert.equal(event.business, businessPda(wallet));
  assert.equal(event.totalDue, 2_545_000_000n);
  assert.equal(event.wasLate, true);
  assert.equal(event.advancesRepaid, 3);
  assert.equal(decodeAdvanceRepaid("not base64 at all"), null);
  assert.equal(decodeAdvanceRepaid(Buffer.alloc(93).toString("base64")), null, "a zeroed blob is not our event");
});

test("a real repayment verifies, and reports what the chain said", () => {
  const proof = verifyRepayment({ transaction: transaction(), wallet, totalDue: 2545 });
  assert.equal(proof.advance, advance);
  assert.equal(proof.totalDue, 2545);
  assert.equal(proof.slot, 4321);
  assert.equal(proof.wasLate, false);
});

test("a borrower cannot settle with someone else's repayment", () => {
  assert.throws(
    () => verifyRepayment({ transaction: transaction({ business: businessPda(other) }), wallet, totalDue: 2545 }),
    /different business/,
  );
});

test("a borrower cannot settle a larger advance with a smaller repayment", () => {
  assert.throws(
    () => verifyRepayment({ transaction: transaction({ totalDue: 100 }), wallet, totalDue: 2545 }),
    /does not match what this advance owes/,
  );
});

test("a transaction someone else signed proves nothing", () => {
  assert.throws(() => verifyRepayment({ transaction: transaction({ signer: other }), wallet, totalDue: 2545 }), /not signed by the wallet/);
});

test("failed, missing and unrelated transactions are all refused", () => {
  assert.throws(() => verifyRepayment({ transaction: null, wallet, totalDue: 2545 }), /could not find that transaction/);
  assert.throws(() => verifyRepayment({ transaction: transaction({ err: { InstructionError: [0, "Custom"] } }), wallet, totalDue: 2545 }), /failed on Solana/);
  assert.throws(
    () =>
      verifyRepayment({
        transaction: transaction({ logs: ["Program 11111111111111111111111111111111 invoke [1]", "Program log: hello"] }),
        wallet,
        totalDue: 2545,
      }),
    /did not repay a Float advance/,
  );
});

test("signatures are checked for shape before anything else happens", () => {
  assert.equal(isValidSignature("5".repeat(88)), true);
  assert.equal(isValidSignature("too-short"), false);
  assert.equal(isValidSignature("0OIl".repeat(22)), false, "base58 excludes 0, O, I and l");
  assert.equal(isValidSignature(undefined), false);
});

test("the business account is derived from the wallet, not taken on trust", () => {
  assert.notEqual(businessPda(wallet), businessPda(other));
  assert.equal(businessPda(wallet), businessPda(wallet));
});
