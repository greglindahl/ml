

## Debug: Missing Bulk Actions + Gallery Details Move

### Issues Found

1. **FolderDetailsView galleries grid (non-list mode)** — The grid view (lines 622-648) has no selection checkboxes or bulk action bar. Only the list view (`GalleryTableView`) has move support via `onMoveGalleries`. The grid cards are plain buttons with no selection state.

2. **GalleryDetailsView three-dot menu** — The `MoreVertical` button (line 224-226) is just a plain button with no dropdown menu. It needs a `DropdownMenu` with Move (and other actions like Delete).

3. **LibraryScreenV4 galleries tab** — This one actually works (lines 528-602) with bulk action bar and checkboxes. However, it only shows when `isAnyGallerySelected` is true, so the user needs to click a gallery card to select it first (checkbox appears on hover).

### Plan

#### 1. FolderDetailsView — Add gallery selection + bulk actions to grid view

Add the same selection pattern used in `LibraryScreenV4`:
- Add `selectedGalleries` state (Set), toggle functions, select-all
- Add checkbox overlays on gallery grid cards (visible on hover or when any selected)
- Add bulk action bar above gallery grid with three-dot menu containing Move and Delete
- Wire Move to existing `handleMoveGalleries` / `MoveGalleriesDialog`

#### 2. GalleryDetailsView — Add Move to three-dot menu

Replace the plain `MoreVertical` button with a `DropdownMenu` containing:
- Move — opens `MoveGalleriesDialog` for the single gallery
- Delete (placeholder)

This requires:
- Import `DropdownMenu` components, `MoveGalleriesDialog`, `FolderInput`, `Trash2`
- Add state for move dialog open + gallery item data
- Add `flattenedFolders` prop or compute from `folderTree`
- Render `MoveGalleriesDialog` in the component

### Files to modify
| File | Change |
|------|--------|
| `src/components/FolderDetailsView.tsx` | Add selection state, checkbox overlays, bulk action bar to galleries grid view |
| `src/components/GalleryDetailsView.tsx` | Replace plain MoreVertical with DropdownMenu containing Move + Delete, wire up MoveGalleriesDialog |

