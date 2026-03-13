
Root cause identified:
- Both affected dropdowns are rendered inside Dialogs and both render option panels via Radix Portal (`PopoverContent` and `SelectContent`).
- With Radix Dialog scroll-lock active, wheel events on portalled dropdown content can be blocked, which matches your “can open but can’t scroll list” behavior.
- New Folder / Edit Folder / Move Galleries all use Popover+Command; Move Folder uses Select. So this is a shared infra bug, not just one modal.

Implementation plan:

1) Fix portal behavior for dropdowns inside dialogs (shared UI layer)
- Update `src/components/ui/popover.tsx` so `PopoverContent` accepts an optional `container` prop and passes it to `PopoverPrimitive.Portal`.
- Update `src/components/ui/select.tsx` so `SelectContent` accepts an optional `container` prop and passes it to `SelectPrimitive.Portal`.
- Keep existing styling and animations; only change portal mounting target support.

2) Mount dropdown portals inside each dialog content (feature dialogs)
- In each dialog that has location dropdowns, add a `DialogContent` ref and pass that ref as `container`:
  - `src/components/NewFolderDialog.tsx` (Location combobox)
  - `src/components/MoveGalleriesDialog.tsx` (New Location combobox)
  - `src/components/MoveFolderDialog.tsx` (Location select)
  - `src/components/EditFolderDialog.tsx` (same location combobox pattern; preventative parity fix)

3) Scroll UX hardening (small but important)
- Keep explicit max-height + `overflow-y-auto` on list containers.
- Add `overscroll-contain` on `CommandList` and Select viewport to prevent wheel chaining to outer layers when list reaches top/bottom.
- Do not change selection logic or folder filtering rules in this pass (scope stays strictly “scroll works reliably”).

4) Regression checks after patch
- New Folder: open Location, mouse-wheel/trackpad through long list, select item.
- Move Galleries modal: same verification.
- Move Folder modal: same verification (Select-based list).
- Edit Folder modal: same verification.
- Confirm no side effects: outside-page scroll remains locked while dialog is open; dropdown itself scrolls normally.

Files to update:
- `src/components/ui/popover.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/command.tsx` (only if overscroll utility is added there)
- `src/components/NewFolderDialog.tsx`
- `src/components/MoveGalleriesDialog.tsx`
- `src/components/MoveFolderDialog.tsx`
- `src/components/EditFolderDialog.tsx`
