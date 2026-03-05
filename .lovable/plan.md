

## Replace Folders tab raw input with FacetedSearchWithTypeahead

The Folders tab inside `FolderDetailsView.tsx` currently uses a plain `<input>` element for search, while the Galleries tab uses the `FacetedSearchWithTypeahead` component. The user wants them to match visually.

### Change: `src/components/FolderDetailsView.tsx` (lines 900-918)

Replace the raw `<input>` search with `<FacetedSearchWithTypeahead>`:
- Remove the custom `<Search>` icon, `<input>`, and `<X>` clear button markup
- Use `<FacetedSearchWithTypeahead placeholder="Search" />` instead
- Wire the `onSearch` callback to filter folders the same way (by folder name matching the query text)
- Remove the now-unnecessary `folderSearchInputRef` and `folderSearchQuery` state if they become unused, or adapt the folder filtering to work with the component's callback

This ensures the Folders tab search has the same rounded border, icon placement, focus ring, and overall treatment as the Galleries tab.

