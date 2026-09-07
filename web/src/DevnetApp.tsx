import "./lib/polyfills";
import { useEffect, useMemo, useState } from "react";
import {
  ConnectionProvider,
  useAnchorWallet,
  useConnection,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { DEVNET_RPC } from "./lib/config";
import { OnChainLedger } from "./lib/onchain";
import { chainError } from "./lib/errors";
import DemoApp from "./DemoApp";
export default function DevnetApp() {
  const wallets = useMemo(() => [], []);
  return (
    <ConnectionProvider endpoint={DEVNET_RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <DevnetWorkspace />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
function DevnetWorkspace() {
  const wallet = useAnchorWallet(),
    { connection } = useConnection();
  const ledger = useMemo(
    () => (wallet ? new OnChainLedger(connection, wallet) : null),
    [connection, wallet],
  );
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setStatus("Checking the deployed program…");
    if (ledger)
      ledger
        .checkDeployment()
        .then(() => {
          if (!cancelled) {
            setReady(true);
            setStatus("");
          }
        })
        .catch((e) => {
          if (!cancelled) setStatus(chainError(e));
        });
    return () => {
      cancelled = true;
    };
  }, [ledger]);
  return (
    <>
      <div className="devnet-toolbar">
        <a href="/">← Application workspace</a>
        <span>Standalone devnet test · test wallets only</span>
        <WalletMultiButton />
      </div>
      {ledger && ready ? (
        <DemoApp key={wallet!.publicKey.toBase58()} providedLedger={ledger} />
      ) : (
        <main className="app-main">
          <h1 className="display text-3xl">Test the Solana flow</h1>
          <p className="mt-4">
            {wallet
              ? status
              : "Connect a devnet test wallet to request, disburse, and repay test USDC."}
          </p>
          <p className="mt-4">
            This test flow is separate from saved applications. It uses a
            generic business label and does not publish invoice documents or
            company names.
          </p>
          <a className="text-button" href="?mode=demo">
            Use the offline demo →
          </a>
        </main>
      )}
    </>
  );
}
