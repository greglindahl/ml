

## Fix: Custom Date Picker Not Reliably Showing

### Root Cause

The `Popover` for the custom date range uses a hidden `<span className="sr-only">` as its trigger. This element has no dimensions or visible position, so the popover has no reliable anchor point. This causes it to either not render visibly or appear at coordinates (0,0).

### Solution

Wrap the entire Date filter button (the `DropdownMenu` trigger) as the `PopoverTrigger` instead, so the calendar popover anchors directly to the visible Date filter button. This requires restructuring the Date filter rendering so that:

1. The `Popover` wraps the Date filter section
2. The Date filter button itself acts as the `PopoverTrigger` (but only opens the popover programmatically via state, not on click -- click still opens the dropdown)
3. Remove the hidden `<span className="sr-only">` trigger entirely

### Technical Details

**File: `src/components/FilterBar.tsx`** (lines ~496-563)

- Restructure the date filter rendering block:
  - Wrap with `<Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>`
  - Use a hidden but properly sized `PopoverTrigger` attached to a ref div that sits at the same position as the date filter button (using `PopoverTrigger asChild` on a small invisible anchor `<div>` right after the dropdown)
  - Alternatively (simpler): use `PopoverAnchor` from Radix to anchor the popover to the date filter button container without making it a trigger, keeping the open/close controlled purely by state
- Remove the `<span className="sr-only">Custom date trigger</span>`
- The popover open/close remains controlled by `customDateOpen` state (set to `true` when "Custom" is selected in the dropdown)

### Approach

Use a wrapper `<div ref>` around the date filter dropdown and set that div as the popover anchor using Radix's virtual anchoring pattern. The Popover will use `open` / `onOpenChange` for state control only, with no click-to-open trigger needed.

```tsx
// Simplified structure
<Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
  <div className="relative">
    <PopoverTrigger asChild>
      <div className="absolute inset-0 pointer-events-none" />
    </PopoverTrigger>
    {dropdownMenu}
  </div>
  <PopoverContent ...>
    {/* calendar UI unchanged */}
  </PopoverContent>
</Popover>
```

The key insight: the `PopoverTrigger` div covers the same space as the date button (via `absolute inset-0`) so the popover anchors to the correct position, but `pointer-events-none` ensures clicks pass through to the dropdown button underneath.

### Files Changed

- `src/components/FilterBar.tsx` -- Fix popover anchoring for the custom date range picker

