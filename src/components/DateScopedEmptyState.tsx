import { EmptyState } from "@/components/EmptyState";
import type { DateRangeValue } from "@/lib/dateRangeFilter";

const RANGE_PHRASE: Partial<Record<DateRangeValue, string>> = {
  week: "in the last 7 days",
  "two-weeks": "in the last 14 days",
  month: "in the last 30 days",
  mtd: "this month",
  quarter: "in the last 90 days",
  year: "in the last 12 months",
  custom: "in that date range",
};

const linkClass = "text-primary hover:underline focus-visible:outline-none focus-visible:underline";

/**
 * No-results state for an Assets tab scoped by the Uploaded range control. Any
 * range short of All time is the likeliest culprit, so it offers All time
 * (Amber: straight there, no stepping through 90 days). "start over" clears
 * search and filters; it's dropped when nothing else is applied, since it
 * would only land back here.
 */
export function DateScopedEmptyState({
  uploaded,
  nothingElseApplied,
  onAllTime,
  onStartOver,
  title = "No assets found",
}: {
  uploaded: DateRangeValue;
  nothingElseApplied: boolean;
  onAllTime: () => void;
  onStartOver: () => void;
  title?: string;
}) {
  if (uploaded === "all-time") {
    return <EmptyState icon="bi-image" title={title} onClearAll={onStartOver} />;
  }
  const range = RANGE_PHRASE[uploaded] ?? "in that date range";
  const allTime = (
    <button type="button" onClick={onAllTime} className={linkClass}>
      All time
    </button>
  );
  return (
    <EmptyState
      icon="bi-image"
      title={title}
      description={
        nothingElseApplied ? (
          <>Nothing was uploaded {range}. Try {allTime}.</>
        ) : (
          <>
            Nothing uploaded {range} matches. Try {allTime}, or{" "}
            <button type="button" onClick={onStartOver} className={linkClass}>
              start over
            </button>
            .
          </>
        )
      }
    />
  );
}
