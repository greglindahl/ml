

## Fix: Folder > Galleries tab search placeholder

The last edit incorrectly changed the Galleries tab search inside `FolderDetailsView.tsx` to use "Search by people, tags, filenames…". It should remain "Search" — only the Assets tab gets the longer placeholder.

### Change: `src/components/FolderDetailsView.tsx` (line 619)

Revert the Galleries tab `FacetedSearchWithTypeahead` placeholder back to `"Search"` (remove the `placeholder` prop so it uses the default).

