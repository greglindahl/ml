Goal: ship a single-pass fix for both regressions (gallery move not visibly updating + location picker not scrollable), without another debug loop.

1. Confirmed findings from current logs

- Move callbacks are firing with correct IDs and target folder IDs.
- Tree mutation currently reports success (`remove` found all IDs, `insertInto` returns `true`).
- So the issue is now UX/state consistency, not event wiring.

2. Root causes to address

- Gallery move feedback is weak/inconsistent in the sidebar because the move logic mutates tree structure in a fragile way and doesn’t force target branch visibility.
- Sidebar expandability logic still trusts `count` metadata, which can get stale after moves and makes folders look unchanged.
- Location picker regression: `MoveFolderDialog` uses Radix Select with `value={targetLocationId ?? ""}` (invalid empty-string controlled value pattern) and current Select viewport behavior is too restrictive for long lists.

3. Implementation plan

A) Harden gallery move state updates (`src/components/LibraryScreen.tsx`)

- Refactor `applyGalleryMoves` to a pure immutable flow:
  - Extract selected gallery nodes from tree (preserve full node data).
  - Remove them from all current parents.
  - Insert into target folder immutably.
  - Guard/fail fast if target folder is missing.
- Remove all temporary `[MOVE]` debug `console.log` statements.
- After successful move, auto-expand destination path in `expandedFolders` so left-nav visibly reflects relocation immediately.

B) Make sidebar reflect real structure only (`src/components/FolderSidebar.tsx`)

- Change `hasExpandableContent` to rely on actual visible children only (not `count` fallback).
- This prevents stale metadata from making folders appear unchanged after move operations.
- Show the moved items in the folder sidebar under the new location so the user can see the move occurred. 

C) Fix location picker scroll + value handling (`src/components/MoveFolderDialog.tsx`)

- Replace empty-string Select control state with a sentinel-safe approach (`"root"` or `undefined`, never `""`).
- Convert Move Folder destination picker to the same searchable popover/command pattern used elsewhere (with explicit scrollable list height), so long folder lists are always scrollable and discoverable.

D) Fix shared Select scrolling behavior (`src/components/ui/select.tsx`)

- Update `SelectPrimitive.Viewport` sizing so it is not constrained to trigger height.
- Use available-height/max-height scrolling behavior for long option lists.

E) Reliability polish for gallery move dialog (`src/components/MoveGalleriesDialog.tsx`)

- Add explicit max height on location list container and ensure wheel/trackpad scrolling is consistently captured.
- Keep existing single-destination bulk move UX.

4. Validation checklist (post-fix)

- Move galleries within same season subtree: old folder loses them, target folder gains them in left nav.
- Move galleries across seasons: source branch updates immediately, destination branch auto-expands.
- Verify both move dialogs can scroll through full location lists with mouse wheel/trackpad.
- Verify no debug logs remain in console for move flow.

Files to update

- `src/components/LibraryScreen.tsx`
- `src/components/FolderSidebar.tsx`
- `src/components/MoveFolderDialog.tsx`
- `src/components/ui/select.tsx`
- `src/components/MoveGalleriesDialog.tsx`