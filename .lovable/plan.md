

## Fix Scrolling & Sticky Behavior

### Problem
The entire page scrolls as one unit — the left nav, folder sidebar, search/tabs/filters, and asset grid all scroll together. The GIF shows the folder sidebar and primary nav scrolling away.

### Goal
- **Primary nav (LeftNav)**: Already `h-screen` and sticky — no change needed.
- **Folder sidebar**: Should be viewport-height and scroll independently (its own overflow). Currently it's `flex flex-col` with `overflow-y-auto` on the tree area, but the parent container scrolls.
- **Search + tabs + filters**: Should stick to the top when the user scrolls, so only the asset grid scrolls beneath them.
- **Asset content area**: Only the asset cards/table should scroll.

### Changes

**1. `src/components/LibraryScreen.tsx`**

The outermost wrapper (line 727) is `flex-1 flex`. The main content area (line 772) uses `flex-1 flex flex-col` and allows the whole thing to grow and scroll with the page.

Fix: Make the outer `flex-1 flex` container take full viewport height (`h-screen overflow-hidden`) so the sidebar and content area each manage their own scrolling. Then inside the main content area:
- The header, tabs row, search, and filter bar become a sticky/fixed top section
- Only the asset grid area below gets `overflow-y-auto flex-1`

Specifically:
- Line 727: Add `h-screen overflow-hidden` to the outer flex container
- Line 772: Change the main content div to `flex-1 flex flex-col min-w-0 h-full overflow-hidden` (remove padding-top, keep horizontal padding)
- Wrap the header + tabs + search + filters in a `flex-shrink-0` div so they don't scroll
- Wrap each `TabsContent` body in a scrollable container (`overflow-y-auto flex-1`)

**2. `src/components/FolderSidebar.tsx`**
- The expanded sidebar (line ~226) already has `flex flex-col w-64` and the tree area has `overflow-y-auto`. Just need to ensure the parent constrains height. Adding `h-full` to the sidebar root divs will make them fill the viewport-height container.

### Layout Structure After Fix

```text
┌──────────────────────────────────────────────────┐
│ LeftNav (h-screen, sticky)                       │
│  ┌─────────────┬────────────────────────────────┐│
│  │ FolderSidebar│  Header + New/Upload buttons  ││
│  │ (h-full,    │  Tabs bar                      ││
│  │  own scroll)│  Search + Filters              ││ ← all sticky (flex-shrink-0)
│  │             │────────────────────────────────││
│  │             │  Asset grid (overflow-y-auto)  ││ ← only this scrolls
│  │             │                                ││
│  └─────────────┴────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

### Files Modified
- `src/components/LibraryScreen.tsx` — restructure the main content area layout
- `src/components/FolderSidebar.tsx` — minor: ensure `h-full` on root containers

