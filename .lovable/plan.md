

## Fix Gallery Persistence + Placeholder Text Changes

### Problem
The galleries tab renders from the static `mockGalleries` import instead of the `galleryList` state, so new galleries never appear.

### Changes

#### 1. `src/components/LibraryScreen.tsx` — Use `galleryList` state instead of `mockGalleries`
- **Line 1025**: Change `<GalleryTableView galleries={mockGalleries} />` to `<GalleryTableView galleries={galleryList} />`
- **Line 1028**: Change `{mockGalleries.map((gallery) => (` to `{galleryList.map((gallery) => (`

#### 2. `src/components/NewGalleryDialog.tsx` — Placeholder text fixes
- **Line 38**: Change initial sharing state from `["Current User"]` to `[]` (empty array)
- **Line 49**: Change reset sharing from `["Current User"]` to `[]`
- **Line 151-153**: Change "Add to Folder" placeholder from `"None"` to `"Select Folder"`
- **Lines 189-197**: Change Schedule select from `defaultValue="immediate"` to no default, add a placeholder like `"Select schedule"`, remove the pre-selected "Immediate" text

