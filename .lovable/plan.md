

## Default Location in New Folder Dialog to Current Folder

Add a `defaultLocationId` prop to `NewFolderDialog` so it pre-selects the current folder as the location. At All Media level, it stays as "Select location...".

### Changes

**`src/components/NewFolderDialog.tsx`**
- Add optional `defaultLocationId?: string | null` to props interface
- Initialize `locationId` state from `defaultLocationId` instead of `null`
- Reset to `defaultLocationId` (not `null`) in `resetForm`
- Use `useEffect` to sync when `defaultLocationId` changes or dialog opens

**`src/components/FolderDetailsView.tsx`** (line ~880)
- Pass `defaultLocationId={folderId}` to `NewFolderDialog`

**`src/components/LibraryScreen.tsx`** (line ~1219)
- No change needed — omitting the prop defaults to `null`, which keeps "Select location..." as placeholder at All Media level

