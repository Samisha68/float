import {useRef,useState} from 'react';
import {invoiceFile} from './lib/api';
export default function InvoiceApplication({busy,onCancel,onSubmit}:{busy:boolean;onCancel:()=>void;onSubmit:(data:unknown)=>Promise<void>}) {
  const [step,setStep]=useState(0);
  const [draft,setDraft]=useState({payer:'',invoiceNumber:'',invoiceDue:'',expectedInflow:'',amount:'',termDays:'30'});
  const [file,setFile]=useState<File|null>(null);
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const lock=useRef(false);
  const heading=useRef<HTMLHeadingElement>(null);
  const move=(next:number)=>{setStep(next);setError('');requestAnimationFrame(()=>{heading.current?.focus();heading.current?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})})};
  const field=(name:keyof typeof draft)=>({name,value:draft[name],onChange:(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setDraft({...draft,[name]:e.target.value})});
  const send=async()=>{if(lock.current||!file)return;lock.current=true;setSaving(true);setError('');try {await onSubmit({...draft,amount:Number(draft.amount),expectedInflow:Number(draft.expectedInflow),termDays:Number(draft.termDays),document:await invoiceFile(file)})}catch(e){setError(e instanceof Error?e.message:'Please try again.')}finally{lock.current=false;setSaving(false)}};
  return <section className="invoice-wizard"><button className="text-button" onClick={onCancel} disabled={busy||saving}>← Workspace</button>
    <ol className="wizard-progress" aria-label="Application progress">{['Your invoice','Your advance','Review'].map((name,i)=><li key={name} aria-current={step===i?'step':undefined}><span>{i<step?'✓':i+1}</span>{name}</li>)}</ol>
    <h2 ref={heading} tabIndex={-1}>{['Start with your invoice.','How much would help?','Everything look right?'][step]}</h2>
    <p className="wizard-description">{['Tell us who owes you and attach the invoice.','Choose an amount within your invoice value, up to 5,000 USDC.','Check your details before sending them to Float for review.'][step]}</p>
    <form onSubmit={e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));setDraft(previous=>({...previous,...values}));if(step===0){if(!file){setError('Attach your invoice to continue.');return}if(file.size>5*1024*1024){setError('Choose an invoice smaller than 5 MB.');return}move(1)}else if(step===1){if(Number(draft.amount)>Number(draft.expectedInflow)){setError('Your advance cannot exceed the invoice amount.');return}move(2)}else void send()}}>
      {step===0 && <><label className="upload-area"><strong>{file?file.name:'Choose your invoice'}</strong><span>PDF, PNG or JPEG · up to 5 MB</span><input type="file" accept="application/pdf,image/png,image/jpeg" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><div className="form-grid"><label>Customer who owes you<input {...field('payer')} maxLength={200} required placeholder="Customer’s business name"/></label><label>Invoice reference<input {...field('invoiceNumber')} maxLength={100} required placeholder="INV-1042"/></label><label>Invoice amount (USDC equivalent)<input {...field('expectedInflow')} type="number" min="0.01" max="1000000000" step="0.01" required/></label><label>Invoice due date<input {...field('invoiceDue')} type="date" required/></label></div><p className="wizard-help">Your document is private to your account and Float’s review team.</p></>}
      {step===1 && <div className="advance-fields"><label>Amount requested (USDC)<input {...field('amount')} type="number" min="0.01" max={Math.min(5000,Number(draft.expectedInflow))} step="0.01" required placeholder="2,500"/></label><label>Repayment term<select {...field('termDays')}><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option><option value="60">60 days</option></select></label><p>The term starts when funding is disbursed. You’ll see any fee and the full repayment amount in your offer.</p></div>}
      {step===2 && <><dl className="application-review">{[['Customer',draft.payer],['Invoice',draft.invoiceNumber],['Document',file?.name],['Invoice value',`${draft.expectedInflow} USDC`],['Invoice due',draft.invoiceDue],['Your request',`${draft.amount} USDC`],['Repayment term',`${draft.termDays} days`]].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p className="review-explainer">Next: Float checks your invoice and may ask for more information. Applying does not guarantee an offer. Funding remains simulated during early access.</p></>}
      {error && <p role="alert">{error}</p>}
      <div className="wizard-actions">{step>0 && <button className="secondary" type="button" disabled={saving||busy} onClick={()=>move(step-1)}>Back</button>}<button className="primary" disabled={saving||busy}>{saving||busy?'Submitting…':step===2?'Submit for review →':'Continue →'}</button></div>
    </form>
  </section>;
}
