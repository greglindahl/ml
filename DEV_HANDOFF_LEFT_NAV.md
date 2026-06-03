# Left Nav Redesign — Dev Handoff

**Scope:** the primary left-hand sidebar (`AppSidebarComponent` / `AppNavComponent` in prod).
**Stack note:** prototype is React + Tailwind + shadcn; prod target is Angular + Bootstrap + Dashkit.
**Out of scope here:** the org switcher (no change), the secondary folder-tree nav (separate handoff).

---

## 1. Headline change: flat hierarchy, no children

The biggest shift is structural. Today every top-level nav item in prod expands to a tree of child links (e.g. Dashboard → Activity / Overview / Users). In the new design **the tree disappears entirely** — each top-level item is a single link, and what used to be its children become **tabs inside the destination screen**.

Concretely:

- Production prod's `AppNavItemComponent` recurses children; the new design does not. Items render flat.
- The expand/collapse-row affordance on each nav item (`bi-chevron-down` on items with children) goes away.
- The active state is computed on the top-level item alone — no need for prod's `activeMatchUrls` / `excludeActiveUrls` / `rootUrlKey` for cross-route detection.
- Per-feature tab strips inside each screen own the "which child page" UX (already implemented in the proto — e.g. Network has Groups / Invite Codes / Manage Users as a `<Tabs>` strip).

This is a deliberate UX shift. Call it out first in any spec review.

---

## 2. Item-by-item disposition (8 → 7)

