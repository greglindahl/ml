

## Update Date Filter Options and Add Icons for Ratio and Type

### 1. Update Date Filter Options

Replace the current date filter options (Today, Last 7 Days, Last 30 Days, Last 90 Days, Last Year, Custom) with the values from the screenshot:

- Last 7 days
- Last 14 days
- Last 30 days
- Month to Date
- Last 90 days
- Last 12 months
- Custom

### 2. Add Icons for Type and Ratio Filters

Add small Lucide icons to the Type and Ratio filter dropdown items:

- **Type filter**: Use `ImageIcon` for "Image" and `Video` for "Video" (from lucide-react)
- **Ratio filter**: Use `RectangleHorizontal` for 16:9, `Square` for 1:1, `RectangleVertical` for 9:16, and a generic `Monitor` or `Proportions` for 4:3

These icons will render inline next to each option label within the dropdown.

### Technical Details

**File: `src/components/FilterBar.tsx`**

1. **Date filter** (lines 156-177): Replace the options array with the new values matching the screenshot.

2. **Type filter icons**: Add an `icon` field to each Type option and render it in the dropdown item. Map type values to Lucide icons (`Image`, `Video`).

3. **Ratio filter icons**: Add an `icon` field to each Ratio option. Map ratio values to appropriate Lucide shape icons (`RectangleHorizontal`, `Square`, `RectangleVertical`, `Proportions`).

4. Update the `FilterOption` interface to include an optional `icon` field, and update the dropdown rendering to show icons next to labels when present.

### Files Changed

- `src/components/FilterBar.tsx` -- Update date options, add icon mappings for Type and Ratio, render icons in dropdown items

