

## Keep Search Text as Plain Text on Enter (No Chips)

### What Changes

1. **Add Enter key handling** to the search input so pressing Enter closes the dropdown (feels like "submitting") while keeping the typed text visible in the input field -- no conversion to a pill/chip.
2. The search already fires live on every keystroke, so no additional search trigger is needed on Enter.

### Technical Details

**File: `src/components/FacetedSearchWithDropdown.tsx`**

Add an `onKeyDown` handler to the `Input` component (line 139-146):

```tsx
<Input
  ref={inputRef}
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onFocus={handleInputFocus}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsOpen(false);
      setActiveFieldSearch(null);
    }
  }}
  placeholder="Search by keyword, tag, player, team, season etc."
  className="pl-10 pr-10 w-full bg-background"
/>
```

This ensures:
- Typing "LeBron" and pressing Enter keeps "LeBron" as plain text in the input
- The dropdown closes on Enter so it feels like a search submission
- No chip/pill is created
- The live search continues to work as before

One file, one small change.

