

## Limit Tags Dropdown to Top 20

### What Changes

The Tags filter dropdown currently shows all unique tags from the dataset sorted by frequency. This will be limited to only the **top 20 tags** (by count) to better represent what real users will see.

### Technical Details

**File: `src/components/FilterBar.tsx`**

A single change on line 110-116: add `.slice(0, 20)` after the `.sort()` and before `.map()`:

```tsx
return Object.entries(tagCounts)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 20)
  .map(([tag, count]) => ({
    label: tag,
    value: tag,
    count,
  }));
```

One line added, no other changes needed.
