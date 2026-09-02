import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Bootstrap icon class, e.g. "bi-image". */
  icon?: string;
  title: string;
  /** Static subcopy. Ignored when onClearAll is set — the reset sentence takes its place. */
  description?: React.ReactNode;
  /**
   * Wire this up on a no-results state to offer the user a way out. Renders the
   * standard reset sentence with an inline link and should clear every filter
   * AND the search, dropping the user back to an unfiltered view.
   */
  onClearAll?: () => void;
  /** Link text at the end of the reset sentence. Keep it a verb phrase. */
  clearLabel?: string;
  /**
   * "no-results" — a query or filter excluded everything. Terse.
   * "empty" — nothing exists here yet. Roomier, usually paired with an action.
   */
  variant?: "no-results" | "empty";
  /** Optional actions, rendered under the description. */
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = "bi-image",
  title,
  description,
  onClearAll,
  clearLabel = "clear all",
  variant = "no-results",
  children,
  className,
}: EmptyStateProps) {
  const isEmpty = variant === "empty";

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <i className={cn("bi text-5xl text-muted-foreground/30 mb-4", icon)} />
      <h3 className={cn("mb-1", isEmpty ? "text-xl font-semibold mb-2" : "text-lg font-medium")}>{title}</h3>
      {onClearAll ? (
        <p className={cn("text-sm text-muted-foreground", isEmpty && "max-w-sm mb-8")}>
          Try adjusting your search or filters, or{" "}
          <button
            type="button"
            onClick={onClearAll}
            className="text-primary hover:underline focus-visible:outline-none focus-visible:underline"
          >
            {clearLabel}
          </button>
        </p>
      ) : (
        description && (
          <p className={cn("text-sm text-muted-foreground", isEmpty && "max-w-sm mb-8")}>{description}</p>
        )
      )}
      {children}
    </div>
  );
}
