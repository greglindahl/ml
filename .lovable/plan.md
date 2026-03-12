

## Debug: Galleries Not Moving from Folder View

### Analysis

I've thoroughly traced the move flow from `FolderDetailsView` through `applyGalleryMoves` in `LibraryScreen`. The logic appears structurally correct:

1. `FolderDetailsView` → `onMove` callback → calls `onMoveGalleries(galleryIds, locationId)`
2. `applyGalleryMoves` → clones tree → removes galleries → inserts at target → `setFolderTree`
3. `activeFolderItem` recomputes from `folderTree` → `FolderDetailsView` re-renders with updated `folder`

Despite the logic looking correct, the galleries don't actually move. To isolate the root cause, I'll add targeted `console.log` statements at key points in the flow.

### Plan

**`src/components/FolderDetailsView.tsx`**
- In the `onMove` callback (line 1104), add a log before calling `onMoveGalleries`:
  - Log `moveGalleryItems.map(g => g.id)` and `locationId`

**`src/components/LibraryScreen.tsx`**
- At the top of `applyGalleryMoves`, log `galleryIds` and `targetLocationId`
- Inside `setFolderTree`, log the tree BEFORE and AFTER the remove/insert operations:
  - Log the count of galleries found in the tree before removal
  - Log whether `removeFromTree` actually removed anything (compare tree structure)
  - Log whether `insertInto` found the target folder and returned `true`

### Expected Outcomes

The logs will reveal one of:
- `applyGalleryMoves` is never called (prop wiring issue)
- `galleryIds` is empty (selection not passed correctly)
- `removeFromTree` doesn't find the galleries (ID mismatch)
- `insertInto` doesn't find the target (target folder ID mismatch)
- Tree IS updated but component doesn't re-render (React issue)

Once the console logs reveal the root cause on the next interaction, I'll fix the actual bug.

### Files Modified
- `src/components/LibraryScreen.tsx` (add debug logs)
- `src/components/FolderDetailsView.tsx` (add debug logs)

