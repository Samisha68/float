import type { Application } from './lib/api';
import { usd, shortDate } from './lib/domain';

export function DashboardOverview({ name, items, onApply, onSelect }: {
  name: string; items: Application[]; onApply: () => void; onSelect?: (id: string) => void;
}) {
  const waiting = items.filter(a => ['Requested', 'NeedsInformation', 'Offered', 'Accepted'].includes(a.status));
  const active = items.filter(a => a.status === 'Active');
  const repaid = items.filter(a => a.status === 'Repaid');
  const attention = items.find(a => a.status === 'NeedsInformation') ?? items.find(a => a.status === 'Offered');
  const nextDue = [...active].filter(a => a.dueAt).sort((a, b) => a.dueAt! - b.dueAt!)[0];
  const title = attention ? attention.status === 'Offered' ? 'Your offer is ready.' : 'A few details are missing.'
    : nextDue ? `Next repayment · ${shortDate(nextDue.dueAt!)}` : items.length ? 'You’re up to date.' : 'Your first invoice starts here.';
  const next = () => attention && onSelect ? onSelect(attention.id) : nextDue && onSelect ? onSelect(nextDue.id) : onApply();
  return <section className="borrower-overview" aria-label={`${name} dashboard`}>
    <div className="borrower-figures">
      <div><span>In progress</span><strong>{waiting.length}</strong></div>
      <div><span>Outstanding · simulated</span><strong>{usd(active.reduce((sum, a) => sum + a.totalDue, 0))}<small>USDC</small></strong></div>
      <div><span>Repaid advances</span><strong>{repaid.length}</strong></div>
    </div>
    <div className="borrower-next">
      <span aria-hidden>↳</span><h2>{title}</h2>
      <button onClick={next}>{attention ? 'Open application' : nextDue ? 'View repayment' : items.length ? 'New application' : 'Add an invoice'} <span aria-hidden>↗</span></button>
    </div>
    {!items.length && <details className="borrower-help"><summary>What will I need?</summary><p>An unpaid customer invoice, its due date, and the amount you’d like to request. You’ll review everything before submitting.</p></details>}
  </section>;
}
