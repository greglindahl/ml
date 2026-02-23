

## Move Custom Date Range Picker Under Date Filter and Restyle Calendar

### What Changes

1. **Move the custom date picker inline under the Date filter dropdown** -- Instead of opening as a separate popover, when "Custom" is selected from the Date dropdown, a panel will appear directly below the Date filter button (anchored to it), showing the calendar UI.

2. **Restyle the calendar to match the screenshot** -- The calendar panel will feature:
   - A single calendar (not two separate Start/End date pickers)
   - "Choose a Date Range" text link below the calendar grid
   - An info message: "For optimal performance, limit your search selection to 12 months."
   - "Clear" button (left) and "Save" button (right, blue) at the bottom
   - Clean, spacious styling matching the screenshot

### Technical Details

**File: `src/components/FilterBar.tsx`**

1. **Remove the standalone Popover** (lines 583-636) -- Delete the separate `<Popover>` at the bottom of the component that currently renders the custom date range picker with two nested calendar popovers.

2. **Replace with inline Popover anchored to the Date filter** -- When "Custom" is selected in the Date dropdown, instead of opening a separate floating popover, render a `<Popover>` directly around/after the Date filter's `<DropdownMenu>`. The popover will contain:
   - A `<Calendar>` component in `range` mode (react-day-picker supports `mode="range"` for selecting a date range on a single calendar)
   - "Choose a Date Range" label below the calendar
   - Info text with an info icon
   - A footer with "Clear" and "Save" buttons

3. **Calendar styling** -- Style the calendar to be more spacious and match the screenshot:
   - Larger day cells
   - Clean month/year header with chevron navigation
   - Today highlighted with a circle outline
   - Selected range shown with filled background
   - Future dates disabled/grayed out

4. **State changes**:
   - Use `customDateOpen` state to control the new popover visibility
   - When "Custom" is clicked in the date dropdown, close the dropdown and open the calendar popover
   - "Save" applies the range and closes the popover
   - "Clear" resets the date range and closes the popover

### Approximate Layout of the New Calendar Panel

```text
+-----------------------------------+
|  < February v 2026                |
|                                   |
|  Sun Mon Tue Wed Thu Fri Sat      |
|   1   2   3   4   5   6   7      |
|   8   9  10  11  12  13  14      |
|  15  16  17  18  19  20  21      |
|  22 (23) 24  25  26  27  28      |
|                                   |
|     Choose a Date Range           |
|                                   |
|  (i) For optimal performance,     |
|      limit your search selection  |
|      to 12 months.                |
|                                   |
|  ------separator------            |
|  Clear               [Save]      |
+-----------------------------------+
```

### Files Changed

- `src/components/FilterBar.tsx` -- Remove old custom date popover, add new inline calendar popover anchored under the Date filter button with redesigned UI matching the screenshot

