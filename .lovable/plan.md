

## Move Galleries Dialog

Based on the mockup, this is a multi-gallery move dialog where each selected gallery shows its name, current location (folder path or "Not in a folder"), and an independent location picker. This is different from the existing single-location `MoveFolderDialog`.

### Key observations from the mockup
- Title: "Move Galleries" (plural, with count: "You're about to move [X] galleries")
- Subtitle explains sharing/assets/access are not affected
- Table layout: Gallery | Current Location | Location (select dropdown per row)
- Info banner about background processing + searchability
- Cancel / Move buttons

### What needs to happen

#### 1. Create `MoveGalleriesDialog.tsx`
A new dialog component that:
- Accepts a list of selected galleries (with their current folder paths)
- Renders a table with one row per gallery: name, current location breadcrumb (or "Not in a folder"), and a per-row `Select` dropdown for the target location
- Location dropdown options: "All Media" (root) + all folders from `flattenedFolders`, filtered to respect depth (galleries can go up to level 4)
- Info banner matching the mockup text
- Cancel / Move footer buttons
- Move button calls back with a mapping of gallery ID to target location

#### 2. Wire it into `GalleryTableView.tsx`
- The table already has multi-select (checkboxes + `selectedGalleries` state)
- Add a "Move" action that appears when galleries are selected (bulk action bar or dropdown)
- Pass selected gallery data + folder context up to trigger the dialog

#### 3. Helper: resolve gallery's current folder path
- Need a utility to find which folder (if any) contains a given gallery ID, and build its breadcrumb path string (e.g., "Folder Name > Folder Name" or "Not in a folder")

### Complexity concern
Right now `GalleryTableView` doesn't know about the folder tree — it just receives a flat list of galleries. The current location of each gallery requires traversing the folder tree. We have two options:

**Option A**: Pass the folder tree into `GalleryTableView` and compute paths there
**Option B**: Lift the move action to `FolderDetailsView` (which already has the folder tree), and have `GalleryTableView` just emit the selected IDs upward

Option B is cleaner — keeps `GalleryTableView` presentation-focused.

### Proposed approach (Option B)

1. **`GalleryTableView`**: Expose `selectedGalleries` state upward via a callback prop (`onSelectionChange`) or expose a "Move" action callback (`onMoveGalleries(ids: string[])`)
2. **`FolderDetailsView`**: Handle the move dialog state, compute current locations for each selected gallery from the folder tree, and render `MoveGalleriesDialog`
3. **`MoveGalleriesDialog`**: New component matching the mockup layout

### Files to create/modify
- **Create** `src/components/MoveGalleriesDialog.tsx` — the dialog matching the mockup
- **Modify** `src/components/GalleryTableView.tsx` — add `onMoveGalleries` callback prop, surface bulk "Move" action
- **Modify** `src/components/FolderDetailsView.tsx` — wire up the dialog with folder tree context
- **Modify** `src/lib/mockFolderData.ts` — add helper to find a gallery's parent folder path

