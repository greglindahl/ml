import { cn } from "@/lib/utils";
import { RELEVANCE_RESULT_LIMIT } from "@/lib/relevance";

interface RelevanceLimitNoticeProps {
  className?: string;
}

/**
 * End-of-results notice for relevance-sorted search.
 *
 * Relevance-sorted search stops at RELEVANCE_RESULT_LIMIT. Without a total
 * count anywhere in the assets view (deliberate — counting is expensive), the
 * cap is otherwise invisible: results simply stop, and the user cannot tell
 * whether they reached the end of their library or the end of what we will
 * show them. This one line is the only thing that distinguishes those.
 *
 * Kept quiet on purpose. It sets an expectation, it does not report a problem,
 * and every other sort still pages through everything.
 */
export function RelevanceLimitNotice({ className }: RelevanceLimitNoticeProps) {
  return (
    <p className={cn("py-8 text-center text-sm text-muted-foreground", className)}>
      Showing the top {RELEVANCE_RESULT_LIMIT.toLocaleString()} assets by relevance.
      {" "}Sort by any other field to see all results.
    </p>
  );
}
