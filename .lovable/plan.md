

## Add "Apply to All" Action to Move Galleries Dialog

### What changes

**`src/components/MoveGalleriesDialog.tsx`**

When a user selects a location for any gallery row, show a small "+ Apply to all" text button directly below that row's dropdown. Clicking it copies that selection to all other galleries in the list.

- Add a helper `handleApplyToAll` that takes a value and sets it as the target for every gallery
- After each `Select` in the table cell, conditionally render a small "+ Apply to all" link when that row has a selection and there are multiple galleries
- Style it as a small text button (text-xs, pink/rose color matching the mockup) positioned below the select dropdown
- Only show it on the first row that has a selection (to avoid cluttering every row)

### Implementation detail

Track which gallery was most recently changed. Show "+ Apply to all" beneath that row's Location cell only. On click, apply that row's target value to all galleries.

