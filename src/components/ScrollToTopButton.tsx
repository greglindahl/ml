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
  const [centerX, setCenterX] = useState<number | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => setVisible(el.scrollTop > threshold);
    onScroll();

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, threshold]);

  /**
   * Centre on the CONTENT AREA, not the viewport.
   *
   * This button is `fixed`, so a plain `left-1/2` centres it on the window —
   * but the arrival pill centres inside the content column, which the left nav
   * and folder sidebar push to the right. The two controls then sit ~60px apart
   * on a nominally centred axis. Measuring the scroll container puts both on the
   * same line, and the ResizeObserver keeps it true when the nav collapses or
   * the folder sidebar opens.
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setCenterX(rect.left + rect.width / 2);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [scrollRef]);

  if (!visible || centerX === null) return null;

  return (
    <button
      type="button"
      onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
      style={{ left: centerX }}
      className={cn(
        "fixed bottom-6 -translate-x-1/2 z-30",
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
