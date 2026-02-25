

## Remove "Views" from Sort Dropdown

### Change

**File: `src/components/LibraryScreen.tsx`** (line 107)

Remove the line:
```tsx
{ value: "publicViews", label: "Views" },
```

**File: `src/components/LibraryScreenV4.tsx`** (~line 44, same entry)

Remove the corresponding "Views" entry if present.

Single line removal in each file, no logic changes needed since unused sort fields are simply ignored.

