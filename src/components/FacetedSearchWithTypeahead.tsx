import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, X, User, Tag, Folder, Clock, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LibraryAsset, AI_GENERATED_TAGS } from "@/lib/mockLibraryData";

interface FacetGroup {
  label: string;
  facets: string[];
}

const facetGroups: FacetGroup[] = [
  {
    label: "Content & Context",
    facets: [
      "Football", "Basketball", "Baseball", "Esports",
      "Solo (1)", "Small Group (2-4)", "Team Shot (5+)", "Crowd/Fans",
      "Looking at Camera", "Candid", "Headshot",
    ],
  },
  {
    label: "Teams",
    facets: [
      "Lakers", "Warriors", "Celtics", "Heat", "Nets", "Bucks", "Mavericks", "Suns",
      "Chiefs", "49ers", "Cowboys", "Patriots", "Eagles", "Packers", "Bills",
      "Yankees", "Dodgers", "Red Sox", "Cubs",
    ],
  },
  {
    label: "People",
    facets: [
      "Lebron James", "Steph Curry", "Kevin Durant", "Giannis Antetokounmpo", "Luka Doncic",
    ],
  },
  {
    label: "Media Type",
    facets: ["Photo", "Video"],
  },
  {
    label: "Orientation",
    facets: ["Landscape", "Portrait", "Square"],
  },
  {
    label: "Resolution",
    facets: ["8192x5464", "6000x4000", "5712x3808", "5790x3860", "5705x3803", "5754x3836", "5380x3587"],
  },
  {
    label: "File Format",
    facets: ["JPG", "PNG", "HEIC", "MP4", "MOV", "ProRes"],
  },
  {
    label: "Video Duration",
    facets: ["0-15s", "15-30s", "30-60s", "60s+"],
  },
  {
    label: "Workflow",
    facets: ["Active", "Archived", "Embargoed", "Approved", "Pending Review", "Has Audio"],
  },
];

interface Suggestion {
  type: "asset" | "creator" | "tag" | "facet";
  value: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  category?: string; // The group label for facets
  isAiGenerated?: boolean;
}

interface SelectedFacet {
  value: string;
  type: "tag" | "facet";
  category: string; // e.g., "Tag", "People", "Teams", etc.
  isAiGenerated?: boolean;
}

interface FacetedSearchWithTypeaheadProps {
  onSearch?: (query: string, selectedFacets: string[]) => void;
  onFacetCountsChange?: (counts: Record<string, number>) => void;
  assets?: LibraryAsset[];
}

// Helper to filter assets based on query and facets
function filterAssets(assets: LibraryAsset[], query: string, selectedFacets: string[]): LibraryAsset[] {
  return assets.filter(asset => {
    // Text query match - each word in query must match somewhere
    if (query) {
      const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const nameLower = asset.name.toLowerCase();
      const creatorLower = asset.creator.toLowerCase();
      const tagsLower = asset.tags.map(t => t.toLowerCase());
      
      const allWordsMatch = words.every(word => {
        const matchesName = nameLower.includes(word);
        const matchesCreator = creatorLower.includes(word);
        const matchesTags = tagsLower.some(t => t.includes(word));
        return matchesName || matchesCreator || matchesTags;
      });
      
      if (!allWordsMatch) return false;
    }

    // Facet match - ALL selected facets must match (AND logic)
    if (selectedFacets.length > 0) {
      const lowerFacets = selectedFacets.map(f => f.toLowerCase());
      const allFacetsMatch = lowerFacets.every(facet => {
        const matchesTag = asset.tags.some(tag => tag.toLowerCase() === facet);
        const matchesType = asset.type.toLowerCase() === facet;
        const matchesPhoto = facet === "photo" && asset.type === "image";
        const matchesVideo = facet === "video" && asset.type === "video";
        return matchesTag || matchesType || matchesPhoto || matchesVideo;
      });
      if (!allFacetsMatch) return false;
    }

    return true;
  });
}

// Helper to count assets matching a facet within filtered results
function countAssetsForFacet(assets: LibraryAsset[], facet: string): number {
  const lowerFacet = facet.toLowerCase();
  return assets.filter(asset => 
    asset.tags.some(tag => tag.toLowerCase() === lowerFacet) ||
    asset.type.toLowerCase() === lowerFacet ||
    (facet.toLowerCase() === "photo" && asset.type === "image") ||
    (facet.toLowerCase() === "video" && asset.type === "video")
  ).length;
}

const RECENT_SEARCHES_KEY = "library-recent-searches";
const MAX_RECENT_SEARCHES = 5;

