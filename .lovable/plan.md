

## Three Changes

### 1. Rename "Folders" label to "Library" in the sidebar header
**File: `src/components/LibraryScreen.tsx` (line 507)**
- Change `"Folders"` → `"Library"`

### 2. Rename "All Files" to "All Media" everywhere
**File: `src/lib/mockFolderData.ts` (line 50)**
- Change `name: "All Files"` → `name: "All Media"` in the root folder definition

**File: `src/components/GalleryDetailsView.tsx` (line 72)**
- Change the hardcoded `"All Files"` breadcrumb text → `"All Media"`

**File: `src/components/FolderDetailsView.tsx` (line 79)**
- Change the hardcoded `"All Files"` breadcrumb text → `"All Media"`

### 3. Fix breadcrumbs for newly created folders
The breadcrumb functions in `GalleryDetailsView` and `FolderDetailsView` use the static `folders` import from `mockFolderData.ts`. When a new folder is created, the `folderTree` state in `LibraryScreen` updates but these components still reference the stale static data.

**Fix: Pass `folderTree` as a prop to both detail views.**

- **`src/components/GalleryDetailsView.tsx`**: Add `folderTree` prop, use it in `buildBreadcrumbPath` instead of the static `folders` import
- **`src/components/FolderDetailsView.tsx`**: Same — add `folderTree` prop, use it for breadcrumb building
- **`src/components/LibraryScreen.tsx`**: Pass `folderTree` to both `<GalleryDetailsView>` and `<FolderDetailsView>`

