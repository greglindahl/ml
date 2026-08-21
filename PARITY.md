# View Parity Matrix & Audit Findings

**Purpose:** every Library capability exists in multiple hand-copied view instances. This doc is the checklist that keeps them honest. **Rule: any PR that changes a row updates every column of that row — or states in the PR why an instance is exempt.**

Audited 2026-08-20; P1 fixes applied same day on the relevance-updates branch. Remaining ❌/⚠️ cells are the P2 backlog.
Instances: **A1** All Media › All Assets · **A2** Folder › Assets · **A3** Gallery details › Assets · **A4** Favorites › Assets · **G1** All Media › Galleries · **G2** Folder › Galleries · **G3** Favorites › Galleries · **F1** All Media › Folders · **F2** Folder › Folders

## Matrix — Assets instances

| Capability | A1 | A2 | A3 | A4 |
|---|---|---|---|---|
| Search wired (onSearch) | ✅ | ✅ | ✅ | ✅ |
| Search facet chips + clearAll integration | ✅ | ❌ | ❌ | ❌ |
| Facet-aware search handler | ✅ | ✅ | ✅ | ❌ (setter only) |
| Relevance sort (12776) full model | ✅ | ✅ | ⚠️ effect-based variant | ✅ (fixed 8/20) |
| Sort option list | 10 fields | 10 fields | ❌ 4 fields | ✅ 10 fields (fixed 8/20) |
| Sort direction toggle + indicator | ✅ | ✅ | ✅ | ✅ (fixed 8/20) |
| Sort dropdown hidden in table mode | ✅ | ✅ | ✅ | ✅ (fixed 8/20) |
| Unsorted pill | ✅ filters (fixed 8/20) | ✅ filters (fixed 8/20) | n/a (by design) | hidden (by design) |
| Unviewed pill | ✅ filters (fixed 8/20) | ✅ filters (fixed 8/20) | ✅ wired+filters (fixed 8/20) | ✅ filters (fixed 8/20) |
| Branding pill | ✅ applied | ✅ applied (fixed 8/20) | ✅ wired+applied (fixed 8/20) | ✅ applied |
| handleFilterChange coverage | all ids | ❌ 6 ids (drops tags/AI/source) | ❌ 6 ids | stores all, ❌ applies subset |
| FiltersSheet (narrow width) | ✅ | ✅ | ✅ (own sections) | ✅ shares A1's (fixed 8/20) |
| Multi-select mode (12949) | ✅ | ✅ | ⚠️ no exit-on-nav | ✅ mode-flag card-click (fixed 8/20) |
| Selection clears on per-page change | ✅ | ✅ | ✅ | ✅ (fixed 8/20) |
| Bulk bar overflow Move/Remove from Gallery | n/a | n/a | ✅ | n/a |
| Table isLoading skeleton | ✅ | ✅ | ✅ | ✅ (fixed 8/20) |
| Settings gear (per-page/columns) | ✅ | ✅ | ✅ (own drawer, own storage key) | ✅ shares A1's drawer (fixed 8/20) |
| Empty state (copy/structure parity) | ✅ | ✅ | ✅ | ⚠️ diverges (placement, no min-h) |

## Matrix — Galleries instances

| Capability | G1 | G2 | G3 |
|---|---|---|---|
| Search wired | ✅ (fixed 8/20) | ✅ (fixed 8/20) | ✅ |
| Sort applied to grid | ✅ | ✅ | ✅ |
| Sort applied to table | via header sort (shared comparator) | via header sort | via header sort |
| Filters applied in table mode | ✅ (fixed 8/20, shared visibleGalleries) | ✅ | ✅ |
| Card heart (favorite) | ✅ live | ✅ live (fixed 8/20) | ✅ live |
| Card body opens gallery | ✅ | ✅ (fixed 8/20) | ✅ |
| Bulk heart action | ✅ bulk favorite (fixed 8/20) | ✅ bulk favorite (fixed 8/20) | ✅ live |
| Bulk archive action | ✅ + unarchive branch | ✅ + unarchive branch (fixed 8/20) | ✅ + unarchive branch (fixed 8/20) |
| Bulk kebab (Move/Delete) | ✅ | ✅ (diff icon) | ✅ (fixed 8/20) |
| Action tooltips on bulk bar | ✅ | ✅ (fixed 8/20) | ✅ |
| Select-all denominator | ❌ unfiltered list | ❌ unfiltered list | ✅ visible list |
| Selection clears on per-page change | ✅ | ✅ | ✅ (fixed 8/20) |
| FiltersSheet | ✅ | ✅ | ✅ shares G1's (fixed 8/20) |
| Settings gear | ✅ | ✅ | ✅ shares G1's drawer (fixed 8/20) |
| Empty state | ✅ search/filter-aware (fixed 8/20) | ✅ rich + CTAs | ⚠️ single variant, no CTA |

## Matrix — Folders instances

| Capability | F1 | F2 |
|---|---|---|
| Search wired | ✅ | ✅ |
| Table per-page/columns prefs passed | ✅ | ✅ shared "folders" keys (fixed 8/20) |
| Settings drawer reachable | ✅ gear added (fixed 8/20) | ❌ none (opens via Library tab) |
| Archived subfolder visibility | ✅ via sidebar switch | ✅ same switch via prop (fixed 8/20) |
| Unarchive toast | ✅ | ✅ (fixed 8/20) |
| Empty state | generic, search-aware | rich + CTAs, ❌ no-match copy ignores query |
| In-tab New Folder CTA | ❌ | ✅ (empty state only) |
| Bulk select in table | ➖ removed by design (PR #16) | ➖ same |
| Multi-select mode | ➖ by design | ➖ by design |

## Cross-cutting

- `DATE_RANGE_OPTIONS` duplicated in 3 files (FilterBar, GalleryDetailsFilterBar, GalleryFilterBar) — consistent today, drift-prone. `DATE_FILTER_IDS` exported once, re-declared once.
- Chip `removeValue` keyed by `sourceId` in A1/A2 but `filterId` in A3/A4.
- Chip icons only in A1; label-only elsewhere.
- A3 persists per-page/columns under its own `"gallery-assets"` key; A1/A4 share, A2 shares the assets key.
- Relevance sort implementation drifts (A3 effect-based, A4 reduced) — candidates for a shared `useAssetSort()` hook.
- StickyHeaderBlock offsets: A4/G3 use `top-[65px] pt-0` (nested tabs); everyone else default.

## Known by-design asymmetries (do not "fix")

- Unsorted pill: top-level All Media only (galleries) — folder/gallery scopes exclude it.
- Favorites pill hidden inside the Favorites tab.
- Folder tables have no bulk select (PR #16 decision).
- Deep-link `&bulk=1` select-all is gallery-details-only.
- A2 hides the Folders filter dropdown (`hideFilters`) because the view is already folder-scoped.

## Process

1. Touch a row → sweep every column in the same PR (or write the exemption in the PR body).
2. Run `node scripts/check-parity.mjs` before commit (mechanical invariants: wired onSearch, sort option sourcing, sticky table wrappers, etc.).
3. Before PM demos: scan the ❌/⚠️ cells above — anything you demo that crosses one is a known gap, not a surprise.
