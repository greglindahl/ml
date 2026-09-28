import { useCallback, useMemo, useState } from "react";
import {
  AppliedFilterChips,
  ListFilterBar,
  ListFiltersSheet,
  ListSearchRow,
  type ListFilterDef,
  type ListFilterState,
  type ListPillDef,
  type ListPillState,
} from "./ListFilters";
import {
  TableSettingsDrawer,
  allVisible,
  useVisibilityPreference,
  type SettingsOption,
  type VisibilityMap,
} from "./TableSettingsDrawer";
import { usePerPagePreference } from "./SettingsDrawer";

/**
 * The whole ML 2.0 list header in one piece: search row (+ gear), filter row,
 * applied-filter chips, the narrow-width FiltersSheet and the View Settings
 * drawer. A screen supplies filter/pill/column definitions and reads the
 * resulting state back from `useListControls` to filter its rows.
 */

export interface ListControls {
  search: string;
  setSearch: (value: string) => void;
  filters: ListFilterState;
  setFilters: (value: ListFilterState) => void;
  pills: ListPillState;
  setPill: (id: string, active: boolean) => void;
  setPills: (value: ListPillState) => void;
  perPage: number;
  setPerPage: (value: number) => void;
  columnVisibility: VisibilityMap;
  setColumnVisibility: (value: VisibilityMap) => void;
  filterVisibility: VisibilityMap;
  setFilterVisibility: (value: VisibilityMap) => void;
  /** Search + filters + pills — what an empty state's "start over" resets. */
  clearAll: () => void;
  isFiltered: boolean;
}

export function useListControls(
  key: string,
  { columns = [], filters = [] }: { columns?: SettingsOption[]; filters?: SettingsOption[] },
): ListControls {
  const [search, setSearch] = useState("");
  const [filterState, setFilters] = useState<ListFilterState>({});
  const [pills, setPills] = useState<ListPillState>({});
  const [perPage, setPerPage] = usePerPagePreference(key, 40);
  const defaultColumns = useMemo(() => allVisible(columns), [columns]);
  const defaultFilters = useMemo(() => allVisible(filters), [filters]);
  const [columnVisibility, setColumnVisibility] = useVisibilityPreference(`tableColumns.${key}`, defaultColumns);
  const [filterVisibility, setFilterVisibilityRaw] = useVisibilityPreference(`filterVisibility.${key}`, defaultFilters);

  // Hiding a filter from the row also drops its applied values; otherwise a chip
  // would keep narrowing the list with no control left to change it.
  const setFilterVisibility = useCallback(
    (next: VisibilityMap) => {
      setFilterVisibilityRaw(next);
      setFilters((prev) => {
        const kept = Object.fromEntries(Object.entries(prev).filter(([id]) => next[id] !== false));
        return Object.keys(kept).length === Object.keys(prev).length ? prev : kept;
      });
    },
    [setFilterVisibilityRaw],
  );

  const setPill = useCallback((id: string, active: boolean) => setPills((prev) => ({ ...prev, [id]: active })), []);

  const clearAll = useCallback(() => {
    setSearch("");
    setFilters({});
    setPills({});
  }, []);

  const isFiltered = search.trim() !== "" || Object.keys(filterState).length > 0 || Object.values(pills).some(Boolean);

  return {
    search,
    setSearch,
    filters: filterState,
    setFilters,
    pills,
    setPill,
    setPills,
    perPage,
    setPerPage,
    columnVisibility,
    setColumnVisibility,
    filterVisibility,
    setFilterVisibility,
    clearAll,
    isFiltered,
  };
}

interface ListToolbarProps {
  controls: ListControls;
  filterDefs?: ListFilterDef[];
  pillDefs?: ListPillDef[];
  /** Omit for lists with no table preferences — the gear goes away. */
  columns?: SettingsOption[];
  searchPlaceholder?: string;
  sheetTitle?: string;
}

export function ListToolbar({
  controls,
  filterDefs = [],
  pillDefs = [],
  columns,
  searchPlaceholder,
  sheetTitle,
}: ListToolbarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const visibleFilters = filterDefs.filter((f) => controls.filterVisibility[f.id] !== false);
  const hasFilterRow = visibleFilters.length > 0 || pillDefs.length > 0;
  const filterOptions = useMemo(() => filterDefs.map((f) => ({ key: f.id, label: f.label })), [filterDefs]);

  return (
    <>
      <ListSearchRow
        value={controls.search}
        onChange={controls.setSearch}
        placeholder={searchPlaceholder}
        onOpenSettings={columns ? () => setSettingsOpen(true) : undefined}
      />

      {hasFilterRow && (
        <div>
          <ListFilterBar
            filters={visibleFilters}
            value={controls.filters}
            onChange={controls.setFilters}
            pills={pillDefs}
            pillState={controls.pills}
            onPillToggle={controls.setPill}
            onOpenFiltersSheet={() => setSheetOpen(true)}
          />
        </div>
      )}

      <AppliedFilterChips filters={visibleFilters} value={controls.filters} onChange={controls.setFilters} />

      {hasFilterRow && (
        <ListFiltersSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={sheetTitle}
          filters={visibleFilters}
          value={controls.filters}
          pills={pillDefs}
          pillState={controls.pills}
          onApply={(filters, pills) => {
            controls.setFilters(filters);
            controls.setPills(pills);
          }}
        />
      )}

      {columns && (
        <TableSettingsDrawer
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          perPage={controls.perPage}
          onPerPageChange={controls.setPerPage}
          columns={columns}
          columnVisibility={controls.columnVisibility}
          defaultColumnVisibility={allVisible(columns)}
          onColumnVisibilityChange={controls.setColumnVisibility}
          filters={filterOptions}
          filterVisibility={controls.filterVisibility}
          defaultFilterVisibility={allVisible(filterOptions)}
          onFilterVisibilityChange={controls.setFilterVisibility}
        />
      )}
    </>
  );
}
