import type { TokenResponse } from '@/api/auth/types';
import { getSession, setSession } from '@/lib/auth/session-store';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type QueryAtom = string | number | boolean;
type QueryParamValue = QueryAtom | QueryAtom[] | undefined | null;

interface ApiFetchInit extends RequestInit {
  accessToken?: string;
  skipAuthRetry?: boolean;
  params?: Record<string, QueryParamValue>;
}

// 백엔드가 KONECT 운영 서버와 자원을 공유해 응답이 느릴 수 있다 — 모바일 웹뷰 기준 10s보다 넉넉하게 둔다.
const DEFAULT_TIMEOUT_MS = 30_000;

function buildQuery(params: Record<string, QueryParamValue>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          usp.append(key, String(item));
        }
      });
    } else {
      usp.append(key, String(value));
    }
  }
  return usp.toString();
}

function withQuery(path: string, params?: Record<string, QueryParamValue>): string {
  if (!params) {
    return path;
  }
  const query = buildQuery(params);
  return query ? `${path}${path.includes('?') ? '&' : '?'}${query}` : path;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null;
  }
  return response.json().catch(() => null);
}

async function rawFetch<T>(path: string, init: ApiFetchInit): Promise<T> {
  const { accessToken, headers, params, ...rest } = init;
  const token = accessToken ?? getSession()?.accessToken;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(withQuery(path, params), {
      ...rest,
      credentials: 'include',
      signal: rest.signal ?? timeoutController.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });

    const body = await parseBody(response);

    if (!response.ok) {
      const message = (body as { message?: string } | null)?.message ?? '요청을 처리하지 못했습니다.';
      throw new ApiError(response.status, message);
    }

    return body as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

let reissuePromise: Promise<TokenResponse> | null = null;

export function reissueAccessToken(): Promise<TokenResponse> {
  if (!reissuePromise) {
    reissuePromise = rawFetch<TokenResponse>('/v1/auth/reissue', {
      method: 'POST',
      skipAuthRetry: true,
    }).finally(() => {
      reissuePromise = null;
    });
  }
  return reissuePromise;
}

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  try {
    return await rawFetch<T>(path, init);
  } catch (err) {
    const usesSessionToken = !init.accessToken && !init.skipAuthRetry;
    if (!(err instanceof ApiError) || err.status !== 401 || !usesSessionToken || !getSession()) {
      throw err;
    }

    let newToken: TokenResponse;
    try {
      newToken = await reissueAccessToken();
    } catch {
      setSession(null);
      throw err;
    }

    const current = getSession();
    if (current) {
      setSession({ ...current, accessToken: newToken.accessToken });
    }
    return rawFetch<T>(path, { ...init, accessToken: newToken.accessToken, skipAuthRetry: true });
  }
}

type HttpInit = Omit<ApiFetchInit, 'method' | 'body'>;

function jsonBody(body: unknown): Pick<ApiFetchInit, 'body'> {
  return body === undefined ? {} : { body: JSON.stringify(body) };
}

/**
 * 도메인 api.ts에서 쓰는 메서드 단축 헬퍼. 인증·401 재발급 재시도는 apiFetch에 그대로 위임한다.
 */
export const apiClient = {
  get: <T>(path: string, init: HttpInit = {}) => apiFetch<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init: HttpInit = {}) =>
    apiFetch<T>(path, { ...init, ...jsonBody(body), method: 'POST' }),
  put: <T>(path: string, body?: unknown, init: HttpInit = {}) =>
    apiFetch<T>(path, { ...init, ...jsonBody(body), method: 'PUT' }),
  patch: <T>(path: string, body?: unknown, init: HttpInit = {}) =>
    apiFetch<T>(path, { ...init, ...jsonBody(body), method: 'PATCH' }),
  delete: <T>(path: string, init: HttpInit = {}) => apiFetch<T>(path, { ...init, method: 'DELETE' }),
};
