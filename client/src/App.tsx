import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { SavedScan } from '../../shared/types';
import { ApiError, errorMessage, request } from './api';
import History from './History';
import Report from './Report';

type Session = { user: { email: string } | null; csrfToken: string; expiresAt: string };
type Health = { status: string; model: string };
const examples = [
  { label: 'Simple URL', value: 'https://example.com/docs' },
  { label: 'Several indicators', value: 'http://review@example.test:8080/account/login/verify' },
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [view, setView] = useState<'scan' | 'history'>('scan');
  const [url, setUrl] = useState('');
  const [scan, setScan] = useState<SavedScan | null>(null);
  const [busy, setBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [auth, setAuth] = useState<'login' | 'register' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const generation = useRef(0);
  const urlInput = useRef<HTMLInputElement>(null);

  const refreshSession = useCallback(async () => {
    const currentGeneration = generation.current;
    const current = await request<Session>('/auth/session');
    if (generation.current === currentGeneration) setSession(current);
    return current;
  }, []);
  const refreshHealth = useCallback(async () => {
    try {
      const response = await fetch('/health', { signal: AbortSignal.timeout(5000), cache: 'no-store' });
      setHealth(response.ok ? await response.json() : null);
    } catch { setHealth(null); }
  }, []);
  useEffect(() => {
    refreshSession().catch(() => setError('Cannot start a session. Check the connection and try again.'));
    void refreshHealth();
  }, [refreshSession, refreshHealth]);

  const sessionExpired = useCallback(() => {
    generation.current++;
    setSession(null); setScan(null); setView('scan'); setAuth('login');
    setError('Your session needs to be refreshed. Sign in again if requested.');
    refreshSession().catch(() => {});
  }, [refreshSession]);

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    if (!session || !auth) return;
    if (auth === 'register' && password !== confirmation) { setAuthError('The passwords do not match.'); return; }
    setAuthBusy(true); setAuthError('');
    try {
      const current = await request<Session>(`/auth/${auth}`, { method: 'POST', body: { email, password }, csrf: session.csrfToken });
      generation.current++; setSession(current); setScan(null); setAuth(null);
      setPassword(''); setConfirmation(''); setError(''); setView('scan');
      urlInput.current?.focus(); void refreshHealth();
    } catch (exc) {
      setAuthError(errorMessage(exc));
      refreshSession().catch(() => {});
    } finally { setAuthBusy(false); }
  }

  async function logout() {
    if (!session) return;
    setAuthBusy(true); setError('');
    try {
      await request('/auth/logout', { method: 'POST', csrf: session.csrfToken });
      generation.current++; setSession(null); setScan(null); setUrl(''); setView('scan'); setPassword(''); setConfirmation('');
      await refreshSession();
    } catch (exc) { setError(errorMessage(exc)); }
    finally { setAuthBusy(false); }
  }

  async function analyze(event: FormEvent) {
    event.preventDefault();
    if (!session?.user) { setAuth('login'); setAuthError(''); return; }
    const currentGeneration = generation.current;
    setBusy(true); setError(''); setScan(null);
    try {
      const result = await request<SavedScan>('/scans', { method: 'POST', body: { url }, csrf: session.csrfToken });
      if (generation.current === currentGeneration) { setScan(result); setUrl(''); }
    } catch (exc) {
      if (exc instanceof ApiError && (exc.status === 401 || exc.status === 403)) sessionExpired();
      else setError(errorMessage(exc));
    } finally { setBusy(false); void refreshHealth(); }
  }

  return <div className="app">
    <a href="#main" className="skip-link">Skip to main content</a>
    <header className="site-header no-print">
      <div className="header-inner">
        <a href="#main" className="brand" onClick={() => setView('scan')}>PhishAI<span>URL risk checker</span></a>
        <div className="account-controls">
          {session?.user ? <><span className="account-email">{session.user.email}</span><button className="secondary" disabled={busy || authBusy} onClick={logout}>{authBusy ? 'Please wait…' : 'Sign out'}</button></> :
            <button className="secondary" disabled={authBusy} onClick={() => { setAuth('login'); setAuthError(''); }}>Sign in</button>}
        </div>
      </div>
    </header>
    <div className="content">
      <nav className="tabs no-print" aria-label="Main navigation">
        <button aria-current={view === 'scan' ? 'page' : undefined} onClick={() => setView('scan')}>Check a link</button>
        <button aria-current={view === 'history' ? 'page' : undefined} disabled={!session?.user || busy || authBusy} onClick={() => setView('history')}>Your scans</button>
        <span className="service-status">{health ? (health.model === 'ready' ? 'Model available' : 'Rules only · model unavailable') : 'Service status unavailable'}</span>
      </nav>
      <main id="main">
        {view === 'scan' ? <>
          <div className="page-title no-print"><h1>Check a link</h1><p>Review a URL's risk signals without opening the destination.</p></div>
          {auth && <section className="panel auth-panel no-print" aria-labelledby="auth-title">
            <div><h2 id="auth-title">{auth === 'login' ? 'Sign in' : 'Create an account'}</h2><p className="muted">Keep your reports private. Saved reports omit URLs and hostnames, and expire after 30 days.</p><p className="muted small">Local review accounts do not send or verify email.</p></div>
            <form onSubmit={authenticate} aria-busy={authBusy}>
              <label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} />
              <label htmlFor="password">Password</label><input id="password" type="password" autoComplete={auth === 'login' ? 'current-password' : 'new-password'} required minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} aria-describedby="password-help" />
              <p id="password-help" className="field-help">Use 12–128 characters.</p>
              {auth === 'register' && <><label htmlFor="confirmation">Confirm password</label><input id="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></>}
              {authError && <p className="error" role="alert">{authError}</p>}
              <div className="button-row"><button className="primary" disabled={authBusy || !session}>{authBusy ? 'Please wait…' : auth === 'login' ? 'Sign in' : 'Create account'}</button><button type="button" className="secondary" disabled={authBusy} onClick={() => { setAuth(null); setPassword(''); setConfirmation(''); }}>Cancel</button></div>
              <button type="button" className="link-button auth-switch" disabled={authBusy} onClick={() => { setAuth(auth === 'login' ? 'register' : 'login'); setAuthError(''); setConfirmation(''); }}>{auth === 'login' ? 'Create a new account' : 'Already have an account? Sign in'}</button>
            </form>
          </section>}
          <section className="panel scanner no-print" aria-labelledby="scanner-title">
            <h2 id="scanner-title">Enter a URL</h2>
            <form onSubmit={analyze} aria-busy={busy}>
              <label htmlFor="url">HTTP or HTTPS URL</label>
              <div className="scan-input-row"><input ref={urlInput} id="url" type="text" inputMode="url" autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={4096} placeholder="https://example.com/path" value={url} onChange={event => setUrl(event.target.value)} aria-describedby="url-help" disabled={busy} /><button className="primary" disabled={busy || authBusy || !session}>{busy ? 'Checking…' : session?.user ? 'Check URL' : 'Sign in to check'}</button></div>
              <p className="field-help" id="url-help">Up to 4,096 characters. No page visits, DNS lookups, or external reputation checks.</p>
            </form>
            <div className="examples"><span>Synthetic examples:</span>{examples.map(item => <button key={item.label} className="link-button" disabled={busy} onClick={() => { setUrl(item.value); urlInput.current?.focus(); }}>{item.label}</button>)}</div>
            <p className="privacy-copy">Only minimized results are saved. Original URLs and hostnames are omitted. You can delete saved reports at any time.</p>
          </section>
          {error && <div className="notice error" role="alert">{error}{!session && !auth && <button className="link-button" onClick={() => { refreshSession().then(() => setError('')).catch(() => {}); void refreshHealth(); }}>Retry connection</button>}</div>}
          {busy && <p className="notice" role="status">Checking URL features and preparing your report…</p>}
          {scan ? <Report scan={scan} /> : !busy && <div className="empty-state no-print"><h2>Your report will appear here</h2><p>Each report includes model contributions, rule observations, practical next steps, and its limitations.</p></div>}
          <details className="method-note no-print"><summary>How this checker works</summary><p>PhishAI uses URL text, a trained Random Forest, and nine local rules. The model decides the current result when available. Rule observations are reported separately. A missing model produces an explicit rules-only report.</p><p>The model was evaluated on a historical dataset. It can miss harmful links and flag legitimate ones. A lower score is never a safety guarantee.</p></details>
        </> : session?.user && <History key={session.user.email} csrf={session.csrfToken} onSessionExpired={sessionExpired} />}
      </main>
      <footer className="site-footer no-print"><span>PhishAI · Local review build</span><span>Reports retained for 30 days · No safety guarantees</span></footer>
    </div>
  </div>;
}
