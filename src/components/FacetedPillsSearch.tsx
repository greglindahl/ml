import { useState, useRef, useEffect, useMemo } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { LibraryAsset } from "@/lib/mockLibraryData";

interface Facet {
  field: string;
  value: string;
  label: string;
}

interface FacetOption {
  field: string;
  fieldLabel: string;
  values: { value: string; label: string }[];
}

const facetOptions: FacetOption[] = [
  {
    field: "creator",
    fieldLabel: "Creator",
    values: [
      { value: "john", label: "John Smith" },
      { value: "jane", label: "Jane Doe" },
      { value: "alex", label: "Alex Johnson" },
    ],
  },
  {
    field: "type",
    fieldLabel: "Content Type",
    values: [
      { value: "image", label: "Image" },
      { value: "video", label: "Video" },
    ],
  },
  {
    field: "date",
    fieldLabel: "Date Range",
    values: [
      { value: "today", label: "Today" },
      { value: "week", label: "Last 7 Days" },
      { value: "month", label: "Last 30 Days" },
      { value: "year", label: "Last Year" },
    ],
  },
  {
    field: "aspect",
    fieldLabel: "Aspect Ratio",
    values: [
      { value: "1:1", label: "1:1 Square" },
      { value: "16:9", label: "16:9 Landscape" },
      { value: "9:16", label: "9:16 Portrait" },
      { value: "4:3", label: "4:3 Standard" },
    ],
  },
  {
    field: "status",
    fieldLabel: "Status",
    values: [
      { value: "approved", label: "Approved" },
      { value: "pending", label: "Pending Review" },
      { value: "draft", label: "Draft" },
    ],
  },
  {
    field: "tag",
    fieldLabel: "Tag",
    values: [
      { value: "marketing", label: "Marketing" },
      { value: "product", label: "Product" },
      { value: "social", label: "Social Media" },
      { value: "brand", label: "Brand" },
    ],
  },
];

interface FacetedPillsSearchProps {
  onSearch?: (query: string, facets: Facet[]) => void;
  assets?: LibraryAsset[];
}

// Helper to count assets matching a facet value
function countAssetsForFacet(assets: LibraryAsset[], field: string, value: string): number {
  return assets.filter((asset) => {
    switch (field) {
      case "creator":
        return asset.creator.toLowerCase().includes(value.toLowerCase());
      case "type":
        return asset.type === value;
      case "status":
        return asset.status === value;
      case "tag":
        return asset.tags.some((t) => t.toLowerCase() === value.toLowerCase());
      case "aspect":
        return asset.aspectRatio === value;
      case "date":
        const now = new Date();
        const assetDate = asset.dateCreated;
        switch (value) {
          case "today":
            return assetDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return assetDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return assetDate >= monthAgo;
          case "year":
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return assetDate >= yearAgo;
          default:
            return true;
        }
      default:
        return false;
    }
  }).length;
}

