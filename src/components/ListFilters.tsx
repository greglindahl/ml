import { useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TogglePill } from "./TogglePill";
import { FiltersSheet, FilterSection } from "./FiltersSheet";
import { cn } from "@/lib/utils";

/**
 * Config-driven version of the ML 2.0 list header: search row, filter row
 * (dropdown chips left, toggle pills after), applied-filter chip row, and the
 * bottom FiltersSheet the filter row collapses into at ≤767px.
 *
 * Same markup and classes as the hand-built bars (CampaignsFilterBar,
 * UsersFilterBar), but the state is fully controlled by the screen, so the
 * bar, the chips and the sheet can never disagree about what's applied.
 */

export interface ListFilterValue {
  value: string;
  label: string;
}

export type ListFilterState = Record<string, ListFilterValue[]>;
export type ListPillState = Record<string, boolean>;

export interface ListFilterDef {
  id: string;
  label: string;
  /** Bootstrap icon class, e.g. "bi-person". */
  icon: string;
  options: ListFilterValue[];
  /** Multi-select (default) or pick-one. */
  multi?: boolean;
  /** Adds a search input to the dropdown — use for long option lists. */
  searchable?: boolean;
  /**
   * A filter prod doesn't have yet (a design proposal). Hidden everywhere —
   * filter row, chips, sheet and View Settings — unless SHOW_PROPOSED_FILTERS.
   */
  proposed?: boolean;
}

/**
 * Flip to preview proposed filters. Off by default: the prototype should only
 * show filters prod actually supports.
 */
export const SHOW_PROPOSED_FILTERS = false;

export const isFilterAvailable = (def: ListFilterDef) => SHOW_PROPOSED_FILTERS || !def.proposed;

export interface ListPillDef {
  id: string;
  label: string;
  icon: string;
  tooltip?: string;
}

/** Created-date options shared by every Connect list. Values feed `matchesDateRange`. */
export const CREATED_DATE_OPTIONS: ListFilterValue[] = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "week" },
  { label: "Last 30 Days", value: "month" },
  { label: "Last 90 Days", value: "quarter" },
  { label: "Last Year", value: "year" },
];

/** True when the filter is unset or any of the item's values is selected. */
export function matchesFilter(state: ListFilterState, filterId: string, itemValues: string | string[]): boolean {
  const selected = state[filterId];
  if (!selected || selected.length === 0) return true;
  const values = Array.isArray(itemValues) ? itemValues : [itemValues];
  return selected.some((s) => values.includes(s.value));
}

export function countActiveFilters(state: ListFilterState): number {
  return Object.values(state).reduce((sum, arr) => sum + arr.length, 0);
}

const NO_PILLS: ListPillState = {};

function toggleValue(state: ListFilterState, def: ListFilterDef, option: ListFilterValue, checked: boolean): ListFilterState {
  const current = state[def.id] || [];
  const updated = def.multi === false
    ? (checked ? [option] : [])
    : checked
      ? [...current, option]
      : current.filter((v) => v.value !== option.value);
  const next = { ...state };
  if (updated.length === 0) delete next[def.id];
  else next[def.id] = updated;
  return next;
}

// ---------------------------------------------------------------------------
// Search row
// ---------------------------------------------------------------------------

interface ListSearchRowProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Omit to hide the gear (lists with no table preferences). */
  onOpenSettings?: () => void;
}

