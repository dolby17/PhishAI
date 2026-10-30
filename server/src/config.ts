export type Config = {
  host: string; port: number; origin: string; mongoUrl: string; aiUrl: string;
  sessionSecret: string; secureCookie: boolean; sessionTtlSeconds: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const secret = env.SESSION_SECRET ?? '';
  if (secret.length < 32 || secret.startsWith('replace-')) throw new Error('Set SESSION_SECRET to at least 32 random characters.');
  const port = Number(env.PORT ?? 3000);
  const ttl = Number(env.SESSION_TTL_SECONDS ?? 28800);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT.');
  if (!Number.isInteger(ttl) || ttl < 60 || ttl > 86400) throw new Error('Session TTL must be 60–86400 seconds.');
  const origin = env.APP_ORIGIN ?? 'http://127.0.0.1:3000';
  if (new URL(origin).origin !== origin) throw new Error('APP_ORIGIN must be an exact origin.');
  const aiUrl = env.AI_URL ?? 'http://127.0.0.1:8000';
  if (!['http:', 'https:'].includes(new URL(aiUrl).protocol)) throw new Error('Invalid AI_URL.');
  return { host: env.HOST ?? '127.0.0.1', port, origin,
    mongoUrl: env.MONGO_URL ?? 'mongodb://127.0.0.1:27017/phishai', aiUrl,
    sessionSecret: secret, secureCookie: env.COOKIE_SECURE === 'true', sessionTtlSeconds: ttl };
}
