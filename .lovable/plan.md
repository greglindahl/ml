

## Folder Actions: Edit, Move, Archive, Delete

Add four folder action dialogs accessible from the "more" (three-dot) menu on the folder details header.

### 1. Edit Folder Dialog (`src/components/EditFolderDialog.tsx`)
- Reuse the same layout as `NewFolderDialog` but with title "Edit Folder", pre-populated name/location/galleries, and a "Save" button instead of "Create"
- Accept the current folder as a prop to pre-fill fields

### 2. Move Folder Dialog (`src/components/MoveFolderDialog.tsx`)
Based on the screenshot (Option 2 style):
- Title: "Move Folder"
- Description text: "Choose a new location for this folder. Moving a folder changes its location in the hierarchy. Nested folders and galleries move with it."
- Show the folder being moved: folder icon, name, and current breadcrumb path
- "Location" dropdown (Select component) listing all valid folders, excluding the folder itself and its descendants
- **4-level depth validation**: Calculate the depth of the folder being moved (including its deepest nested child). If placing it at the selected location would exceed 4 levels total, show a red error: "This move would exceed the 4-level folder limit. Choose a different location." and disable the Move button
- Info banner: "This move will affect X media items and may take some time to complete. The move will continue in the background. **Content will not be searchable until the move is finished.**"
- Cancel and Move buttons

### 3. Archive Folder Dialog (`src/components/ArchiveFolderDialog.tsx`)
- Simple confirmation dialog
- Title: "Archive Folder"
- Description explaining that archiving hides the folder from the main view
- Cancel and Archive buttons

### 4. Delete Folder Dialog (`src/components/DeleteFolderDialog.tsx`)
Based on the screenshot:
- Title: "Delete Folder"
- Text: "This will permanently delete this folder and any nested folders inside it."
- Table showing: Folder name | Sub Folders count
- Checkbox confirmation: "I understand deleting a folder is permanent. Galleries, images and videos that were in a deleted folder will remain in your library."
- Delete button disabled until checkbox is checked
- Cancel and Delete buttons

### 5. Wire actions in `src/components/FolderDetailsView.tsx`
- Replace the existing `MoreVertical` ghost button with a `DropdownMenu` containing: Edit, Move, Archive, Delete items
- Add state for each dialog's open/closed status
- Render all four dialog components
- Pass folder data, breadcrumb path, and flattened folder tree as needed

### Helper: Depth calculation (`src/lib/mockFolderData.ts`)
- Add `getMaxDepth(folder)` — returns the max nesting depth below a folder (1 = leaf, 2 = has children, etc.)
- Add `getFolderDepth(folderId, tree)` — returns how deep a folder is in the tree (root = 1)
- Move validation: `targetDepth + getMaxDepth(movingFolder) > 4` → error

### Files to create
- `src/components/EditFolderDialog.tsx`
- `src/components/MoveFolderDialog.tsx`
- `src/components/ArchiveFolderDialog.tsx`
- `src/components/DeleteFolderDialog.tsx`

### Files to modify
- `src/components/FolderDetailsView.tsx` — add dropdown menu and dialog state
- `src/lib/mockFolderData.ts` — add depth helper functions

