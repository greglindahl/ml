

## Remove metadata counts from folder sidebar nav

The screenshot shows the sidebar nav items without any count metadata (e.g., "3 folders", "2 galleries", "48 assets") beneath each item. Currently, lines 454-462 in `src/components/LibraryScreen.tsx` render this metadata below each folder/gallery name.

### Change to `src/components/LibraryScreen.tsx`

**Remove lines 454-462** — the block that renders `folder.count` and `folder.countType` below each nav item. This removes all metadata like "3 folders", "2 galleries", "48 assets" from the sidebar tree.

Single deletion, one file.

