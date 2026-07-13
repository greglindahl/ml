import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const NARROW_BREAKPOINT = 425;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

// At this width and below, side drawers are essentially full-width anyway —
// prefer a bottom sheet (matches the Library page's Filters pattern) over an
// awkwardly-anchored right-edge panel.
export function useIsNarrowScreen() {
  const [isNarrow, setIsNarrow] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${NARROW_BREAKPOINT}px)`);
    const onChange = () => {
      setIsNarrow(window.innerWidth <= NARROW_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsNarrow(window.innerWidth <= NARROW_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isNarrow;
}
