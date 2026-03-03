

## Fix Empty State Buttons + Gallery Folder Assignment Bug

### Issue 1: Empty state buttons not wired
In `FolderDetailsView.tsx` lines 661-662, the "Add Galleries" button and "New Folder" link in the empty folder state are static — they don't open any dialogs.

**Fix**: Wire them to open the existing dialogs:
- "Add Galleries" → `setAddGalleryDialogOpen(true)`
- "New Folder" → `setNewFolderDialogOpen(true)`

### Issue 2: Gallery not added to correct folder level
Two bugs in `NewGalleryDialog.tsx`:

**Bug A**: The "None" SelectItem has `value="none"` but the null-check compares against `""`. When user selects "None", `folderId` becomes the string `"none"` instead of `null`. Then `insertFolderAt` looks for a folder with id `"none"` and finds nothing.

**Fix**: Change `<SelectItem value="none">` to match the null mapping, or change the `onValueChange` to check for `"none"`.

**Bug B**: `useState(defaultFolderId ?? null)` only runs on first mount. Since `NewGalleryDialog` is always rendered (just toggled via `open`), navigating to a different folder doesn't update the dialog's internal `folderId` state.

**Fix**: Add a `useEffect` that syncs `folderId` state when `defaultFolderId` prop changes, or when `open` becomes `true`.

### Files to modify
- `src/components/FolderDetailsView.tsx` — wire empty state buttons (lines 661-662)
- `src/components/NewGalleryDialog.tsx` — fix "none" value mapping + sync defaultFolderId on open

