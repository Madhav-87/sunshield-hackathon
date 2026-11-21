import type { ApiErrorBody } from '../types/api.types';

const DEFAULT_BASE_URL = 'http://localhost:8000/api/v1';
const REQUEST_TIMEOUT_MS = 10_000;

export interface ApiRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  statusOnly?: boolean;
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly requestId?: string;
  readonly status?: number;

  constructor(message: string, code: string, requestId?: string, status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.requestId = requestId;
    this.status = status;
  }
}

export class ContractUnavailableError extends Error {
  constructor(endpoint: string) {
    super(
      `The finalized API contract for ${endpoint} is not available in the frontend workspace. No request was sent.`,
    );
    this.name = 'ContractUnavailableError';
  }
}

function normalizedBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL)
    .trim()
    .replace(/\/+$/, '');
  return configured.endsWith('/api/v1') ? configured : `${configured}/api/v1`;
}

function normalizedEndpoint(path: string): string {
  const cleanPath = path.trim().replace(/^\/+/, '');
  return cleanPath.startsWith('api/v1/') ? cleanPath.slice('api/v1/'.length) : cleanPath;
}

export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCKS !== 'false';
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const timeout = window.setTimeout(
    () => controller.abort(new DOMException('Request timed out', 'TimeoutError')),
    timeoutMs,
  );
  const forwardAbort = () => controller.abort(options.signal?.reason);

  if (options.signal?.aborted) forwardAbort();
  options.signal?.addEventListener('abort', forwardAbort, { once: true });

  try {
    const response = await fetch(`${normalizedBaseUrl()}/${normalizedEndpoint(path)}`, {
      method,
      signal: controller.signal,
      headers:
        body === undefined
          ? { Accept: 'application/json' }
          : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      let errorBody: ApiErrorBody | undefined;
      try {
        errorBody = (await response.json()) as ApiErrorBody;
      } catch {
        // Do not surface unstructured backend response bodies to workers.
      }
      throw new ApiClientError(
        errorBody?.error?.message || 'SunShield could not complete this request. Please try again.',
        errorBody?.error?.code || 'REQUEST_FAILED',
        errorBody?.error?.requestId,
        response.status,
      );
    }

    if (options.statusOnly) return response.status as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    if (controller.signal.aborted) {
      const timedOut =
        controller.signal.reason instanceof DOMException &&
        controller.signal.reason.name === 'TimeoutError';
      throw new ApiClientError(
        timedOut
          ? 'The service took too long to respond. Please try again.'
          : 'This request was cancelled.',
        timedOut ? 'REQUEST_TIMEOUT' : 'REQUEST_CANCELLED',
      );
    }
    throw new ApiClientError(
      'SunShield is having trouble connecting. Check your connection and try again.',
      'NETWORK_ERROR',
    );
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener('abort', forwardAbort);
  }
}

export const apiClient = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>('GET', path, undefined, options),
  getStatus: (path: string, options?: ApiRequestOptions) =>
    request<number>('GET', path, undefined, { ...options, statusOnly: true }),
  post: <T>(path: string, body: unknown, options?: ApiRequestOptions) =>
    request<T>('POST', path, body, options),
};
