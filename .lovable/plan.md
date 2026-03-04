

## Update Move Folder Dialog — Add Nested Folders Table + Enhanced Warning

### What changes

**`src/components/MoveFolderDialog.tsx`**

Replace the single "folder being moved" card with a table listing:
- The folder itself (row 1) with its current breadcrumb path
- All nested sub-folders (recursively) with their full breadcrumb paths

Add a helper function `collectNestedFolders(folder, parentPath)` that recursively walks `folder.children`, collecting `{ name, path }` for each child folder. The parent folder's path comes from the existing `breadcrumbPath` prop.

**Table structure** (matching mockup):
| Folder | Current Location |
|--------|-----------------|
| Season 25-26 | All Media |
| In-Game | All Media > Season 25-26 |
| Training | All Media > Season 25-26 |

**Other updates:**
- Update `DialogDescription` text to match mockup: "Galleries, assets, and sharing are not affected."
- Update the info banner to include affected item count: "This move will affect X media items and may take some time..."
- Compute total asset count by summing `count` values from descendant galleries

### No other files change

