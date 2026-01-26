import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, X, User, Tag, Folder, Clock, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LibraryAsset, AI_GENERATED_TAGS } from "@/lib/mockLibraryData";
interface FacetGroup {
  label: string;
  facets: string[];
}
const facetGroups: FacetGroup[] = [{
  label: "Content & Context",
  facets: ["Football", "Basketball", "Baseball", "Esports", "Solo (1)", "Small Group (2-4)", "Team Shot (5+)", "Crowd/Fans", "Looking at Camera", "Candid", "Headshot"]
}, {
  label: "Teams",
  facets: ["Lakers", "Warriors", "Celtics", "Heat", "Nets", "Bucks", "Mavericks", "Suns", "Chiefs", "49ers", "Cowboys", "Patriots", "Eagles", "Packers", "Bills", "Yankees", "Dodgers", "Red Sox", "Cubs"]
}, {
  label: "People",
  facets: ["Lebron James", "Steph Curry", "Kevin Durant", "Giannis Antetokounmpo", "Luka Doncic"]
}, {
  label: "Scene",
  facets: ["Dunk", "Celebration", "Arrival", "Interview", "Warm-up", "Timeout", "Huddle", "Victory", "Injury"]
}, {
  label: "Media Type",
  facets: ["Photo", "Video"]
}, {
  label: "Orientation",
  facets: ["Landscape", "Portrait", "Square"]
}, {
  label: "Resolution",
  facets: ["8192x5464", "6000x4000", "5712x3808", "5790x3860", "5705x3803", "5754x3836", "5380x3587"]
}, {
  label: "File Format",
  facets: ["JPG", "PNG", "HEIC", "MP4", "MOV", "ProRes"]
}, {
  label: "Video Duration",
  facets: ["0-15s", "15-30s", "30-60s", "60s+"]
}, {
  label: "Workflow",
  facets: ["Active", "Archived", "Embargoed", "Approved", "Pending Review", "Has Audio"]
}];
interface Suggestion {
  type: "asset" | "creator" | "tag" | "facet" | "search";
  value: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  category?: string; // The group label for facets
  isAiGenerated?: boolean;
}
interface SelectedFacet {
  value: string;
  type: "tag" | "facet" | "search";
  category: string; // e.g., "Tag", "People", "Teams", "Search", etc.
  isAiGenerated?: boolean;
}
interface FacetedSearchWithTypeaheadProps {
  onSearch?: (query: string, selectedFacets: string[]) => void;
  onFacetCountsChange?: (counts: Record<string, number>) => void;
  assets?: LibraryAsset[];
}

// Helper to filter assets based on query, facets, and search terms (with fuzzy matching)
function filterAssets(assets: LibraryAsset[], query: string, selectedFacets: SelectedFacet[]): LibraryAsset[] {
  // Separate search terms from tag/facet filters
  const searchTerms = selectedFacets.filter(f => f.type === "search").map(f => f.value.toLowerCase());
  const tagFacets = selectedFacets.filter(f => f.type !== "search").map(f => f.value.toLowerCase().replace(/__manual$/, ''));
  return assets.filter(asset => {
    const nameLower = asset.name.toLowerCase();
    const creatorLower = asset.creator.toLowerCase();
    const tagsLower = asset.tags.map(t => t.toLowerCase());
    const combinedText = `${nameLower} ${creatorLower} ${tagsLower.join(' ')}`;

    // Text query match (from input box, not pills) - each word must match somewhere
    if (query) {
      const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const allWordsMatch = words.every(word => combinedText.includes(word));
      if (!allWordsMatch) return false;
    }

    // Search term pills - fuzzy match with OR logic (any search term matches)
    if (searchTerms.length > 0) {
      const anySearchTermMatches = searchTerms.some(term => {
        // Check if term matches anywhere in name, creator, or tags (partial/fuzzy)
        return combinedText.includes(term);
      });
      if (!anySearchTermMatches) return false;
    }

    // Facet/Tag match - ANY selected facet must match (OR logic)
    if (tagFacets.length > 0) {
      const anyFacetMatches = tagFacets.some(facet => {
        const matchesTag = tagsLower.some(tag => tag === facet);
        const matchesType = asset.type.toLowerCase() === facet;
        const matchesPhoto = facet === "photo" && asset.type === "image";
        const matchesVideo = facet === "video" && asset.type === "video";
        return matchesTag || matchesType || matchesPhoto || matchesVideo;
      });
      if (!anyFacetMatches) return false;
    }
    return true;
  });
}

