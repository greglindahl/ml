import { useState } from "react";
import { ChevronDown, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  multiSelect?: boolean;
}

const galleryFilters: FilterConfig[] = [
  {
    id: "gallery-options",
    label: "Gallery Options",
    multiSelect: true,
    options: [
      { label: "View Only", value: "view-only" },
      { label: "Allow Upload", value: "allow-upload" },
      { label: "Public", value: "public" },
    ],
  },
  {
    id: "creator",
    label: "Creator",
    multiSelect: true,
    options: [
      { label: "John Smith", value: "john" },
      { label: "Jane Doe", value: "jane" },
      { label: "Alex Johnson", value: "alex" },
    ],
  },
  {
    id: "groups",
    label: "Groups",
    multiSelect: true,
    options: [
      { label: "Marketing", value: "marketing" },
      { label: "Social Media", value: "social-media" },
      { label: "Creative", value: "creative" },
      { label: "Operations", value: "operations" },
    ],
  },
  {
    id: "created-date",
    label: "Created Date",
    options: [
      { label: "Today", value: "today" },
      { label: "Last 7 Days", value: "week" },
      { label: "Last 30 Days", value: "month" },
      { label: "Last 90 Days", value: "quarter" },
      { label: "Last Year", value: "year" },
      { label: "Custom", value: "custom" },
    ],
  },
  {
    id: "assets-last-added",
    label: "Assets Last Added Date",
    options: [
      { label: "Today", value: "today" },
      { label: "Last 7 Days", value: "week" },
      { label: "Last 30 Days", value: "month" },
      { label: "Last 90 Days", value: "quarter" },
      { label: "Last Year", value: "year" },
      { label: "Custom", value: "custom" },
    ],
  },
];

export function GalleryFilterBar() {
  const [activeFilters, setActiveFilters] = useState<
    Record<string, { value: string; label: string }[]>
  >({});
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [showArchived, setShowArchived] = useState(false);

  const handleMultiSelect = (
    filterId: string,
    value: string,
    label: string,
    checked: boolean
  ) => {
    setActiveFilters((prev) => {
      const current = prev[filterId] || [];
      let updated: { value: string; label: string }[];
      if (checked) {
        updated = [...current, { value, label }];
      } else {
        updated = current.filter((item) => item.value !== value);
      }
      const newFilters = { ...prev };
      if (updated.length === 0) {
        delete newFilters[filterId];
      } else {
        newFilters[filterId] = updated;
      }
      return newFilters;
    });
  };

  const handleSingleSelect = (filterId: string, value: string, label: string) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      newFilters[filterId] = [{ value, label }];
      return newFilters;
    });
  };

  const handleRemoveValue = (filterId: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[filterId] || [];
      const updated = current.filter((item) => item.value !== value);
      const newFilters = { ...prev };
      if (updated.length === 0) {
        delete newFilters[filterId];
      } else {
        newFilters[filterId] = updated;
      }
      return newFilters;
    });
  };

  const clearFilter = (filterId: string) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[filterId];
      return newFilters;
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {galleryFilters.map((filter) => {
        const selected = activeFilters[filter.id] || [];
        const isActive = selected.length > 0;
        const isMulti = filter.multiSelect;

        return (
          <DropdownMenu key={filter.id}>
            <DropdownMenuTrigger asChild>
              {isActive ? (
                <div className="inline-flex items-center gap-1 h-8 px-1.5 border border-input rounded-md bg-card min-w-[120px] max-w-[280px]">
                  <div className="flex flex-wrap gap-1 flex-1">
                    {selected.map((item) => (
                      <span
                        key={item.value}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs"
                      >
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveValue(filter.id, item.value);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remove ${filter.label} filter: ${item.label}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {item.label}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 ml-auto pl-1">
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFilter(filter.id);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Clear ${filter.label} filter`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-2.5 text-xs font-medium bg-card"
                >
                  <span>{filter.label}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="bg-popover z-50 min-w-[200px]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {/* Search input */}
              <div className="px-2 py-1.5">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${filter.label.toLowerCase()}...`}
                    value={searchQueries[filter.id] || ""}
                    onChange={(e) =>
                      setSearchQueries((prev) => ({
                        ...prev,
                        [filter.id]: e.target.value,
                      }))
                    }
                    className="h-7 pl-7 text-xs bg-background"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {filter.options
                  .filter((option) =>
                    option.label
                      .toLowerCase()
                      .includes((searchQueries[filter.id] || "").toLowerCase())
                  )
                  .map((option) =>
                    isMulti ? (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={selected.some((s) => s.value === option.value)}
                        onCheckedChange={(checked) =>
                          handleMultiSelect(
                            filter.id,
                            option.value,
                            option.label,
                            checked as boolean
                          )
                        }
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    ) : (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={selected.some((s) => s.value === option.value)}
                        onCheckedChange={() =>
                          handleSingleSelect(filter.id, option.value, option.label)
                        }
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    )
                  )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}

      {/* Archived toggle */}
      <div className="inline-flex items-center gap-2 h-8 px-2">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          View Only Archived Galleries
        </span>
        <Switch checked={showArchived} onCheckedChange={setShowArchived} className="scale-75" />
      </div>
    </div>
  );
}
