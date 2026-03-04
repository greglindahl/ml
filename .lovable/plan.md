

## Add Scrollable Region to Move Folder Dialog Table

The nested folders table already shows all sub-folders. We just need to wrap it in a `ScrollArea` with a max height so it doesn't overflow the dialog when there are many nested folders.

### Changes

**`src/components/MoveFolderDialog.tsx`**
- Import `ScrollArea` from `@/components/ui/scroll-area`
- Wrap the table container (lines 120-142) in a `ScrollArea` with `max-h-[200px]` (roughly 5 rows visible before scrolling), keeping the table header sticky so column labels remain visible while scrolling
- Add a summary line above the table: "N folders will be moved" for quick scanning

