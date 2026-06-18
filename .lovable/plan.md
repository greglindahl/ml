Update the sort dropdown so options read "Added" and "Capture" (and "Assets Last Added" where applicable) instead of "Added Date" / "Capture Date". Scope is limited to the sort dropdown — filter sections, column headers, and settings drawer labels stay as-is.

## Changes

- `src/components/LibraryScreen.tsx` — sort options: "Added Date" → "Added", "Capture Date" → "Capture".
- `src/components/FolderDetailsView.tsx` — same two sort option labels.
- `src/components/GalleryDetailsView.tsx` — sort option "Capture Date" → "Capture" (and matching `captureDate` display map used by the sort trigger).
- `src/components/GalleryFilterBar.tsx` — sort option "Assets Last Added Date" → "Assets Last Added".

Filter UI ("Capture Date" filter section), table column comments, and the asset/gallery settings drawer column-label lists are left untouched, since those aren't the sort dropdown.
