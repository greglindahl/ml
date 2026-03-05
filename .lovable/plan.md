

## Add Inline Tooltip Note to Add Gallery Dialog

### Change

Add a persistent inline hint between the gallery list and the footer, using an `Info` (or `Eye`) icon plus muted text styled like a tooltip callout. This is always visible — not a hover tooltip.

### Implementation

**`src/components/AddGalleryDialog.tsx`** — Insert a new inline note between the scrollable list (line 143) and `DialogFooter` (line 145):

```tsx
<div className="flex items-center gap-1.5 pt-2">
  <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
  <span className="text-xs text-muted-foreground">Galleries can only belong to one folder.</span>
</div>
```

This mirrors the tooltip text treatment (small, muted) but is always shown inline at the bottom of the dialog, matching the screenshot reference.

### File Modified
- `src/components/AddGalleryDialog.tsx`

