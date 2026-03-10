

## Add Searchable Location Dropdown to Folder Dialogs

### Approach
Replace the `Select` component for Location in both `NewFolderDialog` and `EditFolderDialog` with a `Popover` + `Command` (cmdk) combo. This gives a searchable combobox pattern: clicking the trigger opens a popover with a search input at top and a filtered list of folder locations below.

### Changes

**`src/components/NewFolderDialog.tsx`**
- Replace the `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` for Location with `Popover` + `Command` components
- Add `locationSearch` state for the search input
- Add `locationPopoverOpen` state
- Filter `flattenedFolders` by search term (case-insensitive match on `displayName`)
- Always show "All Media" as the first option (unless filtered out)
- Display the selected location name in the trigger button, with a `ChevronsUpDown` icon

**`src/components/EditFolderDialog.tsx`**
- Same changes as above

### UI Pattern
```
┌─────────────────────────┐
│ Search locations...     │  ← CommandInput
├─────────────────────────┤
│ ✓ All Media             │  ← CommandItem
│   └ Folder A            │
│   └ Folder B            │
│   └── Sub-folder C      │
└─────────────────────────┘
```

### Files Modified
- `src/components/NewFolderDialog.tsx`
- `src/components/EditFolderDialog.tsx`

