

## Make Folder Actions Persist (In-Memory State)

Currently, `LibraryScreen.tsx` already manages a mutable `folderTree` state (line 66) and handles `handleCreateFolder`. However, the action dialogs in `FolderDetailsView` only show toasts — they don't mutate the tree. We need to lift the mutation logic up.

### Approach

Since there's no backend, all persistence will be **in-memory React state** within `LibraryScreen.tsx` (the parent that owns `folderTree`). This is sufficient for user testing within a session.

### Changes

#### 1. `FolderDetailsView.tsx` — Add callback props instead of local-only toasts

Add new callback props to the interface:
- `onEditFolder: (folderId: string, data: { name: string; locationId: string | null; galleryIds: string[] }) => void`
- `onMoveFolder: (folderId: string, targetLocationId: string | null) => void`
- `onArchiveFolder: (folderId: string) => void`
- `onDeleteFolder: (folderId: string) => void`

Wire each dialog's `onSave`/`onMove`/`onArchive`/`onDelete` to call these props (keeping the toast notifications).

#### 2. `LibraryScreen.tsx` — Add tree mutation handlers

Add four handler functions that immutably update `folderTree`:

- **Edit**: Walk the tree, find the folder by ID, update its `name`. If `locationId` changed, remove from old parent and insert at new parent. If `galleryIds` changed, update children.
- **Move**: Remove the folder from its current parent, insert it under the target folder (or root if null). Depth validation already happens in the dialog.
- **Archive**: Remove the folder from the tree (or mark it with an `archived: true` flag and filter it from display). Simplest for user testing: just remove it.
- **Delete**: Recursively remove the folder and all descendants from the tree.

Pass these handlers as props to `FolderDetailsView`. After delete/archive, navigate back to "all" (reset `activeFolder`).

#### 3. `LibraryScreen.tsx` — Pass handlers to `FolderDetailsView`

Update the `<FolderDetailsView>` render (around line 544) to pass the four new callback props.

#### 4. `mockFolderData.ts` — Add `archived` field (optional)

Add an optional `archived?: boolean` field to `FolderItem` if we want to support toggling archive state rather than removing. For user testing, simple removal is fine — skip this unless preferred.

### Helper utilities needed (in `LibraryScreen.tsx` or `mockFolderData.ts`)

- `removeFolderById(tree, id)` — returns new tree with folder removed
- `insertFolderAt(tree, targetId, folder)` — inserts folder as child of target (or root if null)
- `updateFolderInTree(tree, id, updates)` — updates folder properties in place

### Files to modify
- `src/components/FolderDetailsView.tsx` — add callback props, wire dialogs
- `src/components/LibraryScreen.tsx` — add mutation handlers, pass as props

No new files needed.

