

## Add Bulk Action Capacity Limits with Disabled States and Tooltips

### What changes

Apply a cap of **5 galleries** for Move actions. When exceeded, the action is disabled with a tooltip: "Too many galleries selected. You may only move up to 5 at a time."

### File changes

**`src/components/FolderDetailsView.tsx`** (lines 659-680)
- Define `const GALLERY_MOVE_LIMIT = 5;` and `const isOverMoveLimit = selectedGalleries.size > GALLERY_MOVE_LIMIT;`
- Wrap the Move menu item area: when `isOverMoveLimit`, disable the `DropdownMenuItem` (add `disabled` prop) and wrap it in a `Tooltip` showing the capacity message.
- The Heart and Archive icon buttons remain unaffected (no cap on those).

**`src/components/LibraryScreen.tsx`** (lines 1133-1147)
- Same pattern: add `GALLERY_MOVE_LIMIT` constant, disable Move menu item when over limit, wrap with tooltip.

**`src/components/GalleryTableView.tsx`** (lines 225-239)
- Same pattern for the inline Move button in the table's bulk action bar: disable button + wrap in tooltip when over limit.

### Tooltip implementation
- Use the existing `Tooltip`/`TooltipTrigger`/`TooltipContent` from `@/components/ui/tooltip`.
- For disabled `DropdownMenuItem`: Radix dropdown items with `disabled` prop still render but are non-interactive and visually muted. Wrap the trigger area in a `Tooltip` so hovering shows the message even when disabled.
- For disabled `Button`: set `disabled` prop and wrap in `Tooltip`.

### Constants
A shared constant `GALLERY_MOVE_LIMIT = 5` will be defined in each file (or extracted to a shared constants file). The tooltip message: `"Too many galleries selected. You may only move up to 5 at a time."`

