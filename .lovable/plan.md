

## Remove Top Divider Above Utility Icons

In `src/components/LeftNav.tsx`, remove the top `<div className="mx-4 border-t border-nav-border" />` divider that sits between the main navigation and the utility icons section (avatar, envelope, megaphone). This appears twice — once in the mobile nav (~line 113) and once in the desktop nav (~line 199). Keep the bottom divider between utility icons and the Help nav item.

### Changes

**`src/components/LeftNav.tsx`**
- Remove line ~113: `<div className="mx-4 border-t border-nav-border" />` (mobile, above utility icons)
- Remove line ~199: `<div className="mx-4 border-t border-nav-border" />` (desktop, above utility icons)

