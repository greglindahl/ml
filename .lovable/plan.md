

## Remove Controls from Folders Tab (Keep Only Archived Toggle)

On the All Media level Folders tab, remove the search bar, Creator filter, Date Range filter, Sort dropdown, and grid/list toggle. Replace them with just an "Archived Only" toggle.

### Changes

**`src/components/LibraryScreen.tsx`**

In the `<TabsContent value="folders">` section (lines 1160-1226):

1. **Remove** the `FacetedSearchWithTypeahead` search bar (lines 1161-1164)
2. **Remove** the entire filters/controls row: Creator dropdown, Date Range dropdown, Sort dropdown, and grid/list toggle (lines 1166-1226)
3. **Replace** with a single row containing an "Archived Only" toggle using a `Switch` component + label, right-aligned:

```tsx
<div className="flex items-center justify-end gap-2 mb-6">
  <Label htmlFor="archived-folders" className="text-sm text-muted-foreground">
    Archived Only
  </Label>
  <Switch id="archived-folders" />
</div>
```

This keeps the Folders grid unchanged — only the toolbar above it is simplified.

