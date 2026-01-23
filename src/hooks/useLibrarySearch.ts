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
  totalCount: number;
  search: (query: string, facets: Facet[]) => void;
}

// Simulated API delay (200-600ms)
const SIMULATED_DELAY_MIN = 200;
const SIMULATED_DELAY_MAX = 600;

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
  const [totalCount, setTotalCount] = useState(mockLibraryAssets.length);

  const timeoutRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

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

    setIsLoading(true);

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

      const filters = facetsToFilters(query, facets);
      const searchResults = searchAssets(mockLibraryAssets, filters);

      // Sort by date (newest first)
      searchResults.sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime());

      setResults(searchResults);
      setTotalCount(searchResults.length);
      setIsLoading(false);
    }, delay);
  }, []);

  return { results, allAssets: mockLibraryAssets, isLoading, totalCount, search };
}