| # in prod | Prod item | Disposition in the new design |
|-----------|-----------|--------------------------------|
| 1         | Home      | **Kept** — new top-level item, replaces Dashboard's slot. |
| 2         | Dashboard (+ Activity / Overview / Users) | **Removed as a top-level item.** All three child screens move into **Insights**. |
| 3         | Network (+ Groups / Invite Codes / Manage Users) | **Kept.** Children become in-screen tabs. |
| 4         | Library (+ All Assets / Galleries / Favorites / Branding / Workflows) | **Kept.** Children become in-screen tabs (covered in `DEV_HANDOFF_LAYOUT.md`). |
| 5         | Connect (+ Imports / Exports / Routing Rules / Integrations) | **Kept.** Children become in-screen tabs. |
| 6         | Engage (+ Campaigns / Themes / Settings) | **Kept.** Children become in-screen tabs. |
| 7         | Shares (+ Social Shares / Share Requests / Gallery Downloads) | **Mostly removed.** Share Requests **moves into** the new Requests item. **Social Shares + Gallery Downloads are deleted from the product entirely.** |
| 8         | Content Requests (+ List / Drafts / Archive) | **Renamed → "Requests"**, and **absorbs Share Requests** from Shares. The child pages remain available as in-screen tabs. |
| —         | — | **NEW: Insights** (was Dashboard's three pages, gets a top-level slot of its own). |

Final top-level order (7 items):

```
Home · Library · Network · Connect · Engage · Requests · Insights
```

(`bi-house`, `bi-image`, `bi-people`, `bi-plug`, `bi-cloud-arrow-up`, `bi-camera`, `bi-bar-chart` respectively.)

---

## 3. Permission & feature-flag gating

**Unchanged.** Prod's `removeNavItemsBasedOnRequirements()` (app-nav.component.ts:91–127) still owns the gate. Items are still hidden when:
- `requirePermission` fails
- `requireFeatureFlag` fails
- `requireLaunchDarklyFlag` fails

The new design is design-only — gating logic ports over with no semantic changes. The `removeNavItemsBasedOnRequirements()` config trees just become shorter (no children to traverse).

---

## 4. Active vs inactive item styling

Active state is signalled by **three things in combination**:

| Element | Inactive | Active |
|---------|----------|--------|
| Icon variant | base (e.g. `bi-house`) | **`-fill` variant** (e.g. `bi-house-fill`) |
| Background | transparent | `bg-sidebar-accent` |
| Left edge | `border-l-2 border-transparent` | `border-l-2 border-nav-active-border` |
| Text color (expanded) | `text-nav-text` | `text-nav-text-active` |

The icon swap is the primary cue. All seven nav icons have a `-fill` variant in Bootstrap Icons — no fallback table needed:

| Item     | Inactive icon         | Active icon                |
|----------|-----------------------|----------------------------|
| Home     | `bi-house`            | `bi-house-fill`            |
| Library  | `bi-image`            | `bi-image-fill`            |
| Network  | `bi-people`           | `bi-people-fill`           |
| Connect  | `bi-plug`             | `bi-plug-fill`             |
| Engage   | `bi-cloud-arrow-up`   | `bi-cloud-arrow-up-fill`   |
| Requests | `bi-camera`           | `bi-camera-fill`           |
| Insights | `bi-bar-chart`        | `bi-bar-chart-fill`        |

Implemented as a single conditional: `${isActive ? \`${icon}-fill\` : icon}` (see `NavItem.tsx:34`).

---

## 5. Layout & widths

| State      | Width | Notes |
|------------|-------|-------|
| Expanded   | **250px** | Matches prod (`--gf-app-layout-sidebar-width`). |
| Collapsed  | **72px**  | **New spec.** Prod uses 25px (icon-hairline); the new design keeps icons at full visible weight. |
| Transition | 250ms   | Same easing/duration as prod (`cubic-bezier(0.19, 1, 0.22, 1)`). |

`72px` is wide enough that the seven icons remain comfortably tappable and centered, without label text. This is the second-biggest visual change after the flat hierarchy.

---

## 6. Collapse / hover behavior

The interaction model changes. Three patterns from prod are replaced by one new pattern.

### Removed from prod
- ❌ Always-visible toggle in the sidebar header (prod's checkbox at the top).
- ❌ Auto-expand-on-hover ("peek" behavior; prod's `.collapsed-hovered` with 50px safe zone).
- ❌ 50px right-edge safe zone.

### New pattern

| Trigger | What happens |
|---------|--------------|
| Mouse anywhere over the sidebar | A small chevron button fades in at the right edge of the sidebar. The sidebar itself **does not move**. Icon: `bi-chevron-double-right` when collapsed, `bi-chevron-double-left` when expanded. Tooltip on hover: "Expand" / "Collapse". |
| Mouse leaves the sidebar | The chevron fades back out. The sidebar stays in whatever state the user last toggled it to. |
| User clicks the chevron | Sidebar toggles between 72px ↔ 250px. Labels appear next to the icons when expanded. |
| Mouse over a single nav icon (collapsed state) | An **instant** tooltip (`delayDuration={0}`) shows the page name on the right. Tooltip dismisses on mouse-leave. |

**Why instant tooltips on collapsed icons:** the collapsed nav is icon-only, so the label needs to be discoverable without delay. (Filter chips and most other UI in the app use a 700ms delay; the nav is intentionally faster.)

**Why no auto-peek:** the new collapsed state shows icons at full size with instant tooltips, so a hover-peek is redundant. The chevron click is the only way to commit the sidebar to expanded state, and that state persists (see §7).

---

## 7. Persistence

The user's expanded/collapsed preference is **persisted across sessions**.

| Field | Value |
|-------|-------|
| Storage | `localStorage` |
| Key     | `leftNavExpanded` (or equivalent — name TBD by impl) |
| Value   | `"true"` \| `"false"` |
| Default (no entry) | **collapsed** |
| Hydration | on app load, read the key and set initial state before first render |

Prod uses `localStorage['appSidebarCollapsed']` — different key, same idea. Cross-device sync is **not** in scope; a per-device preference is fine.

---

## 8. Footer cluster

The bottom of the sidebar carries a fixed cluster of utility controls. This is a structural change from prod (which only has Help + Greenfly logo down there).

| Slot | Icon / control | Behavior |
|------|----------------|----------|
| Avatar (left-most in expanded; bottom-most in collapsed) | `<Avatar>` w/ user image or `bi-person` fallback | Click opens a dropdown menu: **View Profile**, **Manage Notifications**, **Settings**, *(separator)*, **Log Out**. Menu opens upward (`side="top"`). |
| Help     | `bi-question-circle` | Routes to Zendesk for admins or Greenfly FAQ for advocates (same as prod). |
| Notifications | `bi-envelope` w/ red unread-count badge | Opens the user's inbox. Badge counts come from the same notifications source as prod. |
| Announcements | `bi-megaphone` | Opens the announcements panel. |
| Greenfly logo | SVG horizontal (expanded) / fly icon (collapsed) | Links to greenfly.com. Sits above the utility row. |

Expanded layout: avatar left, three utility buttons right, justify-between.
Collapsed layout: same items stacked vertically and centered.

The Greenfly logo always renders just above the utility row — it's positioned outside the footer cluster proper but visually reads as part of the bottom block.

---

## 9. Notification badges

Prod scatters red unread-count badges across nav items themselves (Library, Messages, etc.) via `app-nav-item.component.html:74–78`.

**The new design removes all per-item nav badges.** Notifications consolidate into the single envelope badge in the footer cluster (see §8). Users still see counts; they just see them in one place.

---

## 10. Mobile / responsive

Behavior matches prod and does not change.

| Viewport | Behavior |
|----------|----------|
| ≥ 768px  | Sidebar visible by default. Collapse/expand per §6. |
| < 768px  | Sidebar is an **off-canvas drawer** — hidden by default, slid offscreen via `translate3d(-100%, 0, 0)`. A hamburger button (`bi-list` / `bi-x-lg`) in the mobile top bar toggles it open/closed. The drawer closes automatically when the user taps a nav link. Body picks up an `is-mobile-nav-open`-style class while open. |

The 767/768px line is shared with the rest of the Library filter-bar work (see `DEV_HANDOFF_LAYOUT.md` §2). Don't drift to 991 or 1199.

---

## 11. Org switcher

**No change.** The org switcher at the top of the sidebar uses prod's existing `<auth-context-select>` component verbatim — multi-context users get a dropdown, single-context users get the static avatar + name. Skeleton-row transition during org switch (8 placeholder rows for 500ms) stays. The component is out of scope for this redesign; prototype wiring is illustrative only.

---

## 12. Migration notes (for the prod port)

What needs to change in `portal/web/greenflyPortal/`:

- `app-nav.component.ts:43–54` (`getNavConfig()`) — strip Dashboard, Shares, and the renamed Content Requests config; add Insights; rename Content Requests → Requests; move Share Requests sub-route under Requests.
- `app-nav-item.component.ts:67–100` — drop recursion + `activeMatchUrls` / `excludeActiveUrls` / `rootUrlKey` handling, since items no longer have children.
- `app-nav-item.component.html:74–78` — remove the per-item notification badge markup.
- `app-sidebar.component.html:2–14` (top toggle checkbox) + `app-sidebar.component.scss:37–56` — remove the always-visible toggle.
- `app-sidebar.component.scss:74–99` (`.collapsed-hovered`) — remove the auto-peek-on-hover styles.
- New: add the floating chevron at the right edge of the sidebar (fades in on `:hover` of the sidebar root), plus the new collapsed footer cluster (avatar dropdown + help + notifications + announcements).
- CSS variable `--gf-app-layout-sidebar-width-collapsed` — bump from `25px` to `72px`.
- Dashboard route module — fold into Insights route module; redirect the old `/dashboard` paths.
- Shares route module — delete Social Shares + Gallery Downloads; move Share Requests into the Requests module.
- localStorage key — keep `appSidebarCollapsed` if you want to preserve user preferences across the migration, but invert the semantic (currently stores "collapsed"; new design tends to talk in "expanded" terms — pick one and stick with it).

---

## 13. Cross-references

- `DEV_HANDOFF_LAYOUT.md` — Library filter bar & responsive behavior.
- *(forthcoming)* `DEV_HANDOFF_FOLDER_NAV.md` — secondary folder-tree nav.
- `HANDOFF.md` (root) — session-level redesign notes, Mixpanel context, NHL skew data.
