import { formatCivilDate } from './civil-date';

describe('formatCivilDate', () => {
  it('formats a plain civil date', () => {
    expect(formatCivilDate('2026-01-31')).toBe('31/01/2026');
  });

  it('keeps the civil date of an ISO value with time, ignoring the timezone offset', () => {
    expect(formatCivilDate('2026-11-06T00:00:00Z')).toBe('06/11/2026');
  });

  it('does not shift the date near midnight', () => {
    expect(formatCivilDate('2026-03-01T02:30:00.000Z')).toBe('01/03/2026');
  });

  it('returns an unrecognized value unchanged', () => {
    expect(formatCivilDate('')).toBe('');
    expect(formatCivilDate('sem data')).toBe('sem data');
  });
});
