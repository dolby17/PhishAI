import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { hashPassword, verifyPassword } from '../src/password.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const origin = 'http://127.0.0.1:3000';
let mongo: MongoMemoryServer;
let service: Awaited<ReturnType<typeof createApp>>;
let db: MongoClient;
let behavior = 'valid';
const fixture = JSON.parse(readFileSync(path.join(root, 'shared/contracts/response-fixture.json'), 'utf8'));
const password = 'test-only-long-password-17';
const fetcher = (async (url: string | URL | globalThis.Request, options?: RequestInit) => {
  assert.ok(String(url).startsWith('http://fixed-scanner:8000/'));
  if (String(url).endsWith('/health')) return Response.json({ status: 'ok', model: 'missing' });
  if (behavior === 'throw') throw new DOMException('Timeout', 'TimeoutError');
  if (behavior === 'invalid') return Response.json({ verdict: 'low' });
  if (behavior === 'mismatch') return Response.json({ ...fixture, requestId: 'wrong' });
  if (behavior === '422') return Response.json({ error: 'invalid' }, { status: 422 });
  if (behavior === '503') return new Response('unavailable', { status: 503 });
  if (behavior === 'oversize') return new Response('x'.repeat(65537));
  const payload = JSON.parse(String(options?.body));
  return Response.json({ ...fixture, requestId: payload.requestId });
}) as typeof fetch;

before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { version: '8.0.16', downloadDir: path.join(root, '.tools/mongodb'),
    os: { os: 'linux', dist: 'ubuntu', release: '22.04' } }, instance: { ip: '127.0.0.1' } });
  const config = loadConfig({ SESSION_SECRET: 'test-secret-32-characters-long-enough', MONGO_URL: mongo.getUri('phishai-test'), AI_URL: 'http://fixed-scanner:8000', APP_ORIGIN: origin });
  service = await createApp(config, root, fetcher);
  db = new MongoClient(config.mongoUrl); await db.connect();
});
after(async () => { await db?.close(); await service?.close(); await mongo?.stop(); });

test('configuration rejects placeholders and invalid bounds', () => {
  assert.throws(() => loadConfig({ SESSION_SECRET: 'replace-with-at-least-32-random-characters' }));
  assert.throws(() => loadConfig({ SESSION_SECRET: 'a'.repeat(40), PORT: '0' }));
  assert.throws(() => loadConfig({ SESSION_SECRET: 'a'.repeat(40), SESSION_TTL_SECONDS: '1' }));
});

test('password hashes use independent salts and verify without plaintext storage', async () => {
  const first = await hashPassword(password), second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('wrong-password', first), false);
  assert.equal(first.includes(password), false);
});

test('health reports model availability separately', async () => {
  const res = await request(service.app).get('/health').expect(200);
  assert.equal(res.body.model, 'missing');
  assert.equal(res.headers['x-powered-by'], undefined);
  assert.ok(res.headers['content-security-policy']);
});

