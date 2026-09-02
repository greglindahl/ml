import { useState, useCallback, useEffect, useRef } from "react";
import { mockLibraryAssets, searchAssets, LibraryAsset, SearchFilters } from "@/lib/mockLibraryData";

interface Facet {
  field: string;
  value: string;
  label: string;
}

interface UseLibrarySearchResult {
  results: LibraryAsset[];
  allAssets: LibraryAsset[];
  isLoading: boolean;
  /** The search request itself failed. Distinct from succeeding with zero matches. */
  isError: boolean;
  totalCount: number;
  search: (query: string, facets: Facet[]) => void;
  /** Re-runs the last search with the same query and facets. */
  retry: () => void;
}

/**
 * Review affordance, not product behaviour.
 *
 * The mock API is a setTimeout, so it can never fail, which means the error
 * state would be impossible to see or review. Searching for any of these terms
 * makes the request fail instead of returning results.
 *
 * Delete this along with the isFailureTrigger check when a real API lands.
 */
const FAILURE_TRIGGERS = ["error", "fail", "500"];

function isFailureTrigger(query: string, facets: Facet[]): boolean {
  const terms = [query, ...facets.map((f) => f.value)];
  return terms.some((t) => FAILURE_TRIGGERS.includes(t.trim().toLowerCase()));
}

// Simulated API delay (200-600ms)
// PORTAL-12776 scope 7: search-as-you-type with ~250ms debounce, no submit step.
// The timeout doubles as the debounce — each keystroke cancels the pending run.
const SIMULATED_DELAY_MIN = 250;
const SIMULATED_DELAY_MAX = 250;

function getRandomDelay(): number {
  return Math.floor(Math.random() * (SIMULATED_DELAY_MAX - SIMULATED_DELAY_MIN + 1)) + SIMULATED_DELAY_MIN;
}

// Convert facets array to SearchFilters object
function facetsToFilters(query: string, facets: Facet[]): SearchFilters {
  const filters: SearchFilters = { query };

  facets.forEach((facet) => {
    switch (facet.field) {
      case "creator":
        filters.creator = [...(filters.creator || []), facet.value];
        break;
      case "type":
        filters.type = [...(filters.type || []), facet.value];
        break;
      case "date":
        filters.date = facet.value;
        break;
      case "aspect":
        filters.aspect = [...(filters.aspect || []), facet.value];
        break;
      case "status":
        filters.status = [...(filters.status || []), facet.value];
        break;
      case "tag":
        filters.tag = [...(filters.tag || []), facet.value];
        break;
    }
  });

  return filters;
}

export function useLibrarySearch(): UseLibrarySearchResult {
  const [results, setResults] = useState<LibraryAsset[]>(mockLibraryAssets);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [totalCount, setTotalCount] = useState(mockLibraryAssets.length);

  const timeoutRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  // The last search we were asked to run, so retry can repeat it verbatim. This is
  // what makes the error state recoverable: the user's query and facets survive the
  // failure, so retrying costs them nothing.
  const lastSearchRef = useRef<{ query: string; facets: Facet[] }>({ query: "", facets: [] });

  // Initial load
  useEffect(() => {
    setResults(mockLibraryAssets);
    setTotalCount(mockLibraryAssets.length);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const search = useCallback((query: string, facets: Facet[]) => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    lastSearchRef.current = { query, facets };

    setIsLoading(true);
    // Clear any previous failure up front, so a retry shows the skeleton rather
    // than the error state sitting there while the new request is in flight.
    setIsError(false);

    // Cancel any in-flight simulated request
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // If no query and no facets, immediately return all assets (no delay)
    if (!query.trim() && facets.length === 0) {
      const allResults = [...mockLibraryAssets].sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime());
      setResults(allResults);
      setTotalCount(allResults.length);
      setIsLoading(false);
      return;
    }

    // Simulate API delay for actual searches
    const delay = getRandomDelay();

    timeoutRef.current = window.setTimeout(() => {
      // Ignore stale results
      if (requestId !== requestIdRef.current) return;

      if (isFailureTrigger(query, facets)) {
        // Results are deliberately left untouched. The screen shows the error
        // state, so stale rows are never rendered, and holding them means a
        // successful retry has something to fall back to.
        setIsError(true);
        setIsLoading(false);
        return;
      }

      const filters = facetsToFilters(query, facets);
      const searchResults = searchAssets(mockLibraryAssets, filters);

      // Sort by date (newest first)
      searchResults.sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime());

      setResults(searchResults);
      setTotalCount(searchResults.length);
      setIsLoading(false);
    }, delay);
  }, []);

  const retry = useCallback(() => {
    const { query, facets } = lastSearchRef.current;
    search(query, facets);
  }, [search]);

  return { results, allAssets: mockLibraryAssets, isLoading, isError, totalCount, search, retry };
}
