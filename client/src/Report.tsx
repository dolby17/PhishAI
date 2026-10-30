import { useEffect, useRef } from 'react';
import type { SavedScan } from '../../shared/types';

export const verdictLabel = (verdict: SavedScan['verdict']) => ({ low: 'Lower risk', review: 'Review suggested', high: 'Higher risk' })[verdict];
const percent = (value: number) => Math.round(value * 100);
const number = (value: number) => Number.isInteger(value) ? value.toString() : value.toFixed(2);
export const dateLabel = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function Report({ scan, fromHistory = false }: { scan: SavedScan; fromHistory?: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const article = useRef<HTMLElement>(null);
  useEffect(() => { heading.current?.focus(); }, [scan.scanId]);
  const report = scan.report;
  const explanation = report?.modelExplanation;
  const modelActive = scan.mode !== 'rules_only';
  const contributions = explanation?.status === 'available' ? explanation.contributions : [];

  function download() {
    // Export the same minimized representation saved in history. No original URL or hostname.
    const exported = structuredClone(scan);
    if (exported.report) exported.report.input.hostname = null;
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl; link.download = `phishai-report-${scan.scanId}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  function print() {
    const collapsed = Array.from(article.current?.querySelectorAll<HTMLDetailsElement>('details:not([open])') ?? []);
    collapsed.forEach(detail => { detail.open = true; });
    try { window.print(); }
    finally { collapsed.forEach(detail => { detail.open = false; }); }
  }

  return <article ref={article} className="report panel" aria-labelledby="report-title">
    <div className="section-heading"><div><p className="overline">Analysis report</p>
      <h2 id="report-title" ref={heading} tabIndex={-1} className={`verdict-text ${scan.verdict}`}>{verdictLabel(scan.verdict)}</h2>
      <p className="muted small">{dateLabel(scan.analyzedAt)}{fromHistory ? ' · Saved report' : ''}</p>
    </div><div className="report-actions no-print"><button className="secondary" onClick={download}>Download JSON</button><button className="secondary" onClick={print}>Print / save PDF</button></div></div>

    <p className="result-summary">The {modelActive ? (scan.mode === 'hybrid' ? 'combined' : 'model') : 'rule'} score is <strong>{percent(scan.score)}/100</strong>.
      {' '}{scan.score >= scan.threshold ? 'It meets' : 'It is below'} the high-risk threshold of {percent(scan.threshold)}/100.
      {' '}This is a screening score, not a probability that the site is harmful.</p>
    {scan.status === 'partial' && <p className="notice warning" role="status">Model unavailable. This report uses local rules only.</p>}
    <p className="notice">A low score does not prove safety. The destination was not visited or resolved.</p>

    <dl className="score-comparison">
      <div><dt>Model score</dt><dd>{scan.model.score === null ? 'Unavailable' : `${percent(scan.model.score)}/100`}</dd><span>Learned URL features · uncalibrated</span></div>
      <div><dt>Rule score</dt><dd>{percent(scan.rules.score)}/100</dd><span>{scan.rules.reasons.length} observed indicators · heuristic</span></div>
      <div><dt>Decision method</dt><dd>{scan.mode === 'ml' ? 'Model' : scan.mode === 'hybrid' ? 'Hybrid' : 'Rules only'}</dd><span>Versioned decision policy</span></div>
    </dl>

    {report && <section className="report-section" aria-labelledby="input-title"><h3 id="input-title">URL structure</h3>
      <dl className="structure-list"><div><dt>Hostname</dt><dd className="mono break-word">{report.input.hostname ?? 'Omitted from saved reports for privacy'}</dd></div>
        <div><dt>Scheme / host type</dt><dd>{report.input.scheme.toUpperCase()} · {report.input.hostType}</dd></div>
        <div><dt>Length</dt><dd>{report.input.urlLength} characters · path {report.input.pathLength} · query {report.input.queryLength}</dd></div>
        <div><dt>User information</dt><dd>{report.input.hasUserinfo ? 'Present; its text is not included' : 'Not present'}</dd></div>
      </dl>
    </section>}

    <section className="report-section" aria-labelledby="rules-title"><h3 id="rules-title">What the rules found</h3>
      <p className="muted small">These observations explain the rule score. Each indicator can also occur in legitimate URLs.</p>
      {scan.rules.reasons.length === 0 ? <p>No configured rule triggered. The model may still detect a learned pattern that raises its score.</p> :
        <ol className="findings">{scan.rules.reasons.map(reason => {
          const detail = report?.indicators.find(item => item.code === reason.code);
          return <li key={reason.code}><h4>{reason.message}</h4>{detail && <><p>{detail.explanation}</p><p><strong>Check:</strong> {detail.recommendation}</p></>}
            <p className="finding-meta">Observed {number(reason.observed)} · rule weight {reason.weight}/100 · <code>{reason.code}</code></p>
          </li>;
        })}</ol>}
    </section>

    <section className="report-section" aria-labelledby="model-title"><h3 id="model-title">Why the model produced this score</h3>
      {contributions.length > 0 ? <>
        <p>The table shows the largest changes along this URL's paths through the trained trees. Positive contributions raised the model score; negative contributions lowered it.</p>
        <div className="table-scroll"><table><caption className="sr-only">Six largest model score contributions</caption><thead><tr><th scope="col">Feature</th><th scope="col">Observed</th><th scope="col">Score change</th></tr></thead>
          <tbody>{contributions.slice(0, 6).map(item => <tr key={item.feature}><th scope="row">{item.label}</th><td>{number(item.observed)}</td><td>{item.contribution >= 0 ? '+' : '−'}{(Math.abs(item.contribution) * 100).toFixed(2)} points</td></tr>)}</tbody></table></div>
        <p className="muted small">Tree baseline: {((explanation?.baseline ?? 0) * 100).toFixed(2)} points. Baseline plus all feature changes equals the model score.</p>
        <details><summary>All feature contributions and method limits</summary><p>{explanation?.note}</p><div className="table-scroll"><table><thead><tr><th scope="col">Feature</th><th scope="col">Observed</th><th scope="col">Score change</th></tr></thead><tbody>{contributions.map(item => <tr key={item.feature}><th scope="row">{item.label}</th><td>{number(item.observed)}</td><td>{(item.contribution * 100).toFixed(3)} points</td></tr>)}</tbody></table></div></details>
      </> : <p>{scan.model.status === 'unavailable' ? 'No model ran for this report. The result uses rules only.' : 'A model-specific explanation is unavailable for this report. Rule observations must not be treated as the reason for its model verdict.'}</p>}
    </section>

    {report && <section className="report-section"><h3>What to do next</h3><ul className="recommendations">{report.recommendations.map(item => <li key={item}>{item}</li>)}</ul></section>}
    <details className="report-section"><summary>Coverage and technical details</summary><ul>{scan.limitations.map(item => <li key={item}>{item}</li>)}</ul>
      <dl className="structure-list"><div><dt>Model</dt><dd className="mono break-word">{scan.model.version ?? 'Unavailable'}</dd></div><div><dt>Features / rules</dt><dd>{scan.featureVersion} / {scan.rules.version}</dd></div><div><dt>Score type</dt><dd>{scan.scoreType.replaceAll('_', ' ')}</dd></div><div><dt>External evidence</dt><dd>Disabled. No page, DNS, certificate or reputation checks.</dd></div><div><dt>Report ID</dt><dd className="mono break-word">{scan.scanId}</dd></div><div><dt>Retained until</dt><dd>{dateLabel(scan.expiresAt)}</dd></div></dl>
    </details>
  </article>;
}
