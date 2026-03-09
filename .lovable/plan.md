## Replace Location Dropdown with Radio Buttons

### What Changes

In both `NewFolderDialog` and `EditFolderDialog`, replace the `<Select>` dropdown for Location with a `<RadioGroup>` offering exactly two options:

1. **All Media** — sets `locationId` to `null` (root level)
2. **[Current folder name/path]** — sets `locationId` to the `defaultLocationId` (the folder the user is currently in). Only shown when `defaultLocationId` is not null.

Default selection logic:

- If opened from root ("All Media"), only "All Media" is shown and selected
- If opened from within a folder (e.g. "New L1"), that folder is pre-selected

### Changes

`**src/components/NewFolderDialog.tsx**`

1. Replace `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` imports with `RadioGroup`/`RadioGroupItem` from `@/components/ui/radio-group`
2. Replace the Location `<Select>` block (lines 136–155) with a `<RadioGroup>` containing:
  - Radio item `"root"` labeled "All Media"
  - Conditional radio item for `defaultLocationId` labeled with the folder's display name (look up from `flattenedFolders` by ID, or accept a new `defaultLocationName` prop)
3. Remove `Select`-related imports that are no longer used

`**src/components/EditFolderDialog.tsx**`

1. Same swap — replace `Select` with `RadioGroup` (lines 112–127)
2. Two radio options: "All Media" and the current parent folder name (derived from `currentLocationId` + `flattenedFolders`)
3. Remove unused `Select` imports

`**src/components/NewFolderDialog.tsx` & `EditFolderDialog.tsx**` — both need a helper to resolve the folder display name from `flattenedFolders` using the location ID.

### Files Modified

- `src/components/NewFolderDialog.tsx`
- `src/components/EditFolderDialog.tsx`