import { relativeTime, fullTimestamp } from './relativeTime';

const now = new Date('2026-06-30T23:48:00'); // local
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
const S = 1000, M = 60 * S, H = 60 * M, D = 24 * H;

describe('relativeTime — smart thresholds', () => {
  it('< 60s → Just now', () => {
    expect(relativeTime(ago(0), now)).toBe('Just now');
    expect(relativeTime(ago(59 * S), now)).toBe('Just now');
  });
  it('< 60m → X min ago', () => {
    expect(relativeTime(ago(1 * M), now)).toBe('1 min ago');
    expect(relativeTime(ago(45 * M), now)).toBe('45 min ago');
  });
  it('< 24h → X hr(s) ago (never huge hour counts)', () => {
    expect(relativeTime(ago(1 * H), now)).toBe('1 hr ago');
    expect(relativeTime(ago(5 * H), now)).toBe('5 hrs ago');
    expect(relativeTime(ago(23 * H), now)).toBe('23 hrs ago');
    // the bug we're fixing: 728h must NOT appear
    expect(relativeTime(ago(728 * H), now)).not.toMatch(/hr/);
  });
  it('calendar yesterday → Yesterday', () => {
    expect(relativeTime(new Date('2026-06-29T08:00:00').toISOString(), now)).toBe('Yesterday');
  });
  it('< 30 days → X days ago', () => {
    expect(relativeTime(ago(2 * D), now)).toBe('2 days ago');
    expect(relativeTime(ago(10 * D), now)).toMatch(/days ago/);
  });
  it('>= 30 days, same year → "Mon D"', () => {
    const r = relativeTime(new Date('2026-05-01T10:00:00').toISOString(), now);
    expect(r).toMatch(/May 1/);
    expect(r).not.toMatch(/2026/); // no year for same-year
  });
  it('different year → "Mon D, YYYY"', () => {
    const r = relativeTime(new Date('2025-06-30T10:00:00').toISOString(), now);
    expect(r).toMatch(/Jun 30/);
    expect(r).toMatch(/2025/);
  });
  it('handles invalid input gracefully', () => {
    expect(relativeTime('not-a-date', now)).toBe('');
  });
});

describe('fullTimestamp — tooltip', () => {
  it('renders a full, human date + time', () => {
    const t = fullTimestamp('2026-06-30T23:48:00');
    expect(t).toMatch(/June 30, 2026/);
    expect(t).toMatch(/PM/); // 11:48 PM
  });
  it('handles invalid input', () => {
    expect(fullTimestamp('nope')).toBe('');
  });
});
