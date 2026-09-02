import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: React.ReactNode;
  /**
   * Re-runs the request that failed, with the user's query and filters intact.
   * Leaving this off produces a dead end, so only do that where there is
   * genuinely nothing to retry.
   */
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Shown when a request FAILED, as opposed to succeeding with nothing to show.
 * That distinction is the whole point of this component: falling back to the
 * empty state here would tell the user their search matched nothing, when the
 * truth is it never ran. They would retype the query or conclude their library
 * is empty, and neither is true.
 *
 * Deliberately louder than EmptyState — a real Button rather than an inline
 * link — because the user cannot fix this by rewording anything. Retrying is
 * the only useful move, so it should not look optional.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't run your search. Your search and filters have been kept.",
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center py-16 text-center", className)}
    >
      <i className="bi bi-exclamation-triangle text-5xl text-muted-foreground/40 mb-4" />
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>}
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
