import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Analysis } from '../../shared/types';

type Session = { user: { email: string } | null; csrfToken: string; expiresAt: string };
type Health = { status: string; model: string };
const example = 'http://review@example.test:8080/account/login/verify';

function Shield({ small = false }: { small?: boolean }) {
  return <svg width={small ? 20 : 28} height={small ? 20 : 28} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 8 3v5c0 5-4 8-8 10-4-2-8-5-8-10V6l8-3Z" stroke="currentColor" strokeWidth="1.7"/><path d="m8.5 12 2.3 2.3 4.8-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

async function request<T>(route: string, method = 'GET', body?: unknown, csrf?: string): Promise<T> {
  const res = await fetch(`/api/v1${route}`, {
    method, credentials: 'same-origin',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? 'The request failed. Please try again.');
  return data as T;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [auth, setAuth] = useState<'login' | 'register' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const resultTitle = useRef<HTMLHeadingElement>(null);
  const urlInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    request<Session>('/auth/session').then(setSession).catch(() => setError('Application unavailable. Check the API and database.'));
    fetch('/health').then(async r => { if (r.ok) setHealth(await r.json()); }).catch(() => {});
  }, []);
  useEffect(() => { if (result) resultTitle.current?.focus(); }, [result]);

  async function submitAuth(e: FormEvent) {
    e.preventDefault();
    if (!session || !auth) return;
    setAuthBusy(true); setAuthError('');
    try {
      setSession(await request<Session>(`/auth/${auth}`, 'POST', { email, password }, session.csrfToken));
      setAuth(null); setPassword(''); setError(''); urlInput.current?.focus();
    } catch (exc) {
      setAuthError(exc instanceof Error ? exc.message : 'Account request failed.');
      request<Session>('/auth/session').then(setSession).catch(() => {});
    }
    finally { setAuthBusy(false); }
  }
  async function logout() {
    if (!session) return;
    try {
      await request('/auth/logout', 'POST', undefined, session.csrfToken);
      setSession(null); setResult(null); setUrl('');
      setSession(await request<Session>('/auth/session'));
    } catch { setError('Sign out failed. Please try again.'); }
  }
  async function scan(e: FormEvent) {
    e.preventDefault();
    if (!session?.user) { setAuth('login'); return; }
    setBusy(true); setError(''); setResult(null);
    try { setResult(await request<Analysis>('/scans', 'POST', { url }, session.csrfToken)); }
    catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Analysis unavailable.');
      request<Session>('/auth/session').then(setSession).catch(() => {});
    } finally { setBusy(false); }
  }

  return <div className="shell">
    <aside className="sidebar">
      <a className="brand" href="#main"><span className="brand-icon"><Shield /></span>Phish<span className="brand-ai">Ai</span></a>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <div className="nav-item active"><Shield small />URL scanner<span className="nav-dot" /></div>
      <a className="nav-item" href="#methodology"><span aria-hidden="true">≡</span>How analysis works</a>
      <div className="sidebar-note"><span className="tiny-tag">LOCAL REVIEW BUILD</span><h3>Look closer.<br/>Stay in control.</h3><p>Your link is analyzed as text. Its destination is never opened.</p><div className="boundary"><span className="dot" />No destination contact</div></div>
      <div className="sidebar-footer">PhishAi / v0.1<span>Built for explainable screening</span></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>URL scanner</strong></div><div className="account">
        {session?.user ? <><span className="account-email">{session.user.email}</span><button className="text-button" onClick={logout}>Sign out</button></> : <><span className="private-label">Private session</span><button className="button small" onClick={() => { setAuth('login'); setAuthError(''); }}>Sign in <span aria-hidden="true">↗</span></button></>}
      </div></header>
      <main id="main">
        <div className="page-heading"><div><div className="eyebrow"><span className="dot" />URL INTELLIGENCE LAB</div><h1>A closer look at your link.</h1><p>Inspect the signals. Understand the risk. Decide your next step.</p></div><span className="release-tag">DEMO RELEASE <span>01</span></span></div>

        {auth && <section className="auth-card" aria-labelledby="auth-title"><div><span className="eyebrow">YOUR PRIVATE WORKSPACE</span><h2 id="auth-title">{auth === 'login' ? 'Welcome back.' : 'Create your account.'}</h2><p>Sign in to use the scanner. Submitted URLs are not saved.</p><button className="text-button" onClick={() => { setAuth(auth === 'login' ? 'register' : 'login'); setAuthError(''); }}>{auth === 'login' ? 'New here? Create an account' : 'Already registered? Sign in'}</button></div><form onSubmit={submitAuth} className="auth-form"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /><label htmlFor="password">Password <span>12–128 characters</span></label><input id="password" type="password" autoComplete={auth === 'login' ? 'current-password' : 'new-password'} required minLength={12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} />{authError && <p className="error" role="alert">{authError}</p>}<div className="auth-actions"><button className="button" disabled={authBusy || !session}>{authBusy ? 'Please wait…' : auth === 'login' ? 'Sign in' : 'Create account'}</button><button type="button" className="text-button" onClick={() => { setAuth(null); setPassword(''); }}>Cancel</button></div></form></section>}

        <div className="main-grid"><div className="scan-column">
          <section className="card scanner" aria-labelledby="scan-title"><div className="card-header"><span className="section-number">01 / SCAN</span><span className="pill"><span className="dot" />String analysis only</span></div><h2 id="scan-title">Where does this link stand?</h2><p className="muted">Paste an HTTP or HTTPS URL to inspect its lexical risk signals.</p><form onSubmit={scan} aria-busy={busy}><label htmlFor="url">URL to inspect</label><div className="url-field"><span aria-hidden="true">↗</span><input ref={urlInput} id="url" type="text" inputMode="url" autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="https://example.com/path" required maxLength={4096} value={url} onChange={e => setUrl(e.target.value)} aria-describedby="url-help" /></div><div className="form-bottom"><span id="url-help">URL text only · Up to 4,096 characters</span><button className="button scan-button" disabled={busy || !session}>{busy ? <><span className="spinner" />Analyzing…</> : <>{session?.user ? 'Analyze URL' : 'Sign in to analyze'}<span aria-hidden="true">↗</span></>}</button></div></form><div className="examples"><span>Try a synthetic example</span><button onClick={() => { setUrl('https://example.com/docs'); urlInput.current?.focus(); }}>Simple URL</button><button onClick={() => { setUrl(example); urlInput.current?.focus(); }}>Multiple signals</button></div></section>

          {error && <div className="error error-banner" role="alert">{error}</div>}
          {busy && <div className="card progress" role="status">Extracting URL features and evaluating available branches…</div>}
          {result ? <section className={`card result verdict-${result.verdict}`} aria-labelledby="result-title"><div className="card-header"><span className="section-number">02 / ANALYSIS</span><span className="pill">{result.mode === 'rules_only' ? 'Rules only · model unavailable' : result.mode === 'hybrid' ? 'Validated hybrid policy' : 'URL-feature model'}</span></div><div className="verdict-row"><div><div className="eyebrow">SCREENING RESULT</div><h2 id="result-title" tabIndex={-1}>{result.verdict === 'high' ? 'Elevated risk signals' : result.verdict === 'review' ? 'Take a closer look' : 'Few risk signals detected'}</h2><p className="muted">{result.verdict === 'low' ? 'A low result does not establish that a destination is safe.' : 'Treat this link with caution. Review it before taking action.'}</p></div><div className="score"><strong>{Math.round(result.score * 100)}</strong><span>/ 100 risk score</span></div></div><div className="score-track"><div style={{ width: `${result.score * 100}%` }} /></div><div className="score-caption"><span>{result.scoreType.replaceAll('_', ' ')}</span><span>High-risk threshold: {Math.round(result.threshold * 100)}</span></div><div className="branches"><div><span>LOCAL RULES</span><strong>{Math.round(result.rules.score * 100)}<small> / 100</small></strong><p>{result.rules.reasons.length} observed indicators</p></div><div><span>MODEL BRANCH</span><strong>{result.model.score === null ? 'Unavailable' : Math.round(result.model.score * 100)}{result.model.score !== null && <small> / 100</small>}</strong><p>{result.model.version ?? 'Rules-only fallback active'}</p></div></div><h3>What the rules observed</h3><p className="explanation-note">These observations explain the rule branch. They do not explain the model prediction.</p>{result.rules.reasons.length ? <ul className="reasons">{result.rules.reasons.map(reason => <li key={reason.code}><span className="reason-icon" aria-hidden="true">!</span><div><strong>{reason.message}</strong><span>{reason.code} · {reason.feature}: {reason.observed} · weight {reason.weight}</span></div></li>)}</ul> : <p className="no-signals">No configured rule triggered. Harmful destinations can still have ordinary-looking URLs.</p>}<details><summary>Coverage, versions & limitations</summary><ul className="limitations">{result.limitations.map(x => <li key={x}>{x}</li>)}</ul><p className="version-line">{result.featureVersion} · {result.rules.version}<br/>Request {result.requestId}<br/>External evidence: disabled · Destination contacted: no</p></details></section> : !busy && <section className="card empty-state"><div className="empty-icon"><Shield /></div><div><h3>Your next decision starts with a signal.</h3><p>Results appear here with separate rule and model scores, observed indicators, and clear limitations.</p></div><span className="empty-grid" aria-hidden="true">＋</span></section>}
        </div><aside className="context-column"><section className="method-card" id="methodology"><span className="section-number">THE METHOD</span><h2>Read the link.<br/>Leave the site alone.</h2><p>PhishAi examines the URL string without visiting its destination.</p><ol className="method-list"><li><span>01</span><div><h3>Extract features</h3><p>Length, hostname structure, encoding, and other lexical signals.</p></div></li><li><span>02</span><div><h3>Compare two branches</h3><p>Transparent rules alongside a trained model, when available.</p></div></li><li><span>03</span><div><h3>Show the evidence</h3><p>Separate scores, grounded rule reasons, and honest uncertainty.</p></div></li></ol><div className="method-foot"><Shield small /><span>No page fetches. No DNS lookups.<br/>No external reputation requests.</span></div></section><section className="card system-card"><div className="card-header"><h3>Analysis availability</h3><span className={`status-light ${health ? 'ready' : ''}`} /></div><dl><div><dt>Application</dt><dd>{health ? 'Connected' : 'Checking / unavailable'}</dd></div><div><dt>Local rule engine</dt><dd>{health ? 'Ready' : 'Unknown'}</dd></div><div><dt>URL-feature model</dt><dd>{health?.model === 'ready' ? 'Ready' : health ? 'Unavailable' : 'Unknown'}</dd></div><div><dt>External intelligence</dt><dd className="muted">Disabled</dd></div></dl><p>Availability reflects service health, not detection accuracy.</p></section><div className="privacy-note"><span aria-hidden="true">⌁</span><p><strong>Minimal by design.</strong> This review build stores account and session data. It does not save submitted URLs or scan history.</p></div></aside></div>
        <footer className="page-footer"><span>PhishAi · Explainable URL risk screening</span><span>Local demonstration · No safety guarantees</span></footer>
      </main>
    </div>
  </div>;
}
