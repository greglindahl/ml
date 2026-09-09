import { cn } from "@/lib/utils";

interface RelevanceIndicatorProps {
  className?: string;
}

/**
 * Reports that search results are relevance-ranked.
 *
 * Relevance has no table column, so when it is the active sort every column
 * header renders its neutral unsorted state and the table looks unsorted when
 * it is not. This is the only thing that says otherwise.
 *
 * State, not a control. It is deliberately not a chip, a button or a dropdown:
 * it reports the current ordering and cannot be clicked. It also does not
 * belong in the applied-filter chip row, because relevance describes how
 * results are ordered, not which results are included.
 *
 * Shown only while relevance is the active sort. Choosing a column sort makes
 * the table able to speak for itself again, so this disappears.
 */
export function RelevanceIndicator({ className }: RelevanceIndicatorProps) {
  return (
    <div
      className={cn("flex items-center gap-1.5 flex-shrink-0 text-[13px] text-muted-foreground", className)}
      aria-live="polite"
    >
      {/* Below 1200px the label shortens rather than the row rewrapping. */}
      <span className="cq-relevance-full whitespace-nowrap">Ranked by relevance</span>
      <span className="cq-relevance-short whitespace-nowrap">Relevance</span>
    </div>
  );
}
