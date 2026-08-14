import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Sticky wrapper for a view's header block (search + filters + chips + bulk banner).
 *
 * Publishes its pinned bottom edge (sticky top offset + measured height) as
 * `--content-sticky-h` on its scroll parent, so sticky table header rows can pin
 * immediately beneath the block without overlapping (PORTAL-12949). A
 * ResizeObserver keeps the var current as the banner/chips appear and disappear.
 */
export function StickyHeaderBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const update = () => {
      const top = parseFloat(getComputedStyle(el).top) || 0;
      parent.style.setProperty("--content-sticky-h", `${el.offsetHeight + top}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      parent.style.removeProperty("--content-sticky-h");
    };
  }, []);

  return (
    <div ref={ref} className={cn("sticky top-0 z-20 bg-background pt-6", className)}>
      {children}
    </div>
  );
}
