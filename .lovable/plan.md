

## New Folder Dialog Fixes

### Changes to `src/components/NewFolderDialog.tsx`

**1. Location dropdown**
- Change placeholder from `"Root (top level)"` to `"Select location..."`
- Change the default value logic: don't pre-select root; let it start unselected
- Rename root option from `"Root (top level)"` to `"All Media"`

**2. Add Galleries — search + scroll fix**
- Add a `gallerySearch` state variable
- Add a search `Input` at the top of the `PopoverContent` (above the checkbox list)
- Filter displayed galleries by the search term
- Fix scrolling: the search input should be sticky/outside the scrollable area, and the checkbox list should scroll independently beneath it

### Specific Edits

**Lines 50-53**: Add `gallerySearch` state, reset it in `resetForm`

**Lines 132-147** (Location Select):
- Remove default value `locationId ?? "root"` — use `locationId ?? ""`
- Change `<SelectValue placeholder="Root (top level)" />` → `<SelectValue placeholder="Select location..." />`
- Change `<SelectItem value="root">Root (top level)</SelectItem>` → `<SelectItem value="root">All Media</SelectItem>`

**Lines 165-179** (Popover content):
- Add search input above the scrollable list
- Filter galleries by search term
- Structure: fixed search input + scrollable checkbox list below

