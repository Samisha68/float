import { createHash, randomBytes } from 'node:crypto';
export const inviteHash = code => createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
export function createInvite(db, {uses=1, days=7}={}) {
  if (!Number.isInteger(uses) || uses<1 || uses>1000 || !Number.isInteger(days) || days<1 || days>90) throw new Error('Use 1–1000 redemptions and 1–90 days.');
  const code=`FLOAT-${randomBytes(12).toString('hex').toUpperCase()}`;
  const expires=Date.now()+days*86400000;
  db.prepare('INSERT INTO invites (hash,remaining,expires) VALUES(?,?,?)').run(inviteHash(code),uses,expires);
  return {code,uses,expires};
}
export function redeemInvite(db,code) {
  if (typeof code !== 'string' || code.length>100 || !code.trim()) return false;
  return db.prepare('UPDATE invites SET remaining=remaining-1 WHERE hash=? AND remaining>0 AND expires>?').run(inviteHash(code),Date.now()).changes===1;
}
