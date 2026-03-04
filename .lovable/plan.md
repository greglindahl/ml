

## Add "Gallery belongs to folder" constraint to AddGalleryDialog + orphan galleries

### Problem
The AddGalleryDialog currently shows all galleries as selectable. The business rule is: **a gallery can only belong to one folder**. Galleries already assigned to a folder should appear disabled in the picker. We also need orphan galleries in mock data so this constraint is demonstrable.

### Changes

**1. `src/lib/mockFolderData.ts`** — Add 3-4 orphan galleries to `mockGalleries` that do NOT appear in the folder tree. Examples: "Player Portraits", "Media Day 2025", "Social Media Clips", "Behind the Scenes". These exist only in `mockGalleries`, never referenced in `folders`.

**2. `src/components/AddGalleryDialog.tsx`** — Accept an optional `disabledGalleryIds` prop (a `Set<string>` or `string[]`) representing galleries already assigned to a folder. For those galleries:
- Render the row with reduced opacity and `cursor-not-allowed`
- Show a subtitle like "Already in a folder" beneath the asset count
- Disable the Select button (greyed out, non-clickable)
- Prevent `toggleSelect` from selecting them

**3. `src/components/NewFolderDialog.tsx`** — Accept the `folderTree` prop (already available via parent). Compute the set of gallery IDs that exist inside any folder in the tree using `findGalleryParentPath`. Pass that set as `disabledGalleryIds` to `AddGalleryDialog`.

**4. `src/components/LibraryScreen.tsx`** and **`src/components/FolderDetailsView.tsx`** — Pass `folderTree` to `NewFolderDialog` (and to any other place `AddGalleryDialog` is used directly) so the disabled set can be computed. Also pass `disabledGalleryIds` when calling `AddGalleryDialog` directly.

