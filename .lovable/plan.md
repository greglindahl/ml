
## Default Sort to "Added Date" (Newest First)

### What Changes

The sort control will default to "Added Date" (descending) instead of having no sort selected. Both the grid view and table view will show results sorted by Added Date on initial load, and the sort button will display "Sort: Added Date" with a down arrow.

### Technical Details

**Two files need one-line changes each:**

**1. `src/components/LibraryScreen.tsx` (line 88)**
Change the default sort state from `null` to `"dateCreated"`:
```
const [sortField, setSortField] = useState<SortField>("dateCreated");
```

**2. `src/components/AssetTableView.tsx` (line 62)**
Same change for the table view's internal sort state:
```
const [sortField, setSortField] = useState<SortField>("dateCreated");
```

Both already default `sortDirection` to `"desc"`, so newest-first is automatic. The sort button label and the table header arrow indicator will reflect the active sort immediately on load.
