

## Add Empty State for Folders

When a folder has no children (no sub-folders and no galleries) and no assets, show an empty state matching the reference screenshot instead of the search/filter/grid UI.

### Changes to `src/components/FolderDetailsView.tsx`

**Detect empty folder**: Check if `folder.children` is empty/undefined AND `filteredResults` is empty (no assets). When both are true, the folder is empty.

**Replace tab content with empty state**: When the folder is empty, skip rendering the tabs entirely and show:
- An illustration area (folder icon with smaller image icons, using existing Lucide icons like `FolderOpen` + `Images`)
- **"This folder is empty"** heading
- Two lines of descriptive text:
  - "Folders help you group galleries and other folders by season, event, campaign, or purpose."
  - "You can add existing content or create something new. Nothing outside this folder is affected."
- **"Add Galleries"** primary button (dark, matching the screenshot)
- **"New Folder"** text link below it

The "Add Galleries" and "New Folder" buttons can be non-functional placeholders for now (or wire "New Folder" to the existing dialog if the parent passes a callback).

### Scope
- Single file edit: `src/components/FolderDetailsView.tsx`
- Condition: `(!folder.children || folder.children.length === 0) && filteredResults.length === 0 && !isLoading`
- The empty state replaces everything below the folder header (breadcrumb + header stay visible)

