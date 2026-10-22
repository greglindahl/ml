/**
 * One date format for every date column in the library tables (Uploaded,
 * Captured, Created, Last Added): "Oct 22, 2026", exact time on hover. Mixing
 * "7 hours ago", "Oct 22, 26" and "10/21/26" made side-by-side dates hard to
 * compare (timestamp design pass, 10/22 call). Column names are unchanged.
 */

const DAY = 86_400_000;
const UNIT_MS: Record<string, number> = {
  minute: 60_000,
  hour: 3_600_000,
  day: DAY,
  week: 7 * DAY,
  month: 30 * DAY,
  year: 365 * DAY,
};

/** Some mock rows store "13 hours ago" instead of a Date; turn those into one. */
export function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (/just now|today/i.test(value)) return new Date();
  const m = value.match(/(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/i);
  if (m) return new Date(Date.now() - Number(m[1]) * UNIT_MS[m[2].toLowerCase()]);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export const formatTableDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatFull = (d: Date) =>
  `${formatTableDate(d)}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

export function TableDate({ value, className }: { value: Date | string | null | undefined; className?: string }) {
  const date = toDate(value);
  // Never wrap: a date split across two lines ("Oct 21, / 2026") is harder to scan.
  const cls = `whitespace-nowrap ${className ?? ""}`.trim();
  if (!date) return <span className={cls}>-</span>;
  return (
    <time dateTime={date.toISOString()} title={formatFull(date)} className={cls}>
      {formatTableDate(date)}
    </time>
  );
}
