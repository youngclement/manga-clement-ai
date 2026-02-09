export function generateId(): string {
  try {
    const c: any = typeof crypto !== 'undefined' ? crypto : null;
    if (c?.randomUUID) return c.randomUUID();
  } catch {
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