export function FacetedPillsSearch({ onSearch, assets = [] }: FacetedPillsSearchProps) {
  // Calculate counts for all facet values
  const facetCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    facetOptions.forEach((opt) => {
      counts[opt.field] = {};
      opt.values.forEach((val) => {
        counts[opt.field][val.value] = countAssetsForFacet(assets, opt.field, val.value);
      });
    });
    return counts;
  }, [assets]);
  const [query, setQuery] = useState("");
  const [selectedFacets, setSelectedFacets] = useState<Facet[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter facet options based on query
  const filteredOptions = query.trim()
    ? facetOptions.filter(
        (opt) =>
          opt.fieldLabel.toLowerCase().includes(query.toLowerCase()) ||
          opt.values.some((v) => v.label.toLowerCase().includes(query.toLowerCase()))
      )
    : facetOptions;

  // Get values for active field
  const activeFieldOptions = activeField
    ? facetOptions.find((f) => f.field === activeField)
    : null;

  // Filter values based on query when a field is active
  const filteredValues = activeFieldOptions
    ? activeFieldOptions.values.filter((v) =>
        v.label.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setActiveField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, activeField]);

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsDropdownOpen(true);
    if (activeField && e.target.value === "") {
      setActiveField(null);
    }
  };

  const handleSelectField = (field: string) => {
    setActiveField(field);
    setQuery("");
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  const handleSelectValue = (field: string, value: string, label: string) => {
    const fieldLabel = facetOptions.find((f) => f.field === field)?.fieldLabel || field;
    const newFacet: Facet = { field, value, label: `${fieldLabel}: ${label}` };
    
    // Check if this exact facet already exists
    const exists = selectedFacets.some(
      (f) => f.field === field && f.value === value
    );
    
    if (!exists) {
      const updatedFacets = [...selectedFacets, newFacet];
      setSelectedFacets(updatedFacets);
      onSearch?.(query, updatedFacets);
    }
    
    setQuery("");
    setActiveField(null);
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveFacet = (index: number) => {
    const updatedFacets = selectedFacets.filter((_, i) => i !== index);
    setSelectedFacets(updatedFacets);
    onSearch?.(query, updatedFacets);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsDropdownOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      if (activeField) {
        setActiveField(null);
        setQuery("");
      } else {
        setIsDropdownOpen(false);
      }
      return;
    }

    if (e.key === "Backspace" && query === "" && selectedFacets.length > 0 && !activeField) {
      handleRemoveFacet(selectedFacets.length - 1);
      return;
    }

    const items = activeField ? filteredValues : filteredOptions;
    const maxIndex = items.length - 1;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeField && filteredValues[highlightedIndex]) {
        const val = filteredValues[highlightedIndex];
        handleSelectValue(activeField, val.value, val.label);
      } else if (!activeField && filteredOptions[highlightedIndex]) {
        handleSelectField(filteredOptions[highlightedIndex].field);
      }
    }
  };

  const handleClearAll = () => {
    setSelectedFacets([]);
    setQuery("");
    onSearch?.("", []);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input with Pills */}
      <div
        className="flex flex-wrap items-center gap-2 min-h-[44px] px-3 py-2 border rounded-lg bg-background focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <i className="bi bi-search w-4 h-4 text-muted-foreground flex-shrink-0 inline-flex items-center justify-center leading-none" />
        
        {/* Selected Facet Pills */}
        {selectedFacets.map((facet, index) => (
          <span
            key={`${facet.field}-${facet.value}-${index}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-sm rounded-md"
          >
            {facet.label}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFacet(index);
              }}
              className="hover:bg-primary/20 rounded p-0.5 transition-colors"
            >
              <i className="bi bi-x text-xs" />
            </button>
          </span>
        ))}

        {/* Active Field Indicator */}
        {activeField && (
          <span className="text-sm text-primary font-medium">
            {facetOptions.find((f) => f.field === activeField)?.fieldLabel}:
          </span>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedFacets.length > 0
              ? "Add more filters..."
              : "Search or select a filter..."
          }
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-[#6e84a3]"
        />

        {/* Clear All Button */}
        {(selectedFacets.length > 0 || query) && (
          <button
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded hover:bg-accent transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {activeField ? (
            // Show values for selected field
            <div className="p-2">
              <button
                onClick={() => {
                  setActiveField(null);
                  setQuery("");
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2 px-2"
              >
                <i className="bi bi-chevron-down text-xs rotate-90" />
                Back to fields
              </button>
              <div className="text-xs font-medium text-muted-foreground px-2 mb-1">
                {activeFieldOptions?.fieldLabel}
              </div>
              {filteredValues.length > 0 ? (
                filteredValues.map((val, index) => {
                  const count = facetCounts[activeField]?.[val.value] ?? 0;
                  return (
                    <button
                      key={val.value}
                      onClick={() => handleSelectValue(activeField, val.value, val.label)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                        highlightedIndex === index
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      } ${count === 0 ? "opacity-50" : ""}`}
                    >
                      <span>{val.label}</span>
                      <span className="text-xs text-muted-foreground">({count})</span>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No matching values
                </div>
              )}
            </div>
          ) : (
            // Show field options
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground px-2 mb-2">
                Filter by
              </div>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, index) => (
                  <button
                    key={opt.field}
                    onClick={() => handleSelectField(opt.field)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                      highlightedIndex === index
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <span>{opt.fieldLabel}</span>
                    <i className="bi bi-chevron-down w-4 h-4 -rotate-90 text-muted-foreground inline-flex items-center justify-center leading-none" />
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No matching filters
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