// Helper to count assets matching a facet within filtered results
function countAssetsForFacet(assets: LibraryAsset[], facet: string): number {
  const lowerFacet = facet.toLowerCase();
  return assets.filter(asset => asset.tags.some(tag => tag.toLowerCase() === lowerFacet) || asset.type.toLowerCase() === lowerFacet || facet.toLowerCase() === "photo" && asset.type === "image" || facet.toLowerCase() === "video" && asset.type === "video").length;
}
const RECENT_SEARCHES_KEY = "library-recent-searches";
const MAX_RECENT_SEARCHES = 5;
export function FacetedSearchWithTypeahead({
  onSearch,
  onFacetCountsChange,
  assets = []
}: FacetedSearchWithTypeaheadProps) {
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
    return filterAssets(assets, searchQuery, selectedFacets);
  }, [assets, searchQuery, selectedFacets]);

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
  // Combine searchQuery with search-type pills for fuzzy matching
  useEffect(() => {
    const searchTermPills = selectedFacets.filter(f => f.type === "search").map(f => f.value);
    const tagFacetValues = selectedFacets.filter(f => f.type !== "search").map(f => f.value);
    // Combine current input with search term pills for the query
    const combinedQuery = [searchQuery, ...searchTermPills].filter(Boolean).join(" ");
    onSearch?.(combinedQuery, tagFacetValues);
  }, [searchQuery, selectedFacets, onSearch]);

  // Helper to get icon for a facet group
  const getIconForGroup = (groupLabel: string): React.ReactNode => {
    if (groupLabel === "People") {
      return <User className="w-4 h-4 text-muted-foreground" />;
    }
    return <Folder className="w-4 h-4 text-muted-foreground" />;
  };

  // Generate grouped typeahead suggestions based on query
  const groupedSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return {
      recognizedPeople: [],
      otherTags: []
    };
    const query = searchQuery.toLowerCase();
    const recognizedPeople: Suggestion[] = [];
    const otherTags: Suggestion[] = [];

    // Match "People" facets - these are AI-recognized faces
    const peopleGroup = facetGroups.find(g => g.label === "People");
    if (peopleGroup) {
      peopleGroup.facets.filter(f => f.toLowerCase().includes(query) && !selectedFacetValues.includes(f)).slice(0, 3).forEach(facet => {
        const count = facetCounts[facet] || 0;
        if (count > 0) {
          recognizedPeople.push({
            type: "facet",
            value: facet,
            label: `${facet} (recognized)`,
            icon: <User className="w-4 h-4" />,
            count,
            category: "People",
            isAiGenerated: true
          });
        }
      });
    }

    // Get unique tags from filtered assets
    const allTags = [...new Set(filteredAssets.flatMap(a => a.tags))];
    allTags.filter(t => t.toLowerCase().includes(query)).slice(0, 5).forEach(tag => {
      const count = filteredAssets.filter(a => a.tags.includes(tag)).length;
      const isAi = AI_GENERATED_TAGS.has(tag);

      // Skip people names - they're already shown in Recognized People
      const isPeopleName = peopleGroup?.facets.some(p => p.toLowerCase() === tag.toLowerCase());
      if (!isPeopleName) {
        otherTags.push({
          type: "tag",
          value: tag,
          label: tag,
          icon: <Tag className="w-4 h-4" />,
          count,
          category: "Tag",
          isAiGenerated: isAi
        });
      }
    });
    return {
      recognizedPeople,
      otherTags
    };
  }, [searchQuery, filteredAssets, selectedFacetValues, facetCounts]);
  const handleRemoveFacet = useCallback((facetValue: string) => {
    setSelectedFacets(prev => prev.filter(f => f.value !== facetValue));
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
  const removeRecentSearch = useCallback((searchToRemove: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== searchToRemove);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);
  const clearAllRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      // Add search term as a pill
      handleAddSearchTerm(searchQuery.trim());
    }
  };
  const handleAddSearchTerm = useCallback((term: string) => {
    if (!term.trim()) return;
    // Add to recent searches
    addToRecentSearches(term);
    // Add as a selected facet with type "search"
    setSelectedFacets(prev => {
      const exists = prev.some(f => f.value.toLowerCase() === term.toLowerCase() && f.type === "search");
      if (exists) return prev;
      return [...prev, {
        value: term,
        type: "search",
        category: "Search"
      }];
    });
    setSearchQuery("");
    setIsOpen(false);
  }, [addToRecentSearches]);
  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    setIsOpen(false);
  };
  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedFacets([]);
  };
  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    if (suggestion.type === "search") {
      handleAddSearchTerm(suggestion.value);
    } else if (suggestion.type === "facet" || suggestion.type === "tag") {
      // Add the facet to selectedFacets - use functional update to preserve existing selections
      setSelectedFacets(prev => {
        const exists = prev.some(f => f.value === suggestion.value);
        if (exists) {
          return prev.filter(f => f.value !== suggestion.value);
        }
        return [...prev, {
          value: suggestion.value,
          type: suggestion.type as "tag" | "facet",
          category: suggestion.category || "Tag",
          isAiGenerated: suggestion.isAiGenerated
        }];
      });
      setSearchQuery("");
      setIsOpen(false);
    } else if (suggestion.type === "creator") {
      // Add creator as a search term
      handleAddSearchTerm(suggestion.value);
    } else if (suggestion.type === "asset") {
      handleAddSearchTerm(suggestion.value);
    }
  }, [handleAddSearchTerm]);
  const hasTagSuggestions = groupedSuggestions.recognizedPeople.length > 0 || groupedSuggestions.otherTags.length > 0;
  const showTypeahead = isOpen && (searchQuery.trim().length > 0 || recentSearches.length > 0);
  return <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input ref={inputRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={handleInputFocus} onKeyDown={handleKeyDown} placeholder="Search by people, tags, filenames…" className="pl-10 pr-10 w-full bg-white" />
        {(searchQuery || selectedFacets.length > 0) && <button onClick={handleClearAll} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>}
      </div>

      {/* Selected Facets/Search Pills */}
      {selectedFacets.length > 0 && <div className="flex flex-wrap gap-2 mt-2">
          {selectedFacets.map(facet => {
        const isPeople = facet.category === "People";
        const isSearch = facet.type === "search";
        const isAi = facet.isAiGenerated;
        return <Badge key={facet.value} variant="secondary" className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-secondary/80" onClick={() => handleRemoveFacet(facet.value)}>
                {isSearch ? <Search className="w-3.5 h-3.5" /> : isPeople ? <User className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />}
                {isAi && !isPeople && <Sparkles className="w-3 h-3" />}
                {facet.value.replace(/__manual$/, '')}
                <X className="w-3.5 h-3.5 ml-0.5" />
              </Badge>;
      })}
        </div>}

      {/* Typeahead Suggestions Dropdown */}
      {showTypeahead && <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50">
          <ScrollArea className="max-h-[400px]">
            <div className="p-3">
              {/* Generic Search Option - shown when user is typing */}
              {searchQuery.trim() && <div className="mb-4">
                  <button onClick={() => handleAddSearchTerm(searchQuery.trim())} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-accent transition-colors">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{searchQuery}</span>
                  </button>
                </div>}
              
              {/* Recent Searches Section */}
              {recentSearches.length > 0 && !searchQuery.trim() && <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Recent Searches
                    </h4>
                    <button onClick={e => {
                e.stopPropagation();
                clearAllRecentSearches();
              }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {recentSearches.map((search, idx) => <div key={`recent-${idx}`} className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors group">
                        <button onClick={() => handleAddSearchTerm(search)} className="flex items-center gap-2 flex-1 text-left">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{search}</span>
                        </button>
                        <button onClick={e => {
                  e.stopPropagation();
                  removeRecentSearch(search);
                }} className="p-0.5 rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Remove ${search} from recent searches`}>
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>)}
                  </div>
                </div>}
              
              {/* Tag Suggestions Header - only show if we have suggestions and user is typing */}
              {searchQuery.trim() && hasTagSuggestions && <div className="text-xs font-medium text-muted-foreground mb-3">
                  Suggestions ({filteredAssets.length} results)
                </div>}
              
              {/* Recognized People Section */}
              {searchQuery.trim() && groupedSuggestions.recognizedPeople.length > 0 && <div className="mb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">AI Identified </h4>
                  <div className="flex flex-col gap-2">
                    {groupedSuggestions.recognizedPeople.map((suggestion, idx) => (
                      <button 
                        key={`recognized-${suggestion.value}-${idx}`}
                        onClick={() => handleSuggestionClick(suggestion)} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors w-fit bg-gray-200 hover:bg-gray-100" 
                        style={{ backgroundColor: '#e0e0e0' }}
                      >
                        <User className="w-4 h-4" />
                        <span>{suggestion.value}</span>
                      </button>
                    ))}
                  </div>
                </div>}
              
              
              
              {/* Other Tags Section */}
              {searchQuery.trim() && groupedSuggestions.otherTags.length > 0 && <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Manually Tagged </h4>
                  <div className="flex flex-col gap-2">
                    {groupedSuggestions.otherTags.map((suggestion, idx) => {
                      const isAi = suggestion.isAiGenerated;
                      return (
                        <button 
                          key={`tag-${suggestion.value}-${idx}`}
                          onClick={() => handleSuggestionClick(suggestion)} 
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors w-fit ${isAi ? "bg-slate-200 hover:bg-slate-300 text-slate-700" : "bg-gray-400 hover:bg-gray-500 text-white"}`}
                        >
                          <i className="bi bi-bounding-box-circles w-4 h-4" />
                          <span>{suggestion.value}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>}
            </div>
          </ScrollArea>
        </div>}
    </div>;
}

// Export the facet groups for use in parent components
export { facetGroups };
export type { FacetGroup };