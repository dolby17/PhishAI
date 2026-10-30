// Local demo using a real MongoDB child process. No system-wide installation.
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.chdir(root);
const runtime = path.join(root, '.runtime');
await mkdir(path.join(runtime, 'mongo'), { recursive: true });
let secret;
try { secret = await readFile(path.join(runtime, 'session-secret'), 'utf8'); }
catch { secret = randomBytes(48).toString('hex'); await writeFile(path.join(runtime, 'session-secret'), secret, { mode: 0o600 }); }
const python = path.join(root, '.venv/bin/python');
await access(python);
await access(path.join(root, 'client/dist/index.html'));
const mongo = await MongoMemoryServer.create({ binary: { version: '8.0.16', downloadDir: path.join(root, '.tools/mongodb'),
  os: { os: 'linux', dist: 'ubuntu', release: '22.04' } },
  instance: { ip: '127.0.0.1', dbPath: path.join(runtime, 'mongo'), dbName: 'phishai', storageEngine: 'wiredTiger' } });
const children = [];
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  await Promise.all(children.map(child => new Promise(resolve => {
    if (child.exitCode !== null) return resolve();
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 5000);
    child.once('exit', () => { clearTimeout(timer); resolve(); }); child.kill('SIGTERM');
  })));
  await mongo.stop({ doCleanup: false });
  process.exit(code);
}
const launch = (command, args, options) => {
  const child = spawn(command, args, { stdio: 'inherit', ...options });
  children.push(child);
  child.on('error', () => { console.error('A demo service could not start.'); void stop(1); });
  child.on('exit', code => { if (!stopping) { console.error('A demo service stopped.'); void stop(code || 1); } });
  return child;
};
launch(python, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--no-access-log'],
  { cwd: path.join(root, 'ai-service'), env: { ...process.env, OPENBLAS_NUM_THREADS: '2', OMP_NUM_THREADS: '2' } });
let ready = false;
for (let attempt = 0; attempt < 40; attempt++) {
  try { if ((await fetch('http://127.0.0.1:8000/health')).ok) { ready = true; break; } } catch {}
  await new Promise(resolve => setTimeout(resolve, 250));
}
if (!ready) { console.error('Scanner did not become ready.'); await stop(1); }
launch(process.execPath, ['server/dist/server/src/index.js'], { cwd: root,
  env: { ...process.env, HOST: '127.0.0.1', PORT: '3000', MONGO_URL: mongo.getUri('phishai'),
    AI_URL: 'http://127.0.0.1:8000', APP_ORIGIN: 'http://127.0.0.1:3000', SESSION_SECRET: secret,
    COOKIE_SECURE: 'false', SESSION_TTL_SECONDS: '28800' } });
process.once('SIGINT', () => void stop());
process.once('SIGTERM', () => void stop());
let appReady = false;
for (let attempt = 0; attempt < 40; attempt++) {
  try { if ((await fetch('http://127.0.0.1:3000/health')).ok) { appReady = true; break; } } catch {}
  await new Promise(resolve => setTimeout(resolve, 250));
}
if (!appReady) { console.error('Application did not become ready.'); await stop(1); }
console.log('Open http://127.0.0.1:3000 — local demo. Press Ctrl+C to stop.');
