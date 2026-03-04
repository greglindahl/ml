

## Populate All Folders with Mock Gallery and Sub-folder Data

Currently, several folders across all three seasons (Training, Fan Engagement, Pre-Season Camp, Meet & Greets, Summer Workouts, Community Outreach) claim to have galleries in their `count` but have no actual `children` defined. This means navigating into them shows empty content.

### Changes

**`src/lib/mockFolderData.ts`**

Add children (galleries and sub-folders where appropriate) to every folder that currently has none:

**Season 25-26:**
- **Training** (id: `training`): Add 3 galleries — "Shooting Drills", "Scrimmage Footage", "Film Sessions" — and 1 sub-folder "Conditioning" with 2 galleries inside
- **Fan Engagement** (id: `fan-engagement`): Add 3 galleries — "Halftime Shows", "Autograph Signings", "Kids Day"

**Season 24-25:**
- **Pre-Season Camp** (id: `training-2024`): Add 3 galleries — "Tryout Highlights", "Rookie Introductions", "Team Bonding" — and 1 sub-folder "Fitness Testing" with 2 galleries
- **Meet & Greets** (id: `fan-engagement-2024`): Add 3 galleries — "VIP Courtside", "School Visits", "Charity Gala"

**Season 23-24:**
- **Summer Workouts** (id: `training-2023`): Add 3 galleries — "Open Gym Sessions", "Skills Camp", "Recovery & Rehab" — and 1 sub-folder "Weight Room" with 2 galleries
- **Community Outreach** (id: `fan-engagement-2023`): Add 3 galleries — "Hospital Visits", "Food Drive", "Youth Basketball Clinic"

Also add all these new galleries to the `mockGalleries` array so they appear in gallery pickers and search results.

Update the `count` values on each folder to accurately reflect its actual children count.

This gives every navigable folder real content at multiple nesting levels, making the app feel realistic for testing folder navigation, gallery management, and bulk actions throughout the hierarchy.

