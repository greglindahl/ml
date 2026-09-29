import { useEffect, useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ListFilterDef, ListFilterState } from "./ListFilters";

/**
 * Saved filters for the Activity feed — prod's savedActivityFeedFilter, pulled
 * out of the bottom of the filter sidebar and the Account › Notifications page
 * into the filter row, where people can actually find it:
 *
 *  - a "Saved Filters" control that is always visible (count badge, or the
 *    applied filter's name), listing, loading, renaming and deleting filters;
 *  - a contextual "Save filters" link on the applied-chip row the moment any
 *    filter is applied, flipping to "Saved as …" when the view matches one.
 *
 * Prod rules kept: name required and unique (prod's copy), loading replaces the
 * current filters, date ranges save as the relative preset, clearing every
 * filter deselects, delete confirms with prod's copy. Pinned entities aren't in
 * the prototype, so they aren't saved.
 */

export interface SavedFilter {
  id: string;
  name: string;
  filters: ListFilterState;
  createdAt: string;
}

const STORAGE_KEY = "insights.activity.savedFilters";

// A big customer relies on this, so the prototype opens with a couple in place.
const SEED: SavedFilter[] = [
  {
    id: "seed-content",
    name: "New content this week",
    filters: {
      includes: [{ value: "Media", label: "Media" }],
      date: [{ value: "7", label: "Last 7 days" }],
    },
    createdAt: "2026-09-01T12:00:00.000Z",
  },
  {
    id: "seed-social",
    name: "Social team shares",
    filters: {
      category: [{ value: "Sharing", label: "Sharing" }],
      group: [{ value: "Social Media Team", label: "Social Media Team" }],
    },
    createdAt: "2026-09-10T12:00:00.000Z",
  },
];

function useStoredSavedFilters() {
  const [saved, setSaved] = useState<SavedFilter[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as SavedFilter[]) : SEED;
    } catch {
      return SEED;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // Storage unavailable — saved filters just won't survive a reload.
    }
  }, [saved]);
  return [saved, setSaved] as const;
}

/** Same filters regardless of key or value order. */
export function sameFilters(a: ListFilterState, b: ListFilterState) {
  const keys = (s: ListFilterState) => Object.keys(s).filter((k) => s[k]?.length).sort();
  const ka = keys(a);
  const kb = keys(b);
  if (ka.join("|") !== kb.join("|")) return false;
  return ka.every((k) => {
    const va = a[k].map((v) => v.value).sort().join("|");
    const vb = b[k].map((v) => v.value).sort().join("|");
    return va === vb;
  });
}

/** Prod's saved-filter description: "Category: Content, Sharing · User: Emma Allen". */
export function describeFilters(filters: ListFilterState, defs: ListFilterDef[]) {
  return defs
    .filter((d) => filters[d.id]?.length)
    .map((d) => `${d.label}: ${filters[d.id].map((v) => v.label).join(", ")}`)
    .join(" · ");
}

// ---------------------------------------------------------------------------
// Name dialog (create + rename)
// ---------------------------------------------------------------------------

