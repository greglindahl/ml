

## Update Folders Tab Empty State for Level 3 Folders

When `!canCreateSubfolder` (i.e., `folderDepth >= 3`), replace the empty state content in the Folders tab with a distinct "Folder limit reached" message.

### Change in `src/components/FolderDetailsView.tsx` (lines 656-674)

Replace the single empty state block with a conditional:

**When `!canCreateSubfolder`:**
- Icon: same folder icon treatment
- Heading: **"Folder limit reached"**
- Body: "Folders can only be nested three levels deep. You can still add galleries to organize content in this folder."
- CTA: "Add Galleries" button (opens `setAddGalleryDialogOpen(true)`)
- No "New Folder" link

**When `canCreateSubfolder`:** keep current empty state unchanged ("This folder is empty" + both buttons).

Single file change, ~10 lines modified.

