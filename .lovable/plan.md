

## Update Archive Folder Dialog

The current `ArchiveFolderDialog` is a simple confirmation with just the folder name. The screenshot shows a richer design matching the Move Folder pattern: a table of all nested sub-folders with their breadcrumb paths, plus an info banner.

Regarding showing the nested folder path table: yes, I'd recommend it. Archiving is a significant action that affects the entire subtree. Showing users exactly which folders will be hidden — with their full breadcrumb paths — gives them confidence and reduces "undo" support requests. It's the same `collectNestedFolders` logic already used in `MoveFolderDialog`, so it's consistent and low-effort to add.

### Changes

**`src/components/ArchiveFolderDialog.tsx`**
- Accept `folder: FolderItem` and `breadcrumbPath: string` props (replacing the simple `folderName` string)
- Reuse `collectNestedFolders` from `MoveFolderDialog` (extract it or duplicate it) to build the nested folder rows
- Add the same scrollable table pattern (ScrollArea with max-h-[200px], sticky headers) showing Folder name + Current Location columns
- Update description text to match the screenshot: "Archiving a folder hides it from users. If you decide later you want to make an archived folder available, you can unarchive it."
- Add info banner at bottom: "Galleries and assets are not deleted."
- Keep Cancel + Archive footer buttons

**`src/components/FolderDetailsView.tsx`**
- Update the `ArchiveFolderDialog` usage to pass `folder` and `breadcrumbPath` instead of `folderName`

**Shared utility**: Extract `collectNestedFolders` into `mockFolderData.ts` (or duplicate in ArchiveFolderDialog) so both Move and Archive dialogs can use it.

