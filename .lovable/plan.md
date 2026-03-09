

## Replace Edit Folder Gallery UI with New Folder's Pattern

### What Changes

Replace the current Popover/Checkbox gallery picker in `EditFolderDialog` with the same "Select Gallery" row + listed items + `AddGalleryDialog` pattern used in `NewFolderDialog`. This gives a consistent UX: a clickable "Select Gallery" row with a `+` icon, selected galleries listed below with `X` remove buttons, and the full `AddGalleryDialog` modal for selection.

### Implementation

**`src/components/EditFolderDialog.tsx`**

1. Remove the `Popover`, `PopoverContent`, `PopoverTrigger`, `Checkbox`, `ChevronDown` imports
2. Add imports for `Images`, `Plus`, `X` from lucide-react, `AddGalleryDialog`, `NewGalleryDialog`, `collectAssignedGalleryIds`
3. Add props: `folderTree` and `onCreateGallery` (matching `NewFolderDialog`)
4. Add state: `addGalleryOpen`, `newGalleryDialogOpen`
5. Compute `assignedGalleryIds` via `useMemo` + `collectAssignedGalleryIds`
6. Add `removeGallery` callback
7. Replace the Popover-based gallery section (lines 128-164) with the same markup from `NewFolderDialog`:
   - "Select Gallery" row with `Images` icon and `Plus` button that opens `AddGalleryDialog`
   - Listed selected galleries with `Images` icon, name, and `X` remove button
8. Render `AddGalleryDialog` and `NewGalleryDialog` outside the main `Dialog` (same pattern as `NewFolderDialog`)
9. Wrap the whole return in a fragment `<>...</>` to accommodate the extra dialogs

### Files Modified
- `src/components/EditFolderDialog.tsx`
- `src/components/FolderDetailsView.tsx` — pass additional `folderTree` and `onCreateGallery` props to `EditFolderDialog`

