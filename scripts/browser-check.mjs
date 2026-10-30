// User-approved local Firefox checks through standard WebDriver and WebDriver BiDi.
// Uses installed Firefox and the verified Mozilla geckodriver; no submitted URL is visited.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(root, 'docs/evidence');
const runtime = path.join(root, '.runtime/browser');
await mkdir(runtime, { recursive: true });
await mkdir(evidence, { recursive: true });
const reservation = createServer();
await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
const processDriver = spawn(path.join(root, '.tools/browser/geckodriver'), ['--host', '127.0.0.1', '--port', String(port), '--log', 'error'], { stdio: ['ignore', 'ignore', 'pipe'] });
let driverError = '';
processDriver.stderr.on('data', chunk => { driverError += chunk.toString(); });
processDriver.on('error', () => { driverError = 'Install the official geckodriver with node scripts/setup-browser.mjs.'; });
const driverUrl = `http://127.0.0.1:${port}`;
const appUrl = 'http://127.0.0.1:3000';
let sessionId, socket;
const checks = [], pageErrors = [], externalRequests = [];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function command(route, body, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(driverUrl + route, { method, signal: AbortSignal.timeout(30000),
    headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok || result.value?.error) throw new Error(`WebDriver ${result.value?.error ?? response.status}: ${result.value?.message ?? 'request failed'}`);
  return result.value;
}
const wd = (route, body, method) => command(`/session/${sessionId}${route}`, body, method);
const js = script => wd('/execute/sync', { script, args: [] });
async function waitFor(predicate, description, timeout = 12000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try { const value = await predicate(); if (value) return value; } catch {}
    await pause(100);
  }
  throw new Error(`Timed out: ${description}`);
}
const exists = selector => js(`return !!document.querySelector(${JSON.stringify(selector)})`);
const element = async selector => {
  const result = await wd('/element', { using: 'css selector', value: selector });
  return result['element-6066-11e4-a52e-4f735466cecf'];
};
const click = async selector => wd(`/element/${await element(selector)}/click`, {});
const button = async (text, scope = '') => {
  const found = await js(`return [...document.querySelectorAll(${JSON.stringify(scope ? scope + ' button' : 'button')})].find(button => button.textContent.trim() === ${JSON.stringify(text)})`);
  assert.ok(found, `Button missing: ${text}`);
  await wd(`/element/${found['element-6066-11e4-a52e-4f735466cecf']}/click`, {});
};
async function fill(selector, value) {
  const id = await element(selector);
  await wd(`/element/${id}/clear`, {});
  await wd(`/element/${id}/value`, { text: value });
}
async function noOverflow() { assert.equal(await js('return document.documentElement.scrollWidth <= innerWidth'), true, 'Horizontal page overflow'); }

