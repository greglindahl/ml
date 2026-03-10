

## Fix Location Label: "Select Location" at Root, Default to Current Folder

### Problem
The location dropdown always shows "All Media" when `locationId` is null (root level). It should show "Select Location" as placeholder text when at root, and default to the current parent folder when creating a subfolder.

### Changes

**`src/components/NewFolderDialog.tsx`**
- Change `selectedLocationLabel`: when `locationId` is null, return `"Select Location"` instead of `"All Media"`
- The "All Media" option remains in the dropdown list as a selectable item

**`src/components/EditFolderDialog.tsx`**
- Same change to `selectedLocationLabel`

### Files Modified
- `src/components/NewFolderDialog.tsx`
- `src/components/EditFolderDialog.tsx`

