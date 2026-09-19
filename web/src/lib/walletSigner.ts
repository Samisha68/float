/* A Privy embedded wallet, presented as the wallet interface Anchor expects.

   The borrower signs their own instructions: `register_business`,
   `request_advance` and `repay_advance` are all signed by the business
   authority, so Float never holds signing power over a borrower's wallet.
   Privy signs raw bytes, so each transaction is serialised, handed over, and
   rebuilt from what comes back. */

import { Transaction, VersionedTransaction, PublicKey } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";

/* Generic over the wallet object so the caller's own wallet type flows through
   to its signer, rather than being widened and cast back. */
export type WalletLike = { address: string };
export type SignTransaction<W extends WalletLike> = (input: {
  transaction: Uint8Array;
  wallet: W;
}) => Promise<{ signedTransaction: Uint8Array }>;

const bytesOf = (transaction: Transaction | VersionedTransaction) =>
  transaction instanceof VersionedTransaction
    ? transaction.serialize()
    : new Uint8Array(transaction.serialize({ requireAllSignatures: false, verifySignatures: false }));

const rebuild = (original: Transaction | VersionedTransaction, signed: Uint8Array) =>
  original instanceof VersionedTransaction
    ? VersionedTransaction.deserialize(signed)
    : Transaction.from(signed);

export function anchorWallet<W extends WalletLike>(wallet: W, signTransaction: SignTransaction<W>): AnchorWallet {
  const sign = async <T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> => {
    const { signedTransaction } = await signTransaction({ transaction: bytesOf(transaction), wallet });
    return rebuild(transaction, signedTransaction) as T;
  };
  return {
    publicKey: new PublicKey(wallet.address),
    signTransaction: sign,
    signAllTransactions: async (transactions) => {
      /* Signed one at a time: Privy prompts per transaction, and the flows here
         never batch. */
      const signed = [];
      for (const transaction of transactions) signed.push(await sign(transaction));
      return signed;
    },
  };
}
