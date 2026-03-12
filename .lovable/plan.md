

## Bug: Galleries Not Moving When Initiated from Folder View

### Root Cause

There are two independent move flows, and the folder-level one is broken:

- **LibraryScreen (root level)**: Sets its own `selectedGalleries` state, opens its own `MoveGalleriesDialog`, then `applyGalleryMoves` reads those selected IDs. This works.
- **FolderDetailsView (folder level)**: Manages its own `selectedGalleries` and `MoveGalleriesDialog` locally. On move completion, it calls `onMoveGalleries(locationId)` which maps to `applyGalleryMoves`. But `applyGalleryMoves` reads `selectedGalleries` from **LibraryScreen's** state — which is empty because the selection lives inside FolderDetailsView.

Result: `applyGalleryMoves` moves zero galleries and the tree doesn't change.

### Fix

Change the `onMoveGalleries` prop to also pass the gallery IDs, so the parent knows which galleries to move.

**`src/components/FolderDetailsView.tsx`**
- Update `onMoveGalleries` prop type from `(locationId: string | null) => void` to `(galleryIds: string[], locationId: string | null) => void`
- In the `onMove` callback of `MoveGalleriesDialog`, pass `moveGalleryItems.map(g => g.id)` along with `locationId`

**`src/components/LibraryScreen.tsx`**
- Update `applyGalleryMoves` to accept `(galleryIds: string[], targetLocationId: string | null)` instead of reading from `selectedGalleries` state
- Use the passed `galleryIds` parameter for the tree mutation
- Update all call sites:
  - The root-level `MoveGalleriesDialog`'s `onMove` callback: pass `Array.from(selectedGalleries)` as the first argument
  - The `onMoveGalleries` prop passed to `FolderDetailsView`: already maps through correctly with the new signature

### Files Modified
- `src/components/FolderDetailsView.tsx`
- `src/components/LibraryScreen.tsx`

