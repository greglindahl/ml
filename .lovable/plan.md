

## Fix Remaining Scroll & Layout Issues

### Issues Identified

1. **GalleryDetailsView and FolderDetailsView not scroll-constrained**: These detail views (lines 187, 296) still use the old pattern (`flex-1 flex flex-col min-w-0 px-4 ... pb-12 pt-8`) without `h-full overflow-hidden`. Their `TabsContent` elements also lack `overflow-y-auto`, so content overflows and gets cut off instead of scrolling independently.

2. **Top-right icons overlapping Upload button**: The fixed icons (announcements, messages, avatar) in `LibraryV1.tsx` line 46 are `fixed top-4 right-4 z-50`. The Library header's action buttons (New, Upload) at line 774 sit in a `justify-between` row with no right padding to account for these fixed icons. They overlap.

### Changes

**1. `src/components/GalleryDetailsView.tsx`**
- Line 187: Change outer div to `flex-1 flex flex-col min-w-0 h-full overflow-hidden px-4 md:px-8 xl:px-16` (add `h-full overflow-hidden`, remove `pb-12`, adjust padding-top)
- Make breadcrumb + header + tabs bar `flex-shrink-0`
- Line 250: Add `min-h-0` to Tabs container, `flex-shrink-0` to tab list border div
- Lines 274, 493, 515: Add `overflow-y-auto` to all `TabsContent`

**2. `src/components/FolderDetailsView.tsx`**
- Line 296: Same outer div fix — `h-full overflow-hidden`, remove `pb-12`
- Make breadcrumb + header + tabs bar `flex-shrink-0`
- Line 373: Add `min-h-0` to Tabs, `flex-shrink-0` to tab list border div
- Lines 398, 618, 900: Add `overflow-y-auto` to all `TabsContent`

**3. `src/components/LibraryScreen.tsx`** — Fix top-right icon overlap
- Line 774: Add right padding (`pr-40` or similar) to the header row so the New/Upload buttons don't sit under the fixed top-right icons

**4. `src/components/FolderDetailsView.tsx` and `src/components/GalleryDetailsView.tsx`** — Same overlap fix
- Their header rows also need right padding to avoid the fixed icons

### Files Modified
- `src/components/LibraryScreen.tsx` — add right padding to header
- `src/components/GalleryDetailsView.tsx` — scroll containment + right padding
- `src/components/FolderDetailsView.tsx` — scroll containment + right padding

