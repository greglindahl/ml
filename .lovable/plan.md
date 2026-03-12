

## Hide "Archived Only" Toggle in Folders Tab

### Problem
The "Archived Only" toggle is visible in the Folders tab toolbar (at the folder level like "Season 25-26"), but the user wants it hidden since the sidebar already has a "View Archived" toggle for folder tree navigation.

### Approach
Wrap the "Archived Only" toggle element in the Folders tab with a conditional that prevents it from rendering, while preserving the code and state functionality for future use.

### Changes

**`src/components/FolderDetailsView.tsx`**
- Wrap the "Archived Only" toggle div (lines 901-905) with `{false && (...)}` to hide it while keeping the code intact
- The toggle uses `archivedFoldersOnly` state and `setArchivedFoldersOnly` — these remain functional but unused while hidden

### UI Result
The Folders tab will show only the grid/list view toggle buttons on the right side of the controls row, with the "Archived Only" switch no longer visible.

### Files Modified
- `src/components/FolderDetailsView.tsx`

