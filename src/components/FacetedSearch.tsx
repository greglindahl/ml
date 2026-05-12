import { useState, useRef, useEffect, useMemo } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LibraryAsset } from "@/lib/mockLibraryData";

interface FacetGroup {
  label: string;
  facets: string[];
}

const searchFields = [
  { key: "filename", label: "Filename" },
  { key: "description", label: "Description" },
  { key: "transcript", label: "Transcript" },
  { key: "tags", label: "Tags" },
  { key: "notes", label: "Notes" },
];

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
    label: "Media Type",
    facets: ["Photo", "Video", "Graphic", "Audio", "Document"],
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

interface FacetedSearchProps {
  onSearch?: (query: string, selectedFacets: string[], fieldSearch?: { field: string; value: string }) => void;
  assets?: LibraryAsset[];
}

// Helper to count assets matching a facet
function countAssetsForFacet(assets: LibraryAsset[], facet: string): number {
  const lowerFacet = facet.toLowerCase();
  return assets.filter(asset => 
    asset.tags.some(tag => tag.toLowerCase() === lowerFacet) ||
    asset.type.toLowerCase() === lowerFacet ||
    (facet.toLowerCase() === "photo" && asset.type === "image") ||
    (facet.toLowerCase() === "video" && asset.type === "video")
  ).length;
}

export function FacetedSearch({ onSearch, assets = [] }: FacetedSearchProps) {
  const [showTypeahead, setShowTypeahead] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacets, setSelectedFacets] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowTypeahead(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trigger search when query or facets change
  useEffect(() => {
    onSearch?.(searchQuery, selectedFacets);
  }, [searchQuery, selectedFacets, onSearch]);

  // Compute typeahead suggestions based on search query
  const typeaheadSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    const suggestions: { type: string; value: string; asset?: LibraryAsset }[] = [];
    const seen = new Set<string>();

    // Search through assets for matching names, players, teams, tags
    assets.forEach(asset => {
      // Match asset name
      if (asset.name.toLowerCase().includes(query) && !seen.has(`name:${asset.name}`)) {
        seen.add(`name:${asset.name}`);
        suggestions.push({ type: "Asset", value: asset.name, asset });
      }

      // Match tags (players, teams, etc.)
      asset.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query) && !seen.has(`tag:${tag}`)) {
          seen.add(`tag:${tag}`);
          // Categorize common tag patterns
          let tagType = "Tag";
          if (tag.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/)) tagType = "Player";
          else if (tag.match(/Chiefs|Ravens|Bulls|Lakers|Yankees|Dodgers|Team/i)) tagType = "Team";
          else if (tag.match(/2024|2023|Season|Week/i)) tagType = "Season";
          suggestions.push({ type: tagType, value: tag });
        }
      });
    });

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }, [searchQuery, assets]);

  const handleFacetToggle = (facet: string) => {
    setSelectedFacets((prev) =>
      prev.includes(facet) ? prev.filter((f) => f !== facet) : [...prev, facet]
    );
  };

  const handleRemoveFacet = (facet: string) => {
    setSelectedFacets((prev) => prev.filter((f) => f !== facet));
  };

  const handleInputFocus = () => {
    setShowTypeahead(true);
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedFacets([]);
  };

  const handleSuggestionClick = (suggestion: { type: string; value: string }) => {
    setSearchQuery(suggestion.value);
    setShowTypeahead(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground inline-flex items-center justify-center leading-none" />
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowTypeahead(true);
          }}
          onFocus={handleInputFocus}
          placeholder="Search by keyword, tag, player, team, season etc."
          className="pl-10 pr-10 w-full bg-background"
        />
        {(searchQuery || selectedFacets.length > 0) && (
          <button
            onClick={handleClearAll}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded transition-colors"
          >
            <i className="bi bi-x w-4 h-4 text-muted-foreground inline-flex items-center justify-center leading-none" />
          </button>
        )}
      </div>

      {/* Selected Facets Pills */}
      {selectedFacets.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedFacets.map((facet) => (
            <Badge
              key={facet}
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => handleRemoveFacet(facet)}
            >
              {facet}
              <i className="bi bi-x text-xs" />
            </Badge>
          ))}
        </div>
      )}

      {/* Typeahead Suggestions */}
      {showTypeahead && searchQuery.length >= 2 && typeaheadSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {typeaheadSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.value}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
              >
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-12 flex-shrink-0">
                  {suggestion.type}
                </span>
                <span className="text-foreground truncate">{suggestion.value}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
