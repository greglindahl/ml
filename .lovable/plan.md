

## Add "New Folder" Dialog

### What We're Building

A modal dialog triggered by clicking "New Folder" from the existing New dropdown on the Library page. Based on the reference screenshot, the dialog has:

- **Title**: "New Folder"
- **Name** (required): Text input
- **Location** (optional): Select dropdown populated from the existing folder tree (replaces "Parent" from the mockup — more user-friendly)
- **Add Galleries** (optional): Multi-select dropdown populated from existing galleries
- **Cancel / Create** buttons

On create, a new folder is added to the mock folder tree in state.

### Technical Details

**New file: `src/components/NewFolderDialog.tsx`**
- Dialog component using existing `Dialog`, `Input`, `Select`, `Button` UI primitives
- Props: `open`, `onOpenChange`, `onCreateFolder`, `folders` (for location options), `galleries` (for gallery options)
- Name field with required validation
- Location dropdown: flattened folder tree (indented names to show hierarchy), defaults to root
- Add Galleries: multi-select from available galleries using checkboxes in a dropdown/popover
- Cancel closes dialog, Create validates name is non-empty then calls `onCreateFolder`

**Modified: `src/components/LibraryScreen.tsx`**
- Add state: `newFolderDialogOpen`
- Wire "New Folder" `DropdownMenuItem` onClick to open the dialog
- Add `handleCreateFolder` callback that inserts the new folder into the folder tree state (currently `folders` is imported statically — we'll need to lift it to component state)
- Render `<NewFolderDialog>` in the component tree

**Modified: `src/lib/mockFolderData.ts`**
- Add a helper `flattenFolders(folders, depth)` that returns a flat list with depth info for the location dropdown display

### Dialog Styling
- Matches the reference: clean layout, rounded inputs, "Cancel" as outline button, "Create" as primary dark button
- Uses existing shadcn Dialog, Input, Select, and Button components

