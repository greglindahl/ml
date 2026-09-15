import { cn } from "@/lib/utils";

interface NewAssetsPillProps {
  count: number;
  onClick: () => void;
  className?: string;
}

/**
 * "N New Assets" arrival pill.
 *
 * Deliberately NOT a scroll control. In production, pressing this resets the
 * user's search parameters and jumps them to the top of the feed — the loudest
 * issue in the discovery notes (Randy 11/20, Lucy 11/24, and the reason Randy
 * Johnson Room keeps a second browser tab open). Here it only admits the
 * pending assets into the feed; filters, sort and scroll position are untouched.
 * Getting back to the top is a separate, explicit control.
 */
export function NewAssetsPill({ count, onClick, className }: NewAssetsPillProps) {
  if (count < 1) return null;

  const label = count === 1 ? "1 New Asset" : `${count > 99 ? "99+" : count} New Assets`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 h-8 pl-3 pr-3.5 rounded-full",
        "bg-[#d9f7e5] text-[#0d7333] text-[13px] font-medium",
        "border border-[#0d7333]/15 hover:bg-[#cdf2dc] transition-colors",
        className,
      )}
    >
      <i
        className="bi bi-arrow-clockwise w-4 h-4 inline-flex items-center justify-center leading-none"
        aria-hidden="true"
      />
      {label}
    </button>
  );
}
