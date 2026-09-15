import { useEffect, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";

interface ScrollToTopButtonProps {
  /** The scrolling element to watch and return to the top of. */
  scrollRef: RefObject<HTMLElement>;
  /** Show once the user is this far down. */
  threshold?: number;
  className?: string;
}

/**
 * "Back to top", split out from the arrival pill on purpose.
 *
 * Megan's 1/29 framing: coming back to a feed you want to land where you were,
 * "but also maybe be able to go to the top." Production currently welds those
 * two jobs together — the pill moves you whether you wanted it to or not. Here
 * the pill never scrolls and this is the only control that does.
 *
 * Positioned bottom-center rather than bottom-right: the upload tray owns the
 * bottom-right corner, and two floating affordances stacking there is its own
 * problem.
 */
export function ScrollToTopButton({ scrollRef, threshold = 600, className }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => setVisible(el.scrollTop > threshold);
    onScroll();

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, threshold]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-30",
        "inline-flex items-center gap-2 h-9 pl-3 pr-4 rounded-full",
        "bg-[#12263f] text-white text-[13px] font-medium shadow-lg",
        "hover:bg-[#1c3a5e] transition-colors",
        className,
      )}
    >
      <i
        className="bi bi-arrow-up w-4 h-4 inline-flex items-center justify-center leading-none"
        aria-hidden="true"
      />
      Back to top
    </button>
  );
}
