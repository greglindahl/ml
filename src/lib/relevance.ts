import type { LibraryAsset } from "@/lib/mockLibraryData";

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
