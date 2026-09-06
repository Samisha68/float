import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openStore,passwordHash} from './store.mjs';
import {createInvite,inviteHash} from './invites.mjs';
import {createApp} from './index.mjs';
const origin='http://localhost:5173';
async function fixture(t) {
 const db=openStore(':memory:');
 const invite=createInvite(db,{uses:10});
 const identities={alice:{id:'did:privy:alice',linkedAccounts:[{type:'wallet',chainType:'solana',address:'wallet-alice'}]},bob:{id:'did:privy:bob',linkedAccounts:[{type:'wallet',chainType:'solana',address:'wallet-bob'}]},noWallet:{id:'did:privy:empty',linkedAccounts:[]}};
 const server=createApp({db,origin,verifyIdentity:async token=>{if(!identities[token])throw new Error('Invalid or expired token');return identities[token]}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{await new Promise(r=>server.close(r));db.close()});
 const request=async(path,body,cookie='')=>{const res=await fetch(`http://127.0.0.1:${server.address().port}/api${path}`,{method:body===undefined?'GET':'POST',headers:{origin,cookie,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(path==='/privy'?{inviteCode:invite.code,...body}:body)});return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]}};
 return {db,request,invite};
}
test('Privy rejects invalid tokens and wallets supplied only by the client',async t=>{
 const {request}=await fixture(t);
 assert.equal((await request('/privy',{accessToken:'forged',wallet:'wallet-alice'})).status,401);
 assert.equal((await request('/privy',{accessToken:'noWallet',wallet:'wallet-alice'})).status,403);
 assert.equal((await request('/applications')).status,401);
 assert.equal((await request('/register',{email:'x@example.test',password:'test-password-long',name:'Test'})).status,403);
});
test('Verified identities are stable, isolated, and cannot grant themselves operator access',async t=>{
 const {db,request}=await fixture(t);
 const a=await request('/privy',{accessToken:'alice',role:'operator'});
 assert.equal(a.status,200);assert.equal(a.data.user.role,'borrower');assert.equal(a.data.user.wallet,'wallet-alice');
 assert.equal((await request('/applications',{},a.cookie)).status,400);
 const profile=await request('/profile',{name:'Alice Business'},a.cookie);assert.equal(profile.data.user.name,'Alice Business');
 const again=await request('/privy',{accessToken:'alice'});assert.equal(again.data.user.id,a.data.user.id);assert.equal(again.data.user.name,'Alice Business');
 const b=await request('/privy',{accessToken:'bob'});assert.notEqual(b.data.user.id,a.data.user.id);
 assert.equal(db.prepare('SELECT COUNT(*) AS count FROM privy_identities').get().count,2);
 await request('/logout',{},again.cookie);assert.equal((await request('/session',undefined,again.cookie)).data.user,null);
});
test('Legacy sessions cannot bypass wallet onboarding',async t=>{
 const {db,request}=await fixture(t);
 db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run('legacy','legacy@example.test','Legacy',passwordHash('test-password-long'),'borrower');
 const {createHash}=await import('node:crypto');
 db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update('oldtoken').digest('hex'),'legacy',Date.now()+60000);
 assert.equal((await request('/applications',undefined,'float_session=oldtoken')).status,401);
});

test('Invites block direct signup, expire, are single-use, and existing identities can return',async t=>{
 const {db,request}=await fixture(t);
 const one=createInvite(db);
 const before=db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
 for (const code of ['', 'made-up']) {
   const denied=await request('/privy',{accessToken:'alice',inviteCode:code});
   assert.equal(denied.status,403);assert.equal(denied.data.code,'INVITE_REQUIRED');assert.equal(denied.cookie,undefined);
 }
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n,before);
 db.prepare('UPDATE invites SET expires=? WHERE hash=?').run(Date.now()-1,inviteHash(one.code));
 assert.equal((await request('/privy',{accessToken:'alice',inviteCode:one.code})).status,403);
 const valid=createInvite(db);
 const accepted=await request('/privy',{accessToken:'alice',inviteCode:`  ${valid.code.toLowerCase()}  `});
 assert.equal(accepted.status,200);
 assert.equal(db.prepare('SELECT remaining FROM invites WHERE hash=?').get(inviteHash(valid.code)).remaining,0);
 assert.equal((await request('/privy',{accessToken:'bob',inviteCode:valid.code})).status,403);
 const returning=await request('/privy',{accessToken:'alice',inviteCode:''});
 assert.equal(returning.status,200);assert.equal(returning.data.user.id,accepted.data.user.id);
});
test('Invalid identities do not consume invitations and concurrent claims cannot reuse one',async t=>{
 const {db,request}=await fixture(t);const invite=createInvite(db);
 assert.equal((await request('/privy',{accessToken:'forged',inviteCode:invite.code})).status,401);
 assert.equal(db.prepare('SELECT remaining FROM invites WHERE hash=?').get(inviteHash(invite.code)).remaining,1);
 const results=await Promise.all(['alice','bob'].map(accessToken=>request('/privy',{accessToken,inviteCode:invite.code})));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,403]);
});
