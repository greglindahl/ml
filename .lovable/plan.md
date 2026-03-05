

## Fix: Newly Created Gallery Shows ID Instead of Name

### Root Cause

In `handleCreateFolder` (line 132), gallery name lookup uses `mockGalleries.find(g => g.id === gId)` — the **static imported array**. Newly created galleries are added to `galleryList` state, not `mockGalleries`. So the lookup fails and falls back to `gId` (the raw ID like `gallery-17727325332...`).

The same issue exists in `handleEditFolder` (line 167).

### Fix: `src/components/LibraryScreen.tsx`

1. **Line 132**: Change `mockGalleries.find(g => g.id === gId)` to `galleryList.find(g => g.id === gId)` — use the live state array that includes newly created galleries
2. **Line 167**: Same fix for `handleEditFolder` — change `mockGalleries.find(...)` to `galleryList.find(...)`
3. **Update `useCallback` dependencies**: Add `galleryList` to the dependency arrays of both `handleCreateFolder` and `handleEditFolder`

