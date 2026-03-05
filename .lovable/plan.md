

## Add Tooltip to Disabled Galleries in Add Gallery Dialog

### Change

In `src/components/AddGalleryDialog.tsx`, wrap the "In Folder" button for disabled galleries with a `Tooltip` component that explains why the gallery cannot be selected.

**Tooltip text**: "Galleries can only belong to one folder. To move this gallery, remove it from its current folder first."

### Implementation

- Import `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` from `@/components/ui/tooltip`
- When `isDisabled` is true, wrap the "In Folder" button in a `Tooltip` so hovering shows the explanatory message
- Keep the existing "Already in a folder" inline text as secondary context

### File Modified
- `src/components/AddGalleryDialog.tsx`

