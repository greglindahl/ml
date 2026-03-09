

## Auto-Expand New Folders and Galleries in Sidebar

### Problem

When creating a new folder with galleries (or adding a new gallery to a folder), the parent folder expands to show the new folder, but the new folder itself does not expand to reveal its gallery children. The user expects to see the full tree expanded after creation.

### Changes

**`src/components/LibraryScreen.tsx`** — three locations:

1. **`handleCreateFolder` (~line 150-153)**: After expanding the parent, also expand the newly created folder itself if it has gallery children.
   ```
   // Add the new folder's ID to expandedFolders
   setExpandedFolders(prev => {
     const next = new Set([...prev, newFolder.id]);
     if (data.locationId) next.add(data.locationId);
     return next;
   });
   ```

2. **`handleCreateGallery` (~line 286-295)**: When a gallery is added to a folder, auto-expand that folder so the new gallery is visible in the sidebar.
   ```
   if (data.folderId) {
     setExpandedFolders(prev => new Set([...prev, data.folderId]));
   }
   ```

3. **`handleAddGalleriesToFolder` (~line 301-320)**: Same — expand the target folder after galleries are added.
   ```
   if (targetFolderId) {
     setExpandedFolders(prev => new Set([...prev, targetFolderId]));
   }
   ```

### Files Modified
- `src/components/LibraryScreen.tsx`