test('session lifecycle, CSRF, protected scans, contract failures and privacy', async t => {
  const agent = request.agent(service.app);
  let session = (await agent.get('/api/v1/auth/session').expect(200));
  let csrf = session.body.csrfToken;
  const anonymousCookie = session.headers['set-cookie'];
  assert.match(String(anonymousCookie), /HttpOnly/);
  assert.match(String(anonymousCookie), /SameSite=Strict/);
  const post = (route: string, body: unknown, token = csrf) => agent.post(route).set('Origin', origin).set('X-CSRF-Token', token).send(body);
  await post('/api/v1/scans', { url: 'https://example.com/' }).expect(401);
  await agent.post('/api/v1/auth/register').set('Origin', origin).send({ email: 'test@example.test', password }).expect(403);
  await agent.post('/api/v1/auth/register').set('Origin', 'http://wrong.test').set('X-CSRF-Token', csrf).send({ email: 'test@example.test', password }).expect(403);
  await post('/api/v1/auth/register', { email: 'test@example.test', password: 'short' }).expect(400);
  const registered = await post('/api/v1/auth/register', { email: 'test@example.test', password }).expect(201);
  assert.notDeepEqual(registered.headers['set-cookie'], anonymousCookie);
  const stale = csrf;
  csrf = registered.body.csrfToken;
  assert.notEqual(csrf, stale);
  await post('/api/v1/scans', { url: 'https://example.com/' }, stale).expect(403);
  const scan = await post('/api/v1/scans', { url: 'https://example.com/' }).expect(200);
  assert.equal(scan.body.status, 'partial');
  assert.equal(scan.body.model.status, 'unavailable');
  assert.equal(JSON.stringify(scan.body).includes('https://example.com/'), false);
  assert.match(scan.headers['cache-control'], /no-store/);
  for (const body of [{ url: 17 }, { url: '' }, { url: 'a'.repeat(4097) }, { url: 'https://example.com/', extra: true }]) {
    await post('/api/v1/scans', body).expect(400);
  }
  for (const mode of ['throw', 'invalid', 'mismatch', '503', 'oversize']) {
    await t.test(`upstream ${mode} produces no safety verdict`, async () => {
      behavior = mode;
      const res = await post('/api/v1/scans', { url: 'https://example.com/' }).expect(503);
      assert.equal(res.body.verdict, undefined);
    });
  }
  behavior = '422'; await post('/api/v1/scans', { url: 'invalid' }).expect(400); behavior = 'valid';
  await post('/api/v1/scans', { url: 'x'.repeat(40000) }).expect(413);
  const storedScan = await db.db().collection('scans').findOne({ 'analysis.requestId': scan.body.requestId });
  assert.ok(storedScan);
  assert.equal(storedScan.url, undefined);
  assert.equal(JSON.stringify(storedScan).includes('https://example.com/'), false);
  assert.equal(storedScan.analysis.report?.input.hostname ?? null, null);
  const storedUser = await db.db().collection('users').findOne({ email: 'test@example.test' });
  assert.equal(storedUser?.password, undefined);
  assert.equal(storedUser?.passwordHash.includes(password), false);
  await post('/api/v1/auth/logout', undefined).expect(204);
  session = await agent.get('/api/v1/auth/session').expect(200); csrf = session.body.csrfToken;
  assert.equal(session.body.user, null);
  await post('/api/v1/scans', { url: 'https://example.com/' }).expect(401);
  await post('/api/v1/auth/login', { email: 'test@example.test', password: 'wrong-password-long' }).expect(401);
  const loggedIn = await post('/api/v1/auth/login', { email: 'test@example.test', password }).expect(200);
  csrf = loggedIn.body.csrfToken;
  const sessions = await db.db().collection('sessions').find().toArray();
  const record = sessions.find(row => JSON.parse(row.session).userId);
  assert.ok(record);
  const oldData = JSON.parse(record.session); oldData.issuedAt = Date.now() - 86400001;
  await db.db().collection('sessions').updateOne({ _id: record._id }, { $set: { session: JSON.stringify(oldData) } });
  const expired = await agent.get('/api/v1/auth/session').expect(200);
  assert.equal(expired.body.user, null);
  assert.notEqual(expired.body.csrfToken, csrf);
});

test('malformed JSON and body limits have stable errors', async () => {
  const malformed = await request(service.app).post('/api/v1/scans').set('Content-Type', 'application/json').send('{broken').expect(400);
  assert.equal(malformed.body.error.code, 'INVALID_JSON');
  await request(service.app).post('/api/v1/scans').set('Content-Type', 'application/json').send(JSON.stringify({ url: 'x'.repeat(40000) })).expect(413);
});

test('scan limits are per user and account attempt limits return JSON errors', async () => {
  const first = request.agent(service.app), second = request.agent(service.app);
  const register = async (agent: ReturnType<typeof request.agent>, email: string) => {
    const initial = await agent.get('/api/v1/auth/session').expect(200);
    const registered = await agent.post('/api/v1/auth/register').set('Origin', origin)
      .set('X-CSRF-Token', initial.body.csrfToken).send({ email, password }).expect(201);
    return registered.body.csrfToken as string;
  };
  const firstToken = await register(first, 'limit-one@example.test');
  const secondToken = await register(second, 'limit-two@example.test');
  for (let index = 0; index < 20; index++) {
    await first.post('/api/v1/scans').set('Origin', origin).set('X-CSRF-Token', firstToken)
      .send({ url: 'https://example.test/' }).expect(200);
  }
  const limited = await first.post('/api/v1/scans').set('Origin', origin).set('X-CSRF-Token', firstToken)
    .send({ url: 'https://example.test/' }).expect(429);
  assert.equal(limited.body.error.code, 'SCAN_RATE_LIMIT');
  await second.post('/api/v1/scans').set('Origin', origin).set('X-CSRF-Token', secondToken)
    .send({ url: 'https://example.test/' }).expect(200);
  let rateLimited = false;
  for (let index = 0; index < 12; index++) {
    const response = await second.post('/api/v1/auth/login').set('Origin', origin).set('X-CSRF-Token', secondToken)
      .send({ email: 'not-an-email', password });
    if (response.status === 429) { assert.equal(response.body.error.code, 'AUTH_RATE_LIMIT'); rateLimited = true; break; }
    assert.equal(response.status, 400);
  }
  assert.equal(rateLimited, true);
});