try {
  await waitFor(async () => (await command('/status')).ready, 'WebDriver startup', 10000);
  const session = await command('/session', { capabilities: { alwaysMatch: {
    browserName: 'firefox', acceptInsecureCerts: false, webSocketUrl: true,
    'moz:firefoxOptions': { binary: process.env.FIREFOX_BINARY ?? '/usr/bin/firefox', args: ['-headless'], prefs: {
      'browser.download.folderList': 2, 'browser.download.dir': runtime,
      'browser.download.useDownloadDir': true, 'browser.helperApps.neverAsk.saveToDisk': 'application/json',
      'browser.download.always_ask_before_handling_new_types': false,
    } },
  } } });
  sessionId = session.sessionId;
  socket = new WebSocket(session.capabilities.webSocketUrl);
  const pending = new Map();
  let sequence = 0;
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id !== undefined && pending.has(message.id)) {
      const waiter = pending.get(message.id); pending.delete(message.id); clearTimeout(waiter.timer);
      message.type === 'error' ? waiter.reject(new Error(`BiDi ${message.error}: ${message.message}`)) : waiter.resolve(message.result);
    } else if (message.method === 'log.entryAdded' && message.params.type === 'javascript' && message.params.level === 'error') {
      pageErrors.push(message.params.text);
    } else if (message.method === 'network.beforeRequestSent') {
      const url = message.params.request.url;
      // data: fonts are inline bytes, not destination-network requests.
      if (!url.startsWith(appUrl + '/') && !url.startsWith('blob:') && !url.startsWith('data:') && url !== 'about:blank') externalRequests.push(url);
    }
  });
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  const bidi = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`BiDi timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
  const tree = await bidi('browsingContext.getTree');
  const context = tree.contexts[0].context;
  await bidi('session.subscribe', { events: ['log.entryAdded', 'network.beforeRequestSent'], contexts: [context] });
  async function viewport(width, height) {
    await bidi('browsingContext.setViewport', { context, viewport: { width, height }, devicePixelRatio: 1 });
    assert.deepEqual(await js('return [innerWidth, innerHeight]'), [width, height]);
  }
  async function screenshot(name, full = false) {
    const capture = await bidi('browsingContext.captureScreenshot', { context, origin: full ? 'document' : 'viewport', format: { type: 'image/png' } });
    await writeFile(path.join(evidence, name), Buffer.from(capture.data, 'base64'));
  }
  await viewport(1366, 900);
  await wd('/url', { url: appUrl });
  await waitFor(() => js('return document.querySelector(".service-status")?.textContent === "Model available"'), 'Application/model readiness');
  assert.equal(await js('return document.querySelector("h1").textContent'), 'Check a link');
  assert.equal(await js('return [...document.querySelectorAll("button")].find(button => button.textContent === "Your scans").disabled'), true);
  await wd('/actions', { actions: [{ type: 'key', id: 'keyboard', actions: [{ type: 'keyDown', value: '\uE004' }, { type: 'keyUp', value: '\uE004' }] }] });
  assert.equal(await js('return document.activeElement.classList.contains("skip-link")'), true);
  await js('document.activeElement.blur(); return true;');
  await noOverflow(); await screenshot('ui-desktop.png');
  checks.push('desktop layout', 'keyboard skip link', 'protected history navigation');

  await button('Sign in'); await button('Create a new account');
  const email = `ui-review-${randomBytes(5).toString('hex')}@example.test`, password = randomBytes(24).toString('hex');
  await fill('#email', email); await fill('#password', password); await fill('#confirmation', password + 'wrong');
  await button('Create account');
  await waitFor(() => js('return document.querySelector("[role=alert]")?.textContent.includes("passwords do not match")'), 'Password confirmation error');
  await fill('#confirmation', password); await button('Create account');
  await waitFor(() => exists('.account-email'), 'Registration');
  assert.equal(await js('return document.querySelector("label[for=url]").textContent'), 'HTTP or HTTPS URL');
  checks.push('registration', 'password confirmation', 'accessible form labels');

  await fill('#url', 'javascript:alert(1)'); await button('Check URL');
  await waitFor(() => js('return document.querySelector("[role=alert]")?.textContent.includes("valid absolute HTTP or HTTPS URL")'), 'Invalid URL response');
  assert.equal(await exists('article.report'), false); checks.push('invalid input has no safety verdict');
  await button('Several indicators'); await button('Check URL');
  await waitFor(() => exists('article.report'), 'Real model report');
  assert.equal(await js('return document.querySelectorAll(".findings > li").length'), 3);
  assert.equal(await js('return document.querySelector("#model-title").parentElement.textContent.includes("Positive contributions raised")'), true);
  assert.equal(await js('return document.activeElement.id'), 'report-title');
  assert.equal(await js('return [...document.querySelectorAll("a")].some(link => link.href.includes("example.test"))'), false);
  await screenshot('ui-report-desktop.png', true);
  checks.push('real trained-model scan', 'three grounded rule explanations', 'model contribution table', 'result focus', 'non-clickable destination');

  const existingDownloads = new Set(await readdir(runtime));
  await button('Download JSON');
  const exported = await waitFor(async () => {
    const name = (await readdir(runtime)).find(item => /^phishai-report-.*\.json$/.test(item) && !existingDownloads.has(item));
    if (!name) return false;
    return JSON.parse(await readFile(path.join(runtime, name), 'utf8'));
  }, 'Fresh complete JSON download');
  assert.equal(exported.report.input.hostname, null);
  assert.equal(JSON.stringify(exported).includes('example.test'), false);
  assert.equal(exported.report.modelExplanation.contributions.length, 20);
  checks.push('minimized JSON download with all model contributions');
  await js('window.print = () => { window.__printInvoked = true; window.__printDetailsExpanded = [...document.querySelectorAll("article.report details")].every(detail => detail.open); }; return true;');
  await button('Print / save PDF');
  assert.equal(await js('return window.__printInvoked && window.__printDetailsExpanded'), true);
  checks.push('print action expands full report (system dialog/PDF output not automated)');

  await button('Your scans');
  await waitFor(() => js('return document.querySelectorAll(".history-table tbody tr").length === 1'), 'Saved report history');
  assert.deepEqual(await js('return [...document.querySelectorAll(".summary-counts dd")].map(item => Number(item.textContent))'), [1, exported.verdict === 'high' ? 1 : 0, exported.verdict === 'review' ? 1 : 0, exported.verdict === 'low' ? 1 : 0]);
  await click('button[aria-label^="Open report from"]');
  await waitFor(() => js('return document.querySelector("article.report")?.textContent.includes("Omitted from saved reports for privacy")'), 'Saved report privacy');
  checks.push('private history/dashboard', 'saved report detail', 'hostname omitted from stored report');
  await button('Delete all history'); await waitFor(() => exists('.confirmation'), 'Delete confirmation');
  await button('Cancel'); assert.equal(await exists('.confirmation'), false);
  checks.push('destructive action confirmation and cancellation');

  await viewport(375, 812); await noOverflow(); await screenshot('ui-history-mobile.png', true);
  await button('Check a link'); await js('window.scrollTo(0,0); return true;');
  await noOverflow(); await screenshot('ui-mobile.png');
  await button('Simple URL'); await button('Check URL');
  await waitFor(() => exists('article.report'), 'Mobile model report');
  await noOverflow(); await screenshot('ui-report-mobile.png', true);
  checks.push('375px mobile scan/history layout without page overflow', 'mobile scan');
  await button('Sign out'); await waitFor(() => js('return !document.querySelector(".account-email") && !document.querySelector("article.report")'), 'Logout privacy');
  await button('Sign in'); await fill('#email', email); await fill('#password', password); await button('Sign in', '.auth-panel');
  await waitFor(() => exists('.account-email'), 'Login'); await button('Your scans');
  await waitFor(() => js('return document.querySelectorAll(".history-table tbody tr").length === 2'), 'History after login');
  checks.push('logout clears private report state', 'login restores private saved history');
  assert.deepEqual(pageErrors, []); assert.deepEqual(externalRequests, []);
  checks.push('no uncaught JavaScript errors', 'no external application requests');
  const result = { checkedAt: new Date().toISOString(), browser: `Firefox ${session.capabilities.browserVersion} / Mozilla geckodriver ${session.capabilities['moz:geckodriverVersion']}`,
    desktopViewport: [1366,900], mobileViewport: [375,812], passed: checks, uncaughtPageErrors: pageErrors, externalApplicationRequests: externalRequests,
    screenshots: ['ui-desktop.png','ui-report-desktop.png','ui-mobile.png','ui-history-mobile.png','ui-report-mobile.png'],
    limits: ['Headless Firefox and two viewports only; not a formal WCAG audit.', 'Print action/expanded content checked; system print dialog and generated PDF not verified.'] };
  await writeFile(path.join(evidence, 'browser-check.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  await writeFile(path.join(runtime, 'driver-error.log'), driverError);
  throw error;
} finally {
  socket?.close();
  if (sessionId) await command(`/session/${sessionId}`, undefined, 'DELETE').catch(() => {});
  processDriver.kill('SIGTERM');
}