export function ListSearchRow({ value, onChange, placeholder = "Search", onOpenSettings }: ListSearchRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 pl-9 pr-8 text-[15px] border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <i className="bi bi-x-lg text-sm" />
          </button>
        )}
      </div>

      {onOpenSettings && (
        <div className="flex items-center gap-2 ml-auto">
          <Tooltip delayDuration={700}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-md border-gray-300 bg-white text-[#6e84a3]"
                onClick={onOpenSettings}
                aria-label="Settings"
              >
                <i className="bi bi-gear w-4 h-4 inline-flex items-center justify-center leading-none" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Settings</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter row
// ---------------------------------------------------------------------------

const TRIGGER_CLASS =
  "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]";
const TRIGGER_ACTIVE_CLASS = "bg-primary/10 border-primary text-primary";
const ICON_CLASS = "w-4 h-4 inline-flex items-center justify-center leading-none";

function FilterDropdown({
  def,
  value,
  onChange,
}: {
  def: ListFilterDef;
  value: ListFilterState;
  onChange: (next: ListFilterState) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = value[def.id] || [];
  const options = def.searchable
    ? def.options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : def.options;

  return (
    <DropdownMenu onOpenChange={(open) => !open && setQuery("")}>
      <Tooltip delayDuration={700}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={cn(TRIGGER_CLASS, selected.length > 0 && TRIGGER_ACTIVE_CLASS)}>
              <i className={cn("bi", def.icon, ICON_CLASS)} />
              <span className="filter-label">{def.label}</span>
              {selected.length > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
                  {selected.length}
                </span>
              )}
              <i className={cn("bi bi-chevron-down", ICON_CLASS)} />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{def.label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="bg-popover z-50 min-w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
        {def.searchable && (
          <div className="px-2 py-2 border-b">
            <div className="relative">
              <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
              <input
                type="text"
                placeholder={`Search ${def.label.toLowerCase()}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
        <div className="max-h-[280px] overflow-y-auto">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              className="text-[13px]"
              checked={selected.some((s) => s.value === option.value)}
              onCheckedChange={(checked) => onChange(toggleValue(value, def, option, checked as boolean))}
              // Multi-select stays open so several values can be picked in one go.
              onSelect={(e) => def.multi !== false && e.preventDefault()}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
          {options.length === 0 && (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">No results found</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ListFilterBarProps {
  filters: ListFilterDef[];
  value: ListFilterState;
  onChange: (next: ListFilterState) => void;
  pills?: ListPillDef[];
  pillState?: ListPillState;
  onPillToggle?: (id: string, active: boolean) => void;
  onOpenFiltersSheet: () => void;
}

export function ListFilterBar({
  filters,
  value,
  onChange,
  pills = [],
  pillState = {},
  onPillToggle,
  onOpenFiltersSheet,
}: ListFilterBarProps) {
  const totalActive = countActiveFilters(value) + pills.filter((p) => pillState[p.id]).length;

  return (
    <div className="filter-bar-container cq-filterbar-hide-label flex flex-wrap items-center gap-1.5">
      {/* Collapsed Filters button (≤767px container) */}
      <Button variant="outline" size="sm" className={cn("filters-collapsed-button", TRIGGER_CLASS)} onClick={onOpenFiltersSheet}>
        <i className={cn("bi bi-filter", ICON_CLASS)} />
        <span>Filters</span>
        {totalActive > 0 && (
          <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] w-4 h-4">
            {totalActive}
          </span>
        )}
        <i className={cn("bi bi-chevron-down", ICON_CLASS)} />
      </Button>

      <div className="filters-expanded contents">
        {filters.map((def) => (
          <FilterDropdown key={def.id} def={def} value={value} onChange={onChange} />
        ))}
        {pills.map((pill) => (
          <TogglePill
            key={pill.id}
            label={pill.label}
            iconClass={pill.icon}
            tooltip={pill.tooltip}
            isActive={!!pillState[pill.id]}
            onClick={() => onPillToggle?.(pill.id, !pillState[pill.id])}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Applied filter chips
// ---------------------------------------------------------------------------

interface AppliedFilterChipsProps {
  filters: ListFilterDef[];
  value: ListFilterState;
  onChange: (next: ListFilterState) => void;
}

/** Reserved-height row so the table doesn't jump when the first chip lands. */
export function AppliedFilterChips({ filters, value, onChange }: AppliedFilterChipsProps) {
  const chips = filters.flatMap((def) => (value[def.id] || []).map((v) => ({ def, v })));

  return (
    <div className="min-h-[24px]">
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map(({ def, v }) => (
            <Badge
              key={`${def.id}-${v.value}`}
              colorStyle="primary"
              theme="soft"
              shape="rounded"
              className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-primary/30 text-[13px] normal-case tracking-normal font-normal"
              onClick={() => onChange(toggleValue(value, def, v, false))}
            >
              <i className={cn("bi", def.icon, "text-sm")} />
              {v.label}
              <i className="bi bi-x text-sm ml-0.5" />
            </Badge>
          ))}
          {/* Filters only — the search term and toggle pills are left alone. */}
          <button
            onClick={() => onChange({})}
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bottom sheet (narrow widths)
// ---------------------------------------------------------------------------

interface SheetDraft extends Record<string, unknown> {
  filters: ListFilterState;
  pills: ListPillState;
}

function SheetDropdown({
  def,
  draft,
  setDraft,
}: {
  def: ListFilterDef;
  draft: SheetDraft;
  setDraft: React.Dispatch<React.SetStateAction<SheetDraft>>;
}) {
  const [query, setQuery] = useState("");
  const selected = draft.filters[def.id] || [];
  const options = def.searchable
    ? def.options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : def.options;
  const display = selected.length === 0 ? "All" : selected.length === 1 ? selected[0].label : `${selected.length} selected`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal h-10">
          <span className={cn(selected.length === 0 && "text-muted-foreground")}>{display}</span>
          <i className={cn("bi bi-chevron-down", ICON_CLASS)} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white" onCloseAutoFocus={(e) => e.preventDefault()}>
        {def.searchable && (
          <div className="px-2 py-2 border-b">
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="w-full h-8 px-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
        <div className="max-h-[280px] overflow-y-auto">
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selected.some((s) => s.value === option.value)}
              onCheckedChange={(checked) =>
                setDraft((d) => ({ ...d, filters: toggleValue(d.filters, def, option, checked as boolean) }))
              }
              onSelect={(e) => def.multi !== false && e.preventDefault()}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ListFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  filters: ListFilterDef[];
  value: ListFilterState;
  pills?: ListPillDef[];
  pillState?: ListPillState;
  /** Applied on "View Results" — closing the sheet any other way discards the draft. */
  onApply: (filters: ListFilterState, pills: ListPillState) => void;
}

export function ListFiltersSheet({
  open,
  onOpenChange,
  title = "Filters",
  filters,
  value,
  pills = [],
  pillState = NO_PILLS,
  onApply,
}: ListFiltersSheetProps) {
  // FiltersSheet re-seeds its draft whenever `value` changes identity while open,
  // so this has to be stable across unrelated parent renders.
  const snapshot = useMemo<SheetDraft>(() => ({ filters: value, pills: pillState }), [value, pillState]);

  return (
    <FiltersSheet<SheetDraft>
      open={open}
      onOpenChange={onOpenChange}
      value={snapshot}
      onApply={(draft) => onApply(draft.filters, draft.pills)}
      title={title}
    >
      {({ draft, setDraft }) => (
        <>
          {filters.map((def) => (
            <FilterSection key={def.id} label={def.label} icon={def.icon}>
              <SheetDropdown def={def} draft={draft} setDraft={setDraft} />
            </FilterSection>
          ))}
          {pills.map((pill) => (
            <FilterSection key={pill.id} label={pill.label} icon={pill.icon}>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={!!draft.pills[pill.id]}
                  onCheckedChange={(checked) =>
                    setDraft((d) => ({ ...d, pills: { ...d.pills, [pill.id]: checked === true } }))
                  }
                />
                <span className="text-sm">{pill.tooltip ?? pill.label}</span>
              </label>
            </FilterSection>
          ))}
        </>
      )}
    </FiltersSheet>
  );
}
