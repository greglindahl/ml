

## Bug: Archived Folders Don't Appear in "Archived Only" View

### Root Cause

The Folders tab grid at the "All Media" level renders from `mockFolderCards` — a **static array** imported from `mockFolderData.ts`. When you create a new folder (like "Archive") it gets added to the `folderTree` state, but **never** to `mockFolderCards`. The filtering logic iterates `mockFolderCards` and looks up each card's ID in `folderTree` to check `archived` status. Since the new folder isn't in `mockFolderCards`, it's never rendered — archived or not.

### Fix

**`src/components/LibraryScreen.tsx`** (lines ~1267-1268)

Instead of filtering `mockFolderCards`, derive the folder cards dynamically from the current `folderTree` state. Specifically, use the direct children of the active folder (or top-level season folders when viewing "All Media") and build card objects from them. This ensures newly created folders and their archived state are always reflected.

The change replaces:
```ts
const filteredFolderCards = mockFolderCards.filter(fc => {
  const treeItem = findFolderById(folderTree, fc.id);
  ...
});
```

With logic that derives cards from `folderTree` children directly:
```ts
const topLevelFolders = folderTree.filter(f => f.id !== "all");
const filteredFolderCards = topLevelFolders
  .filter(f => archivedFoldersOnly ? f.archived === true : f.archived !== true)
  .map(f => ({ id: f.id, name: f.name, galleryCount: f.count || 0, timeAgo: "—" }));
```

This single change fixes both:
1. Archived folders not appearing in "Archived Only" view
2. Newly created folders not appearing in the grid at all (if they weren't in the static mock data)

