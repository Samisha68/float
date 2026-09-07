import { PublicKey } from "@solana/web3.js";

/** Deployed 31 Aug 2026 by `anchor keys sync`. Must match
 *  program/Anchor.toml and the declare_id! in the program source. */
export const FLOAT_PROGRAM_ID = new PublicKey(
  "6NjXwwwuFNWV3MBk2r2wv68hDde1snEiMMfwrvQ31Db8"
);

/** Circle's official devnet USDC. Get test tokens at https://faucet.circle.com
 *  NOTE: the archived hackathon code uses a different, incorrect mint. */
export const USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

export const DEVNET_RPC = "https://api.devnet.solana.com";

/** USDC is 6 decimals. UI works in whole dollars; the chain works in base units. */
export const USDC_DECIMALS = 6;
export const toBaseUnits = (dollars: number) => Math.round(dollars * 10 ** USDC_DECIMALS);
export const fromBaseUnits = (units: number | bigint) => Number(units) / 10 ** USDC_DECIMALS;

/** PDA seeds — must match the program's constants exactly.
 *  Uint8Array rather than Buffer: Vite does not polyfill Node globals, so a
 *  Buffer here compiles and then throws in the browser. */
const utf8 = new TextEncoder();
export const TREASURY_SEED = utf8.encode("treasury");
export const BUSINESS_SEED = utf8.encode("business");
export const ADVANCE_SEED = utf8.encode("advance");

export const treasuryPda = () =>
  PublicKey.findProgramAddressSync([TREASURY_SEED], FLOAT_PROGRAM_ID)[0];

export const businessPda = (authority: PublicKey) =>
  PublicKey.findProgramAddressSync([BUSINESS_SEED, authority.toBytes()], FLOAT_PROGRAM_ID)[0];

export const advancePda = (business: PublicKey, nonce: bigint) => {
  const n = new Uint8Array(8);
  new DataView(n.buffer).setBigUint64(0, nonce, true); // u64 little-endian
  return PublicKey.findProgramAddressSync([ADVANCE_SEED, business.toBytes(), n], FLOAT_PROGRAM_ID)[0];
};
