

## Add Favorites and Branded Toggle Buttons to Assets Tab

Add two icon toggle buttons after the "More" filter dropdown on the Assets tab filter bar: a heart toggle for favorites and a palette toggle for branded assets.

### What They Look Like

- Two icon-only buttons placed inline after the "More" dropdown, before any "Clear all" button
- **Heart toggle**: A heart icon that toggles on/off (filled/outlined state)
- **Palette toggle**: A palette/gear icon that toggles on/off
- When toggled on, the button gets a highlighted/active visual state (matching the filter bar aesthetic)
- When toggled off, the button returns to its default outline state

### What They Do

- Visual/interaction only -- toggling does not actually filter the data
- Each button independently toggles between active and inactive states
- They do not show pills or dropdown menus -- just a simple on/off toggle

### Technical Details

**File: `src/components/FilterBar.tsx`**

1. Add `Heart` and `Palette` imports from `lucide-react`
2. Add two boolean state variables: `isFavoritesActive` and `isBrandedActive`
3. After the `MoreFiltersDropdown` component (line 621), render two `Button` components:
   - Heart button: toggles `isFavoritesActive`, uses `Heart` icon, filled style when active
   - Palette button: toggles `isBrandedActive`, uses `Palette` icon, highlighted style when active
4. Active state styling: use a distinct background/border (e.g., `bg-primary/10 border-primary text-primary`) to match the filter bar's visual language
5. Both buttons use `variant="outline"` and `size="icon"` with `h-8 w-8` sizing to match the filter button heights

No other files need to change.
