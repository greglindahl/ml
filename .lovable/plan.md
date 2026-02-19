

## Add Count Badges to More Dropdown Sub-Options

### What Changes

Each option inside the Source, Approval Status, and Status fly-out menus will display a count badge on the right side, matching the style used by the other filter dropdowns (People, Scene, Type, etc.).

Since the mock asset data doesn't have `source`, `approvalStatus`, or `organizationStatus` fields, the counts will be simulated with realistic static values.

### Technical Details

**File: `src/components/FilterBar.tsx`**

1. **Add `count` to each option object** in the three option arrays (~lines 449-466):

```tsx
const sourceOptions = [
  { label: "Posted Content", value: "posted-content", count: 12 },
  { label: "Imported Content", value: "imported-content", count: 8 },
  { label: "Published Content", value: "published-content", count: 15 },
  { label: "Uploaded Content", value: "uploaded-content", count: 22 },
  { label: "Engage Content", value: "engage-content", count: 5 },
  { label: "Requested Content", value: "requested-content", count: 3 },
];
const statusOptions = [
  { label: "Pending", value: "pending", count: 14 },
  { label: "Approved", value: "approved", count: 38 },
  { label: "Rejected", value: "rejected", count: 7 },
];
const orgStatusOptions = [
  { label: "All", value: "all", count: 65 },
  { label: "Organized", value: "organized", count: 42 },
  { label: "Unorganized", value: "unorganized", count: 23 },
];
```

2. **Render counts inside each `DropdownMenuCheckboxItem`** for all three sub-menus. Replace the plain `{opt.label}` with a flex layout showing the label and count, following the same pattern used by the existing filters (line 432):

```tsx
<DropdownMenuCheckboxItem ...>
  <span className="flex-1">{opt.label}</span>
  <span className="text-xs text-muted-foreground ml-auto">{opt.count}</span>
</DropdownMenuCheckboxItem>
```

This applies to all three sub-menus (Source at ~line 491, Approval Status at ~line 506, Status at ~line 521).

No new dependencies or components needed -- follows the exact same count display pattern already used by the other filter dropdowns.
