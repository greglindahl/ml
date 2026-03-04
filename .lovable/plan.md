

## Replace Add Galleries Dropdown with AddGalleryDialog in New Folder Modal

### Change

**`src/components/NewFolderDialog.tsx`**

1. **Remove** the Popover-based gallery multi-select dropdown (the `gallerySearch`, `Popover`, `PopoverTrigger`, `PopoverContent`, `Checkbox` list block)

2. **Add** a "Select Gallery" row styled as a bordered container with a gallery icon, "Select Gallery" text, and a "+" button on the right (matching the GIF pattern)

3. **On "+" click**, open the existing `AddGalleryDialog` component. When galleries are selected via `onSelectGalleries`, merge them into `selectedGalleryIds` state.

4. **Show selected galleries** as a list below the selector row (gallery name with an X to remove), so the user can see what they've picked.

5. **Remove** unused imports (`Popover`, `PopoverContent`, `PopoverTrigger`, `ChevronDown`, `Checkbox`, `gallerySearch` state).

6. **Add** import for `AddGalleryDialog` and `Images`/`Plus` icons from lucide-react.

