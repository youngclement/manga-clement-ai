import { authStore } from './auth-client';

authStore.loadFromStorage();

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

function resolveBackendUrl(input: RequestInfo): RequestInfo {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    return `${BACKEND_BASE_URL}${input}`;
  }
  return input;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = authStore.getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(resolveBackendUrl('/api/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    return null;
  }

  const raw = await res.json();
  const payload = raw?.data ?? raw;
  if (payload?.accessToken && payload?.refreshToken) {
    authStore.setTokens(payload.accessToken, payload.refreshToken);
    return payload.accessToken as string;
  }

  return null;
}

export async function apiFetch(
  input: RequestInfo,
  init: RequestInit = {},
  retry = true,
): Promise<Response> {
  const token = authStore.getAccessToken();
  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const resolvedInput = resolveBackendUrl(input);

  const res = await fetch(resolvedInput, { ...init, headers });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      authStore.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error('Unauthenticated');
    }

    const retryHeaders = new Headers(init.headers || {});
    retryHeaders.set('Authorization', `Bearer ${newToken}`);

    return fetch(resolvedInput, { ...init, headers: retryHeaders });
  }

  return res;
}


