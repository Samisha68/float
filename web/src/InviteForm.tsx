import {useRef, useState} from 'react';

export function InviteForm({onRedeem}: {onRedeem:(code:string)=>Promise<void>}) {
  const [code,setCode]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const lock=useRef(false);
  return <form onSubmit={async event=>{
    event.preventDefault();
    if(lock.current)return;
    lock.current=true;setBusy(true);setError('');
    try {await onRedeem(code.trim());}
    catch(error){setError(error instanceof Error?error.message:'Please try again.');}
    finally{lock.current=false;setBusy(false);}
  }}>
    <label>Invitation code<input name="inviteCode" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={code} onChange={e=>setCode(e.target.value)} maxLength={100} required autoFocus placeholder="FLOAT-…" aria-describedby={error?'invite-help invite-error':'invite-help'} aria-invalid={!!error} disabled={busy}/></label>
    <p id="invite-help" className="invite-help">Your invitation opens early access. It does not guarantee funding.</p>
    {error && <p id="invite-error" role="alert">{error}</p>}
    <button className="primary" disabled={busy || !code.trim()}>{busy?'Checking invitation…':'Unlock my workspace →'}</button>
  </form>;
}
