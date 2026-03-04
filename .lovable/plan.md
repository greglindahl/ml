

## Fix: Move Folder Depth Validation Bug

### Problem

The depth validation in `MoveFolderDialog` uses the check `targetDepth + movingDepth - 1 > 4`, but the rule is **folders can only exist at levels 1-3** (level 4 is galleries-only). This means the correct limit for folder depth is 3, not 4.

Example: Moving "Season 23-24" (which has folder children like "In-Game") into "Season 24-25 > In-Game" produces:
- All Media > Season 24-25 (L1) > In-Game (L2) > Season 23-24 (L3) > In-Game (L4) — folder at level 4, violates the rule.

The current math evaluates to `3 + 2 - 1 = 4`, and `4 > 4` is false, so the move is incorrectly allowed.

### Fix

**`src/components/MoveFolderDialog.tsx`** — One-line change:

Change line 102 from:
```typescript
const exceedsDepthLimit = targetDepth + movingDepth - 1 > 4;
```
to:
```typescript
const exceedsDepthLimit = targetDepth + movingDepth - 1 > 3;
```

This enforces that the deepest folder in the moved subtree cannot land deeper than level 3, reserving level 4 for galleries only.

### No other files change