export function FacetedSearchWithTypeahead({ onSearch, onFacetCountsChange, assets = [] }: FacetedSearchWithTypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacets, setSelectedFacets] = useState<SelectedFacet[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extract just the values for filtering
  const selectedFacetValues = useMemo(() => selectedFacets.map(f => f.value), [selectedFacets]);

  // Filter assets based on current query and selected facets
  const filteredAssets = useMemo(() => {
    return filterAssets(assets, searchQuery, selectedFacetValues);
  }, [assets, searchQuery, selectedFacetValues]);

  // Compute dynamic facet counts based on filtered assets
  const facetCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    facetGroups.forEach(group => {
      group.facets.forEach(facet => {
        counts[facet] = countAssetsForFacet(filteredAssets, facet);
      });
    });
    return counts;
  }, [filteredAssets]);

  // Notify parent of facet count changes
  useEffect(() => {
    onFacetCountsChange?.(facetCounts);
  }, [facetCounts, onFacetCountsChange]);

  // Trigger search when query or facets change
  useEffect(() => {
    onSearch?.(searchQuery, selectedFacetValues);
  }, [searchQuery, selectedFacetValues, onSearch]);

  // Helper to get icon for a facet group
  const getIconForGroup = (groupLabel: string): React.ReactNode => {
    if (groupLabel === "People") {
      return <User className="w-4 h-4 text-muted-foreground" />;
    }
    return <Folder className="w-4 h-4 text-muted-foreground" />;
  };

  // Generate typeahead suggestions based on query
  const suggestions = useMemo((): Suggestion[] => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: Suggestion[] = [];

    // Get unique creators from filtered assets
    const creators = [...new Set(filteredAssets.map(a => a.creator))];
    creators
      .filter(c => c.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach(creator => {
        const count = filteredAssets.filter(a => a.creator === creator).length;
        results.push({
          type: "creator",
          value: creator,
          label: creator,
          icon: <User className="w-4 h-4 text-muted-foreground" />,
          count,
        });
      });

    // Match "People" facets FIRST (before tags) - People are AI-recognized
    const peopleGroup = facetGroups.find(g => g.label === "People");
    if (peopleGroup) {
      peopleGroup.facets
        .filter(f => f.toLowerCase().includes(query) && !selectedFacetValues.includes(f))
        .slice(0, 3)
        .forEach(facet => {
          const count = facetCounts[facet] || 0;
          if (count > 0) {
            results.push({
              type: "facet",
              value: facet,
              label: `People: ${facet}`,
              icon: <User className="w-4 h-4 text-muted-foreground" />,
              count,
              category: "People",
              isAiGenerated: true, // People are always AI-recognized
            });
          }
        });
    }

    // Get unique tags from filtered assets
    const allTags = [...new Set(filteredAssets.flatMap(a => a.tags))];
    allTags
      .filter(t => t.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach(tag => {
        const count = filteredAssets.filter(a => a.tags.includes(tag)).length;
        const isAi = AI_GENERATED_TAGS.has(tag);
        results.push({
          type: "tag",
          value: tag,
          label: `Tag: ${tag}`,
          icon: <Tag className="w-4 h-4 text-muted-foreground" />,
          count,
          category: "Tag",
          isAiGenerated: isAi,
        });
      });

    // Match other facets (excluding People since we handled it above)
    facetGroups
      .filter(group => group.label !== "People")
      .forEach(group => {
        group.facets
          .filter(f => f.toLowerCase().includes(query) && !selectedFacetValues.includes(f))
          .slice(0, 2)
          .forEach(facet => {
            const count = facetCounts[facet] || 0;
            if (count > 0) {
              results.push({
                type: "facet",
                value: facet,
                label: `${group.label}: ${facet}`,
                icon: getIconForGroup(group.label),
                count,
                category: group.label,
              });
            }
          });
      });


    return results.slice(0, 8);
  }, [searchQuery, filteredAssets, selectedFacetValues, facetCounts]);

  const handleFacetToggle = useCallback((facetValue: string, type: "tag" | "facet", category: string, isAiGenerated?: boolean) => {
    setSelectedFacets((prev) => {
      const exists = prev.some(f => f.value === facetValue);
      if (exists) {
        return prev.filter((f) => f.value !== facetValue);
      } else {
        return [...prev, { value: facetValue, type, category, isAiGenerated }];
      }
    });
  }, []);

  const handleRemoveFacet = useCallback((facetValue: string) => {
    setSelectedFacets((prev) => prev.filter((f) => f.value !== facetValue));
  }, []);

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const addToRecentSearches = useCallback((query: string) => {
    if (!query.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addToRecentSearches(searchQuery);
      setIsOpen(false);
    }
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    setIsOpen(false);
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedFacets([]);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (suggestion.type === "facet" || suggestion.type === "tag") {
      handleFacetToggle(suggestion.value, suggestion.type, suggestion.category || "Tag", suggestion.isAiGenerated);
      setSearchQuery("");
    } else if (suggestion.type === "creator") {
      // Add creator as a search term
      setSearchQuery(suggestion.value);
    } else if (suggestion.type === "asset") {
      setSearchQuery(suggestion.value);
    }
    setIsOpen(false);
  };

  const showTypeahead = isOpen && searchQuery.trim().length > 0 && suggestions.length > 0;
  const showFacetsPreview = isOpen && searchQuery.trim().length === 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search by keyword, tag, player, team, season etc."
          className="pl-10 pr-10 w-full bg-white"
        />
        {(searchQuery || selectedFacets.length > 0) && (
          <button
            onClick={handleClearAll}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Selected Facets Pills */}
      {selectedFacets.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedFacets.map((facet) => {
            const isPeople = facet.category === "People";
            const isAi = facet.isAiGenerated;
            
            return (
              <Badge
                key={facet.value}
                variant="secondary"
                className={`gap-1.5 pr-1.5 cursor-pointer transition-colors ${
                  isAi 
                    ? "bg-slate-200 hover:bg-slate-300 text-slate-700" 
                    : "hover:bg-secondary/80"
                }`}
                onClick={() => handleRemoveFacet(facet.value)}
              >
                {isPeople ? (
                  <User className="w-3.5 h-3.5" />
                ) : (
                  <Tag className="w-3.5 h-3.5" />
                )}
                {isAi && <Sparkles className="w-3 h-3" />}
                {facet.category === "Tag" ? `${facet.value} (tag)` : `${facet.value} (recognized)`}
                <X className="w-3.5 h-3.5 ml-0.5" />
              </Badge>
            );
          })}
        </div>
      )}

      {/* Facets Preview Dropdown (shown on focus before typing) */}
      {showFacetsPreview && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50">
          <ScrollArea className="h-[400px]">
            <div className="p-3">
              {/* Recent Searches Section */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Recent Searches
                  </h4>
                  <div className="flex flex-col gap-1">
                    {recentSearches.map((search, idx) => (
                      <button
                        key={`recent-${idx}`}
                        onClick={() => handleRecentSearchClick(search)}
                        className="flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded hover:bg-accent transition-colors"
                      >
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {facetGroups
                .filter((group) => {
                  // Only show group if at least one facet has count > 0 or is selected
                  return group.facets.some((facet) => {
                    const count = facetCounts[facet] || 0;
                    const isSelected = selectedFacetValues.includes(facet);
                    return count > 0 || isSelected;
                  });
                })
                .map((group) => (
                <div key={group.label} className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {group.label}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {group.facets
                      .filter((facet) => {
                        const count = facetCounts[facet] || 0;
                        const isSelected = selectedFacetValues.includes(facet);
                        return count > 0 || isSelected;
                      })
                      .map((facet) => {
                        const count = facetCounts[facet] || 0;
                        const isSelected = selectedFacetValues.includes(facet);
                        return (
                          <Badge
                            key={facet}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer hover:bg-accent transition-colors text-xs"
                            onClick={() => handleFacetToggle(facet, "facet", group.label)}
                          >
                            {facet}
                            {assets.length > 0 && (
                              <span className="ml-1 text-[10px] opacity-70">({count})</span>
                            )}
                          </Badge>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Typeahead Suggestions Dropdown (shown when typing) */}
      {showTypeahead && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50">
          <ScrollArea className="max-h-[300px]">
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                Suggestions ({filteredAssets.length} results)
              </div>
              {suggestions.map((suggestion, idx) => {
                const isPeople = suggestion.category === "People";
                const isAi = suggestion.isAiGenerated;
                
                return (
                  <button
                    key={`${suggestion.type}-${suggestion.value}-${idx}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full flex items-center gap-2 px-2 py-2 text-sm text-left rounded hover:bg-accent transition-colors"
                  >
                    {isPeople ? (
                      <User className="w-4 h-4 text-muted-foreground" />
                    ) : suggestion.type === "tag" ? (
                      <Tag className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      suggestion.icon
                    )}
                    {isAi && <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span className="truncate">
                      {isPeople 
                        ? `${suggestion.value} (recognized)`
                        : suggestion.type === "tag"
                          ? `${suggestion.value} (tag)`
                          : suggestion.label
                      }
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

// Export the facet groups for use in parent components
export { facetGroups };
export type { FacetGroup };
