import {lazy,Suspense,type ReactNode} from 'react';
import {Welcome} from './Welcome';
import type {User} from './lib/api';
const PrivyOnboarding=lazy(()=>import('./PrivyOnboarding'));
const appId=(import.meta as ImportMeta & {env:Record<string,string>}).env.VITE_PRIVY_APP_ID;
export default function Onboarding({children}:{children:(user:User,onLogout:()=>Promise<void>)=>ReactNode}) {
  if(!appId) return <Welcome unavailable/>;
  return <Suspense fallback={<Welcome ready={false}/>}><PrivyOnboarding>{children}</PrivyOnboarding></Suspense>;
}
