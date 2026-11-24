import { useState, useEffect, useRef, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Generic filter snapshot type - each screen will define its own shape
export type FilterSnapshot = Record<string, unknown>;

// Context for draft state within the sheet
interface FiltersSheetContextValue<T extends FilterSnapshot> {
  draft: T;
  setDraft: React.Dispatch<React.SetStateAction<T>>;
  /** Which accordion section is open (one at a time); null = all closed. */
  openSection: string | null;
  setOpenSection: (id: string | null) => void;
}

const FiltersSheetContext = createContext<FiltersSheetContextValue<FilterSnapshot> | null>(null);

export function useFiltersSheetDraft<T extends FilterSnapshot>() {
  const context = useContext(FiltersSheetContext);
  if (!context) {
    throw new Error("useFiltersSheetDraft must be used within a FiltersSheet");
  }
  return context as FiltersSheetContextValue<T>;
}

interface FiltersSheetProps<T extends FilterSnapshot> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: T;
  onApply: (next: T) => void;
  children: React.ReactNode | ((context: FiltersSheetContextValue<T>) => React.ReactNode);
  title?: string;
  /**
   * Turns on the footer's "Clear Filters (n)" (prod's mobile sheet), shown only
   * while something is selected. Two kinds of sheet:
   * - draft: `count` reads the draft and `empty` is the draft with nothing
   *   picked; clearing changes the draft and View Results applies it.
   * - live (picks apply straight away, e.g. Manage Users): `count` reads the
   *   page's filters and `onClear` clears them.
   */
  clear?: { count: (draft: T) => number; empty?: T; onClear?: () => void };
}

export function FiltersSheet<T extends FilterSnapshot>({
  open,
  onOpenChange,
  value,
  onApply,
  children,
  title = "Filters",
  clear,
}: FiltersSheetProps<T>) {
  // Initialize draft from value when sheet opens
  const [draft, setDraft] = useState<T>(value);
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Reset draft when sheet opens
  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  // Every accordion section starts closed each time the sheet opens.
  useEffect(() => {
    if (open) setOpenSection(null);
  }, [open]);

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const contextValue: FiltersSheetContextValue<T> = { draft, setDraft, openSection, setOpenSection };
  const selectedCount = clear ? clear.count(draft) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-[700px] flex flex-col p-0 rounded-t-lg"
      >
        <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
          <SheetTitle className="text-base font-semibold text-left">{title}</SheetTitle>
        </SheetHeader>

        {/* Scrollable filter content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <FiltersSheetContext.Provider value={contextValue as FiltersSheetContextValue<FilterSnapshot>}>
            {typeof children === "function" ? children(contextValue) : children}
          </FiltersSheetContext.Provider>
        </div>

        {/* Fixed footer */}
        <div className="flex-shrink-0 border-t px-4 py-3 flex flex-col items-center gap-3">
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (clear!.empty) setDraft(clear!.empty);
                clear!.onClear?.();
              }}
              className="inline-flex items-center gap-1.5 text-[15px] text-primary hover:underline"
            >
              <i className="bi bi-x-lg text-[12px]" aria-hidden="true" />
              Clear Filters
              <span className="ml-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-muted-foreground text-white text-[11px] font-semibold tabular-nums">
                {selectedCount}
              </span>
            </button>
          )}
          <Button onClick={handleApply} className="w-full">
            View Results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper component for filter sections inside the sheet
interface FilterSectionProps {
  label: string;
  icon?: string;
  children: React.ReactNode;
}

/**
 * The mobile sheet's filter control (prod, per Tell): an accordion, not a popover.
 * Options expand inline and the whole sheet scrolls; long lists cap at ~6 rows
 * with their own scroll; one section open at a time across the sheet; a newly
 * opened section scrolls into view; picked options are solid blue rows; a
 * pick-one control closes on pick. Every sheet uses this one control.
 */
