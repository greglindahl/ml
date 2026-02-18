

## Move Search Pills Inside the Input Field

### What Changes

The selected facet pills (Badges) will move from their current position below the search input into the input container itself, creating an inline "chips-in-input" pattern like email To fields.

### How It Will Look

Before:
```
[magnifier Search by people, tags, filenames...        ]
[Lebron James x] [Nike x]
```

After:
```
[magnifier [Lebron James x] [Nike x] Search by people, tags...  x]
```

The placeholder text appears only when no pills are selected and no text is typed.

### Technical Details

**File: `src/components/FacetedSearchWithTypeahead.tsx`**

**1. Replace the input section (lines 379-402)** with a single flex-wrap container:

- Remove the `<Input>` component and the separate pills `<div>` below it
- Create a single container div styled as an input field:
  ```
  flex flex-wrap items-center gap-1.5 min-h-[40px] px-3 py-1.5
  border rounded-md bg-white
  focus-within:ring-2 focus-within:ring-ring
  ```
- Inside the container, render in order:
  1. Search icon (flex-shrink-0)
  2. Selected facet pills (the existing Badge components, same styling)
  3. A plain `<input>` element (not the shadcn Input) with `flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm`
  4. Clear-all X button (when pills or text exist)

**2. Dynamic placeholder**: The `<input>` placeholder will be set to the full placeholder text only when `selectedFacets.length === 0`, otherwise it shows "Add filter..." (shorter, since pills take up space).

**3. No behavior changes**: All keyboard handling, dropdown positioning, click-to-remove on pills, clear all, and typeahead dropdown remain exactly the same.

