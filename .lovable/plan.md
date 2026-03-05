

## Add Table View for Folders

Currently the Folders tab only renders a grid of folder cards. The grid/list toggle buttons exist but the list button does nothing. This plan adds a `FolderTableView` component and wires the toggle to switch between grid and table views.

### New file: `src/components/FolderTableView.tsx`

Create a table component following the same patterns as `GalleryTableView.tsx`:

- **Columns**: Checkbox, Icon (folder icon), Name (clickable, navigates into folder), Subfolders count, Created date (mock), Created by (mock), Actions menu (three-dot)
- **Features**: Select all / individual checkboxes, sortable columns (name, subfolders, created), action menu with View, Edit, Move, Archive, Delete options
- **Props**: `folders: FolderItem[]`, `onNavigate: (folderId: string) => void`, `isLoading?: boolean`, `archivedFoldersOnly?: boolean`, `onUnarchiveFolder?: (folderId: string) => void`
- **Styling**: Matches `GalleryTableView` — uppercase tracking-wider column headers, `border rounded-lg bg-card` wrapper, same sort icon pattern

### Change: `src/components/FolderDetailsView.tsx`

1. Add `folderViewMode` state (`"grid" | "table"`, default `"grid"`)
2. Wire the existing grid/list toggle buttons (lines 910-917) to set this state, with active highlighting
3. Conditionally render the existing grid (lines 970-1003) or the new `<FolderTableView>` based on `folderViewMode`
4. Import and use the new `FolderTableView` component

