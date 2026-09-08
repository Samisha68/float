# Float working-capital MVP

A local, persistent pilot workspace with a separate offline demo and standalone Solana devnet test flow. Funding in the pilot workspace is simulated. No real funds move and no financing is promised.

## Run locally

Requires Node.js 24 (uses built-in SQLite).

```sh
cd web
npm install
npm run dev
```

Open http://localhost:5173. The command starts both Vite and the API on port 3001.
## Privy onboarding setup

Copy `.env.example` to `.env.local`. Set `VITE_PRIVY_APP_ID` and `PRIVY_APP_ID` to the same public App ID. Put `PRIVY_APP_SECRET` in `.env.local` on the server only; never use a `VITE_` prefix for secrets or paste the secret into chat.

In the Privy dashboard, enable email, Google, and Solana wallet login; enable embedded Solana wallets; and allow `http://localhost:5173` (plus `http://127.0.0.1:5173` if used). Restart `npm run dev` after changing environment variables. Configure your deployed HTTPS origin separately before publishing.

The new flow is sign-in → required Solana wallet → invitation (new users only) → business name → invoice → requested advance → review. Users without wallets can create one through Privy. The backend verifies Privy access tokens and looks up linked wallets before issuing a Float session. A wallet address supplied by the browser is never accepted as proof.

Without a public App ID the new landing page is available, but sign-in stays unavailable. The sample demo remains separate and does not create saved applications or reputation.

Existing password accounts and their records are preserved, but password login is disabled. Accounts are not automatically merged by email. Any migration must explicitly verify ownership. New Privy accounts are always borrowers.

To grant operator access after the intended operator has signed in, use their exact Privy user ID from the Privy dashboard:

```sh
npm run operator -- did:privy:YOUR_USER_ID
```

Refresh the app after granting access. This is a local administrative command, never a public API.

## Working flow

1. Business submits an invoice (PDF/PNG/JPEG, up to 5 MB), amount, due date, and financing request.
2. Operator downloads the invoice, requests more information, rejects the application with a reason, or issues a test offer.
3. Borrower responds to information requests or accepts/declines the offer.
4. Operator records a simulated disbursement only after acceptance.
5. Borrower records a simulated repayment. Both roles see the full application history.

Accounts, documents, sessions, and applications persist in `web/data/float.sqlite`. The directory is excluded from Git. Documents are served only to their owner or an operator. Back up this directory before moving the app. It contains private information; do not serve it as a static directory. The current local single-instance setup is not a public production lending service.

## Demo and devnet

- `/?mode=demo`: original in-memory sample demonstration. No transactions; refresh resets it.
- `/?mode=devnet`: wallet-based, standalone devnet test using `OnChainLedger`. This is separate from saved applications. Business labels are generic and evidence references are zeroed test placeholders. No company names or invoice files are sent to chain by this client.
- Devnet was redeployed 8 September 2026. The deployed binary matches `program/` byte for byte (sha256 `a848c694d61574eca32a22bb3b3a696e45aa4c48f70fb6c5110719b1e536620a`), so the client's compatibility check passes and the wallet test flow is open. Matching account size alone is not proof of matching code; compare the dumped binary before funding tests.
- Existing program backup: `data/backups/float-devnet-20260906.so` (ignored by Git).
- Approval requires the treasury's underwriter wallet; repayment requires the borrower's wallet. Borrower repayment needs principal **plus fee** in test USDC and devnet SOL for fees.

The private application workflow and on-chain tests are deliberately separate until server-side transaction reconciliation and application-to-wallet binding are implemented. Never mark an application paid based only on a client-submitted signature.

## Verification

```sh
npm test
npm run build
```

API tests cover private document access, borrower/operator permissions, persistent storage, invalid requests, duplicate invoices, acceptance before funding, information requests, rejection/decline, and duplicate state transitions.

## Deployment configuration

The application has **not** been published. `npm run build` creates the frontend. `npm start` serves the frontend and API together from the `web` directory.

For a future deployment, use a persistent disk and HTTPS reverse proxy, and configure:

- `NODE_ENV=production` (secure cookies)
- `FLOAT_ORIGIN=https://your-exact-app-origin` (required; same-origin mutations)
- `FLOAT_DB=/persistent/private/path/float.sqlite`
- `PORT` (default 3001) and `HOST` (default 127.0.0.1)

No email sender, funding partner, mainnet funds, KYB provider, invoice verification integration, or automated collection service is connected. These are operational dependencies, not features implied by the prototype.

### Wallet-first verification (6 September 2026)

Eight API tests pass, including Privy-bound identity isolation, client-supplied wallet rejection, and legacy session rejection. Privy tests inject a verifier to exercise local authorization; they do not certify a live Privy login. Browser checks cover the new landing page at mobile width and the isolated three-step invoice form, including upload, date preservation, Back navigation, review, and submit. Live email/social login and embedded wallet creation require a configured Privy app and remain unverified until credentials are supplied.

## Early-user invitations

New Privy identities need a server-verified invitation before a Float account or session is created. Existing linked users can sign back in without another code. The public interactive dashboard preview never grants account access.

From `web/`, generate a code with `npm run invite`. By default it expires after seven days and admits one user. `npm run invite -- 10 14` creates a code for ten users, valid for fourteen days. Codes are random, case-insensitive, and displayed only when generated; SQLite stores their SHA-256 hashes. Share the output privately. The CLI reads `.env.local`, including `FLOAT_DB`, so use the same database as the API. Redemption and account creation run in one transaction; expired or exhausted invitations cannot create accounts. There is no public code-generation endpoint.

The welcome page uses Anime.js to move the same invoice into its workspace position as the user progresses. The chosen sample amount carries through to the application details. It respects reduced motion, offers keyboard-accessible controls, and uses native dialogs. MotionSites’ TrueEarth composition informed the split scene; the implementation and artwork are original. Sample data is labeled locally, with no full-width preview banner. The signed-in borrower dashboard uses actual saved applications to show next actions, outstanding test repayments, and progress. No preview action saves an application.

Verified 6 September: ten API tests pass, including invitation expiry, reuse, concurrent redemption, rejected identities, and returning users. Desktop/mobile preview navigation and keyboard slider checks pass. Live Privy sign-in and embedded-wallet creation still require credentials and have not been verified end to end.
