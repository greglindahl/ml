import { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { NameDialog, describeFilters, sameFilters, type SavedFilter, type SavedFiltersStore } from "./ActivitySavedFilters";

/**
 * Option B for Activity saved filters: a views bar of one-click chips above the
 * filter row (Gmail / Linear style). Same saved data as Option A, different model:
 *
 *  - "All activity" is always first and means no filters;
 *  - the active view is remembered, so editing its filters marks it modified
 *    ("•") and offers Update view (new — prod can only rename) or Save as new;
 *  - each chip's ⋯ menu renames, deletes, or moves it; past MAX_INLINE views
 *    the rest fold into a searchable "More" menu so the row never wraps.
 */

const MAX_INLINE = 5;
const ACTIVE_KEY = "insights.activity.activeView";

const CHIP =
  "inline-flex items-center gap-1.5 h-8 rounded-full border text-[13px] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const CHIP_IDLE = "bg-white border-gray-300 text-foreground hover:bg-accent";
const CHIP_ACTIVE = "bg-primary/10 border-primary text-primary";

export function useActivitySavedViews({
  store: [saved, setSaved],
  filters,
  setFilters,
  defs,
}: {
  store: SavedFiltersStore;
  filters: ListFilterState;
  setFilters: (next: ListFilterState) => void;
  defs: ListFilterDef[];
}) {
  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_KEY);
    } catch {
      return null;
    }
  });
  const [nameDialog, setNameDialog] = useState<{ mode: "create" } | { mode: "rename"; target: SavedFilter } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedFilter | null>(null);
  const [moreQuery, setMoreQuery] = useState("");

  const isFiltered = Object.values(filters).some((v) => v?.length);
  const active = saved.find((s) => s.id === activeId) ?? null;
  const modified = !!active && !sameFilters(active.filters, filters);

  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {
      // Storage unavailable — the active view just won't survive a reload.
    }
  }, [activeId]);

  // Clearing every filter is "All activity" (prod: clearing deselects), and a
  // deleted view can't stay active.
  useEffect(() => {
    if (!isFiltered && activeId) setActiveId(null);
  }, [isFiltered, activeId]);
  useEffect(() => {
    if (activeId && !active) setActiveId(null);
  }, [activeId, active]);

  const apply = (view: SavedFilter | null) => {
    setActiveId(view?.id ?? null);
    setFilters(view ? view.filters : {});
  };

  const move = (view: SavedFilter, delta: -1 | 1) =>
    setSaved((prev) => {
      const i = prev.findIndex((s) => s.id === view.id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const updateActive = () => {
    if (!active) return;
    setSaved((prev) => prev.map((s) => (s.id === active.id ? { ...s, filters } : s)));
    toast({ title: "View updated", description: active.name });
  };

  const submitName = (name: string) => {
    if (!nameDialog) return;
    if (nameDialog.mode === "create") {
      const id = `sf-${Date.now()}`;
      setSaved((prev) => [...prev, { id, name, filters, createdAt: new Date().toISOString() }]);
      setActiveId(id);
      toast({ title: "View saved", description: name });
    } else {
      const id = nameDialog.target.id;
      setSaved((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
      toast({ title: "View renamed", description: name });
    }
    setNameDialog(null);
  };

  const inline = saved.slice(0, MAX_INLINE);
  const overflow = saved.slice(MAX_INLINE);
  // Keep the active view visible even when it lives past the fold.
  const activeInOverflow = !!active && overflow.some((s) => s.id === active.id);

  // A render function, not a component: defined inside the hook, a component
  // would get a new identity every render and drop its open menu.
  const renderChip = (view: SavedFilter) => {
    const isActive = active?.id === view.id;
    const index = saved.findIndex((s) => s.id === view.id);
    return (
      <div key={view.id} className={cn(CHIP, isActive ? CHIP_ACTIVE : CHIP_IDLE, "pr-1 pl-3 group")}>
        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            <button type="button" className="inline-flex items-center gap-1.5 max-w-[220px]" onClick={() => apply(view)} aria-pressed={isActive}>
              <i className={cn("bi", isActive ? "bi-bookmark-fill" : "bi-bookmark", "text-[12px]")} aria-hidden="true" />
              <span className="truncate">{view.name}</span>
              {isActive && modified && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-label="modified" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[320px]">
            {describeFilters(view.filters, defs) || "No filters"}
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                !isActive && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100",
              )}
              aria-label={`${view.name} options`}
            >
              <i className="bi bi-three-dots text-[12px]" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-white min-w-[200px]">
            {isActive && modified && (
              <>
                <DropdownMenuItem onClick={updateActive}>
                  <i className="bi bi-arrow-repeat w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" />
                  Update view
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNameDialog({ mode: "create" })}>
                  <i className="bi bi-bookmark-plus w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" />
                  Save as new view
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => apply(view)}>
                  <i className="bi bi-arrow-counterclockwise w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" />
                  Discard changes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => setNameDialog({ mode: "rename", target: view })}>
              <i className="bi bi-pencil w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem disabled={index === 0} onClick={() => move(view, -1)}>
              <i className="bi bi-arrow-left w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" />
              Move left
            </DropdownMenuItem>
            <DropdownMenuItem disabled={index === saved.length - 1} onClick={() => move(view, 1)}>
              <i className="bi bi-arrow-right w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" />
              Move right
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(view)}>
              <i className="bi bi-trash w-4 h-4 mr-2 inline-flex items-center justify-center leading-none" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const bar = (
    <nav aria-label="Saved views" className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
      <button type="button" className={cn(CHIP, "px-3", !active && !isFiltered ? CHIP_ACTIVE : CHIP_IDLE)} onClick={() => apply(null)} aria-pressed={!active && !isFiltered}>
        <i className="bi bi-activity text-[12px]" aria-hidden="true" />
        All activity
      </button>

      {inline.map(renderChip)}
      {activeInOverflow && active && renderChip(active)}

      {overflow.length > 0 && (
        <Popover onOpenChange={(open) => !open && setMoreQuery("")}>
          <PopoverTrigger asChild>
            <button type="button" className={cn(CHIP, CHIP_IDLE, "px-3")}>
              More
              <span className="text-muted-foreground tabular-nums">{overflow.length}</span>
              <i className="bi bi-chevron-down text-[11px]" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[300px] p-0 bg-white">
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Search views"
                aria-label="Search saved views"
                value={moreQuery}
                onChange={(e) => setMoreQuery(e.target.value)}
                className="w-full h-8 px-2 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <ul className="max-h-[280px] overflow-y-auto py-1">
              {overflow
                .filter((v) => v.name.toLowerCase().includes(moreQuery.trim().toLowerCase()))
                .map((v) => (
                  <li key={v.id}>
                    <button type="button" onClick={() => apply(v)} className="w-full text-left px-3 py-2 hover:bg-accent">
                      <span className="block text-[13px] font-medium text-foreground truncate">{v.name}</span>
                      <span className="block text-[12px] text-muted-foreground truncate">{describeFilters(v.filters, defs)}</span>
                    </button>
                  </li>
                ))}
            </ul>
          </PopoverContent>
        </Popover>
      )}

      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          {/* span wrapper: a disabled button can't raise the tooltip */}
          <span>
            <button
              type="button"
              disabled={!isFiltered || (!!active && !modified)}
              onClick={() => setNameDialog({ mode: "create" })}
              className="inline-flex items-center gap-1.5 h-8 px-2 text-[13px] text-primary rounded-md hover:bg-accent disabled:text-muted-foreground disabled:hover:bg-transparent disabled:cursor-not-allowed whitespace-nowrap"
            >
              <i className="bi bi-plus-lg" aria-hidden="true" />
              Save view
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {!isFiltered ? "Apply a filter to save it as a view" : active && !modified ? "This view is already saved" : "Save the current filters as a view"}
        </TooltipContent>
      </Tooltip>
    </nav>
  );

  const dialogs = (
    <>
      <NameDialog
        open={!!nameDialog}
        onOpenChange={(open) => !open && setNameDialog(null)}
        mode={nameDialog?.mode ?? "create"}
        initialName={nameDialog?.mode === "rename" ? nameDialog.target.name : ""}
        existingNames={saved.map((s) => s.name)}
        summary={describeFilters(nameDialog?.mode === "rename" ? nameDialog.target.filters : filters, defs)}
        onSubmit={submitName}
        title={nameDialog?.mode === "rename" ? "Rename View" : "Save View"}
        description={nameDialog?.mode === "rename" ? "Only the name changes; the filters stay the same." : "It appears in the views bar above the filters."}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete View?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete the view "{deleteTarget?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                setSaved((prev) => prev.filter((s) => s.id !== deleteTarget.id));
                toast({ title: "View deleted", description: deleteTarget.name });
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

  return { bar, dialogs };
}
