import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Bootstrap icon class, e.g. "bi-image". */
  icon?: string;
  title: string;
  /**
   * Subcopy naming this particular empty state. Composes with onClearAll rather
   * than being replaced by it: a state can both say something specific ("No
   * folders match your search.") and still offer the way out.
   */
  description?: React.ReactNode;
  /**
   * Wire this up on a no-results state to offer the user a way out. Renders the
   * standard reset sentence with an inline link and should clear every filter
   * AND the search, dropping the user back to an unfiltered view.
   *
   * This is deliberately a bigger hammer than the filter chip row's "Clear
   * Filters", which leaves the search alone. Hence "start over" rather than
   * another "clear" label: two clears with different blast radii on one screen
   * read as the same action.
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
  clearLabel = "start over",
  variant = "no-results",
  children,
  className,
}: EmptyStateProps) {
  const isEmpty = variant === "empty";

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <i className={cn("bi text-5xl text-muted-foreground/30 mb-4", icon)} />
      <h3 className={cn("mb-1", isEmpty ? "text-xl font-semibold mb-2" : "text-lg font-medium")}>{title}</h3>
      {(description || onClearAll) && (
        <div className={cn("flex flex-col items-center", isEmpty && "max-w-sm mb-8")}>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {onClearAll && (
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters, or{" "}
              <button
                type="button"
                onClick={onClearAll}
                className="text-primary hover:underline focus-visible:outline-none focus-visible:underline"
              >
                {clearLabel}
              </button>
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
