import type { TokenResponse } from '@/lib/api/types';
import { getSession, setSession } from '@/lib/auth/session-store';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ApiFetchInit extends RequestInit {
  accessToken?: string;
  skipAuthRetry?: boolean;
}

async function rawFetch<T>(path: string, init: ApiFetchInit): Promise<T> {
  const { accessToken, headers, ...rest } = init;
  const token = accessToken ?? getSession()?.accessToken;

  const response = await fetch(path, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? '요청을 처리하지 못했습니다.');
  }

  return body as T;
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
