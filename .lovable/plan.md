

## Change Search Placeholder on Galleries and Folders Tabs

**What changes:** The search input placeholder on the Galleries and Folders tabs will be changed from "Search by people, tags, filenames..." to just "Search".

### Technical Details

1. **Add a `placeholder` prop to `FacetedSearchWithTypeahead`** (in `src/components/FacetedSearchWithTypeahead.tsx`)
   - Add `placeholder?: string` to the `FacetedSearchWithTypeaheadProps` interface
   - Pass it through to the `Input` component, defaulting to the current text

2. **Pass the new placeholder on Galleries and Folders tabs** (in `src/components/LibraryScreen.tsx`)
   - On the Galleries tab (~line 627): `<FacetedSearchWithTypeahead placeholder="Search" />`
   - On the Folders tab (~line 740): `<FacetedSearchWithTypeahead placeholder="Search" />`
   - The Assets tab remains unchanged with the default placeholder

