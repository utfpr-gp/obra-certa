/**
 * Formats a civil date (`yyyy-MM-dd`, optionally followed by a time or offset) as `dd/MM/yyyy`.
 * It never builds a `Date`, so the calendar day is preserved regardless of the browser timezone.
 */
export function formatCivilDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}
