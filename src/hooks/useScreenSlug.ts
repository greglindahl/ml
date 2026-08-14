import { useEffect } from "react";

/**
 * Keeps the address bar shareable for a screen: writes `?screen=<name>&tab=<tab>`
 * (replaceState, no history spam) on mount and whenever the tab changes, so any
 * page in the proto can be linked from a ticket by copying the URL.
 *
 * Library and Home don't use this — Library owns its richer param set
 * (?tab / ?gallery / ?folder / &bulk) in LibraryScreen, and Home is bare "/"
 * (written by Index when navigating home).
 */
export function useScreenSlug(screen: string, tab?: string) {
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("screen", screen);
    if (tab) params.set("tab", tab);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [screen, tab]);
}

/** Returns `candidate` when it's one of `allowed`, else undefined — for
    validating ?tab= values from the URL before seeding tab state. */
export function validTab<T extends string>(candidate: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.includes(candidate as T) ? (candidate as T) : undefined;
}
