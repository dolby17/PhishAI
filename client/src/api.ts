export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message); }
}

export async function request<T>(route: string, options: {
  method?: string; body?: unknown; csrf?: string; signal?: AbortSignal;
} = {}): Promise<T> {
  const response = await fetch(`/api/v1${route}`, {
    method: options.method ?? 'GET', credentials: 'same-origin',
    headers: { ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.csrf ? { 'X-CSRF-Token': options.csrf } : {}) },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal ?? AbortSignal.timeout(12000),
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.error?.message ?? 'The request failed. Please try again.', response.status, data?.error?.code ?? 'REQUEST_FAILED');
  if (data === null) throw new Error('The application returned an unreadable response. Please try again.');
  return data as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof DOMException && error.name === 'TimeoutError') return 'The request took too long. Please try again.';
  return 'Cannot reach the application. Check the connection and try again.';
}
