

## Enforce Folder Depth Constraint (Max 3 Levels of Folders)

Folders can nest up to 3 levels deep. Level 4 can only contain galleries, not folders. This affects the "New" dropdown, the empty state, and the "New Folder" dialog.

### How depth is determined
The `breadcrumbPath` in `FolderDetailsView` already includes "All Media" + ancestors + current folder. A folder at depth 3 has `breadcrumbPath.length === 4`. We compute `folderDepth = breadcrumbPath.length - 1` (excluding "All Media" root).

### Changes

#### `src/components/FolderDetailsView.tsx`
1. Compute `folderDepth` from `breadcrumbPath.length - 1`
2. Define `canCreateSubfolder = folderDepth < 3`
3. **New dropdown (line 248)**: Conditionally render the "New Folder" menu item only when `canCreateSubfolder`
4. **Empty state (line 662)**: Conditionally render "New Folder" link only when `canCreateSubfolder`
5. When `!canCreateSubfolder`, the empty state text could say "Add galleries to this folder" instead of mentioning folders

#### `src/components/NewFolderDialog.tsx`
The "Location" dropdown in the New Folder dialog should also exclude folders at depth 3 from being valid parent locations. This requires filtering `flattenedFolders` to only include folders where placing a new child wouldn't exceed depth 3. (This may already be partially handled — will verify and fix if needed.)

### Files to modify
- `src/components/FolderDetailsView.tsx` — hide "New Folder" options at depth 3
- `src/components/NewFolderDialog.tsx` — filter location options by depth (if not already constrained)

