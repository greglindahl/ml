Change the sort dropdown label "Capture" to "Captured" consistently across the three components that render this sort option:

1. **src/components/LibraryScreen.tsx** — update the `captureDate` option label.
2. **src/components/FolderDetailsView.tsx** — update the `captureDate` option label.
3. **src/components/GalleryDetailsView.tsx** — update the `captureDate` option label in `SORT_OPTIONS` and the matching value in `SORT_LABELS`.

Out of scope: the "Capture Date" filter section label in `GalleryDetailsView.tsx` (line 631), since it is not part of the sort dropdown.