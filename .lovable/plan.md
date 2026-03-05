

## Fix: New Gallery Not Appearing in New Folder Dialog

### Root Cause

Two issues:

1. **`onCreateGallery` prop is never passed** to `<NewFolderDialog>` in either `LibraryScreen.tsx` (line 1458) or `FolderDetailsView.tsx` (line 1089). The prop was added to the interface but never wired by the parents.

2. **`handleCreateGallery` returns `void`** (`LibraryScreen.tsx` line 222). The `NewFolderDialog` expects `onCreateGallery` to return the new `Gallery` object so it can add its ID to `selectedGalleryIds`. Since nothing is returned, even after wiring, the auto-select won't work.

### Changes

**`src/components/LibraryScreen.tsx`**:
- Make `handleCreateGallery` return the new `Gallery` object (add `return newGallery;` after line 244)
- Pass `onCreateGallery={handleCreateGallery}` to `<NewFolderDialog>` (line 1458)

**`src/components/FolderDetailsView.tsx`**:
- Pass `onCreateGallery` prop through to `<NewFolderDialog>` (line 1089) — this component receives `onCreateGallery` from its parent (`LibraryScreen`), so it just needs to forward it

