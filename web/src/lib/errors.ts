export function chainError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/reject|denied|cancel/i.test(raw))
    return "Signature cancelled. No new transaction was submitted.";
  if (/0x1\b|insufficient/i.test(raw))
    return "Insufficient test funds. Check devnet SOL and USDC; repayment includes the fee.";
  if (/429|rate limit/i.test(raw))
    return "Devnet is busy. Wait a moment, then refresh before trying again.";
  if (/blockhash|timeout|timed out|fetch|network/i.test(raw))
    return "Could not confirm the result. Check your wallet activity and refresh before submitting again.";
  if (/Unauthorized|not authorised/i.test(raw))
    return "Switch to the wallet authorised for this action.";
  if (/custom program error|simulation failed/i.test(raw))
    return "The test transaction was rejected. Check the selected wallet, test funds, and program deployment.";
  return raw;
}
