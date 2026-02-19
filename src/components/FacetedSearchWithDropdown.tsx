import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
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

interface FacetedSearchWithDropdownProps {
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

export function FacetedSearchWithDropdown({ onSearch, assets = [] }: FacetedSearchWithDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacets, setSelectedFacets] = useState<string[]>([]);
  const [activeFieldSearch, setActiveFieldSearch] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveFieldSearch(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trigger search when query or facets change
  useEffect(() => {
    onSearch?.(searchQuery, selectedFacets);
  }, [searchQuery, selectedFacets, onSearch]);

  // Compute facet counts based on current assets
  const facetCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    facetGroups.forEach(group => {
      group.facets.forEach(facet => {
        counts[facet] = countAssetsForFacet(assets, facet);
      });
    });
    return counts;
  }, [assets]);

  const handleFacetToggle = (facet: string) => {
    setSelectedFacets((prev) =>
      prev.includes(facet) ? prev.filter((f) => f !== facet) : [...prev, facet]
    );
  };

  const handleFieldSearchClick = (field: string) => {
    setActiveFieldSearch(field);
    setSearchQuery(`${field}: `);
    inputRef.current?.focus();
  };

  const handleRemoveFacet = (facet: string) => {
    setSelectedFacets((prev) => prev.filter((f) => f !== facet));
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedFacets([]);
    setActiveFieldSearch(null);
  };

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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setIsOpen(false);
              setActiveFieldSearch(null);
            }
          }}
          placeholder="Search by keyword, tag, player, team, season etc."
          className="pl-10 pr-10 w-full bg-background"
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
          {selectedFacets.map((facet) => (
            <Badge
              key={facet}
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => handleRemoveFacet(facet)}
            >
              {facet}
              <X className="w-3 h-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50">
          <ScrollArea className="h-[400px]">
            <div className="p-3">
              {/* Field Search Options */}
              <div className="space-y-1 mb-4">
                {searchFields.map((field) => (
                  <button
                    key={field.key}
                    onClick={() => handleFieldSearchClick(field.label)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded hover:bg-accent transition-colors"
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{field.label}:</span>
                  </button>
                ))}
              </div>

              {/* Facet Groups */}
              {facetGroups.map((group) => (
                <div key={group.label} className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {group.label}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {group.facets.map((facet) => {
                      const count = facetCounts[facet] || 0;
                      return (
                        <Badge
                          key={facet}
                          variant={selectedFacets.includes(facet) ? "default" : "outline"}
                          className={`cursor-pointer hover:bg-accent transition-colors text-xs ${count === 0 ? "opacity-50" : ""}`}
                          onClick={() => handleFacetToggle(facet)}
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
    </div>
  );
}
