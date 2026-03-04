

## Update Move Galleries Dialog to Table Layout (Hybrid Mockup)

### What changes

**`src/components/MoveGalleriesDialog.tsx`**

Replace the current row-based layout (thumbnail + stacked name/path + dropdown) with a three-column table layout matching the uploaded mockup:

| Gallery | Current Location | Location |
|---------|-----------------|----------|
| Gallery Name | Folder > Folder | Select Location dropdown |

Key changes:
- Remove the gallery thumbnail icon
- Use a `Table` with three columns: **Gallery**, **Current Location**, **Location**
- Each row shows gallery name, its current breadcrumb path, and a `Select` dropdown for the target location
- Remove the "+ Apply to All" button (not in the mockup)
- Update description text to match mockup: split into two lines — "You're about to move [X] galleries to a new location." then "This changes where they appear in the folder hierarchy." then "Sharing, assets, and access are not affected"
- Update info banner text to match mockup: "This move will affect 10,000 media items and may take some time to complete. The move will continue in the background. **Content will not be searchable until the move is finished.**"
- Update select placeholder from "Select folder" to "Select Location"

### No other files change

