

## Wire Folder Table View Toggle at All Media Level

The grid/list toggle buttons in `LibraryScreen.tsx` (Folders tab, lines 1365-1372) are static — no state, no click handlers, no `FolderTableView` usage. The table view only works inside `FolderDetailsView.tsx`.

### Changes: `src/components/LibraryScreen.tsx`

1. **Import** `FolderTableView` from `@/components/FolderTableView`
2. **Add state**: `const [folderViewMode, setFolderViewMode] = useState<"grid" | "table">("grid")`
3. **Wire toggle buttons** (lines 1365-1372): add `onClick` handlers and active styling (`bg-muted` when selected), matching the pattern in `FolderDetailsView.tsx`
4. **Conditional render** (lines 1375-1427): when `folderViewMode === "table"`, render `<FolderTableView>` with the filtered top-level folders converted to `FolderItem[]` format; when `"grid"`, keep existing grid

The `FolderTableView` expects `FolderItem[]` from `mockFolderData`. The top-level folders from `folderTree` should map cleanly since they share the same shape. The `onNavigate` callback will call `setActiveFolder(folderId)`.

