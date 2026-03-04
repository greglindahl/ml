

## Replace Galleries Empty State with Actionable CTA

### What changes

**`src/components/FolderDetailsView.tsx`**

1. **Galleries tab empty state** (lines 688-693): Replace the passive "No galleries found / This folder doesn't contain any galleries" message with the same empty-state pattern used in the Folders tab — an illustration, descriptive text, and an "Add Galleries" button that opens the `AddGalleryDialog` (gallery selector). This lets users immediately select existing galleries or create new ones.

2. **Button color change** — update all "Add Galleries" buttons from black (`bg-foreground text-background`) to blue (`bg-primary text-primary-foreground hover:bg-primary/90`) across three locations:
   - The new galleries-tab empty state (line ~689)
   - The folders-tab empty state at levels 1-2 (line ~775)
   - The folders-tab empty state at level 3 / nesting limit (line ~784)

### Summary of behavior
- Inside a folder on the Galleries tab with no galleries → shows illustration + "Add Galleries" blue button
- Clicking "Add Galleries" opens the existing `AddGalleryDialog` (the gallery selector with search, select, and "+ New Gallery")
- All "Add Galleries" CTAs across the app become blue-styled for consistency

