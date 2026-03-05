

## Fix "New Gallery" Button in New Folder Dialog

### Problem
In `NewFolderDialog.tsx`, the `AddGalleryDialog` is rendered with `onCreateNew={() => {}}` — a no-op. Clicking "New Gallery" closes the Add Gallery dialog but nothing else happens. In contrast, both `LibraryScreen.tsx` and `FolderDetailsView.tsx` wire `onCreateNew` to `() => setNewGalleryDialogOpen(true)`, which correctly opens the New Gallery modal.

### Fix: `src/components/NewFolderDialog.tsx`

1. **Add state** for `newGalleryDialogOpen`
2. **Import and render** `NewGalleryDialog` alongside the existing `AddGalleryDialog`
3. **Wire** `onCreateNew={() => setNewGalleryDialogOpen(true)}` on the `AddGalleryDialog`
4. **Handle gallery creation** inside the `NewGalleryDialog` callback: add the newly created gallery to `selectedGalleryIds` so it appears in the folder being created
5. **Accept new props**: `flattenedFolders` (already available) and optionally `onGalleryCreated` callback so the parent can update its gallery list with the new gallery

Since `NewFolderDialog` doesn't own the gallery list, the simplest approach is to add an optional `onCreateGallery` prop that bubbles the new gallery data up to the parent (`LibraryScreen` / `FolderDetailsView`), which already has the `handleCreateGallery` logic. The parent returns the new gallery ID, which `NewFolderDialog` then adds to `selectedGalleryIds`.

Alternatively, render the `NewGalleryDialog` inside `NewFolderDialog` and pass an `onCreateGallery` prop from the parent that handles persisting the gallery and returns the created gallery object, so the dialog can immediately add it to the selected list.

### Changes

- **`src/components/NewFolderDialog.tsx`**:
  - Add `newGalleryDialogOpen` state
  - Import `NewGalleryDialog` and `NewGalleryData`
  - Add optional prop `onCreateGallery?: (data: NewGalleryData) => Gallery | void` to the interface
  - Render `<NewGalleryDialog>` after `<AddGalleryDialog>`, wired to the new state
  - Replace `onCreateNew={() => {}}` with `onCreateNew={() => setNewGalleryDialogOpen(true)}`

