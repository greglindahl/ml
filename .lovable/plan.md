

## Fix: Keep tabs visible in empty folder state

The screenshot shows the empty state should appear **inside** the Folders tab, not replace the entire tab structure. The tabs (Assets, Galleries, Folders), "Archived Only" toggle, and view switcher should all remain visible.

### Change to `src/components/FolderDetailsView.tsx`

**Move the empty state inside the Folders tab content** instead of replacing all tabs:

- **Remove** the conditional wrapper at lines 225-242 that replaces the entire `<Tabs>` with the empty state
- **Restore** the `<Tabs>` to always render
- **Add** the empty state inside the Folders `TabsContent` — when the folder has no children, show the empty illustration/text instead of the folders grid
- Keep the "Archived Only" toggle and grid/list view switcher visible above the empty state (matching the screenshot)

The condition for the empty state becomes specific to the Folders tab: show it when `folder.children` is empty. The Assets and Galleries tabs keep their existing behavior independently.

