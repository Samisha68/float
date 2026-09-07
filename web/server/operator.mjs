import { openStore } from "./store.mjs";
const email = process.argv[2]?.trim();
if (!email) {
  console.error("Usage: npm run operator -- did:privy:YOUR_USER_ID");
  process.exit(1);
}
const db = openStore();
const result = db
  .prepare("UPDATE users SET role='operator' WHERE id=(SELECT user_id FROM privy_identities WHERE subject=?)")
  .run(email);
console.log(
  result.changes
    ? "Account now has operator access. Refresh the app."
    : "Account not found. Create an account in the app first.",
);
db.close();
