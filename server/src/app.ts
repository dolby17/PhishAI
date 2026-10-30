import express, { type Request, type Response, type NextFunction } from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { MongoClient, MongoServerError, type ObjectId } from 'mongodb';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import type { Config } from './config.js';
import { hashPassword, verifyPassword } from './password.js';
import type { Analysis } from '../../shared/types.js';

declare module 'express-session' {
  interface SessionData { userId?: string; email?: string; csrf?: string; issuedAt?: number }
}

type User = { _id?: ObjectId; email: string; passwordHash: string; createdAt: Date };
type Fetcher = typeof fetch;
const token = () => randomBytes(32).toString('hex');
const error = (res: Response, status: number, code: string, message: string) => res.status(status).json({ error: { code, message } });
const save = (req: Request) => new Promise<void>((resolve, reject) => req.session.save(e => e ? reject(e) : resolve()));
const regenerate = (req: Request) => new Promise<void>((resolve, reject) => req.session.regenerate(e => e ? reject(e) : resolve()));

export async function createApp(config: Config, projectRoot: string, fetcher: Fetcher = fetch) {
  const client = new MongoClient(config.mongoUrl, { serverSelectionTimeoutMS: 3000 });
  await client.connect();
  const users = client.db().collection<User>('users');
  await users.createIndex({ email: 1 }, { unique: true });
  const store = MongoStore.create({ clientPromise: Promise.resolve(client), collectionName: 'sessions',
    ttl: config.sessionTtlSeconds, autoRemove: 'native' });
  // Consume store errors without printing session documents or connection strings.
  store.on('error', () => console.error('Session storage unavailable.'));
  const dummyHash = await hashPassword(token());
  const contract = JSON.parse(readFileSync(path.join(projectRoot, 'shared/contracts/analyze-v1.schema.json'), 'utf8'));
  const ajv = new Ajv2020.default({ strict: false });
  const validate = ajv.compile<Analysis>({ ...contract, $ref: '#/$defs/AnalyzeResponse' });
  const validateRequest = ajv.compile({ ...contract, $ref: '#/$defs/AnalyzeRequest' });
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (_req, res) => error(res, 429, 'RATE_LIMIT', 'Too many requests. Try again later.') }));
  app.use(express.json({ limit: '32kb', strict: true }));
  app.use(session({ name: 'phishai.sid', store, secret: config.sessionSecret, resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, secure: config.secureCookie, sameSite: 'strict', maxAge: config.sessionTtlSeconds * 1000, path: '/' } }));
  app.use((req, _res, next) => {
    if (req.session.issuedAt && Date.now() - req.session.issuedAt >= config.sessionTtlSeconds * 1000) {
      req.session.regenerate(next);
    } else next();
  });
  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.get('origin') !== config.origin) return error(res, 403, 'ORIGIN_REJECTED', 'Request origin is not allowed.');
    const supplied = req.get('x-csrf-token') ?? '';
    const expected = req.session.csrf ?? '';
    if (!expected || !/^[a-f0-9]{64}$/.test(supplied) || supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
      return error(res, 403, 'CSRF_REJECTED', 'Refresh your session and try again.');
    }
    next();
  });
  app.get('/health', async (_req, res) => {
    try {
      await client.db().command({ ping: 1 });
      const upstream = await fetcher(`${config.aiUrl}/health`, { signal: AbortSignal.timeout(2000) });
      if (!upstream.ok) throw new Error('Scanner health unavailable');
      const health = await upstream.json() as { model?: string };
      res.json({ status: 'ok', database: 'ready', scanner: 'ready', model: health.model ?? 'unknown' });
    } catch { error(res, 503, 'NOT_READY', 'An internal service is unavailable.'); }
  });
  app.get('/api/v1/auth/session', async (req, res) => {
    req.session.csrf ??= token();
    req.session.issuedAt ??= Date.now();
    await save(req);
    res.json({ user: req.session.userId ? { email: req.session.email } : null, csrfToken: req.session.csrf,
      expiresAt: new Date(req.session.issuedAt + config.sessionTtlSeconds * 1000).toISOString() });
  });
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (_req, res) => error(res, 429, 'AUTH_RATE_LIMIT', 'Too many account attempts. Try again later.') });
  for (const action of ['register', 'login'] as const) {
    app.post(`/api/v1/auth/${action}`, authLimiter, async (req, res) => {
      const body = req.body;
      if (!body || Object.keys(body).sort().join(',') !== 'email,password' || typeof body.email !== 'string'
        || typeof body.password !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
        || body.password.length < 12 || body.password.length > 128) {
        return error(res, 400, 'INVALID_CREDENTIALS', 'Use a valid email and a password of 12–128 characters.');
      }
      const email = body.email.trim().toLowerCase();
      let user: User | null;
      if (action === 'register') {
        const passwordHash = await hashPassword(body.password);
        try {
          const inserted = await users.insertOne({ email, passwordHash, createdAt: new Date() });
          user = { _id: inserted.insertedId, email, passwordHash, createdAt: new Date() };
        } catch (exc) {
          if (exc instanceof MongoServerError && exc.code === 11000) return error(res, 409, 'ACCOUNT_UNAVAILABLE', 'Unable to create an account with those details.');
          throw exc;
        }
      } else {
        user = await users.findOne({ email });
        const matches = await verifyPassword(body.password, user?.passwordHash ?? dummyHash);
        if (!user || !matches) return error(res, 401, 'LOGIN_FAILED', 'Email or password is incorrect.');
      }
      await regenerate(req);
      req.session.userId = user!._id!.toString();
      req.session.email = email;
      req.session.csrf = token();
      req.session.issuedAt = Date.now();
      await save(req);
      res.status(action === 'register' ? 201 : 200).json({ user: { email }, csrfToken: req.session.csrf,
        expiresAt: new Date(req.session.issuedAt + config.sessionTtlSeconds * 1000).toISOString() });
    });
  }
  app.post('/api/v1/auth/logout', async (req, res) => {
    await new Promise<void>((resolve, reject) => req.session.destroy(e => e ? reject(e) : resolve()));
    res.clearCookie('phishai.sid', { httpOnly: true, sameSite: 'strict', secure: config.secureCookie, path: '/' });
    res.status(204).end();
  });
  app.post('/api/v1/scans', rateLimit({ windowMs: 60 * 1000, limit: 20,
    keyGenerator: req => req.session.userId ?? 'anonymous', validate: { keyGeneratorIpFallback: false },
    handler: (_req, res) => error(res, 429, 'SCAN_RATE_LIMIT', 'Scan limit reached. Wait one minute.') }), async (req, res) => {
    if (!req.session.userId) return error(res, 401, 'AUTH_REQUIRED', 'Sign in to scan a URL.');
    const requestId = randomUUID();
    const body = req.body;
    const payload = { schemaVersion: '1.0', requestId, url: body?.url };
    if (!body || Object.keys(body).join(',') !== 'url' || !validateRequest(payload)) {
      return error(res, 400, 'INVALID_URL', 'Submit one URL string of 1–4096 characters.');
    }
    try {
      const upstream = await fetcher(`${config.aiUrl}/internal/v1/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000), redirect: 'error',
      });
      if (upstream.status === 422) return error(res, 400, 'INVALID_URL', 'Enter a valid absolute HTTP or HTTPS URL.');
      if (!upstream.ok || !upstream.body) throw new Error('Scanner unavailable');
      const chunks: Uint8Array[] = [];
      let size = 0;
      for await (const chunk of upstream.body) {
        size += chunk.length;
        if (size > 65536) throw new Error('Scanner response too large');
        chunks.push(chunk);
      }
      const result: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!validate(result) || result.requestId !== requestId) throw new Error('Invalid scanner contract');
      res.json(result);
    } catch { error(res, 503, 'ANALYSIS_UNAVAILABLE', 'Analysis is unavailable. No safety verdict was produced.'); }
  });
  app.use('/api', (_req, res) => error(res, 404, 'NOT_FOUND', 'Endpoint not found.'));
  const assets = path.join(projectRoot, 'client/dist');
  if (existsSync(assets)) {
    app.use(express.static(assets));
    app.get('/', (_req, res) => res.sendFile(path.join(assets, 'index.html')));
  }
  app.use((exc: { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (exc.type === 'entity.too.large') return error(res, 413, 'BODY_TOO_LARGE', 'Request body is too large.');
    if (exc.type === 'entity.parse.failed') return error(res, 400, 'INVALID_JSON', 'Request must be valid JSON.');
    return error(res, 503, 'SERVICE_UNAVAILABLE', 'Service is temporarily unavailable.');
  });
  return { app, close: async () => { await client.close(); } };
}
