// Shared matcher for the Uploaded Date / Captured Date filters. Both filters use
// the same range options; callers pass the asset date they apply to
// (dateCreated for Uploaded, captureDate for Captured).

export type DateRangeValue =
  | "today"
  | "week"
  | "two-weeks"
  | "month"
  | "mtd"
  | "quarter"
  | "year"
  | "all-time"
  | "custom";

/**
 * All Assets' Uploaded filter always has a selection (default sort decision,
 * Oct 2026): defaults to Last 30 days, offers All time explicitly, and clearing
 * resets to 30 days instead of leaving it unfiltered. The last choice persists
 * in the browser; with nothing stored it falls back to 30 days.
 */
export const UPLOADED_DEFAULT: DateRangeValue = "month";
const UPLOADED_KEY = "filter.assets.uploaded";
const PERSISTED_UPLOADED: DateRangeValue[] = ["week", "two-weeks", "month", "mtd", "quarter", "year", "all-time"];

export function readStoredUploaded(): DateRangeValue {
  try {
    const v = localStorage.getItem(UPLOADED_KEY) as DateRangeValue | null;
    return v && PERSISTED_UPLOADED.includes(v) ? v : UPLOADED_DEFAULT;
  } catch {
    return UPLOADED_DEFAULT;
  }
}

/** Custom ranges aren't stored; a reload with one applied comes back to the last preset. */
export function storeUploaded(value: string) {
  if (!PERSISTED_UPLOADED.includes(value as DateRangeValue)) return;
  try {
    localStorage.setItem(UPLOADED_KEY, value);
  } catch {
    // Storage unavailable — the 30-day default still applies.
  }
}

export interface CustomRange {
  from: Date | undefined;
  to: Date | undefined;
}

const DAY_LIMITS: Record<string, number> = {
  week: 7,
  "two-weeks": 14,
  month: 30,
  quarter: 90,
  year: 365,
};

export function matchesDateRange(
  date: Date,
  filter: DateRangeValue,
  customRange?: CustomRange
): boolean {
  if (filter === "all-time") return true;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (filter === "custom") {
    // No range applied yet — don't filter anything out
    if (!customRange?.from || !customRange?.to) return true;
    const fromDate = new Date(customRange.from.getFullYear(), customRange.from.getMonth(), customRange.from.getDate());
    const toDate = new Date(customRange.to.getFullYear(), customRange.to.getMonth(), customRange.to.getDate());
    return day >= fromDate && day <= toDate;
  }

  if (filter === "mtd") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return day >= monthStart && day <= today;
  }

  const diffDays = Math.floor((today.getTime() - day.getTime()) / 86400000);
  if (filter === "today") return diffDays === 0;
  return diffDays <= (DAY_LIMITS[filter] ?? 365);
}
