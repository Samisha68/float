/* The two on-chain actions a borrower takes from the workspace.

   Both are signed in the browser by the borrower's own wallet, then handed to
   the server as a signature. The server verifies each against Solana before it
   changes anything, so a lie here achieves nothing. */

import { anchorWallet, type SignTransaction, type WalletLike } from "./walletSigner";
import { anchorAdvance, settleAdvance, type Advance } from "./live";
import type { Application } from "./api";

/* Anchor and web3.js need Buffer, which the browser does not have, and they are
   a large dependency nobody loads unless they sign something. Both problems go
   away by pulling them in at the moment of use: the polyfill is installed
   first, and the workspace stays light for borrowers who never touch the
   chain. */
const ledgerFor = async <W extends WalletLike>(wallet: W, signTransaction: SignTransaction<W>) => {
  await import("./polyfills");
  const [{ Connection }, { DEVNET_RPC }, { OnChainLedger }] = await Promise.all([
    import("@solana/web3.js"),
    import("./config"),
    import("./onchain"),
  ]);
  return new OnChainLedger(new Connection(DEVNET_RPC, "confirmed"), anchorWallet(wallet, signTransaction));
};

/* Creates the business profile if this wallet has none, then the advance. The
   amount and term must match the application, or the server refuses to record
   it. Nothing about the payer or the invoice is sent to the chain. */
export async function putAdvanceOnChain<W extends WalletLike>(
  application: Application,
  advance: Advance,
  wallet: W,
  signTransaction: SignTransaction<W>,
): Promise<Application> {
  const ledger = await ledgerFor(wallet, signTransaction);
  const created = await ledger.requestAdvance({
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
  const ledger = await ledgerFor(wallet, signTransaction);
  const repaid = await ledger.repay(onChainAdvance);
  return settleAdvance(application.id, repaid.signature);
}
