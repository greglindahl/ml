import { cn } from "@/lib/utils";

/** The Prev / pages / Next footer every list table shares (lifted from GroupsTable). */
export function TablePagination({
  page,
  perPage,
  total,
  onPageChange,
}: {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex items-stretch w-full">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={atStart}
          className={cn(
            "flex items-center justify-center gap-2 px-6 h-16 bg-[#edf2f9] border border-border rounded-bl-lg text-[15px]",
            atStart ? "text-muted-foreground cursor-not-allowed" : "text-foreground hover:bg-muted",
          )}
        >
          <i className="bi bi-arrow-left" />
          Prev
        </button>
        <div className="flex-1 flex items-center justify-center gap-2 border-y border-border bg-white">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(0, 5)
            .map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center text-[15px] rounded",
                  page === p ? "border-b-2 border-primary font-medium" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {p}
              </button>
            ))}
        </div>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={atEnd}
          className={cn(
            "flex items-center justify-center gap-2 px-6 h-16 bg-[#edf2f9] border border-border rounded-br-lg text-[15px]",
            atEnd ? "text-muted-foreground cursor-not-allowed" : "text-foreground hover:bg-muted",
          )}
        >
          Next
          <i className="bi bi-arrow-right" />
        </button>
      </div>
      <span className="text-[13px] text-foreground">
        Viewing {start} - {end} of {total}
      </span>
    </div>
  );
}
