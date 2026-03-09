

## Bug Fix: "All Media" Radio Selection Ignored in New Folder Dialog

### Root Cause

In `src/components/FolderDetailsView.tsx` line 1086, the `onCreateFolder` callback overrides the user's selection:

```tsx
const folderData = { ...data, locationId: data.locationId ?? folderId };
```

The nullish coalescing operator (`??`) treats `null` as a fallback case — but `null` is the intentional value for "All Media" (root level). So when the user selects "All Media", `locationId` is `null`, and `?? folderId` replaces it with the current folder's ID.

### Fix

**`src/components/FolderDetailsView.tsx`** (~line 1086)

Pass `data.locationId` through as-is without the fallback:

```tsx
onCreateFolder?.(data);
```

The dialog already defaults `locationId` to `folderId` (via the `defaultLocationId` prop on line 1084), so the fallback is unnecessary — the user's explicit radio selection should be respected.

### Files Modified
- `src/components/FolderDetailsView.tsx` (1 line change)

