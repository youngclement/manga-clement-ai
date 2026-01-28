/**
 * ID utilities (no React imports) — safe to use in both client and server.
 */

/**
 * Generate a UUID v4 string.
 *
 * Uses Web Crypto / Node Crypto `randomUUID()` when available.
 * Falls back to a best-effort non-UUID string to avoid crashing in old runtimes.
 */
export function generateId(): string {
  try {
    const c: any = typeof crypto !== 'undefined' ? crypto : null;
    if (c?.randomUUID) return c.randomUUID();
  } catch {
    // ignore
  }

  // Fallback (rare)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}


