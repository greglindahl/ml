import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Bootstrap icon class, e.g. "bi-image". */
  icon?: string;
  title: string;
  description?: React.ReactNode;
  /**
   * "no-results" — a query or filter excluded everything. Terse, no action:
   * the way out is the filter chips above the results.
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
  variant = "no-results",
  children,
  className,
}: EmptyStateProps) {
  const isEmpty = variant === "empty";

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <i className={cn("bi text-5xl text-muted-foreground/30 mb-4", icon)} />
      <h3 className={cn("mb-1", isEmpty ? "text-xl font-semibold mb-2" : "text-lg font-medium")}>{title}</h3>
      {description && (
        <p className={cn("text-sm text-muted-foreground", isEmpty && "max-w-sm mb-8")}>{description}</p>
      )}
      {children}
    </div>
  );
}
