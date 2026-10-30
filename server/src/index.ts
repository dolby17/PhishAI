import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';
import { createApp } from './app.js';
import { existsSync } from 'node:fs';
import path from 'node:path';

const source = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = existsSync(path.resolve(source, '../../shared/contracts/analyze-v1.schema.json'))
  ? path.resolve(source, '../..') : path.resolve(source, '../../../..');
try {
  const config = loadConfig();
  const service = await createApp(config, projectRoot);
  const server = service.app.listen(config.port, config.host, () => console.log(`PhishAi API listening on ${config.host}:${config.port}`));
  const shutdown = () => server.close(() => { void service.close().finally(() => process.exit(0)); });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch {
  console.error('Startup failed. Check configuration and database availability; see README.md.');
  process.exit(1);
}
