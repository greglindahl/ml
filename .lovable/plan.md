

## Match folder search styling to the app-wide search treatment

The screenshot shows the search icon on the **left** side of the input, matching the `FacetedSearchWithTypeahead` component. The current folder search has the icon on the **right**.

### Change: `src/components/FolderDetailsView.tsx` (lines 900-918)

- Move the `Search` icon to the **left** side (`left-3` instead of `right-3`)
- Update input padding to `pl-10 pr-10` (left padding for icon, right padding for clear button)
- Keep the clear (X) button on the right when text is entered

