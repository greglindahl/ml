

## Fix: Depth Validation Bug + Alert Modal for Invalid Moves

### Root Cause

The depth check on line 113 of `FolderSidebar.tsx` uses `> 4`, but since level 4 is reserved exclusively for galleries, folders can only occupy levels 1-3. A folder with 3 levels of nesting (New L1 > New L2 > New L3) dragged into a level-1 folder (Season 23-24) produces `1 + 3 = 4`, which passes the `> 4` check incorrectly. It should be `> 3`.

### Changes

**1. `src/components/FolderSidebar.tsx`**
- Line 113: Change `targetDepth + draggedSubtreeDepth > 4` to `> 3` — enforces that folders cannot land at level 4 (reserved for galleries)
- Line 168: Replace `sonnerToast.error(...)` with a call to set state that opens an alert dialog
- Add state `showDepthAlert` and render an `AlertDialog` with the message from the reference image: *"This move would exceed the 4-level folder limit. Choose a different location."* with an info icon and OK button

**2. `src/components/FolderSidebar.tsx` — Alert Dialog UI**
- Use the existing `@radix-ui/react-alert-dialog` (already installed) to show a modal alert
- Style the message with a red/destructive info icon matching the reference screenshot
- Single "OK" button dismisses the dialog; item has already snapped back automatically

