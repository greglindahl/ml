# Secondary Folder-Tree Nav — Dev Handoff

**Scope:** the folder-tree sidebar inside the Library screen (left edge of the content area, sibling to `content-container`).
**Stack note:** prototype is React + Tailwind + shadcn (uses `@dnd-kit` for drag-and-drop); prod target is Angular + Bootstrap + Dashkit.
**Pairs with:** `DEV_HANDOFF_LEFT_NAV.md` (primary left nav), `DEV_HANDOFF_LAYOUT.md` (Library filter bar & responsive behavior).

---

## 1. Headline: net-new UI

The folder-tree sidebar is **net-new UI in the Library** — there is no equivalent surface in production today. Prod's existing folder concept renders as static count badges (no tree, no nested folders, no drag-and-drop, no sidebar). Everything in this doc describes the new design that will replace nothing.

API integration is out of scope for this handoff; once the backend folder model lands the operations described below get wired to it.

---

## 2. Anatomy & integration

Sidebar is a left-edge panel inside `LibraryScreen`, rendered as a sibling of `.content-container` (the filter bar / asset area).

| File | Role |
|------|------|
| `src/components/FolderSidebar.tsx` | The sidebar shell — owns DnD context, collapse state, recursive tree render, footer archive toggle |
| `src/components/SortableFolderItem.tsx` | Per-item renderer — handles dragging, hover/active styling, expand/collapse chevron |
| `src/lib/mockFolderData.ts` | Mock data: `FolderItem` type + a 3-season nested tree (4+ levels per season) |
| `src/components/LibraryScreen.tsx:794–822` | Integration point — passes folder list, active folder, expand state, callbacks |

The sidebar is **always rendered next to Library** (not lifted into the primary nav). It is a domain-specific surface, not a global one — Network, Engage, etc. do not get a folder tree.

---

## 3. Data model

```ts
interface FolderItem {
  id: string;
  name: string;
  type: "folder" | "gallery";       // mixed — both render in the same tree
  count?: number;                    // displayed as a badge
  countType?: "folders" | "galleries" | "assets";
  children?: FolderItem[];           // folders only; galleries don't nest
  archived?: boolean;
}
```

### Special-case root

