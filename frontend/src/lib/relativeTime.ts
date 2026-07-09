/**
 * User-friendly, locale-aware timestamp formatting — the single source of truth
 * for how relative times and full tooltips render across the app.
 *
 * Uses only the built-in Intl APIs (no date library). The relative thresholds
 * are intentionally custom (spec below), so we compute them directly rather than
 * via Intl.RelativeTimeFormat's fixed buckets; absolute dates/times go through
 * Intl.DateTimeFormat so they stay locale-aware.
 *
 *   < 60s            → "Just now"
 *   < 60m            → "X min ago"
 *   < 24h            → "X hr(s) ago"
 *   calendar 1 day   → "Yesterday"
 *   < 30 days        → "X days ago"
 *   >= 30d same year → "Jun 30"
 *   different year   → "Jun 30, 2025"
 */

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function shortDate(d: Date, withYear: boolean): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(d);
}

/** Smart relative label. `now` is injectable for deterministic tests. */
export function relativeTime(input: string | number | Date, now: Date = new Date()): string {
  const then = new Date(input);
  if (isNaN(then.getTime())) return '';

  const seconds = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) {
    const h = Math.floor(seconds / 3600);
    return `${h} ${h === 1 ? 'hr' : 'hrs'} ago`;
  }

  const dayDiff = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (dayDiff <= 1) return 'Yesterday';
  if (dayDiff < 30) return `${dayDiff} days ago`;

  return shortDate(then, then.getFullYear() !== now.getFullYear());
}

/** Full timestamp for tooltips, e.g. "June 30, 2026 at 11:48 PM" (locale-aware). */
export function fullTimestamp(input: string | number | Date): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(d);
}
