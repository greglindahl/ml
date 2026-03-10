

## Revert Chevron Expansion, Keep Subfolder Column

### What Changes

Remove the expandable tree row behavior (chevron toggle, `expandedFolders` state, recursive `renderRow`, indentation) from `FolderTableView`, reverting to a flat list of top-level folders. Keep the "Subfolders" column showing the count.

### Implementation

**`src/components/FolderTableView.tsx`**

1. Remove `expandedFolders` state and `toggleExpand` function
2. Remove the recursive `renderRow` function — go back to a flat `.map()` over `sorted`
3. Remove the chevron button and depth-based indentation from each row
4. Keep the folder icon column simple (just `FolderOpen` icon, no chevron)
5. Keep the "Subfolders" column and `subfolderCount` in the enriched data
6. Remove `ChevronRight` from imports if no longer used

### File Modified
- `src/components/FolderTableView.tsx`

