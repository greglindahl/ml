

## Put Help and Greenfly Logo on the Same Row

Looking at the design reference, the Help nav item and the Greenfly logo should sit side-by-side on the same row at the bottom of the nav, rather than stacked vertically.

### Changes in `src/components/LeftNav.tsx`

**Desktop (expanded):** Replace the separate "Bottom navigation" div and "Greenfly logo" div with a single flex row containing Help on the left and the logo on the right.

**Desktop (collapsed):** Stack them vertically (icon above logo mark) as they won't fit side-by-side.

**Mobile:** Same horizontal layout as expanded desktop.

Specifically:
- Merge the bottom nav section (lines 219-230) and the Greenfly logo section (lines 232-239) into one `flex items-center justify-between` container when expanded.
- Same treatment for mobile (lines 129-145).

