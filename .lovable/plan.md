
## Disable Filter Options Already Selected in Search

### What Changes

When you select a facet from the search typeahead (e.g., "Lebron James"), that same option will appear disabled/grayed out in the corresponding filter dropdown (e.g., the People filter). This prevents confusing duplicate selections across search and filters.

### How It Will Work

- Select "Lebron James" from the search typeahead --> "Lebron James" appears grayed out and non-clickable in the People filter dropdown
- Same logic applies to Scene, Brand, and Tags filters
- When you remove the pill from the search bar, the option becomes active again in the filter

### Technical Details

**Three files need changes:**

**1. `src/components/FacetedSearchWithTypeahead.tsx`**
- Add a new callback prop: `onSelectedFacetsChange?: (facets: SelectedFacet[]) => void`
- Call this callback whenever `selectedFacets` state changes (via a `useEffect`)
- Export the `SelectedFacet` type so parent components can use it

**2. `src/components/LibraryScreen.tsx`**
- Add state to track selected search facets: `const [searchSelectedFacets, setSearchSelectedFacets] = useState([])`
- Pass the callback to `FacetedSearchWithTypeahead`: `onSelectedFacetsChange={setSearchSelectedFacets}`
- Pass the facets down to `FilterBar`: `disabledValues={searchSelectedFacets}`

**3. `src/components/FilterBar.tsx`**
- Add a new prop: `disabledValues?: { value: string; category: string }[]`
- In the dropdown rendering logic, for People/Scene/Brand/Tags filters, check if the option's value matches any disabled facet
- If disabled: render the item with `opacity-50 pointer-events-none` styling and skip the `onCheckedChange` handler
- Map search facet categories to filter IDs (e.g., "People" --> "people", "Scene" --> "scene", "Brand" --> "brand")
