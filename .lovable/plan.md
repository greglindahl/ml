

## Auto-Expand Sidebar to Show Newly Created Folders

### Problem
When creating a new folder (especially nested ones), the parent folder in the sidebar navigation may not be expanded, so the newly created folder is not visible. Dropbox automatically reveals newly created items in the folder tree by expanding their parent.

### Changes: `src/components/LibraryScreen.tsx`

1. **In `handleCreateFolder`**: After inserting the new folder, auto-expand its parent in the sidebar by adding the parent's ID (i.e., `data.locationId`) to `expandedFolders`. If the folder is created at root level, no expansion needed since root items are always visible.

2. **In `FolderDetailsView`'s folder creation** (if it creates folders independently): Same logic — ensure the parent folder ID is added to `expandedFolders`.

Concretely, after the `setFolderTree(...)` call in `handleCreateFolder`, add:

```tsx
// Auto-expand parent so new folder is visible in sidebar nav
if (data.locationId) {
  setExpandedFolders(prev => new Set([...prev, data.locationId]));
}
```

3. **Also expand the sidebar itself** if it's collapsed: set `isFolderSidebarExpanded(true)` after folder creation so the user can see the tree.

### Scope
- Only `src/components/LibraryScreen.tsx` needs changes
- Two lines added after folder creation in `handleCreateFolder` (~line 148)

