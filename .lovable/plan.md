

## Update Assets tab search placeholder text

Pass `placeholder="Search by people, tags, filenames…"` to the `FacetedSearchWithTypeahead` component on every Assets tab. Leave Galleries and Folders tab searches unchanged.

### Changes

**`src/components/LibraryScreen.tsx`** (line 871)
- Add `placeholder="Search by people, tags, filenames…"` to the Assets tab search instance

**`src/components/FolderDetailsView.tsx`** (lines 399 and 619)
- Add `placeholder="Search by people, tags, filenames…"` to both Assets tab search instances inside folder details

**`src/components/GalleryDetailsView.tsx`** (line 277)
- Add `placeholder="Search by people, tags, filenames…"` to the gallery details assets search

No changes to the Galleries tab search (LibraryScreen line 1157) or the Folders tab search input.

