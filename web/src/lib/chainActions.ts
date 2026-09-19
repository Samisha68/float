/* The two on-chain actions a borrower takes from the workspace.

   Both are signed in the browser by the borrower's own wallet, then handed to
   the server as a signature. The server verifies each against Solana before it
   changes anything, so a lie here achieves nothing. */

import { Connection } from "@solana/web3.js";
import { DEVNET_RPC } from "./config";
import { OnChainLedger } from "./onchain";
import { anchorWallet, type SignTransaction, type WalletLike } from "./walletSigner";
import { anchorAdvance, settleAdvance, type Advance } from "./live";
import type { Application } from "./api";

const ledgerFor = <W extends WalletLike>(wallet: W, signTransaction: SignTransaction<W>) =>
  new OnChainLedger(new Connection(DEVNET_RPC, "confirmed"), anchorWallet(wallet, signTransaction));

/* Creates the business profile if this wallet has none, then the advance. The
   amount and term must match the application, or the server refuses to record
   it. Nothing about the payer or the invoice is sent to the chain. */
export async function putAdvanceOnChain<W extends WalletLike>(
  application: Application,
  advance: Advance,
  wallet: W,
  signTransaction: SignTransaction<W>,
): Promise<Application> {
  const created = await ledgerFor(wallet, signTransaction).requestAdvance({
    amount: advance.amount,
    expectedInflow: advance.incoming,
    payer: "",
    termDays: advance.days,
  });
  return anchorAdvance(application.id, created.signature);
}

export async function repayOnChain<W extends WalletLike>(
  application: Application,
  onChainAdvance: string,
  wallet: W,
  signTransaction: SignTransaction<W>,
): Promise<Application> {
  const repaid = await ledgerFor(wallet, signTransaction).repay(onChainAdvance);
  return settleAdvance(application.id, repaid.signature);
}
