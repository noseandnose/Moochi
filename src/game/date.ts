/** Local calendar date key, e.g. 2026-10-13. Uses the device's local time. */
export function dateKey(now: number | Date = Date.now()): string {
  const d = typeof now === 'number' ? new Date(now) : now;
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Parses a date key into a local Date at noon (safe across DST changes). */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  // Reject impossible dates such as 2026-13-45: a real key round-trips through Date.
  return dateKey(fromDateKey(value)) === value;
}

/** Keys for the last `count` local days ending today, oldest first. */
export function recentDateKeys(now: number | Date, count: number): string[] {
  const base = typeof now === 'number' ? new Date(now) : now;
  const keys: string[] = [];
  for (let offset = count - 1; offset >= 0; offset--) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - offset, 12);
    keys.push(dateKey(d));
  }
  return keys;
}

export function dateKeyToNumber(key: string): number {
  return Number(key.replace(/-/g, '')) || 0;
}

/** The date key `offset` days after `key` (negative for earlier days). */
export function shiftDateKey(key: string, offset: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + offset, 12));
}
