// Optional Linux x86-64 review tooling from Mozilla's pinned official release.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

if (process.platform !== 'linux' || process.arch !== 'x64') throw new Error('This review helper targets Linux x86-64 with Firefox installed.');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = path.join(root, '.tools/browser');
const binary = path.join(folder, 'geckodriver');
const binarySha = 'f831b7e61454804e8a307edd951bf8a5f373efe3f718e75454a6485a51f6e39f';
const archiveSha = 'e815130ea95983e162ae91843b48d3a3ce991735635fce83a647afde21e09f7e';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
try {
  if (sha256(await readFile(binary)) === binarySha) { console.log('Verified Mozilla geckodriver 0.37.1 already installed locally.'); process.exit(0); }
} catch {}
await mkdir(folder, { recursive: true });
const response = await fetch('https://github.com/mozilla/geckodriver/releases/download/v0.37.1/geckodriver-v0.37.1-linux64.tar.gz', { signal: AbortSignal.timeout(90000) });
if (!response.ok) throw new Error('Unable to download official Mozilla WebDriver.');
const bytes = Buffer.from(await response.arrayBuffer());
if (sha256(bytes) !== archiveSha) throw new Error('WebDriver archive checksum mismatch.');
const archive = path.join(folder, 'geckodriver.tar.gz');
await writeFile(archive, bytes);
if (execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim() !== 'geckodriver') throw new Error('Unexpected WebDriver archive contents.');
execFileSync('tar', ['--no-same-owner', '-xzf', archive, '-C', folder, 'geckodriver']);
await chmod(binary, 0o755);
if (sha256(await readFile(binary)) !== binarySha) throw new Error('WebDriver binary checksum mismatch.');
console.log('Verified Mozilla geckodriver 0.37.1 installed in .tools/browser.');
