

## Show All Descendant Galleries in Folder Views

Currently `getChildGalleries` only returns direct gallery children of a folder. The user wants to see **all galleries contained within a folder and its sub-folders** — so viewing "Season 25-26" shows galleries from "In-Game", "Training", etc.

### Changes

**`src/components/FolderDetailsView.tsx`**

Update `getChildGalleries` to recursively collect all descendant galleries instead of just direct children:

```typescript
function getChildGalleries(folder: FolderItem): FolderItem[] {
  if (!folder.children) return [];
  const galleries: FolderItem[] = [];
  for (const child of folder.children) {
    if (child.type === "gallery") {
      galleries.push(child);
    } else if (child.type === "folder" && child.children) {
      galleries.push(...getChildGalleries(child));
    }
  }
  return galleries;
}
```

This is the only change needed — `childGalleries` is already used everywhere (cards, selection, bulk actions, move dialog) so all downstream logic will automatically work with the full set.

