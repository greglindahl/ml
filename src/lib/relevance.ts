import type { LibraryAsset } from "@/lib/mockLibraryData";

/**
 * Production cap on relevance-sorted search results.
 *
 * The de-duplication fix (same asset appearing twice while paging) requires a
 * bounded result window, so relevance-sorted search stops here. Every other
 * sort still pages through the whole library.
 *
 * This is the number the notice shows the user. Keep it in sync with the
 * backend; if the cap moves, the copy moves with it.
 */
export const RELEVANCE_RESULT_LIMIT = 1000;

/**
 * PROTOTYPE ONLY — the number we actually cap at here.
 *
 * The sample library holds roughly 200 assets, so the real 1,000 limit can
 * never be reached and the notice would be impossible to review. Capping low
 * lets the notice appear in its real position, at the end of a real result
 * list, while still displaying RELEVANCE_RESULT_LIMIT as the number.
 *
 * Set this to RELEVANCE_RESULT_LIMIT (or delete the cap) once there is a real
 * backend behind the search.
 */
export const PROTOTYPE_RELEVANCE_LIMIT = 20;

/**
 * Applies the relevance cap. Returns the list untouched for every other sort,
 * because only relevance is limited.
 */
export function capRelevanceResults<T>(results: T[], sortField: string | null): T[] {
  if (sortField !== "relevance") return results;
  return results.slice(0, PROTOTYPE_RELEVANCE_LIMIT);
}

/**
 * True when the cap actually trimmed something, i.e. the notice should show.
 *
 * Takes the count BEFORE capping, so a search that happens to return exactly
 * the limit does not claim results were withheld when none were.
 */
export function isRelevanceCapped(uncappedCount: number, sortField: string | null): boolean {
  return sortField === "relevance" && uncappedCount > PROTOTYPE_RELEVANCE_LIMIT;
}

// Mock relevance ranking (PORTAL-12776): match strength against the text query.
// Name hits outrank tag hits outrank creator hits; prefix beats substring.
// Real ranking comes from the search backend.
export function relevanceScore(asset: LibraryAsset, q: string) {
  const query = q.toLowerCase();
  let score = 0;
  const name = asset.name.toLowerCase();
  if (name === query) score += 200;
  else if (name.startsWith(query)) score += 150;
  else if (name.includes(query)) score += 100;
  if (asset.tags.some(t => t.toLowerCase() === query)) score += 60;
  else if (asset.tags.some(t => t.toLowerCase().includes(query))) score += 40;
  if (asset.creator.toLowerCase().includes(query)) score += 20;
  return score;
}
