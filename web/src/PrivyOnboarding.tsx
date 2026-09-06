import './lib/polyfills';
import { useEffect, useState, type ReactNode } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { toSolanaWalletConnectors, useWallets, useCreateWallet } from '@privy-io/react-auth/solana';
import { api, ApiError, type User } from './lib/api';

import {InviteForm} from './InviteForm';
import {Welcome} from './Welcome';
const appId = (import.meta as ImportMeta & {env: Record<string,string>}).env.VITE_PRIVY_APP_ID;
export default function Onboarding({children}:{children:(user:User,onLogout:()=>Promise<void>)=>ReactNode}) {
  if (!appId) return <Welcome unavailable/>;
  return <PrivyProvider appId={appId} config={{loginMethods:['email','google','wallet'], appearance:{theme:'light',accentColor:'#000000',logo:'/float-favicon.svg',walletChainType:'solana-only'}, embeddedWallets:{solana:{createOnLogin:'users-without-wallets'}}, externalWallets:{solana:{connectors:toSolanaWalletConnectors()}}}}><IdentityGate>{children}</IdentityGate></PrivyProvider>;
}
function IdentityGate({children}:{children:(user:User,onLogout:()=>Promise<void>)=>ReactNode}) {
  const {ready,authenticated,user,login,logout,getAccessToken} = usePrivy();
  const {wallets,ready:walletsReady} = useWallets();
  const {createWallet} = useCreateWallet();
  const [account,setAccount] = useState<User|null>(null);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [retry,setRetry] = useState(0);
  const [needsInvite,setNeedsInvite] = useState(false);
  useEffect(()=>{
    setAccount(null); setError(''); setNeedsInvite(false);
    if (!ready || !authenticated || !walletsReady || !wallets.length) return;
    let cancelled=false;
    getAccessToken().then(accessToken=>api<{user:User}>('/privy',{accessToken})).then(result=>{if(!cancelled)setAccount(result.user)}).catch(e=>{if(!cancelled){if(e instanceof ApiError && e.code==='INVITE_REQUIRED')setNeedsInvite(true);else setError(e.message)}});
    return ()=>{cancelled=true};
  },[ready,authenticated,user?.id,walletsReady,wallets[0]?.address,retry]);
  const signOut = async()=>{try {await api('/logout',{});} catch { /* Privy logout still clears browser authentication. */ } finally {setAccount(null);await logout();}};
  if (!ready || !authenticated) return <Welcome ready={ready} onStart={()=>login()}/>;
  if (account?.name) return children(account,signOut);
  return <div className="onboarding-shell"><a className="onboarding-brand" href="/"><img src="/float-favicon.svg" alt="Float"/></a><main className="onboarding-card">
    <ol className="onboarding-steps" aria-label="Account setup progress"><li data-done="true">✓ Signed in</li><li aria-current={!account&&!needsInvite?"step":undefined}>{account||needsInvite?"✓":"02"} Wallet</li><li aria-current={needsInvite?"step":undefined}>{account?"✓":"03"} Invite</li><li aria-current={account?"step":undefined}>04 Business</li></ol>
    <p className="eyebrow">{needsInvite ? 'EARLY ACCESS · YOUR INVITATION' : !account ? 'YOUR WALLET' : 'YOUR BUSINESS'}</p>
    <h1>{needsInvite ? 'A space reserved for you.' : !account ? 'Your workspace is taking shape.' : 'What’s your business called?'}</h1>
    <p>{needsInvite ? 'Enter the invitation code shared by the Float team to unlock your business workspace.' : !account ? 'Your Solana wallet is required to continue. It connects your Float account to your funding journey.' : 'Let’s make this space yours. Add your registered business name to open your dashboard.'}</p>
    {!walletsReady && <p role="status">Loading your wallet…</p>}
    {walletsReady && !wallets.length && <button className="primary" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await createWallet();setRetry(n=>n+1)}catch(e){setError(e instanceof Error?e.message:'Wallet setup failed. Please retry.')}finally{setBusy(false)}}}>{busy?'Creating wallet…':'Create my wallet →'}</button>}
    {wallets.length>0 && !account && !needsInvite && !error && <p role="status">Wallet ready. Opening your account…</p>}
    {needsInvite && <InviteForm onRedeem={async inviteCode=>{
      const accessToken=await getAccessToken();
      const result=await api<{user:User}>('/privy',{accessToken,inviteCode});
      setAccount(result.user);setNeedsInvite(false);
    }}/>}
    {account && <form onSubmit={async e=>{e.preventDefault();const name=new FormData(e.currentTarget).get('name');setBusy(true);setError('');try{const result=await api<{user:User}>('/profile',{name});setAccount({...account,...result.user})}catch(e){setError(e instanceof Error?e.message:'Please retry.')}finally{setBusy(false)}}}><label>Business name<input name="name" autoComplete="organization" maxLength={200} required autoFocus placeholder="e.g. Borneo Supply Co."/></label><button className="primary" disabled={busy}>{busy?'Saving…':'Open my dashboard →'}</button></form>}
    {error && <div role="alert"><p>{error}</p>{!needsInvite && <button className="secondary" onClick={()=>setRetry(n=>n+1)}>Try again</button>}</div>}
    <button className="text-button" onClick={()=>void signOut()}>Sign out</button>
  </main></div>;
}
