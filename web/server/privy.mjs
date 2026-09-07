import { PrivyClient } from '@privy-io/node';
let client;
export async function verifyPrivyIdentity(token) {
  const appId = process.env.PRIVY_APP_ID;
  const secret = process.env.PRIVY_APP_SECRET;
  if (!appId || !secret) throw Object.assign(new Error('Sign-in is not available yet. Please try again later.'), {status:503});
  client ??= new PrivyClient({appId, appSecret:secret});
  const claims = await client.utils().auth().verifyAccessToken(token);
  const identity = await client.users()._get(claims.user_id);
  if (identity.id !== claims.user_id) throw new Error('Identity mismatch');
  return {id:identity.id, linkedAccounts:identity.linked_accounts.map(a=>({...a,chainType:a.chain_type}))};
}
