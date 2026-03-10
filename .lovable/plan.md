

## Simplify Move Galleries Dialog to Single Location

### Understanding
Currently the Move Galleries dialog has a per-row location dropdown (one per gallery). The user wants to:
1. Remove the "Location" column from the table
2. Add a single searchable location picker (same Popover + Command combobox used in New/Edit Folder dialogs) above or below the table
3. All selected galleries move to that one location

### Changes

**`src/components/MoveGalleriesDialog.tsx`**
- Remove the "Location" `TableHead` and per-row `Select` cells from the table — table becomes two columns: Gallery, Current Location
- Remove `targets` state (per-gallery mapping) and `lastChanged` / `handleApplyToAll` / `handleTargetChange`
- Add single `locationId` state (`string | null`) and `locationPopoverOpen` state
- Add the Popover + Command searchable combobox (matching the pattern from `EditFolderDialog`) placed between the table and the info alert
- Label it "New Location" with the trigger showing "Select Location" when null, or the folder's `displayName`
- Update `onMove` call to pass the single selected location
- Update the `onMove` prop type from `Record<string, string | null>` to a single `string | null`
- Move button disabled until a location is selected

### Files Modified
- `src/components/MoveGalleriesDialog.tsx`
- Any parent that calls `onMove` (need to check prop usage)

