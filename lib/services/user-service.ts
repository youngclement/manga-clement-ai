import { apiFetch } from '@/lib/services/api-client';
import { handleApiError, safeAsync } from '@/lib/utils/error-handler';
import type { UserProfile } from '@/lib/types';

export const getMyProfile = async (): Promise<UserProfile | null> => {
  return safeAsync(async () => {
    const res = await apiFetch('/api/users/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      await handleApiError(res);
    }

    const data = await res.json();
    const profile = data?.data?.profile ?? data?.profile ?? null;
    return profile as UserProfile | null;
  }, null) as Promise<UserProfile | null>;
};

export const updateMyProfile = async (
  payload: { displayName?: string; bio?: string; avatarUrl?: string }
): Promise<UserProfile | null> => {
  return safeAsync(async () => {
    const res = await apiFetch('/api/users/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      await handleApiError(res);
    }

    const data = await res.json();
    const profile = data?.data?.profile ?? data?.profile ?? null;
    return profile as UserProfile | null;
  }, null) as Promise<UserProfile | null>;
};


