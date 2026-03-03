

## Bulk Actions for Gallery Selection + Enhanced Move Dialog

Based on the mockups, there are several pieces to implement:

### 1. Add "Apply to All" to `MoveGalleriesDialog.tsx`
Each row's location selector gets a "+ Apply to All" link/button. Clicking it copies that row's selected folder to every other gallery in the dialog. This is a small addition to the existing component.

### 2. Bulk selection mode for gallery grid in `LibraryScreenV4.tsx`
The Galleries tab currently renders a simple grid with no selection. Need to add:
- **Selection state** tracking which gallery IDs are selected
- **Checkbox overlay** on each gallery card (visible on hover or when any are selected)
- **Bulk action bar** that appears above the grid when 1+ galleries are selected, showing "{N} selected" with a three-dot menu containing **Move** and **Delete** actions

### 3. Wire Move dialog into `LibraryScreenV4.tsx`
When "Move" is clicked from the bulk action bar:
- Build `MoveGalleryItem[]` from selected galleries (current location = "Not in a folder" at root level)
- Open `MoveGalleriesDialog` with the flattened folder tree
- Show success toast on completion

### 4. Success toast
After moving, show a toast like "Galleries moved — {N} galleries moved successfully."

### Files to modify

| File | Change |
|------|--------|
| `src/components/MoveGalleriesDialog.tsx` | Add "+ Apply to All" button per row that copies that row's target to all others |
| `src/components/LibraryScreenV4.tsx` | Add gallery selection state, checkbox overlays on gallery cards, bulk action bar with three-dot menu (Move, Delete), wire up MoveGalleriesDialog |

### Bulk action bar design
Matches the pattern from `GalleryTableView` but as a standalone bar above the gallery grid:
- Left: checkbox (for select all) + "{N} selected" text
- Right: three-dot `MoreHorizontal` menu with Move and Delete options

