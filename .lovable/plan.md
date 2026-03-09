## Unarchive via Overflow Menu Instead of Hover Button

### Current Behavior

- Archived folder/gallery cards show an "Unarchive" button on hover
- Clicking archived cards is disabled (`if (!archivedFoldersOnly) onNavigate(...)`)
- No confirmation dialog for unarchive

### Desired Behavior

1. Remove hover "Unarchive" buttons from archived folder and gallery cards
2. Allow clicking into archived folders/galleries to view their contents
3. Add "Unarchive" option to the overflow menu (three-dot menu) on the folder details page when the current folder is archived
4. Show a confirmation dialog: "You're about to unarchive this folder. This will unarchive associated galleries. Do you wish to proceed?"
5. Keep the current behavior of showing the unarchived item in the folder tree nav like we have today

### Changes

**New file: `src/components/UnarchiveFolderDialog.tsx**`

- Confirmation dialog with title "Unarchive Folder"
- Description: "You're about to unarchive this folder. This will unarchive associated galleries and sub-folders."
- Cancel + Unarchive buttons
- Same structure as `ArchiveFolderDialog` but simpler

`**src/components/FolderDetailsView.tsx**`

1. **Remove hover Unarchive buttons** from archived folder cards (line 987-999) and gallery cards (line 848-861)
2. **Allow navigation into archived items** — remove the `!archivedFoldersOnly` guards on `onNavigate` calls (~line 984, 872, 877)
3. **Add Unarchive to overflow menu** — when `folder.archived === true`, replace the Archive menu item with Unarchive (ArchiveRestore icon) in the three-dot menu (~line 354-367). Also add `unarchiveDialogOpen` state.
4. **Render `UnarchiveFolderDialog**` alongside other dialogs, wired to `onUnarchiveFolder`

`**src/components/FolderTableView.tsx**`

- Allow navigation into archived folders in table view — remove the `!archivedFoldersOnly` guard on the name click (~line 113)
- Keep the Unarchive option in the row overflow menu (it's already there)

### Files Modified

- `src/components/UnarchiveFolderDialog.tsx` (new)
- `src/components/FolderDetailsView.tsx`
- `src/components/FolderTableView.tsx`