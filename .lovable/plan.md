

## Add success toasts on folder and gallery creation

### Changes

**`src/components/LibraryScreen.tsx`**
- Import `toast` from `sonner`
- In the `handleCreateFolder` callback, after the folder is created and dialog closes, call `toast.success("Folder created successfully")`
- In the `handleCreateGallery` callback (or wherever `NewGalleryDialog`'s `onCreateGallery` is handled), call `toast.success("Gallery created successfully")`

**`src/components/FolderDetailsView.tsx`**
- Same pattern: import `toast` from `sonner`, add success toasts after folder/gallery creation callbacks if they exist here too.

