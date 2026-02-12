
## Add Gallery-Specific Filters to the Galleries Tab

Replace the current simple Creator/Date Range dropdowns on the Galleries tab with a new set of filters matching the reference screenshot.

### New Filters (Galleries Tab Only)

1. **Gallery Options** - Multi-select checkboxes: View Only, Allow Upload, Public
2. **Creator** - Searchable dropdown (reuse existing creator options)
3. **Groups** - Searchable dropdown with mock group options
4. **Created Date** - Date range selector (Today, Last 7 Days, Last 30 Days, Last 90 Days, Last Year, Custom)
5. **Assets Last Added Date** - Same date range options as Created Date
6. **View Only Archived Galleries** - Toggle switch

### Technical Details

**1. Create a new `GalleryFilterBar` component** (`src/components/GalleryFilterBar.tsx`)
- Build a dedicated filter bar component for the Galleries tab
- Use the same styling patterns as `FilterBar.tsx` (outline buttons, chevron icons, pill-style active states with X removal)
- Filters use `DropdownMenu` with `DropdownMenuCheckboxItem` for multi-select and single-select options
- The "View Only Archived Galleries" toggle uses a `Switch` component placed inline after the dropdown filters
- Each dropdown includes an internal search input (matching FilterBar pattern)
- Mock data for Groups: "Marketing", "Social Media", "Creative", "Operations"

**2. Update `LibraryScreen.tsx`**
- Import the new `GalleryFilterBar` component
- Replace the existing Creator/Date Range dropdown block (lines 632-661) on the Galleries tab with `<GalleryFilterBar />`
- Keep the right-side controls (Sort, Manage Columns, Grid/List toggle) unchanged
- The filters are visual/non-functional for now (no actual filtering logic on galleries), matching how the current Creator/Date Range dropdowns work

**3. Files changed**
- `src/components/GalleryFilterBar.tsx` (new file)
- `src/components/LibraryScreen.tsx` (updated Galleries tab filter section)
