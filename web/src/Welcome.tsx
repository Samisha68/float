import { useLayoutEffect, useRef, useState } from 'react';
import { animate, createScope, stagger } from 'animejs';

type Scene = 'welcome' | 'amount' | 'workspace';
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export function Welcome({ onStart, ready = true, unavailable = false }: { onStart?: () => void; ready?: boolean; unavailable?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const invoice = useRef<HTMLElement>(null);
  const previousRect = useRef<DOMRect | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const accessDialog = useRef<HTMLDialogElement>(null);
  const detailsDialog = useRef<HTMLDialogElement>(null);
  const [scene, setScene] = useState<Scene>('welcome');
  const [amount, setAmount] = useState(3000);
  const [section, setSection] = useState<'overview' | 'applications'>('overview');
  const [hasMoved, setHasMoved] = useState(false);
  const workspace = scene === 'workspace';

  useLayoutEffect(() => {
    const before = previousRect.current;
    const scope = createScope({ root, mediaQueries: { reduce: '(prefers-reduced-motion: reduce)' } }).add(self => {
      if (self?.matches.reduce) return;
      if (before && invoice.current) {
        const after = invoice.current.getBoundingClientRect();
        animate(invoice.current, {
          x: [before.left - after.left, 0], y: [before.top - after.top, 0],
          scaleX: [before.width / after.width, 1], scaleY: [before.height / after.height, 1],
          duration: 350, ease: 'out(4)',
        });
      }
      animate('.portal-enter', { opacity: [0, 1], y: [10, 0], duration: 280, delay: stagger(25), ease: 'out(3)' });
      if (root.current?.querySelector('.bridge-line')) animate('.bridge-line', { strokeDashoffset: [1, 0], duration: 350, ease: 'out(3)' });
    });
    previousRect.current = null;
    if (hasMoved) title.current?.focus({ preventScroll: true });
    return () => scope.revert();
  }, [scene, section]);

  const move = (next: Scene) => {
    if (next === scene) return;
    previousRect.current = invoice.current?.getBoundingClientRect() ?? null;
    setHasMoved(true);
    setScene(next);
  };
  const access = () => {
    if (ready && !unavailable && onStart) onStart();
    else accessDialog.current?.showModal();
  };
  const reset = () => { setSection('overview'); move('welcome'); };

  return <div ref={root} className="float-portal">
    <a className="experience-skip" href="#portal-main">Skip to content</a>
    <header className="portal-header">
      <a href="/" aria-label="Float home"><img src="/float-favicon.svg" alt="Float" /></a>
      <span className="portal-header-caption">Room for what’s next.</span>
      <nav aria-label="Main navigation">
        {scene !== 'welcome' && <button className="portal-back" onClick={reset}>← Start again</button>}
        <button className="portal-access" onClick={access}>Use invitation <span aria-hidden>↗</span></button>
      </nav>
    </header>

    <main id="portal-main" className="portal-canvas" data-scene={scene}>
      {!workspace ? <>
        <div className="portal-intro">
          <p className="portal-kicker portal-enter">BUSINESS MOVES. MONEY SHOULD TOO.</p>
          <h1 ref={title} tabIndex={-1} className="portal-enter">{scene === 'welcome' ? <>Between<br/>earned <span>&</span> paid.<br/><span>There’s Float.</span></> : <>A little space.<br/><span>A next move.</span></>}</h1>
          {scene === 'welcome' ? <>
            <p className="portal-description portal-enter">Working capital against your invoices.<br/>For the business you’re building.</p>
            <button className="portal-primary portal-enter" onClick={() => move('amount')}>See it in motion <span aria-hidden>→</span></button>
          </> : <div className="portal-amount portal-enter">
            <label htmlFor="portal-amount">How much would you request?</label>
            <output htmlFor="portal-amount">{money(amount)}</output>
            <input id="portal-amount" type="range" min="500" max="5000" step="100" value={amount} aria-valuetext={`${amount} US dollars`} onChange={e => setAmount(Number(e.target.value))} />
            <div className="portal-range-labels"><span>$500</span><span>$5,000</span></div>
            <button className="portal-primary" onClick={() => move('workspace')}>Bring it into Float <span aria-hidden>→</span></button>
          </div>}
          <div className="portal-pagination" aria-label="Your journey">
            {(['welcome','amount','workspace'] as Scene[]).map((item, index) => <button key={item} aria-label={['Introduction','Choose an amount','Open workspace'][index]} aria-current={scene === item ? 'step' : undefined} onClick={() => move(item)}><span>0{index+1}</span><span>{['An invoice','A possibility','Your space'][index]}</span></button>)}
          </div>
        </div>
        <div className="portal-landscape" aria-hidden="true">
          <div className="portal-horizon" />
          <svg viewBox="0 0 600 700" preserveAspectRatio="none"><defs><linearGradient id="bridge-fade" x1="0" x2="1"><stop offset="0" stopColor="white" stopOpacity=".08"/><stop offset=".6" stopColor="white" stopOpacity=".65"/><stop offset="1" stopColor="white" stopOpacity=".15"/></linearGradient></defs>
            {Array.from({length:12},(_,i)=><path key={i} d={`M ${-130+i*26} 700 C ${60+i*16} ${320-i*4}, ${420-i*14} ${420-i*7}, ${490+i*20} -30`} fill="none" stroke="url(#bridge-fade)" strokeWidth={i===5?2:0.7} />)}
            <path className="bridge-line" pathLength="1" strokeDasharray="1" d="M 0 590 C 200 480, 390 400, 610 70" fill="none" stroke="white" strokeOpacity=".6" strokeWidth="1" />
          </svg>
          <span className="landscape-label label-earned">01 / EARNED</span><span className="landscape-label label-paid">02 / WHAT’S NEXT</span>
          <p className="landscape-caption">Your work is done.<br/>Your next move doesn’t have to wait.</p>
        </div>
      </> : <>
        <aside className="portal-sidebar portal-enter">
          <div className="portal-company"><span>BS</span><div>Borneo Supply<small>Sample workspace</small></div></div>
          <nav aria-label="Workspace navigation"><button aria-current={section==='overview'?'page':undefined} onClick={()=>setSection('overview')}><span aria-hidden>◫</span> Overview</button><button aria-current={section==='applications'?'page':undefined} onClick={()=>setSection('applications')}><span aria-hidden>▤</span> Applications <small>1</small></button></nav>
          <button className="sidebar-invite" onClick={access}>Make it yours <span aria-hidden>↗</span></button>
        </aside>
        <div className="portal-workbench portal-enter">
          <div className="portal-workbench-heading"><div><p className="portal-kicker">{section==='overview'?'YOUR WORKSPACE':'YOUR APPLICATIONS'}</p><h1 ref={title} tabIndex={-1}>{section==='overview'?'A little room to move.':'One step closer.'}</h1></div><button className="portal-primary" aria-label="New application" onClick={access}>New application <span aria-hidden>+</span></button></div>
          <div className="portal-balance"><div><span>Requested</span><strong>{money(amount)}<small>USDC</small></strong></div><div className="portal-balance-status"><span className="portal-dot"/> Draft application</div><button onClick={()=>move('amount')}>Adjust amount ↗</button></div>
          <div className="portal-list-label"><h2>{section==='overview'?'Your next move':'Applications'}</h2><span>01</span></div>
        </div>
      </>}

      <article ref={invoice} className="portal-invoice" aria-label="Sample invoice">
        <div className="portal-invoice-top"><span className="invoice-monogram" aria-hidden>BS</span><span>{workspace?'INV-0042':'INVOICE / 0042'}</span><span className="portal-sample">Sample</span></div>
        <div className="portal-invoice-body"><p>{workspace?'Northwind Logistics':'Borneo Supply Co.'}</p><h2>{workspace?money(amount):'$6,000'}{workspace&&<small> requested</small>}</h2><div className="portal-invoice-meta"><span>{workspace?'Against a $6,000 invoice':'Billed to Northwind Logistics'}</span><span>Due in 30 days</span></div></div>
        {!workspace && <div className="invoice-paper-lines" aria-hidden><span/><span/><span/></div>}
        <div className="portal-invoice-bottom">{workspace ? <><span className="portal-draft">Draft</span><button onClick={()=>detailsDialog.current?.showModal()}>View application <span aria-hidden>↗</span></button></> : <><span>INCOMING PAYMENT</span><strong>$6,000.00</strong></>}</div>
      </article>
      {workspace && <div className="portal-next-action portal-enter"><span aria-hidden>↳</span><p>Ready to bring your own invoice?</p><button onClick={access}>Enter with an invitation →</button></div>}
      {!workspace && <div className="portal-floating-note portal-enter"><span aria-hidden>↗</span><div>{scene==='welcome'?'Money coming in.':'Room to move.'}<strong>{scene==='welcome'?'A new possibility.':`${money(amount)} requested`}</strong></div></div>}
    </main>
    <footer className="portal-footer"><span>Built for the in-between.</span><span>Early access <span aria-hidden>·</span> Funding subject to review</span><button onClick={access}>Have an invitation? ↗</button></footer>

    <dialog ref={accessDialog} className="portal-dialog" aria-labelledby="access-title" onClick={e=>{if(e.target===e.currentTarget)accessDialog.current?.close()}}>
      <button className="portal-dialog-close" aria-label="Close" onClick={()=>accessDialog.current?.close()}>×</button><img src="/float-favicon.svg" alt="Float"/><p className="portal-kicker">EARLY ACCESS</p><h2 id="access-title">Your business.<br/>Your space.</h2><p>{unavailable?'Invitations will open soon. Until then, take a look around.': 'Sign-in is getting ready. Please try again in a moment.'}</p><button className="portal-primary" onClick={()=>{accessDialog.current?.close();move('amount')}}>Explore Float <span aria-hidden>→</span></button>
    </dialog>
    <dialog ref={detailsDialog} className="portal-dialog" aria-labelledby="application-title" onClick={e=>{if(e.target===e.currentTarget)detailsDialog.current?.close()}}>
      <button className="portal-dialog-close" aria-label="Close application" onClick={()=>detailsDialog.current?.close()}>×</button><p className="portal-kicker">SAMPLE APPLICATION / INV-0042</p><h2 id="application-title">{money(amount)}<small> USDC</small></h2><dl><div><dt>Customer</dt><dd>Northwind Logistics</dd></div><div><dt>Invoice value</dt><dd>$6,000</dd></div><div><dt>Payment expected</dt><dd>In 30 days</dd></div><div><dt>Status</dt><dd>Draft</dd></div></dl><p>No offer or funding has been issued.</p><button className="portal-primary" onClick={()=>{detailsDialog.current?.close();access()}}>Start my application <span aria-hidden>↗</span></button>
    </dialog>
  </div>;
}
