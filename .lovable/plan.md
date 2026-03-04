

## Add Bulk Select to Gallery Controls (Toggle Group Style)

Integrate a "Bulk Select" toggle button into the existing grid/list toggle group in `FolderDetailsView.tsx`, matching the treatment shown in the screenshot — three icons (grid, list, checkbox) grouped together in a single bordered container.

### Changes

**`src/components/FolderDetailsView.tsx`**

Update the toggle group (lines 619-636) to add a third button for bulk select:

```tsx
<div className="flex items-center border rounded-md bg-background">
  <Button variant="ghost" size="icon" 
    className={`h-8 w-8 rounded-r-none ${galleriesViewMode === "grid" ? "bg-muted" : ""}`}
    onClick={() => setGalleriesViewMode("grid")}>
    <Grid3X3 className="w-4 h-4" />
  </Button>
  <Button variant="ghost" size="icon" 
    className={`h-8 w-8 rounded-none border-l ${galleriesViewMode === "list" ? "bg-muted" : ""}`}
    onClick={() => setGalleriesViewMode("list")}>
    <List className="w-4 h-4" />
  </Button>
  <Button variant="ghost" size="icon" 
    className={`h-8 w-8 rounded-l-none border-l ${isAnyGallerySelected ? "bg-muted" : ""}`}
    onClick={() => toggleSelectAllGalleries()}>
    <CheckSquare className="w-4 h-4" />
  </Button>
</div>
```

- Add `CheckSquare` to the imports (already used in LibraryScreen)
- The button toggles selection: if any selected, clear all; if none, select all
- Active state (`bg-muted`) shown when galleries are selected
- No separate standalone "Bulk Select" button needed — it's integrated into the toggle group

**`src/components/LibraryScreen.tsx`**

Apply the same treatment: move the existing standalone "Bulk Select" button into the grid/list toggle group as a third icon button, replacing the current separate `Button` (lines 1052-1062). This keeps the UI consistent across both views.

