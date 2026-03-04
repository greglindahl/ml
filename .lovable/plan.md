

## Hide Archived Items from Nav and Content

Understood. When a folder or gallery is archived (`archived: true`), it should be hidden from:

1. **Sidebar folder tree** — archived folders/galleries should not render in the left nav tree
2. **Main content area** — archived folders/galleries should not appear in the grid/table unless "Archived Only" is toggled on
3. **Only visible** when the "Archived Only" toggle is active on the respective tab

Currently, archived items still show in the sidebar tree and may still appear in content areas. The fix involves filtering out archived items in both rendering paths.

### Changes

**`src/components/LibraryScreen.tsx`**
- In the sidebar tree rendering (the recursive folder/gallery tree), filter out items where `archived === true`
- In the main content Folders tab: already fixed to filter by archive state — verify galleries tab does the same
- In the main content Galleries tab: filter out archived galleries from the grid/table unless `archivedGalleriesOnly` is true

**`src/components/FolderDetailsView.tsx`**
- When rendering child folders and galleries in the content area, filter out archived items unless the respective "Archived Only" toggle is on
- When rendering the sidebar sub-tree for the current folder, exclude archived children

The sidebar tree is rendered in `LibraryScreen.tsx` via a recursive function. I'll add an `archived !== true` filter to that recursion so archived folders and galleries are hidden from navigation entirely.

