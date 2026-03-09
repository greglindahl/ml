

## Fix Archived Item Nesting & Add Opacity Treatment to Gallery Cards

### Problem 1: Sidebar Nesting Misalignment
When an archived folder has `disableDrag` set, the drag handle is completely removed from the DOM. This eliminates the space it occupies, causing the archived item to appear shifted left — breaking the visual hierarchy. For example, "New L3" appears at the same level as "New L2".

### Problem 2: Gallery Cards Missing Archived Opacity
Gallery cards inside an archived folder don't show the reduced-opacity treatment that folder cards use.

### Changes

**`src/components/SortableFolderItem.tsx`**
- When `disableDrag` is true and the item is not "All Files", render an invisible placeholder `<span>` with the same width as the drag handle (`w-3.5 + p-0.5` padding) instead of removing the handle entirely. This preserves the indentation alignment.

**`src/components/FolderDetailsView.tsx`**
- On the gallery card grid (~line 854), add `opacity-50` class when the gallery's `archived` property is true (same treatment as folder cards). Check via `gallery.archived === true`.
- Similarly on folder cards (~line 979), confirm archived folders also get the `opacity-50` class.

### Files Modified
- `src/components/SortableFolderItem.tsx`
- `src/components/FolderDetailsView.tsx`

