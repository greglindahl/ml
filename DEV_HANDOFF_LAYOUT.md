# Library Redesign — Dev Handoff: Layout & Responsive Behavior

**Scope:** All Assets · Gallery Details · Galleries
**Stack note:** prototype is React/Tailwind/shadcn; prod target is Angular + Bootstrap + Dashkit.
**Container queries:** the filter bar is its own container (`container-type: inline-size`). Use `@container` rules — *not* viewport — except where explicitly noted.

---

## 1. The shared layout (applies to all three surfaces)

```
┌─ Search row ──────────────────────────────────────────────┐
│ [Faceted search ......................]  [Sort ▾] [⚙] [☰] │
├─ Filter row ──────────────────────────────────────────────┤
│ [Filter ▾] [Filter ▾] [Filter ▾] [Filter ▾]   · [Pills…]  │
└────────────────────────────────────────────────────────────┘
```

- **Search row** = faceted typeahead (flex-grow) + utility cluster (Sort, Settings ⚙, Bulk ☰).
- **Filter row** = primary filter chips (dropdowns) on the left, binary toggle pills on the right.
- **Settings drawer** opens from the **right** (tabbed: Grid / Table / Filters).
- **FiltersSheet** opens from the **bottom** (matches prod's existing pattern — do not change to right).

---

## 2. Breakpoint table

All thresholds are **container-relative** unless prefixed `viewport:`.

| Threshold              | Type        | Behavior                                                                                          |
|------------------------|-------------|---------------------------------------------------------------------------------------------------|
| `≤ 699px` (content)    | container   | Search row **wraps** to two lines. Utility cluster (Sort/⚙/Bulk) drops below search and **left-aligns** (no `margin-left:auto`). |
| `≤ 1023px` (filterbar) | container   | Hide `.filter-label` and `.pill-label` — chips & pills become **icon-only**. Tooltips on hover show the label. |
| `≤ 767px` (filterbar)  | container   | Filter row collapses to a single **"Filters" button** that opens **FiltersSheet** (bottom sheet). |
| `≤ 767px` (viewport)   | **viewport**| Hide `.folder-tree-sidebar` (sidebar is a sibling of the filter container — container queries can't reach it). |
| `> 1023px`             | container   | Full labels visible on chips and pills.                                                            |

### Why mixed container + viewport

The filter bar is inside `.content-container`. The folder sidebar sits *next to* `.content-container`, not inside it — so a container query on the filter bar can't change the sidebar. Folder-sidebar hide is the **only** viewport rule.

### Why 767 for both sheet collapse and sidebar hide

Mixpanel viewport distribution:
- 75% MAUs at 1440–1920px
- <1000px = 7% (mostly <600px)

767 is the right "real mobile" line. Don't drift to 991 or 1199.

---

## 3. Per-surface filter layout

### 3a. All Assets (`FilterBar.tsx`)

**Search row:** `[Faceted Search] [Sort ▾] [⚙ Settings] [☰ Bulk]`

**Filter row (left → right):**

| Order | Chip / Pill        | Notes |
|-------|--------------------|-------|
| 1     | AI Tags ▾          | **Consolidated** — was AI Tags + Tags separately. |
| 2     | Tags ▾             | Kept separate from AI Tags in current proto; can merge per copy. |
| 3     | Date ▾             |       |
| 4     | Creator ▾          |       |
| 5     | Type ▾             |       |
| 6     | Ratio ▾            |       |
| 7     | Folders ▾          |       |
| 8     | Source ▾           | Renamed from "More"; contains Source + Approval status. NHL-concentrated usage. |
| —     | **Unsorted** pill  | `bi-inbox`. "Not in a gallery" (not "not in a folder"). |

**Removed:** Include Viewed (was a chip; deprecated). Favorites (kept on Gallery Details only — asymmetric on purpose).

### 3b. Gallery Details (`GalleryDetailsFilterBar.tsx`)

**Search row:** same as All Assets.

**Filter row (left → right):** AI Tags · Tags · Date · Creator · Type · Ratio · Folders · Source — then pills:

| Pill            | Icon                              |
|-----------------|-----------------------------------|
| Unviewed Only   | `bi-eye-slash`                    |
| Branding        | `bi-palette`                      |
| Favorites       | `bi-heart` / `bi-heart-fill` (active) |

Three pills, in this order. **Branding is intentional here** (asymmetric vs All Assets, which has no Branding pill) — it filters to branded assets only.

### 3c. Galleries (`GalleryFilterBar.tsx`)

**Search row:** same.

**Filter row (left → right):**

| Order | Chip / Pill         | Notes |
|-------|---------------------|-------|
| 1     | Gallery Options ▾   |       |
| 2     | Creator ▾           | Dropdown contains a **search input** (added per data). |
| 3     | Groups ▾            | Dropdown contains a **search input**.                  |
| 4     | Created Date ▾      |       |
| 5     | Assets Last Added ▾ |       |
| —     | **Archived** pill   |       |

---

## 4. Search & filter affordance rules

### Faceted search (typeahead)

- Flex-grows to fill the search row.
- Has its own **internal min-width** — that's what triggers the row wrap at ~699px content width, not just the search itself.
- When the row wraps, the utility cluster (Sort / ⚙ / ☰) drops to a second line **left-aligned**. Earlier `margin-left:auto` caused right-aligned utilities at narrow widths and looked asymmetric.

### Filter chips (dropdowns)

- Trigger format: `[icon] [label] [▾]` at >1023px container width, `[icon]` only at ≤1023px.
- Label is wrapped in `<span class="filter-label">` so the CSS rule can hide it. **Custom render blocks must also use this class** — AI Tags and "More" both regressed because they bypassed it.
- Dropdowns with long option lists (Creator, Groups, Tags) must include an internal search input. Label/option text = **13px** (the proto was rendering ~9.75px and was illegible).
- Count badges in dropdown options: bump font size to match labels.

### Toggle pills (binary on/off)

- Icon-only by spec. Label lives in the tooltip (`delayDuration={700}`).
- Active state: `bg-primary/10 border border-primary text-primary`.
- Inactive: `bg-white border border-gray-300 text-[#6e84a3] hover:bg-accent/50`.
- Tooltips wrapped in `TooltipPrimitive.Portal` to escape parent `overflow:hidden`. In prod use `NgbTooltip` (Radix is React-only).

### Settings drawer (right-side)

- Tabs: **Grid View** / **Table View** / **Filters**.
- Filters tab = checkbox list of available filters; user pins which are visible. Includes **Restore Default**.
- "Table preferences" heading is owned by `SettingsDrawer.tsx` only — consuming panels must not re-render it.
- Display Label preference: `"title" | "creator" | "none"`. Default flips Creator → Title (60% prefer Title per data). `AssetCard` must respect the prop, not hardcode `creatorName`.

### FiltersSheet (bottom sheet, ≤767 container)

- Opens from `side="bottom"` to match prod.
- Header icon: `bi-filter` (was `bi-sliders` — aligned to the trigger button).
- Contains the same chips/pills, vertically stacked, full-width controls.

---

## 5. Icon set (use these exact classes)

| Use                          | Class                  |
|------------------------------|------------------------|
| Filter affordance (anywhere) | `bi-filter`            |
| Settings trigger             | `bi-gear`              |
| Unsorted pill                | `bi-inbox`             |
| Source filter                | `bi-cloud-arrow-down`  |
| Unviewed Only pill           | `bi-eye-slash`         |
| Favorites pill               | `bi-heart`             |
| Archived pill (Galleries)    | (keep current archive icon — confirm) |

**Do not use** `bi-funnel` or `bi-sliders` for the filter affordance.

**Centering — required for every Bootstrap icon:**

```html
<i class="bi bi-filter inline-flex items-center justify-center leading-none w-4 h-4"></i>
```

Without `inline-flex items-center justify-center leading-none`, glyph baselines drift inside fixed-size buttons.

---

## 6. CSS rules (drop-in reference)

```css
/* filter bar is the container */
.filter-bar { container-type: inline-size; container-name: filterbar; }
.content-container { container-type: inline-size; container-name: content; }

/* search row wrap + left-align utility cluster */
@container content (max-width: 699px) {
  .search-row { flex-wrap: wrap; }
  .search-row .utility-cluster { margin-left: 0; }
}

/* icon-only chips & pills */
@container filterbar (max-width: 1023px) {
  .filter-label, .pill-label { display: none; }
}

/* collapse filter row into FiltersSheet trigger */
@container filterbar (max-width: 767px) {
  .filter-row-chips { display: none; }
  .filter-row-sheet-trigger { display: inline-flex; }
}

/* sidebar hide is viewport-based (sibling, not descendant) */
@media (max-width: 767px) {
  .folder-tree-sidebar { display: none; }
}
```

**Production note:** Bootstrap 5.3+ supports `@container`. For older Bootstrap, wrap in `@supports (container-type: inline-size)` and provide a viewport fallback at matching Bootstrap breakpoints (`sm 576 / md 768 / lg 992 / xl 1200 / xxl 1400`).
