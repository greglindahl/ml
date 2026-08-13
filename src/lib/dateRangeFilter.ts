// Shared matcher for the Added Date / Captured Date filters. Both filters use
// the same range options; callers pass the asset date they apply to
// (dateCreated for Added, captureDate for Captured).

export type DateRangeValue =
  | "today"
  | "week"
  | "two-weeks"
  | "month"
  | "mtd"
  | "quarter"
  | "year"
  | "custom";

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
