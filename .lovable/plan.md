

## Update folder search to match app-wide search pattern

### Change

**`src/components/FolderDetailsView.tsx`**

Move the search input out of the inline controls row and place it as a **full-width row above** the Archived Only / view toggle controls row. Style it to match the screenshot:

- Full-width input with rounded border
- Search icon on the **right** side (not left)
- Placeholder: "Search folders…"
- Clear button (X) appears when text is entered, replacing the search icon position
- Same height/styling as other search inputs in the app (`h-9` or `h-10`, `rounded-md`, `border border-input`)

The controls row (Archived Only toggle + grid/list view) remains unchanged below the search bar.

