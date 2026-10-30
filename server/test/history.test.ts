import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const origin = 'http://127.0.0.1:3000';
const fixture = JSON.parse(readFileSync(path.join(root, 'shared/contracts/response-fixture.json'), 'utf8'));
let mongo: MongoMemoryServer;
let service: Awaited<ReturnType<typeof createApp>>;
let db: MongoClient;
let alice: ReturnType<typeof request.agent>, bob: ReturnType<typeof request.agent>;
let aliceToken: string, bobToken: string;
let savedId: string;

before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { version: '8.0.16', downloadDir: path.join(root, '.tools/mongodb'),
    os: { os: 'linux', dist: 'ubuntu', release: '22.04' } }, instance: { ip: '127.0.0.1' } });
  const config = loadConfig({ SESSION_SECRET: 'history-test-secret-at-least-32-characters', MONGO_URL: mongo.getUri('history-tests'), AI_URL: 'http://fixed-scanner:8000', APP_ORIGIN: origin });
  const fetcher = (async (url: unknown, options?: RequestInit) => {
    if (String(url).endsWith('/health')) return Response.json({ status: 'ok', model: 'missing' });
    return Response.json({ ...fixture, requestId: JSON.parse(String(options?.body)).requestId });
  }) as typeof fetch;
  service = await createApp(config, root, fetcher);
  db = new MongoClient(config.mongoUrl); await db.connect();
  const register = async (email: string) => {
    const agent = request.agent(service.app);
    const initial = await agent.get('/api/v1/auth/session').expect(200);
    const result = await agent.post('/api/v1/auth/register').set('Origin', origin).set('X-CSRF-Token', initial.body.csrfToken)
      .send({ email, password: 'test-only-password-for-history' }).expect(201);
    return { agent, token: result.body.csrfToken };
  };
  const first = await register('alice@example.test'), second = await register('bob@example.test');
  alice = first.agent; aliceToken = first.token; bob = second.agent; bobToken = second.token;
});
after(async () => { await db?.close(); await service?.close(); await mongo?.stop(); });

test('history/detail/dashboard require authentication', async () => {
  for (const route of ['/api/v1/scans', '/api/v1/scans/012345678901234567890123', '/api/v1/dashboard/summary']) {
    await request(service.app).get(route).expect(401);
  }
});

test('saved report omits sensitive input and belongs to its owner', async () => {
  const raw = 'https://private-user:private-password@private.example/path-secret?token=query-secret#fragment-secret';
  const result = await alice.post('/api/v1/scans').set('Origin', origin).set('X-CSRF-Token', aliceToken).send({ url: raw }).expect(200);
  savedId = result.body.scanId;
  const detail = await alice.get(`/api/v1/scans/${savedId}`).expect(200);
  assert.equal(detail.body.report.input.hostname, null);
  const stored = await db.db().collection('scans').findOne({ _id: new ObjectId(savedId) });
  assert.ok(stored);
  for (const secret of [raw, 'private-user', 'private-password', 'private.example', 'path-secret', 'query-secret', 'fragment-secret', 'example.test']) {
    assert.equal(JSON.stringify(stored).includes(secret), false, `Stored report contains ${secret}`);
  }
  assert.equal(stored.analysis.report.input.hostname, null);
  assert.equal(Math.round((stored.expiresAt - stored.createdAt) / 86400000), 30);
  await bob.get(`/api/v1/scans/${savedId}`).expect(404);
  await bob.delete(`/api/v1/scans/${savedId}`).set('Origin', origin).set('X-CSRF-Token', bobToken).expect(404);
  assert.equal((await bob.get('/api/v1/scans').expect(200)).body.total, 0);
  assert.equal((await bob.get('/api/v1/dashboard/summary').expect(200)).body.total, 0);
  const summary = (await alice.get('/api/v1/dashboard/summary').expect(200)).body;
  assert.equal(summary.total, 1); assert.equal(summary.high, 1); assert.equal(summary.partial, 1);
});

test('pagination is bounded and uses only owner records in stable order', async () => {
  for (let i = 0; i < 2; i++) await alice.post('/api/v1/scans').set('Origin', origin).set('X-CSRF-Token', aliceToken).send({ url: 'https://example.com/' }).expect(200);
  const first = (await alice.get('/api/v1/scans?limit=2&page=1').expect(200)).body;
  const second = (await alice.get('/api/v1/scans?limit=2&page=2').expect(200)).body;
  assert.equal(first.total, 3); assert.equal(first.pages, 2); assert.equal(first.items.length, 2); assert.equal(second.items.length, 1);
  assert.equal(new Set([...first.items, ...second.items].map(row => row.id)).size, 3);
  assert.equal(second.items[0].id, savedId);
  for (const query of ['limit=51', 'limit=0', 'page=-1', 'page=1.5', 'page=10001', 'limit[x]=2', 'page=1&page=2']) {
    await alice.get(`/api/v1/scans?${query}`).expect(400);
  }
});

test('expired scans are immediately hidden from reads and counts before TTL cleanup', async () => {
  const original = await db.db().collection('scans').findOne({ _id: new ObjectId(savedId) });
  assert.ok(original);
  const expiredId = new ObjectId();
  await db.db().collection('scans').insertOne({ ...original, _id: expiredId, expiresAt: new Date(Date.now() - 1000) });
  await alice.get(`/api/v1/scans/${expiredId}`).expect(404);
  const history = (await alice.get('/api/v1/scans').expect(200)).body;
  const summary = (await alice.get('/api/v1/dashboard/summary').expect(200)).body;
  assert.equal(history.total, 3); assert.equal(summary.total, 3);
  const indexes = await db.db().collection('scans').indexes();
  assert.equal(indexes.find(index => index.key.expiresAt === 1)?.expireAfterSeconds, 0);
});

test('deletion requires CSRF, changes owner counts and cannot delete another owner', async () => {
  await alice.delete(`/api/v1/scans/${savedId}`).set('Origin', origin).expect(403);
  await alice.delete(`/api/v1/scans/${savedId}`).set('Origin', 'http://wrong.test').set('X-CSRF-Token', aliceToken).expect(403);
  await alice.get('/api/v1/scans/not-a-valid-id').expect(404);
  await alice.delete(`/api/v1/scans/${savedId}`).set('Origin', origin).set('X-CSRF-Token', aliceToken).expect(204);
  await alice.get(`/api/v1/scans/${savedId}`).expect(404);
  assert.equal((await alice.get('/api/v1/dashboard/summary').expect(200)).body.total, 2);
  await bob.delete('/api/v1/scans').set('Origin', origin).set('X-CSRF-Token', bobToken).expect(204);
  assert.equal((await alice.get('/api/v1/scans').expect(200)).body.total, 2);
  await alice.delete('/api/v1/scans').set('Origin', origin).set('X-CSRF-Token', aliceToken).expect(204);
  assert.equal((await alice.get('/api/v1/scans').expect(200)).body.total, 0);
  assert.equal((await alice.get('/api/v1/dashboard/summary').expect(200)).body.total, 0);
});
