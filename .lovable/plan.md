

## Add Expandable Tree Rows to Folder Table View

### What Changes

Add inline expand/collapse behavior to `FolderTableView` so that folders with subfolder children show a chevron caret. Clicking it reveals child folder rows indented beneath the parent, recursively. This lets users preview the folder tree without navigating.

### Implementation

**`src/components/FolderTableView.tsx`**

1. Add `expandedFolders` state (`Set<string>`) tracking which folders are expanded
2. Replace the flat `sorted.map()` render with a recursive `renderRows()` function that:
   - Renders the folder row with a `ChevronRight`/`ChevronDown` toggle if the folder has subfolder children
   - When expanded, recursively renders child folder rows with increasing `depth` parameter
   - Applies left padding to the Name cell based on depth (`pl-${depth * 6}`)
3. The chevron click toggles the folder ID in/out of `expandedFolders` (does not navigate)
4. Clicking the folder name still calls `onNavigate` as before
5. Sorting applies only to top-level folders; children appear in natural order beneath their parent

### Visual Structure

```text
│ ☐ │ ▶ 📂 │ Season 25-26          │ 3  │ 2/28/26 │ Sarah M.  │ ⋯ │
│ ☐ │   ▶ 📂│  In-Game              │ 0  │ 2/23/26 │ David C.  │ ⋯ │  ← depth 1
│ ☐ │   ▶ 📂│  Training             │ 1  │ 2/18/26 │ Emma R.   │ ⋯ │
│ ☐ │     📂│    Conditioning       │ 0  │ 2/13/26 │ Marcus T. │ ⋯ │  ← depth 2
│ ☐ │   ▶ 📂│  Fan Engagement       │ 0  │ 2/8/26  │ Olivia P. │ ⋯ │
│ ☐ │ ▶ 📂 │ Season 24-25          │ 3  │ 2/3/26  │ James W.  │ ⋯ │  ← collapsed
```

- Chevron only appears on folders with subfolder children
- `ChevronRight` when collapsed, `ChevronDown` when expanded (smooth 90deg rotation via CSS transition)
- Child rows use a subtle left border or indent to visually connect them to the parent

### File Modified
- `src/components/FolderTableView.tsx`

