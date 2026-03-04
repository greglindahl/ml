

## Ensure All Galleries Have Mock Assets

The `folderIds` array in `src/lib/mockLibraryData.ts` controls which galleries/folders get assets assigned. Currently it only includes 18 IDs (mostly folder-level), missing all the individual gallery IDs added in the recent data population. This means galleries like "Combine Results", "Shooting Drills", "Halftime Shows", etc. show zero assets.

### Changes

**`src/lib/mockLibraryData.ts`**

1. **Expand the `folderIds` array** (lines 614-618) to include every gallery ID from the folder tree. Add all missing IDs:

   - Season 25-26: `shooting-drills`, `scrimmage-footage`, `film-sessions`, `cardio-sets`, `agility-drills`, `halftime-shows`, `autograph-signings`, `kids-day`
   - Season 24-25: `tryout-highlights`, `rookie-introductions`, `team-bonding`, `combine-results`, `endurance-tests`, `vip-courtside`, `school-visits`, `charity-gala`
   - Season 23-24: `open-gym-sessions`, `skills-camp`, `recovery-rehab`, `strength-training`, `mobility-work`, `hospital-visits`, `food-drive`, `youth-basketball-clinic`

2. **Increase the generated asset count** from 80 to ~160 so assets spread across all galleries still yield a reasonable number per gallery (with ~42 gallery IDs, 160 assets averages ~4 per gallery).

This ensures every gallery in the tree has assets when navigated into, making all views look populated and realistic.