export function SheetAccordionSelect({
  id,
  label,
  placeholder = "All",
  options,
  selected,
  onToggle,
  single = false,
  searchable = false,
}: {
  /** Unique within the sheet: which section is open is tracked by this. */
  id: string;
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  selected: { value: string; label: string }[];
  onToggle: (option: { value: string; label: string }, checked: boolean) => void;
  single?: boolean;
  searchable?: boolean;
}) {
  const { openSection, setOpenSection } = useFiltersSheetDraft();
  const open = openSection === id;
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const visible = searchable ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options;
  const display = selected.length === 0 ? placeholder : selected.length === 1 ? selected[0].label : `${selected.length} selected`;

  useEffect(() => {
    if (open) panelRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open]);

  return (
    <div>
      <Button
        variant="outline"
        className={cn("w-full justify-between font-normal h-10", open && "border-primary")}
        aria-expanded={open}
        onClick={() => setOpenSection(open ? null : id)}
      >
        <span className={cn(selected.length === 0 && "text-muted-foreground")}>{display}</span>
        <i
          className={cn(
            "bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none transition-transform motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </Button>
      {open && (
        <div ref={panelRef} className="mt-1 rounded-md border border-input bg-white">
          {searchable && (
            <div className="px-2 py-2 border-b">
              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-9 px-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
          {/* ~6 rows, then the list scrolls inside the open section */}
          <ul className="max-h-[252px] overflow-y-auto py-1" role="listbox" aria-multiselectable={!single} aria-label={label}>
            {visible.map((option) => {
              const checked = selected.some((s) => s.value === option.value);
              const pick = () => {
                onToggle(option, single ? true : !checked);
                if (single) setOpenSection(null);
              };
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={checked}
                  tabIndex={0}
                  onClick={pick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      pick();
                    }
                  }}
                  className={cn(
                    "flex items-center px-4 h-[42px] text-[15px] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                    checked ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/60",
                  )}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                </li>
              );
            })}
            {visible.length === 0 && <li className="px-3 py-3 text-xs text-muted-foreground text-center">No results found</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export interface LiveSheetFacet {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  single?: boolean;
  searchable?: boolean;
}

export interface LiveSheetToggle {
  id: string;
  label: string;
  /** The checkbox text; the pill's tooltip. Falls back to the label. */
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const NO_DRAFT: FilterSnapshot = {};

/**
 * The mobile sheet for a filter bar that owns its own state (Library assets and
 * galleries, gallery and folder details). Picks apply straight away, so the
 * sheet, the bar and the chips always agree; View Results just closes it.
 * Facets render as the shared accordion, toggle pills as on/off rows, and
 * Clear Filters clears both.
 */
export function LiveFiltersSheet({
  open,
  onOpenChange,
  title = "Filters",
  facets,
  active,
  onToggle,
  toggles = [],
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  facets: LiveSheetFacet[];
  active: Record<string, { value: string; label: string }[]>;
  onToggle: (facet: LiveSheetFacet, option: { value: string; label: string }, checked: boolean) => void;
  toggles?: LiveSheetToggle[];
  /** Clears the bar's filters; the sheet turns the toggles off itself. */
  onClear: () => void;
}) {
  const count =
    facets.reduce((n, f) => n + (active[f.id]?.length ?? 0), 0) + toggles.filter((t) => t.checked).length;
  return (
    <FiltersSheet
      open={open}
      onOpenChange={onOpenChange}
      value={NO_DRAFT}
      onApply={() => {}}
      title={title}
      clear={{
        count: () => count,
        onClear: () => {
          onClear();
          toggles.forEach((t) => t.checked && t.onChange(false));
        },
      }}
    >
      {facets.map((f) => (
        <FilterSection key={f.id} label={f.label}>
          <SheetAccordionSelect
            id={f.id}
            label={f.label}
            options={f.options}
            selected={active[f.id] || []}
            single={f.single}
            searchable={f.searchable}
            onToggle={(option, checked) => onToggle(f, option, checked)}
          />
        </FilterSection>
      ))}
      {toggles.map((t) => (
        <FilterSection key={t.id} label={t.label}>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={t.checked} onCheckedChange={(checked) => t.onChange(checked === true)} />
            <span className="text-sm">{t.description ?? t.label}</span>
          </label>
        </FilterSection>
      ))}
    </FiltersSheet>
  );
}

// `icon` is still accepted so callers don't change, but prod's mobile sheet labels
// are plain text, so it isn't drawn.
export function FilterSection({ label, children }: FilterSectionProps) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[15px] font-medium">{label}</span>
      </div>
      {children}
    </div>
  );
}
