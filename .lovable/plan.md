

## Changes: Rename "Public Views" → "Views" and Remove "Public Downloads" from Sort

Simple label and option removal across 3 files where sort options are defined:

### Files to Change

**`src/components/LibraryScreen.tsx`** (line 104-105)
- Change `{ value: "publicViews", label: "Public Views" }` → `{ value: "publicViews", label: "Views" }`
- Remove the `{ value: "publicDownloads", label: "Public Downloads" }` entry

**`src/components/LibraryScreenV4.tsx`** (line 44-45)
- Same changes as above

**`src/components/AssetTableView.tsx`** (line 26)
- Remove `"publicDownloads"` from the `SortField` type union
- Remove the `case "publicDownloads"` sort handler (line 122)

**`src/components/LibraryScreen.tsx`** (line 90)
- Remove `"publicDownloads"` from the `SortField` type union
- Remove the `case "publicDownloads"` sort handler (line 280)

**`src/components/LibraryScreenV4.tsx`** (line 32)
- Remove `"publicDownloads"` from the `GridSortField` type union
- Remove the `case "publicDownloads"` sort handler (line 109)

The underlying data field `publicViews` remains unchanged — only the display label and the removal of the "Public Downloads" sort option are affected.

