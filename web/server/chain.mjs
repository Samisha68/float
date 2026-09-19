/* Reconciliation: deciding whether a repayment really happened on Solana.

   A borrower's browser can claim anything. What it cannot do is forge a
   confirmed transaction that our program signed off on, so every claim is
   checked against the chain before an application is marked paid:

     1. the transaction exists, is confirmed, and did not fail
     2. the wallet bound to this Float account signed it
     3. our program emitted AdvanceRepaid inside it
     4. the event's business account is the one derived from that wallet
     5. the amount repaid on chain matches what the application says is due

   Check 4 stops a borrower presenting someone else's repayment; check 5 stops
   them presenting a smaller repayment of their own. A signature is accepted
   once: `settlements` holds it, so the same proof cannot settle twice. */

import { createHash } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = "6NjXwwwuFNWV3MBk2r2wv68hDde1snEiMMfwrvQ31Db8";
export const USDC_DECIMALS = 6;
const BUSINESS_SEED = new TextEncoder().encode("business");

/* Anchor prefixes an event with the first 8 bytes of sha256("event:<Name>"). */
export const eventDiscriminator = (name) =>
  createHash("sha256").update(`event:${name}`).digest().subarray(0, 8);

const REPAID = eventDiscriminator("AdvanceRepaid");
const REQUESTED = eventDiscriminator("AdvanceRequested");

/* AdvanceRepaid { advance: Pubkey, business: Pubkey, total_due: u64,
   was_late: bool, advances_repaid: u32, total_volume_repaid: u64 } */
export function decodeAdvanceRepaid(base64) {
  let bytes;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    return null;
  }
  if (bytes.length < 8 + 32 + 32 + 8 + 1 + 4 + 8) return null;
  if (!bytes.subarray(0, 8).equals(REPAID)) return null;
  return {
    advance: new PublicKey(bytes.subarray(8, 40)).toBase58(),
    business: new PublicKey(bytes.subarray(40, 72)).toBase58(),
    totalDue: bytes.readBigUInt64LE(72),
    wasLate: bytes[80] === 1,
    advancesRepaid: bytes.readUInt32LE(81),
    totalVolumeRepaid: bytes.readBigUInt64LE(85),
  };
}

/* AdvanceRequested { advance: Pubkey, business: Pubkey, amount: u64,
   expected_inflow: u64, term_days: u16 } */
export function decodeAdvanceRequested(base64) {
  let bytes;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    return null;
  }
  if (bytes.length < 8 + 32 + 32 + 8 + 8 + 2) return null;
  if (!bytes.subarray(0, 8).equals(REQUESTED)) return null;
  return {
    advance: new PublicKey(bytes.subarray(8, 40)).toBase58(),
    business: new PublicKey(bytes.subarray(40, 72)).toBase58(),
    amount: bytes.readBigUInt64LE(72),
    expectedInflow: bytes.readBigUInt64LE(80),
    termDays: bytes.readUInt16LE(88),
  };
}

export const businessPda = (wallet, programId = PROGRAM_ID) =>
  PublicKey.findProgramAddressSync(
    [BUSINESS_SEED, new PublicKey(wallet).toBytes()],
    new PublicKey(programId),
  )[0].toBase58();

/* Dollars to USDC base units, without floating point drift. */
export const toBaseUnits = (dollars) => BigInt(Math.round(dollars * 10 ** USDC_DECIMALS));

const signers = (transaction) =>
  (transaction?.transaction?.message?.accountKeys ?? [])
    .filter((key) => key.signer)
    .map((key) => (typeof key.pubkey === "string" ? key.pubkey : String(key.pubkey)));

const eventsIn = (transaction, decode) =>
  (transaction?.meta?.logMessages ?? [])
    .filter((line) => line.startsWith("Program data: "))
    .map((line) => decode(line.slice("Program data: ".length)))
    .filter(Boolean);

const refuse = (message) => {
  throw Object.assign(new Error(message), { status: 400 });
};

/* Shared by both verifications: a transaction only counts if it exists, it
   worked, and the wallet on this Float account signed it. */
function usable(transaction, wallet) {
  if (!transaction)
    refuse("We could not find that transaction on Solana yet. Wait for it to confirm and try again.");
  if (transaction.meta?.err) refuse("That transaction failed on Solana, so nothing happened on chain.");
  if (!signers(transaction).includes(wallet))
    refuse("That transaction was not signed by the wallet on this account.");
}

/* The borrower puts the advance on chain themselves, so the server checks that
   what they created matches what Float agreed to fund. */
export function verifyAdvanceRequested({ transaction, wallet, amount, termDays, programId = PROGRAM_ID }) {
  usable(transaction, wallet);
  const requests = eventsIn(transaction, decodeAdvanceRequested);
  if (!requests.length) refuse("That transaction did not create a Float advance.");

  const expectedBusiness = businessPda(wallet, programId);
  const mine = requests.filter((event) => event.business === expectedBusiness);
  if (!mine.length) refuse("That advance belongs to a different business.");

  const match = mine.find((event) => event.amount === toBaseUnits(amount) && event.termDays === termDays);
  if (!match) refuse("The advance on Solana does not match the amount and term of this application.");

  return {
    advance: match.advance,
    business: match.business,
    amount: Number(match.amount) / 10 ** USDC_DECIMALS,
    termDays: match.termDays,
    slot: transaction.slot ?? null,
  };
}

export function isValidSignature(signature) {
  return typeof signature === "string" && /^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(signature);
}

/* Returns what the chain says happened, or throws a message a borrower can
   act on. The caller decides what to do with it. */
export function verifyRepayment({ transaction, wallet, totalDue, advance = null, programId = PROGRAM_ID }) {
  usable(transaction, wallet);

  const repayments = eventsIn(transaction, decodeAdvanceRepaid);
  if (!repayments.length) refuse("That transaction did not repay a Float advance.");

  const expectedBusiness = businessPda(wallet, programId);
  const mine = repayments.filter((event) => event.business === expectedBusiness);
  if (!mine.length) refuse("That repayment belongs to a different business.");

  /* Once the application knows which advance it is, only that one settles it.
     Otherwise the amount is all we have to go on. */
  const forThisAdvance = advance ? mine.filter((event) => event.advance === advance) : mine;
  if (!forThisAdvance.length) refuse("That repayment was for a different advance.");

  const match = forThisAdvance.find((event) => event.totalDue === toBaseUnits(totalDue));
  if (!match) refuse("The amount repaid on Solana does not match what this advance owes.");

  return {
    advance: match.advance,
    business: match.business,
    totalDue: Number(match.totalDue) / 10 ** USDC_DECIMALS,
    wasLate: match.wasLate,
    advancesRepaid: match.advancesRepaid,
    slot: transaction.slot ?? null,
    blockTime: transaction.blockTime ?? null,
  };
}

/* The default reader. Injected in tests, and swappable for a paid RPC when
   the public devnet endpoint starts rate limiting. */
export function transactionReader(endpoint = process.env.FLOAT_RPC || "https://api.devnet.solana.com") {
  return async function getTransaction(signature) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [signature, { encoding: "jsonParsed", commitment: "finalized", maxSupportedTransactionVersion: 0 }],
      }),
    });
    if (!response.ok)
      throw Object.assign(new Error("Solana is not responding right now. Try again in a moment."), { status: 503 });
    const body = await response.json();
    if (body.error)
      throw Object.assign(new Error("Solana could not read that transaction. Check the signature."), { status: 400 });
    return body.result ?? null;
  };
}