function NameDialog({
  open,
  onOpenChange,
  mode,
  initialName,
  existingNames,
  summary,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "rename";
  initialName: string;
  existingNames: string[];
  summary: string;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setSubmitted(false);
    }
  }, [open, initialName]);

  const trimmed = name.trim();
  const taken = existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase() && n !== initialName);
  // Prod's validation copy.
  const error = !trimmed ? "Please enter a name for your filter." : taken ? "Filter name must be unique." : undefined;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!error) onSubmit(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Save Filter" : "Edit Filter Name"}</DialogTitle>
            <DialogDescription>
              {mode === "create" ? "Load these filters again from Saved Filters." : "Only the name changes; the filters stay the same."}
            </DialogDescription>
          </DialogHeader>

          <FormField label="Filter name" htmlFor="saved-filter-name" required error={submitted ? error : undefined}>
            <Input
              id="saved-filter-name"
              autoFocus
              placeholder="e.g. Social team shares"
              maxLength={60}
              value={name}
              variant={submitted && error ? "error" : "default"}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>

          {summary && (
            <div className="rounded-md bg-muted/60 px-3 py-2 text-[13px]">
              <span className="text-muted-foreground">Filters: </span>
              <span className="text-foreground">{summary}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Hook: state + the three pieces the Activity tab renders
// ---------------------------------------------------------------------------

export function useActivitySavedFilters({
  filters,
  setFilters,
  defs,
}: {
  filters: ListFilterState;
  setFilters: (next: ListFilterState) => void;
  defs: ListFilterDef[];
}) {
  const [saved, setSaved] = useStoredSavedFilters();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [nameDialog, setNameDialog] = useState<{ mode: "create" } | { mode: "rename"; target: SavedFilter } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedFilter | null>(null);

  const isFiltered = Object.values(filters).some((v) => v?.length);
  // Selection is derived, not stored: the saved filter whose filters match the
  // view. Editing a filter afterwards drops the match, clearing all filters
  // deselects (prod), and saving makes the new one match immediately.
  const selected = useMemo(
    () => (isFiltered ? saved.find((s) => sameFilters(s.filters, filters)) ?? null : null),
    [saved, filters, isFiltered],
  );
  const names = saved.map((s) => s.name);
  const listed = saved.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));

  const load = (s: SavedFilter) => {
    setFilters(s.filters);
    setMenuOpen(false);
    toast({ title: `Loaded “${s.name}”` });
  };

  const openSave = () => {
    setMenuOpen(false);
    setNameDialog({ mode: "create" });
  };

  const submitName = (name: string) => {
    if (!nameDialog) return;
    if (nameDialog.mode === "create") {
      setSaved((prev) => [...prev, { id: `sf-${Date.now()}`, name, filters, createdAt: new Date().toISOString() }]);
      toast({ title: "Filter saved", description: name });
    } else {
      const id = nameDialog.target.id;
      setSaved((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
      toast({ title: "Filter renamed", description: name });
    }
    setNameDialog(null);
  };

  // --- Filter-row control -------------------------------------------------

  const menu = (
    <Popover
      open={menuOpen}
      onOpenChange={(open) => {
        setMenuOpen(open);
        if (!open) setQuery("");
      }}
    >
      <Tooltip delayDuration={700}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-10 gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3] max-w-[260px]",
                selected && "bg-primary/10 border-primary text-primary",
              )}
              aria-label={selected ? `Saved filter: ${selected.name}` : "Saved Filters"}
            >
              <i className={cn("bi w-4 h-4 inline-flex items-center justify-center leading-none", selected ? "bi-bookmark-fill" : "bi-bookmark")} />
              <span className="filter-label truncate">{selected ? selected.name : "Saved Filters"}</span>
              {!selected && saved.length > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-muted text-foreground text-[10px] min-w-4 h-4 px-1 tabular-nums">
                  {saved.length}
                </span>
              )}
              <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        {/* The label hides on narrow filter bars, so the tooltip carries the name. */}
        <TooltipContent side="bottom">{selected ? `Saved filter: ${selected.name}` : "Saved Filters"}</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-[340px] p-0 bg-white" onOpenAutoFocus={(e) => saved.length === 0 && e.preventDefault()}>
        <div className="px-3 pt-3 pb-2 border-b">
          <p className="text-[13px] font-semibold text-foreground mb-2">Saved Filters</p>
          {saved.length > 0 && (
            <div className="relative">
              <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
              <input
                type="text"
                placeholder="Search"
                aria-label="Search saved filters"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>

        {saved.length === 0 ? (
          // Prod's empty state copy, pointed at this control.
          <div className="px-4 py-6 text-center">
            <p className="text-[14px] font-semibold text-foreground">No saved filters yet.</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Set some filters and click <strong>Save current filters</strong> to easily load those filters again.
            </p>
          </div>
        ) : (
          <ul className="max-h-[300px] overflow-y-auto py-1" aria-label="Saved filters">
            {listed.map((s) => {
              const isSelected = selected?.id === s.id;
              return (
                <li key={s.id} className="group flex items-start gap-1 px-1">
                  <button
                    type="button"
                    onClick={() => load(s)}
                    className={cn(
                      "flex-1 min-w-0 text-left rounded-md px-2 py-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      isSelected && "bg-primary/5",
                    )}
                    aria-current={isSelected ? "true" : undefined}
                  >
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                      {isSelected && <i className="bi bi-check2 text-primary" aria-hidden="true" />}
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="block text-[12px] text-muted-foreground truncate">{describeFilters(s.filters, defs) || "No filters"}</span>
                  </button>
                  <div className="flex items-center pt-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity motion-reduce:transition-none">
                    <button
                      type="button"
                      className="w-7 h-7 rounded inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={`Rename ${s.name}`}
                      onClick={() => {
                        setMenuOpen(false);
                        setNameDialog({ mode: "rename", target: s });
                      }}
                    >
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="w-7 h-7 rounded inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={`Delete ${s.name}`}
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteTarget(s);
                      }}
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
            {listed.length === 0 && <li className="px-3 py-3 text-xs text-muted-foreground text-center">No filters found</li>}
          </ul>
        )}

        <div className="border-t p-1">
          <button
            type="button"
            onClick={openSave}
            disabled={!isFiltered || !!selected}
            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-[13px] text-primary hover:bg-accent disabled:text-muted-foreground disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <i className="bi bi-bookmark-plus" aria-hidden="true" />
            Save current filters
            <span className="ml-auto text-[12px] text-muted-foreground">
              {!isFiltered ? "Apply a filter first" : selected ? "Already saved" : ""}
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );

  // --- Applied-chip row prompt ---------------------------------------------

  const chipAction = selected ? (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
      <i className="bi bi-bookmark-fill text-primary" aria-hidden="true" />
      Saved as <span className="text-foreground font-medium">{selected.name}</span>
    </span>
  ) : (
    <button
      type="button"
      onClick={openSave}
      className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline px-2 py-1"
    >
      <i className="bi bi-bookmark-plus" aria-hidden="true" />
      Save filters
    </button>
  );

  // --- Dialogs ----------------------------------------------------------------

  const dialogs = (
    <>
      <NameDialog
        open={!!nameDialog}
        onOpenChange={(open) => !open && setNameDialog(null)}
        mode={nameDialog?.mode ?? "create"}
        initialName={nameDialog?.mode === "rename" ? nameDialog.target.name : ""}
        existingNames={names}
        summary={describeFilters(nameDialog?.mode === "rename" ? nameDialog.target.filters : filters, defs)}
        onSubmit={submitName}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Filter?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete the filter "{deleteTarget?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                setSaved((prev) => prev.filter((s) => s.id !== deleteTarget.id));
                toast({ title: "Filter deleted", description: deleteTarget.name });
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return { menu, chipAction, dialogs };
}
