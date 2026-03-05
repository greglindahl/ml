

## Move Utility Icons (Announcements, Messages, Profile) into LeftNav

### What Changes

Remove the fixed top-right utility icons (announcements, messages, profile avatar) from `Index.tsx` and `LibraryV1.tsx`, and place them inside the `LeftNav` bottom section. Also add the Greenfly logo to the very bottom of the nav. This also eliminates the `pr-40` overlap workaround since the fixed icons no longer exist.

### Layout from Screenshots

**Collapsed nav** (vertical stack, centered):
```text
│  [main nav items]   │
│─────────────────────│
│     📢 megaphone    │
│     ✉️ envelope 99+ │
│     👤 avatar       │
│─────────────────────│
│     ❓ help         │
│     🐝 gf-mark     │
```

**Expanded nav** (icons in a row, logo horizontal):
```text
│  [main nav items]          │
│────────────────────────────│
│  👤  ✉️ 99+  📢           │  ← row of icons, right-aligned or centered
│────────────────────────────│
│  ❓ Help                   │
│  [greenfly horizontal logo]│
```

### Changes

**1. Copy SVG assets into project**
- Copy `gf-logo-white-horizontal.svg` → `src/assets/gf-logo-white-horizontal.svg`
- Copy `gf-logo-white-mark.svg` → `src/assets/gf-logo-white-mark.svg`

**2. `src/components/LeftNav.tsx`**
- Add a new section between main nav and the Help/bottom section containing the three utility icons (megaphone, envelope with badge, profile avatar)
- **Collapsed**: Stack vertically, centered, with nav-text color styling matching the dark sidebar theme
- **Expanded**: Display as a horizontal row
- Add Greenfly logo at the very bottom: mark (collapsed) or horizontal logo (expanded)
- Add dividers to separate the sections as shown in screenshots

**3. `src/pages/Index.tsx`**
- Remove the entire fixed top-right icons `div` (lines 53-74)

**4. `src/pages/LibraryV1.tsx`**
- Remove the entire fixed top-right icons `div` (lines 46-61)

**5. `src/components/LibraryScreen.tsx`, `src/components/FolderDetailsView.tsx`, `src/components/GalleryDetailsView.tsx`**
- Remove `pr-40` from header action rows since the fixed icons no longer exist

### Files Modified
- `src/assets/gf-logo-white-horizontal.svg` (new)
- `src/assets/gf-logo-white-mark.svg` (new)
- `src/components/LeftNav.tsx`
- `src/pages/Index.tsx`
- `src/pages/LibraryV1.tsx`
- `src/components/LibraryScreen.tsx`
- `src/components/FolderDetailsView.tsx`
- `src/components/GalleryDetailsView.tsx`