- **"All Media"** is hardcoded as `id="all"`, `type="folder"`. It is:
  - Always present at the top of the tree
  - **Non-draggable** (can't be moved by the user)
  - **Non-indented** (renders at depth 0 with no chevron offset)
  - Uses a generic file icon (not the folder icon)
- The prod port must preserve this convention — the route `/library/all` (or equivalent) should always exist and always anchor the tree.

---

## 4. Tree rules

- **Mixed children**: a folder may contain both sub-folders and galleries. Galleries are leaf nodes (they don't get a children list).
- **Max depth: 4 levels** below "All Media". Enforced client-side at `FolderSidebar.tsx:127–130` — violations show an `alert()` (replace with toast/banner in prod; see §11).
- **Ordering**: items render in array order. Drag-reorder writes a new order into state.
- **No gallery nesting**: a gallery can be dropped into a folder, but nothing can be dropped into a gallery. Validated at drop time.

---

## 5. Interactions

### Click → navigate
- Clicking a folder or gallery calls `onSetActiveFolder(id)` and selects it.
- Active selection is reflected by the visual state (§6) and by the main content area filtering to that folder's contents.

### Click chevron → expand / collapse
- Per-folder expand state lives in parent (`expandedFolderIds: Set<string>`) and toggles via `onToggleFolderExpand(id)`.
- Chevron icon: `bi-chevron-down` when expanded, `bi-chevron-right` when collapsed.
- Galleries do not have a chevron (no children).

### Drag-and-drop
Uses `@dnd-kit` (`DndContext` + `SortableContext`, `PointerSensor` + `KeyboardSensor`).

Three validation rules applied in `validateDrop()` (`FolderSidebar.tsx:115–142`):

| Rule | Behavior on violation |
|------|------------------------|
| **No circular nesting** — can't drop a folder into one of its own descendants | Visual `ring-destructive`; drop rejected silently |
| **Max depth 4** — moved subtree's deepest leaf can't exceed 4 levels under "All Media" | Visual `ring-destructive` + `alert()` |
| **No gallery as container** — can't drop into a gallery | Visual `ring-destructive`; drop rejected silently |

Drag affordances:
- Drop target valid: `ring-primary bg-primary/10`
- Drop target invalid: `ring-destructive`
- Archived items: drag disabled (`opacity-50`)

### Footer archive toggle
- Global switch: `Show archived` (off by default).
- When on, archived folders/galleries appear with `opacity-50`; otherwise they're filtered out entirely.
- This is **global**, not per-folder. (Per-folder show/hide is out of scope for v1; see §12.)

---

## 6. Visual states

| State | Styling |
|-------|---------|
| Inactive | base text color, no background |
| Hover | `bg-gray-100` |
| Active (selected) | `bg-primary` (`#d5e5fa`), `text-primary` (`#2c7be5`) |
| Drop target — valid | `ring-primary bg-primary/10` |
| Drop target — invalid | `ring-destructive` |
| Archived (when `showArchived` is on) | `opacity-50`, drag disabled |

### Icons

| Item type | Icon |
|-----------|------|
| "All Media" root | file icon (generic) |
| Folder (collapsed) | folder icon + `bi-chevron-right` |
| Folder (expanded) | folder icon + `bi-chevron-down` |
| Gallery | images icon (no chevron) |

### Indentation

- Depth 0 ("All Media" and its direct children): no indent
- Each level deeper adds a consistent indent step (set in `SortableFolderItem` by depth prop)

---

## 7. Dev specs (concrete CSS reference)

Pulled verbatim from `FolderSidebar.tsx` and `SortableFolderItem.tsx`, then cross-walked to the portal's Dashkit tokens (`portal/.../dashkit/theme/_variables.scss`). Use the portal SCSS variable on the port; the hex is shown only so designers can match in Figma. Values are the source of truth — if the prototype changes, update here.

### Color tokens

| Use | Portal token | Hex |
|-----|--------------|-----|
| Sidebar background | (white) | `#FFFFFF` |
| Sidebar / header / footer borders | `$gray-300` | `#E3EBF6` |
| Body / muted text (inactive items, icons) | `$gray-700` | `#6E84A3` |
| Header title text | `$body-color` / `$black` | `#12263F` |
| Hover background (rows + chevron buttons) | `$gray-200` | `#EDF2F9` |
| Active item background | `$primary-bg-subtle` (= `shift-color($primary, -80%)`) | `#D5E4FA` ≈ `#D5E5FA` |
| Active item text | `$primary` / `$blue` | `#2C7BE5` |
| Drop-target ring (valid) | `$primary` + 10% alpha fill | `ring-primary` + `bg-primary/10` |
| Drop-target ring (invalid) | `$danger` / destructive token + 10% alpha fill | `ring-destructive` + `bg-destructive/10` |

### Typography

| Element | Portal token | Size (rem / px) | Weight | Tracking |
|---------|--------------|------|--------|----------|
| Header title ("Library") | `$font-size-base` | `0.9375rem` / 15px | `$font-weight-normal` (400) | `-0.3px` |
| Tree item name | `$font-size-sm` | `0.8125rem` / 13px | `$font-weight-normal` (400) | `-0.13px` |
| Footer "View Archived" label | `$font-size-sm` | `0.8125rem` / 13px | `$font-weight-normal` (400) | `-0.13px` |
| Item icon (folder / images / file) | — (`1rem`) | `1rem` / 16px | — | — |
| Per-folder expand chevron | — (`1rem`) | `1rem` / 16px | — | — |
| Sidebar toggle chevron + collapsed-state icons | `$font-size-base` | `0.9375rem` / 15px | — | — |
| Drag handle icon | — (`0.875rem`) | `0.875rem` / 14px | — | — |
| Footer archive icon | — (`0.875rem`) | `0.875rem` / 14px | — | — |

#### Icon-size note

The 16px and 14px icon sizes don't map to a portal `$font-size-*` token — use the literal `1rem` / `0.875rem` values.

### Spacing & layout

Portal's `$spacer` is `1.5rem` (24px) — base spacers are `0.125 / 0.25 / 0.5 / 1 / 1.5 / 3 / 4.5 / 9` × `$spacer` (= 3 / 6 / 12 / 24 / 36 / 72 / 108 / 216 px). Values below cite the closest portal spacer where the proto value matches, or note "no portal match" where it doesn't.

| Property | Value | Portal spacer |
|----------|-------|---------------|
| Sidebar width (expanded) | **216px** | `$spacers.8` (`$spacer * 9`) ✓ |
| Sidebar width (collapsed) | **48px** | `$spacer * 2` (literal, not in default map) |
| Sidebar inner padding (top / bottom / sides) | 12 / 24 / 4 px | `$spacers.3` ✓ / `$spacers.4` ✓ / (no match — closest `$spacers.1` = 3px) |
| Header padding | 12px (`$spacers.3`) | ✓ |
| Footer padding | 12px (`$spacers.3`) | ✓ |
| Tree item vertical padding | 8px | (no match — between 6 and 12; keep literal `0.5rem`) |
| Tree item base left padding | 8px | (no match — keep literal) |
| Tree item right padding | 8px | (no match — keep literal) |
| **Depth indent step** | **24px per level** | `$spacers.4` ✓ |
| "All Media" left padding (override) | 24px | `$spacers.4` ✓ |
| Tree item border radius | 6px (`rounded-md`) | matches `$spacers.2` value (coincidence; border-radius isn't a spacer token) |
| Drag handle slot width | 18px | (no match — keep literal) |
| Inner gaps | 4 / 8 px | `$spacers.1` ≈ 3px (1px off) / (no match for 8) |

### Transitions

| Trigger | Transition |
|---------|------------|
| Sidebar width change | `transition-all duration-300 ease-in-out` |
| Item bg/text color change | `transition-colors` (Tailwind default = 150ms ease) |
| Drag handle opacity (hover reveal) | `transition-opacity` |
| Per-folder chevron rotation | `transition-transform` |
| Drag overlay drop animation | 200ms, easing `"ease"` |

### State overrides

| State | Class additions |
|-------|------------------|
| Inactive (default) | `text-[#6e84a3]` |
| Hover | `bg-gray-100` |
| Active | `bg-[#d5e5fa] text-[#2c7be5]` (overrides default) |
| Drop target — valid | `ring-2 ring-primary bg-primary/10` |
| Drop target — invalid | `ring-2 ring-destructive bg-destructive/10` |
| Archived (when "View Archived" is on) | `opacity-50` (drag disabled) |
| Currently being dragged | inline `opacity: 0.4` (set by `@dnd-kit`) |

### Drag handle hover-reveal

The grip handle (`bi-grip-vertical`) is invisible by default and fades in on hover anywhere on the row, with full opacity on direct hover:

```
opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity
```

Plus `cursor-grab` + `touch-none` for pointer + touch handling.

### Drag overlay (floating preview while dragging)

| Property | Value |
|----------|-------|
| Background | `#ffffff` |
| Border | `1px solid #e3ebf6` |
| Border radius | `rounded-md` (6px) |
| Shadow | `shadow-lg` |
| Opacity | 0.9 |
| Padding | `px-3 py-1.5` |
| Font size | 13px |
| Text color | `#6e84a3` |

### Icon set (Bootstrap Icons)

| Use | Class |
|-----|-------|
| "All Media" root | `bi-file-earmark` |
| Folder | `bi-folder` |
| Gallery | `bi-images` |
| Per-folder expand (collapsed) | `bi-chevron-right` |
| Per-folder expand (expanded) | `bi-chevron-down` |
| Sidebar collapse toggle (when expanded) | `bi-chevron-double-left` |
| Sidebar expand toggle (when collapsed) | `bi-chevron-double-right` |
| Drag handle | `bi-grip-vertical` |
| Footer "View Archived" | `bi-archive` |
| Depth-violation dialog | `bi-info-circle` (destructive color) |

---

## 8. Sidebar collapse / expand

The sidebar itself can collapse to icon-only, separate from per-folder expand/collapse.

| State | Width | Notes |
|-------|-------|-------|
| Expanded | **220px** | Full tree visible |
| Collapsed | **50px** | Folder icons only + expand affordance |
| Transition | 300ms ease-in-out | (separate from the primary nav's 250ms) |

Toggle: chevron-double-left (expanded→collapsed) / chevron-double-right (collapsed→expanded) at the top-right edge of the sidebar (`FolderSidebar.tsx:249–269`).

### Tab-driven auto-expand

The sidebar's expanded state is **tied to the Library tab** in addition to the manual toggle. From `LibraryScreen.tsx:447–451`:

| User action | Sidebar behavior |
|---|---|
| Switches to the **Folders** tab | Sidebar **auto-expands** to 220px |
| Switches to any other Library tab (All Assets, Galleries, Favorites, Branding, Workflows) | Sidebar **auto-collapses** to 50px |
| Clicks the chevron at any point | Manual toggle wins for that tab session; switching tabs again re-applies the rule above |

The intent: Folders is the one tab where the tree IS the primary UX, so showing it expanded by default matches user expectation. Other tabs treat the tree as a secondary aid that shouldn't dominate the layout.

This auto-behavior runs **only on the Library screen** — no other screen has a folder tree to govern.

**Persistence interaction**: because the tab-driven auto-expand overrides user state on every tab switch, persisting the collapsed/expanded flag in `localStorage` is less valuable here than for the primary nav. If we add persistence later, it should be **scoped to the user's last-known state on each tab** (e.g. `libraryFolderSidebarExpanded.assets`, `libraryFolderSidebarExpanded.folders`), or skipped entirely in favor of the auto rule.

**Widths intentionally differ from the primary nav.** The folder sidebar is a sub-surface inside one screen; cramming it to the primary nav's 250/72 widths would crowd the asset area. 220/50 is a deliberate sub-surface scale.

---

## 9. Archive behavior

Two concepts in play that should not be confused:

| Concept | Where | What |
|---------|-------|------|
| Item is `archived: true` | Per-item flag on the FolderItem | Hides the item from default view |
| "Show archived" toggle | Sidebar footer | Global on/off — when on, archived items render at `opacity-50`; when off, they're filtered out |

**Per-folder show/hide of children** (e.g., "hide this folder's archived contents without changing the global toggle") is **not in scope** for v1. If we add it later, the toggle moves to a per-folder context menu, not a third UI control.

---

## 10. Responsive

| Viewport | Behavior |
|----------|----------|
| ≥ 768px  | Sidebar visible (expanded or collapsed per user toggle). |
| < 768px  | Folder sidebar **hidden entirely** (viewport rule, not container rule — the sidebar is a sibling of `.content-container`, so container queries can't reach it). See `DEV_HANDOFF_LAYOUT.md` §2. |

On mobile, folder navigation moves into the filter bar's FiltersSheet via a `Folders` filter chip (existing pattern; not a new mobile-only folder surface).

---

## 11. Quality flags / known gaps in the proto

These are intentional prototype shortcuts that should not silently ship:

- **All folder operations are state-only.** Create / move / archive / delete don't call any API yet — wire each up once backend endpoints are confirmed.
- **No keyboard tree navigation.** `KeyboardSensor` is wired for drag-and-drop accessibility, but there's no arrow-key navigation between items, no Enter-to-expand, no Cmd+/ shortcut. Decide if this is a v1 requirement.
- **No tree-internal search.** The Library filter bar's existing search filters *contents*, not the tree itself. If users will have hundreds of folders, a tree filter input is worth adding.
- **No persistence of the manual collapse override.** Today the tab-driven auto-rule (§8) is the only thing controlling collapse — manual chevron toggles only last until the next tab switch. If that's not the intended behavior, add per-tab persistence per the note in §8.
- **Drag-violation feedback is an `alert()`.** Replace with an inline toast / banner in prod.
- **No multi-select drag** (one item at a time).
- **No undo for destructive operations** (delete, archive). Add at least an undo toast.

---

## 12. Out of scope (v1)

- Per-folder "show/hide archived" (global toggle only).
- Tree-internal search input.
- Keyboard tree navigation.
- Multi-select / bulk move.
- Sharing folders with other users (permissions are folder-agnostic in v1).
- Folder-level access control / role gating.
- Folder cover image / color customization.

---

## 13. Cross-references

- `DEV_HANDOFF_LEFT_NAV.md` — primary left nav design + behavior spec.
- `DEV_HANDOFF_LAYOUT.md` — Library filter bar & responsive behavior (folder sidebar hide at 767 viewport documented in §2).
- `HANDOFF.md` (root) — session-level redesign notes.
