

## Drag-and-Drop for Folder Navigation

### Overview

Add drag-and-drop to the sidebar folder tree using `@dnd-kit/core` + `@dnd-kit/sortable`. Three interactions:

1. **Move folder (with nested items) to another folder** — drag a folder onto another folder to nest it inside
2. **Reorder folders** at the same level — drag to reorder siblings
3. **Move a gallery to another folder** — drag a gallery item onto a folder

All moves enforce the 4-level depth limit. Invalid drops snap back with a toast alert.

### Technical Approach

**New dependency**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

**Architecture**:

```text
LibraryScreen
└── FolderSidebar (new component, extracted from renderFolder)
    └── DndContext + SortableContext
        └── SortableFolderItem (recursive, one per tree node)
            ├── useSortable() hook
            ├── drag handle + overlay
            └── drop target highlighting
```

### Changes

**1. New file: `src/components/FolderSidebar.tsx`**
- Extract the sidebar folder tree rendering from `LibraryScreen.tsx` (lines 657-714, 746-783) into a dedicated component
- Wrap tree in `DndContext` with `PointerSensor` and `KeyboardSensor`
- Each folder/gallery node is a `SortableFolderItem` using `useSortable()`
- `onDragEnd` handler:
  - Calculate dragged item's subtree depth (`getMaxDepth`)
  - Calculate target's depth in tree
  - If combined depth > 4: snap back, show `sonnerToast.error("This move would exceed the 4-level folder limit.")`
  - Otherwise: call parent's `onMoveFolder` / reorder callback to update `folderTree` state

**2. `src/components/SortableFolderItem.tsx`** (new file)
- Renders a single folder/gallery row with drag handle
- Uses `useSortable` for drag state
- Shows visual indicators: blue border on valid drop targets, red border on invalid (depth exceeded)
- Supports nested rendering (recursive children)

**3. `src/components/LibraryScreen.tsx`**
- Replace inline `renderFolder` + sidebar JSX with `<FolderSidebar>` component
- Add `handleReorderFolders(itemId, targetParentId, newIndex)` callback to update `folderTree` state
- Pass existing `handleMoveFolder`, `expandedFolders`, `toggleFolderExpand`, `activeFolder`, `setActiveFolder` as props

**4. `src/lib/mockFolderData.ts`**
- Add `getDepthOf(tree, folderId)` helper — returns the depth of a folder in the tree (needed for real-time validation during drag)
- Add `removeFolderById` and `insertFolderAt` tree mutation helpers if not already present

### Depth Validation Logic

```text
onDragOver:
  draggedDepth = getMaxDepth(draggedItem)    // subtree depth
  targetDepth  = getDepthOf(tree, targetId)  // target's current depth
  wouldExceed  = targetDepth + draggedDepth > 3  // 4-level limit (0-indexed)
  → show red/green indicator on drop target

onDragEnd:
  if wouldExceed → snap back + toast error
  else → mutate folderTree state
```

### Visual Feedback
- **Drag overlay**: Semi-transparent clone of the dragged item with folder icon + name
- **Valid drop target**: Light blue background highlight on the target folder row
- **Invalid drop target**: Light red background, cursor changes to "not-allowed"
- **Snap-back**: Default `@dnd-kit` animation returns item to original position

### Scope
- ~3 new/modified files
- 1 new npm package (`@dnd-kit` family)
- No backend changes

