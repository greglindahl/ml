

## Add Gallery Creation Flow

Two new components and wiring changes to support creating galleries from both the top-level Library view and from within a folder.

### New Components

#### 1. `src/components/AddGalleryDialog.tsx` — Select existing galleries
Based on screenshot 1:
- Title: "Add Gallery"
- Search input to filter existing galleries
- "+ New Gallery" button that opens the New Gallery dialog
- List of existing galleries (from `mockGalleries`), each with a thumbnail placeholder, name, and a "Select" button
- Cancel and Save buttons
- Props: `open`, `onOpenChange`, `galleries`, `onSelectGalleries`, `onCreateNew`

#### 2. `src/components/NewGalleryDialog.tsx` — Create a new gallery
Based on screenshot 2:
- Title: "New Gallery" with a "Create Multiple Galleries" link/button (non-functional for now)
- Fields: Name (required), Make Gallery Public checkbox, Description (textarea), Instructions (textarea), Add to Folder (select from folder tree), Sharing (multi-select with user chips — mock a default user), Schedule (select — placeholder), View Only checkbox, Allow Upload checkbox, Archive Date (input — placeholder)
- Cancel and Save buttons
- On save: create a new gallery entry in mock data and optionally add it to the selected folder
- Props: `open`, `onOpenChange`, `onCreateGallery`, `flattenedFolders`

### Wiring Changes

#### `src/components/LibraryScreen.tsx`
- Add state for `addGalleryDialogOpen` and `newGalleryDialogOpen`
- Wire the existing "New Gallery" dropdown item (line 655) to open `AddGalleryDialog` (when at top level) or `NewGalleryDialog` directly
- Add `handleCreateGallery` that creates a new gallery item in the mock data and optionally inserts it into the folder tree
- Render both dialog components

#### `src/components/FolderDetailsView.tsx`
- The existing "New" button (line 229) needs to become a dropdown with "New Folder" and "New Gallery" options (same pattern as the top-level Library header)
- Add props: `onCreateGallery`, `onAddGalleryToFolder`
- Add state for `addGalleryDialogOpen` and `newGalleryDialogOpen`
- Render both dialog components

#### `src/lib/mockFolderData.ts`
- Add a `setMockGalleries` or make `mockGalleries` mutable, or manage gallery state in `LibraryScreen` (preferred — keep gallery list in React state like `folderTree`)

### Data Flow
- Gallery list managed as React state in `LibraryScreen` (initialized from `mockGalleries`)
- When a new gallery is created from within a folder, it gets added to both the gallery list and as a child of that folder in `folderTree`
- When an existing gallery is selected via "Add Gallery", it gets inserted as a child of the current folder

### Files to create
- `src/components/AddGalleryDialog.tsx`
- `src/components/NewGalleryDialog.tsx`

### Files to modify
- `src/components/LibraryScreen.tsx` — gallery state, handlers, dropdown wiring, dialog rendering
- `src/components/FolderDetailsView.tsx` — New button dropdown, gallery dialog integration

