import { useEffect, useState } from 'react';
import type { DashboardSummary, HistoryPage, SavedScan } from '../../shared/types';
import { ApiError, errorMessage, request } from './api';
import Report, { dateLabel, verdictLabel } from './Report';

export default function History({ csrf, onSessionExpired }: { csrf: string; onSessionExpired: () => void }) {
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<HistoryPage | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [selected, setSelected] = useState<SavedScan | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  function handleError(exc: unknown) {
    if (exc instanceof ApiError && (exc.status === 401 || exc.status === 403)) onSessionExpired();
    setError(errorMessage(exc));
  }
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    Promise.all([
      request<HistoryPage>(`/scans?page=${page}&limit=10`, { signal: controller.signal }),
      request<DashboardSummary>('/dashboard/summary', { signal: controller.signal }),
    ]).then(([items, counts]) => {
      if (page > 1 && items.items.length === 0) { setPage(Math.max(1, items.pages)); return; }
      setHistory(items); setSummary(counts);
    }).catch(exc => { if (!controller.signal.aborted) handleError(exc); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, revision]);

  async function open(id: string) {
    setOpening(true); setError(''); setSelected(null);
    try { setSelected(await request<SavedScan>(`/scans/${id}`)); }
    catch (exc) { handleError(exc); }
    finally { setOpening(false); }
  }
  async function remove() {
    if (!confirm) return;
    setDeleting(true); setError('');
    try {
      await request(confirm === 'all' ? '/scans' : `/scans/${confirm}`, { method: 'DELETE', csrf });
      if (confirm === 'all' || selected?.scanId === confirm) setSelected(null);
      setMessage(confirm === 'all' ? 'Your saved history was deleted.' : 'The saved report was deleted.');
      setConfirm(null); setRevision(value => value + 1);
    } catch (exc) { handleError(exc); }
    finally { setDeleting(false); }
  }

  return <>
    <div className="page-title"><h1>Your scans</h1><p>Private reports are retained for 30 days. Original URLs and hostnames are not saved.</p></div>
    {summary && <dl className="summary-counts" aria-label="Your scan summary">
      <div><dt>Total scans</dt><dd>{summary.total}</dd></div><div><dt>Higher risk</dt><dd>{summary.high}</dd></div>
      <div><dt>Review suggested</dt><dd>{summary.review}</dd></div><div><dt>Lower risk</dt><dd>{summary.low}</dd></div>
    </dl>}
    {error && <p className="notice error" role="alert">{error} <button className="link-button" onClick={() => setRevision(value => value + 1)}>Retry</button></p>}
    {message && <p className="notice" role="status">{message}</p>}
    <section className="panel" aria-labelledby="history-title" aria-busy={loading || deleting}>
      <div className="section-heading"><h2 id="history-title">Saved reports</h2><button className="danger secondary" disabled={!history?.total || deleting || opening} onClick={() => { setConfirm('all'); setMessage(''); }}>Delete all history</button></div>
      {confirm && <div className="confirmation" role="group" aria-label="Confirm history deletion"><p><strong>{confirm === 'all' ? 'Delete all your saved reports?' : 'Delete this saved report?'}</strong> This cannot be undone.</p><div className="button-row"><button className="secondary" disabled={deleting} onClick={() => setConfirm(null)}>Cancel</button><button className="danger-button" disabled={deleting} onClick={remove}>{deleting ? 'Deleting…' : 'Delete permanently'}</button></div></div>}
      {loading ? <p role="status" className="muted">Loading your history…</p> : history?.items.length ? <>
        <div className="table-scroll"><table className="history-table"><caption className="sr-only">Your saved scan reports</caption><thead><tr><th scope="col">Scanned</th><th scope="col">Result</th><th scope="col">Score</th><th scope="col">Indicators</th><th scope="col">Actions</th></tr></thead><tbody>{history.items.map(item => <tr key={item.id}>
          <td>{dateLabel(item.createdAt)}</td><td><span className={`verdict-text ${item.verdict}`}>{verdictLabel(item.verdict)}</span>{item.mode === 'rules_only' && <span className="cell-note">Rules only</span>}</td><td>{Math.round(item.score * 100)}/100</td><td>{item.ruleCount}</td><td><div className="table-actions"><button className="link-button" disabled={opening || deleting} onClick={() => open(item.id)} aria-label={`Open report from ${dateLabel(item.createdAt)}`}>View report</button><button className="link-button danger" disabled={opening || deleting} onClick={() => { setConfirm(item.id); setMessage(''); }} aria-label={`Delete report from ${dateLabel(item.createdAt)}`}>Delete</button></div></td>
        </tr>)}</tbody></table></div>
        <div className="pagination"><span>{history.total} saved {history.total === 1 ? 'report' : 'reports'} · Page {page} of {history.pages}</span><div className="button-row"><button className="secondary" disabled={page <= 1 || deleting} onClick={() => setPage(value => value - 1)}>Previous</button><button className="secondary" disabled={page >= history.pages || deleting} onClick={() => setPage(value => value + 1)}>Next</button></div></div>
      </> : !error && <p className="empty-message">No saved reports yet. Check a link to create your first report.</p>}
      {summary && summary.partial > 0 && <p className="muted small">{summary.partial} {summary.partial === 1 ? 'report used' : 'reports used'} rules only because a trained model was unavailable.</p>}
    </section>
    {opening && <p role="status" className="notice">Opening report…</p>}
    {selected && <Report scan={selected} fromHistory />}
  </>;
}
