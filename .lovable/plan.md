

## Rename: "Status" submenu to "Sorted" with updated option labels

Based on the screenshot annotations, three label changes are needed in the "More" filter dropdown:

### Changes

**File: `src/components/FilterBar.tsx`**

1. **Line 584-588** - Rename the `orgStatusOptions` labels:
   - "Organized" → "Sorted"
   - "Unorganized" → "Unsorted"

2. **Line 636** - Rename the submenu trigger label:
   - "Status" → "Sorted"

### Technical Details

```
orgStatusOptions:
  "All" stays as-is
  "Organized" → "Sorted"
  "Unorganized" → "Unsorted"

SubTrigger label:
  "Status" → "Sorted"
```

Three string replacements, single file, no logic changes.

