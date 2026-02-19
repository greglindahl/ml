

## Update "More" Dropdown: Rename Status to Approval Status, Add New Status Filter

### What Changes

1. **Rename** the existing "Status" sub-menu to **"Approval Status"** (keeping Pending, Approved, Rejected options and the `"status"` filter ID).
2. **Add a new "Status" sub-menu** with options: All, Organized, Unorganized (multi-select, using filter ID `"organization-status"`).
3. Update the **More button badge count** to include selections from the new filter.

### Technical Details

**File: `src/components/FilterBar.tsx`**

1. **Rename the sub-trigger label** on line 491 from `Status` to `Approval Status`.

2. **Add new options array** alongside the existing ones (~line 461):
```tsx
const orgStatusOptions = [
  { label: "All", value: "all" },
  { label: "Organized", value: "organized" },
  { label: "Unorganized", value: "unorganized" },
];
```

3. **Add state reader** for the new filter (~line 463):
```tsx
const orgStatusSelected = activeFilters["organization-status"] || [];
```

4. **Update moreCount** to include new filter selections:
```tsx
const moreCount = sourceSelected.length + statusSelected.length + orgStatusSelected.length;
```

5. **Add new `DropdownMenuSub`** after the Approval Status sub-menu (after line 503):
```tsx
<DropdownMenuSub>
  <DropdownMenuSubTrigger className="text-sm">Status</DropdownMenuSubTrigger>
  <DropdownMenuSubContent className="bg-white z-50 min-w-[180px]">
    {orgStatusOptions.map(opt => (
      <DropdownMenuCheckboxItem
        key={opt.value}
        checked={orgStatusSelected.some(s => s.value === opt.value)}
        onCheckedChange={(checked) => handleMultiSelect("organization-status", opt.value, opt.label, !!checked)}
        onSelect={e => e.preventDefault()}
      >
        {opt.label}
      </DropdownMenuCheckboxItem>
    ))}
  </DropdownMenuSubContent>
</DropdownMenuSub>
```

No new dependencies or components needed.
