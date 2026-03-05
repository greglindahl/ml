

## Add "View Archived" Toggle to Folder Sidebar

### What Changes

Move the "Archived Only" toggle from the main content Folders tab toolbar down to the **bottom of the folder sidebar**, pinned as a footer — matching the uploaded reference screenshot showing "View Archived" with a switch at the bottom of the nav.

When toggled **on**, the sidebar tree shows archived folders/galleries (currently filtered out by `f.archived !== true`). The user can then right-click or use the existing overflow menu to unarchive items. When toggled **off** (default), archived items are hidden as they are today.

### Changes

**1. `src/components/FolderSidebar.tsx`**
- Add a new prop `showArchived` (boolean) and `onToggleArchived` (callback) from the parent
- Add a pinned footer section below the scrollable tree area with a `Switch` + "View Archived" label, matching the screenshot layout
- Update `renderTree` to respect `showArchived`: when true, stop filtering out `archived` items (or show only archived items, depending on preference — likely show ALL items including archived, with archived items visually distinguished)
- Update `collectVisibleIds` similarly so DnD context includes archived items when the toggle is on
- Disable drag-and-drop on archived items (they shouldn't be reorderable while in archived view)

**2. `src/components/LibraryScreen.tsx`**
- Pass `archivedFoldersOnly` state and `setArchivedFoldersOnly` to `FolderSidebar` as props
- Remove the "Archived Only" toggle from the Folders tab toolbar (the `<Switch>` + label currently in the folders tab filter bar area around line 1321-1340)
- Keep unarchive logic as-is since it's triggered from context menus / overflow menus on individual items

**3. `src/components/SortableFolderItem.tsx`**
- When an item is archived and `showArchived` is true, add a subtle visual distinction (e.g., reduced opacity or an archive icon badge) so the user can tell which items are archived vs active

### Layout (matching screenshot)
```text
┌─────────────────────┐
│ Library          «   │
├─────────────────────┤
│ All Media            │
│  > New Folder Name   │
│  > Old Folder Name   │
│                      │
│                      │
│                      │
│                      │
├─────────────────────┤
│ View Archived  (o)   │  ← pinned footer with Switch
└─────────────────────┘
```

