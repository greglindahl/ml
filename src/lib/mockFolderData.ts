import starterGalleryThumbnail from "@/assets/starter-gallery/1.svg";

export type ItemType = "folder" | "gallery";

export interface FolderItem {
  id: string;
  name: string;
  type: ItemType;
  count?: number;
  countType?: "folders" | "galleries" | "assets";
  children?: FolderItem[];
  archived?: boolean;
  /** Demo hook: the simulated move "server" rejects moving this folder even when
   *  the client-side count is under MOVE_MEDIA_ITEM_LIMIT (mimics a stale count). */
  simulateMoveRejection?: boolean;
  /** Overrides the default placeholder thumbnail on the gallery details header. */
  thumbnailUrl?: string;
}

// Total media items in a folder subtree (sums gallery counts recursively)
export function countTotalAssets(folder: FolderItem): number {
  let total = 0;
  if (folder.type === "gallery" && folder.count) total += folder.count;
  if (folder.children) {
    for (const child of folder.children) {
      total += countTotalAssets(child);
    }
  }
  return total;
}

// Helper to get all descendant folder/gallery IDs (including self)
export function getAllDescendantIds(folder: FolderItem): string[] {
  const ids = [folder.id];
  if (folder.children) {
    folder.children.forEach(child => {
      ids.push(...getAllDescendantIds(child));
    });
  }
  return ids;
}

// Helper to find a folder by ID in the tree
export function findFolderById(folders: FolderItem[], id: string): FolderItem | null {
  for (const folder of folders) {
    if (folder.id === id) return folder;
    if (folder.children) {
      const found = findFolderById(folder.children, id);
      if (found) return found;
    }
  }
  return null;
}

export interface Gallery {
  id: string;
  name: string;
  assetCount: number;
  timeAgo: string;
  thumbnailUrl?: string;
  isPublic?: boolean;
}

export interface FolderCard {
  id: string;
  name: string;
  galleryCount: number;
  timeAgo: string;
}

export const folders: FolderItem[] = [
  { id: "all", name: "All Media", type: "folder" },
  {
    id: "season-2025",
    name: "Season 25-26",
    type: "folder",
    count: 3,
    countType: "folders",
    children: [
      { 
        id: "in-game", 
        name: "In-Game", 
        type: "folder",
        count: 2,
        countType: "galleries",
        children: [
          { id: "scoring-highlights", name: "Scoring Highlights", type: "gallery", count: 48, countType: "assets" },
          { id: "rebounds-reels", name: "Rebounds Reels", type: "gallery", count: 48, countType: "assets", archived: true },
        ],
      },
      { 
        id: "training", 
        name: "Training", 
        type: "folder",
        count: 4,
        countType: "galleries",
        children: [
          { id: "shooting-drills", name: "Shooting Drills", type: "gallery", count: 24, countType: "assets" },
          { id: "scrimmage-footage", name: "Scrimmage Footage", type: "gallery", count: 36, countType: "assets" },
          { id: "film-sessions", name: "Film Sessions", type: "gallery", count: 18, countType: "assets", archived: true },
          {
            id: "conditioning",
            name: "Conditioning",
            type: "folder",
            count: 3,
            countType: "galleries",
            children: [
              { id: "hiit-recovery", name: "High-Intensity Interval Training and Recovery Protocol", type: "gallery", count: 22, countType: "assets" },
              { id: "cardio-sets", name: "Cardio Sets", type: "gallery", count: 15, countType: "assets" },
              { id: "agility-drills", name: "Agility Drills", type: "gallery", count: 20, countType: "assets" },
            ],
          },
        ],
      },
      { 
        id: "fan-engagement", 
        name: "Fan Engagement", 
        type: "folder",
        count: 3,
        countType: "galleries",
        children: [
          { id: "halftime-shows", name: "Halftime Shows", type: "gallery", count: 30, countType: "assets" },
          { id: "autograph-signings", name: "Autograph Signings", type: "gallery", count: 22, countType: "assets" },
          { id: "kids-day", name: "Kids Day", type: "gallery", count: 40, countType: "assets" },
        ],
      },
      { 
        id: "big-moments", 
        name: "Big Moments", 
        type: "gallery",
        count: 48,
        countType: "assets",
      },
    ],
  },
  {
    id: "season-2024",
    name: "Season 24-25",
    type: "folder",
    count: 3,
    countType: "folders",
    children: [
      { 
        id: "in-game-2024", 
        name: "Game Day", 
        type: "folder",
        count: 2,
        countType: "galleries",
        children: [
          { id: "scoring-highlights-2024", name: "Clutch Plays", type: "gallery", count: 48, countType: "assets" },
          { id: "rebounds-reels-2024", name: "Defensive Stops", type: "gallery", count: 48, countType: "assets" },
        ],
      },
      { 
        id: "training-2024", 
        name: "Pre-Season Camp", 
        type: "folder",
        count: 4,
        countType: "galleries",
        children: [
          { id: "tryout-highlights", name: "Tryout Highlights", type: "gallery", count: 32, countType: "assets" },
          { id: "rookie-introductions", name: "Rookie Introductions", type: "gallery", count: 18, countType: "assets" },
          { id: "team-bonding", name: "Team Bonding", type: "gallery", count: 25, countType: "assets" },
          {
            id: "fitness-testing",
            name: "Fitness Testing",
            type: "folder",
            count: 2,
            countType: "galleries",
            children: [
              { id: "combine-results", name: "Combine Results", type: "gallery", count: 14, countType: "assets" },
              { id: "endurance-tests", name: "Endurance Tests", type: "gallery", count: 19, countType: "assets" },
            ],
          },
        ],
      },
      { 
        id: "fan-engagement-2024", 
        name: "Meet & Greets", 
        type: "folder",
        count: 3,
        countType: "galleries",
        children: [
          { id: "vip-courtside", name: "VIP Courtside", type: "gallery", count: 28, countType: "assets" },
          { id: "school-visits", name: "School Visits", type: "gallery", count: 35, countType: "assets" },
          { id: "charity-gala", name: "Charity Gala", type: "gallery", count: 42, countType: "assets" },
        ],
      },
      { 
        id: "big-moments-2024", 
        name: "Playoff Run", 
        type: "gallery",
        count: 48,
        countType: "assets",
      },
    ],
  },
  {
    id: "season-2023",
    name: "Season 23-24",
    type: "folder",
    count: 3,
    countType: "folders",
    children: [
      { 
        id: "in-game-2023", 
        name: "Match Coverage", 
        type: "folder",
        count: 2,
        countType: "galleries",
        children: [
          { id: "scoring-highlights-2023", name: "Top 10 Dunks", type: "gallery", count: 48, countType: "assets" },
          { id: "rebounds-reels-2023", name: "Block Party", type: "gallery", count: 48, countType: "assets" },
        ],
      },
      { 
        id: "training-2023", 
        name: "Summer Workouts", 
        type: "folder",
        count: 4,
        countType: "galleries",
        children: [
          { id: "open-gym-sessions", name: "Open Gym Sessions", type: "gallery", count: 22, countType: "assets" },
          { id: "skills-camp", name: "Skills Camp", type: "gallery", count: 30, countType: "assets" },
          { id: "recovery-rehab", name: "Recovery & Rehab", type: "gallery", count: 16, countType: "assets" },
          {
            id: "weight-room",
            name: "Weight Room",
            type: "folder",
            count: 2,
            countType: "galleries",
            children: [
              { id: "strength-training", name: "Strength Training", type: "gallery", count: 26, countType: "assets" },
              { id: "mobility-work", name: "Mobility Work", type: "gallery", count: 18, countType: "assets" },
            ],
          },
        ],
      },
      { 
        id: "fan-engagement-2023", 
        name: "Community Outreach", 
        type: "folder",
        count: 3,
        countType: "galleries",
        children: [
          { id: "hospital-visits", name: "Hospital Visits", type: "gallery", count: 20, countType: "assets" },
          { id: "food-drive", name: "Food Drive", type: "gallery", count: 15, countType: "assets" },
          { id: "youth-basketball-clinic", name: "Youth Basketball Clinic", type: "gallery", count: 38, countType: "assets" },
        ],
      },
      {
        id: "big-moments-2023",
        name: "Championship Parade",
        type: "gallery",
        count: 48,
        countType: "assets",
      },
    ],
  },
  {
    id: "season-archive",
    name: "Season Archive",
    type: "folder",
    count: 3,
    countType: "galleries",
    children: [
      { id: "archive-full-games", name: "Full Game Broadcasts", type: "gallery", count: 6200, countType: "assets" },
      { id: "archive-raw-photos", name: "Raw Photo Dumps", type: "gallery", count: 4800, countType: "assets" },
      { id: "archive-press-photos", name: "Press Photo Archive", type: "gallery", count: 1450, countType: "assets" },
    ],
  },
  {
    id: "broadcast-masters",
    name: "Broadcast Masters",
    type: "folder",
    count: 2,
    countType: "galleries",
    simulateMoveRejection: true,
    children: [
      { id: "broadcast-masters-2324", name: "2023-24 Game Masters", type: "gallery", count: 5100, countType: "assets" },
      { id: "broadcast-masters-2425", name: "2024-25 Game Masters", type: "gallery", count: 4350, countType: "assets" },
    ],
  },
  {
    id: "season-2022-archived",
    name: "Season 22-23",
    type: "folder",
    count: 2,
    countType: "galleries",
    archived: true,
    children: [
      { id: "rookie-spotlight-2022", name: "Rookie Spotlight", type: "gallery", count: 18, countType: "assets", archived: true },
      { id: "trade-deadline-2022", name: "Trade Deadline Moments", type: "gallery", count: 24, countType: "assets", archived: true },
    ],
  },
  {
    id: "legacy-branding",
    name: "Legacy Branding Assets",
    type: "folder",
    count: 1,
    countType: "galleries",
    archived: true,
    children: [
      { id: "old-logo-package", name: "Old Logo Package", type: "gallery", count: 12, countType: "assets", archived: true },
    ],
  },
  {
    id: "retired-jerseys-archived",
    name: "Retired Jersey Ceremonies",
    type: "gallery",
    count: 30,
    countType: "assets",
    archived: true,
  },
  {
    id: "starter-gallery",
    name: "Starter Gallery",
    type: "gallery",
    count: 18,
    countType: "assets",
    thumbnailUrl: starterGalleryThumbnail,
  },
];

export const mockGalleries: Gallery[] = [
  { id: "scoring-highlights", name: "Scoring Highlights", assetCount: 48, timeAgo: "2 days ago", thumbnailUrl: "https://picsum.photos/seed/gal1/400/300" },
  { id: "rebounds-reels", name: "Rebounds Reels", assetCount: 48, timeAgo: "5 days ago", thumbnailUrl: "https://picsum.photos/seed/gal2/400/300" },
  { id: "big-moments", name: "Big Moments", assetCount: 48, timeAgo: "1 week ago", thumbnailUrl: "https://picsum.photos/seed/gal3/400/300" },
  { id: "shooting-drills", name: "Shooting Drills", assetCount: 24, timeAgo: "3 days ago", thumbnailUrl: "https://picsum.photos/seed/gal4/400/300" },
  { id: "scrimmage-footage", name: "Scrimmage Footage", assetCount: 36, timeAgo: "4 days ago", thumbnailUrl: "https://picsum.photos/seed/gal5/400/300", isPublic: true },
  { id: "film-sessions", name: "Film Sessions", assetCount: 18, timeAgo: "1 week ago", thumbnailUrl: "https://picsum.photos/seed/gal6/400/300" },
  { id: "cardio-sets", name: "Cardio Sets", assetCount: 15, timeAgo: "5 days ago", thumbnailUrl: "https://picsum.photos/seed/gal7/400/300" },
  { id: "agility-drills", name: "Agility Drills", assetCount: 20, timeAgo: "6 days ago", thumbnailUrl: "https://picsum.photos/seed/gal8/400/300" },
  { id: "halftime-shows", name: "Halftime Shows", assetCount: 30, timeAgo: "3 days ago", thumbnailUrl: "https://picsum.photos/seed/gal9/400/300" },
  { id: "autograph-signings", name: "Autograph Signings", assetCount: 22, timeAgo: "1 week ago", thumbnailUrl: "https://picsum.photos/seed/gal10/400/300" },
  { id: "kids-day", name: "Kids Day", assetCount: 40, timeAgo: "4 days ago", thumbnailUrl: "https://picsum.photos/seed/gal11/400/300", isPublic: true },
  { id: "scoring-highlights-2024", name: "Clutch Plays", assetCount: 48, timeAgo: "2 weeks ago", thumbnailUrl: "https://picsum.photos/seed/gal12/400/300" },
  { id: "rebounds-reels-2024", name: "Defensive Stops", assetCount: 48, timeAgo: "3 weeks ago", thumbnailUrl: "https://picsum.photos/seed/gal13/400/300" },
  { id: "big-moments-2024", name: "Playoff Run", assetCount: 48, timeAgo: "1 month ago", thumbnailUrl: "https://picsum.photos/seed/gal14/400/300" },
  { id: "tryout-highlights", name: "Tryout Highlights", assetCount: 32, timeAgo: "2 weeks ago", thumbnailUrl: "https://picsum.photos/seed/gal15/400/300" },
  { id: "rookie-introductions", name: "Rookie Introductions", assetCount: 18, timeAgo: "3 weeks ago", thumbnailUrl: "https://picsum.photos/seed/gal16/400/300" },
  { id: "team-bonding", name: "Team Bonding", assetCount: 25, timeAgo: "2 weeks ago", thumbnailUrl: "https://picsum.photos/seed/gal17/400/300" },
  { id: "combine-results", name: "Combine Results", assetCount: 14, timeAgo: "1 month ago", thumbnailUrl: "https://picsum.photos/seed/gal18/400/300" },
  { id: "endurance-tests", name: "Endurance Tests", assetCount: 19, timeAgo: "1 month ago", thumbnailUrl: "https://picsum.photos/seed/gal19/400/300" },
  { id: "vip-courtside", name: "VIP Courtside", assetCount: 28, timeAgo: "3 weeks ago", thumbnailUrl: "https://picsum.photos/seed/gal20/400/300" },
  { id: "school-visits", name: "School Visits", assetCount: 35, timeAgo: "1 month ago", thumbnailUrl: "https://picsum.photos/seed/gal21/400/300" },
  { id: "charity-gala", name: "Charity Gala", assetCount: 42, timeAgo: "1 month ago", thumbnailUrl: "https://picsum.photos/seed/gal22/400/300" },
  { id: "scoring-highlights-2023", name: "Top 10 Dunks", assetCount: 48, timeAgo: "2 months ago", thumbnailUrl: "https://picsum.photos/seed/gal23/400/300" },
  { id: "rebounds-reels-2023", name: "Block Party", assetCount: 48, timeAgo: "2 months ago", thumbnailUrl: "https://picsum.photos/seed/gal24/400/300" },
  { id: "big-moments-2023", name: "Championship Parade", assetCount: 48, timeAgo: "3 months ago", thumbnailUrl: "https://picsum.photos/seed/gal25/400/300" },
  { id: "open-gym-sessions", name: "Open Gym Sessions", assetCount: 22, timeAgo: "2 months ago", thumbnailUrl: "https://picsum.photos/seed/gal26/400/300" },
  { id: "skills-camp", name: "Skills Camp", assetCount: 30, timeAgo: "2 months ago", thumbnailUrl: "https://picsum.photos/seed/gal27/400/300" },
  { id: "recovery-rehab", name: "Recovery & Rehab", assetCount: 16, timeAgo: "3 months ago", thumbnailUrl: "https://picsum.photos/seed/gal28/400/300" },
  { id: "strength-training", name: "Strength Training", assetCount: 26, timeAgo: "2 months ago", thumbnailUrl: "https://picsum.photos/seed/gal29/400/300" },
  { id: "mobility-work", name: "Mobility Work", assetCount: 18, timeAgo: "3 months ago", thumbnailUrl: "https://picsum.photos/seed/gal30/400/300" },
  { id: "hospital-visits", name: "Hospital Visits", assetCount: 20, timeAgo: "2 months ago", thumbnailUrl: "https://picsum.photos/seed/gal31/400/300" },
  { id: "food-drive", name: "Food Drive", assetCount: 15, timeAgo: "3 months ago", thumbnailUrl: "https://picsum.photos/seed/gal32/400/300" },
  { id: "youth-basketball-clinic", name: "Youth Basketball Clinic", assetCount: 38, timeAgo: "2 months ago", thumbnailUrl: "https://picsum.photos/seed/gal33/400/300" },
  { id: "player-portraits", name: "Player Portraits", assetCount: 42, timeAgo: "1 week ago", thumbnailUrl: "https://picsum.photos/seed/gal34/400/300" },
  { id: "media-day-2025", name: "Media Day 2025", assetCount: 56, timeAgo: "3 days ago", thumbnailUrl: "https://picsum.photos/seed/gal35/400/300" },
  { id: "social-media-clips", name: "Social Media Clips", assetCount: 34, timeAgo: "2 days ago", thumbnailUrl: "https://picsum.photos/seed/gal36/400/300" },
  { id: "behind-the-scenes", name: "Behind the Scenes", assetCount: 28, timeAgo: "5 days ago", thumbnailUrl: "https://picsum.photos/seed/gal37/400/300" },
  { id: "starter-gallery", name: "Starter Gallery", assetCount: 18, timeAgo: "Just now", thumbnailUrl: starterGalleryThumbnail },
  { id: "archive-full-games", name: "Full Game Broadcasts", assetCount: 6200, timeAgo: "6 months ago", thumbnailUrl: "https://picsum.photos/seed/gal38/400/300" },
  { id: "archive-raw-photos", name: "Raw Photo Dumps", assetCount: 4800, timeAgo: "6 months ago", thumbnailUrl: "https://picsum.photos/seed/gal39/400/300" },
  { id: "archive-press-photos", name: "Press Photo Archive", assetCount: 1450, timeAgo: "5 months ago", thumbnailUrl: "https://picsum.photos/seed/gal40/400/300" },
  { id: "broadcast-masters-2324", name: "2023-24 Game Masters", assetCount: 5100, timeAgo: "8 months ago", thumbnailUrl: "https://picsum.photos/seed/gal41/400/300" },
  { id: "broadcast-masters-2425", name: "2024-25 Game Masters", assetCount: 4350, timeAgo: "2 months ago", thumbnailUrl: "https://picsum.photos/seed/gal42/400/300" },
];

// Collect all gallery IDs that are assigned to any folder in the tree
export function collectAssignedGalleryIds(items: FolderItem[]): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    if (item.type === "gallery") ids.add(item.id);
    if (item.children) {
      for (const id of collectAssignedGalleryIds(item.children)) {
        ids.add(id);
      }
    }
  }
  return ids;
}

// Flatten folder tree for dropdown display (only folders, not galleries)
export interface FlattenedFolder {
  id: string;
  name: string;
  depth: number;
  displayName: string; // indented name for display
}

export function flattenFolders(items: FolderItem[], depth = 0): FlattenedFolder[] {
  const result: FlattenedFolder[] = [];
  for (const item of items) {
    if (item.type === "folder" && item.id !== "all") {
      const indent = "\u00A0\u00A0".repeat(depth);
      result.push({
        id: item.id,
        name: item.name,
        depth,
        displayName: `${indent}${item.name}`,
      });
      if (item.children) {
        result.push(...flattenFolders(item.children, depth + 1));
      }
    }
  }
  return result;
}

// Get the max depth of nested children below a folder (1 = leaf, 2 = has children, etc.)
export function getMaxDepth(folder: FolderItem): number {
  if (!folder.children || folder.children.length === 0) return 1;
  const childFolders = folder.children.filter(c => c.type === "folder");
  if (childFolders.length === 0) return 1;
  return 1 + Math.max(...childFolders.map(getMaxDepth));
}

// Get the depth of a folder in the tree (root level = 1)
export function getFolderDepth(folderId: string, tree: FolderItem[], currentDepth = 1): number {
  for (const item of tree) {
    if (item.id === folderId) return currentDepth;
    if (item.children) {
      const found = getFolderDepth(folderId, item.children, currentDepth + 1);
      if (found > 0) return found;
    }
  }
  return 0;
}

// Shared utility for collecting nested folder rows (used in Move/Archive dialogs)
export interface NestedFolderRow {
  name: string;
  path: string;
}

export function collectNestedFolders(folder: FolderItem, parentPath: string): NestedFolderRow[] {
  const rows: NestedFolderRow[] = [{ name: folder.name, path: parentPath }];
  if (folder.children) {
    const childPath = parentPath ? `${parentPath} > ${folder.name}` : folder.name;
    for (const child of folder.children) {
      if (child.type === "folder") {
        rows.push(...collectNestedFolders(child, childPath));
      }
    }
  }
  return rows;
}

// Count sub-folders (direct children only that are folders)
export function countSubFolders(folder: FolderItem): number {
  if (!folder.children) return 0;
  return folder.children.filter(c => c.type === "folder").length;
}

// Count all galleries nested anywhere within a folder, including those inside sub-folders
export function countAllGalleries(folder: FolderItem): number {
  if (folder.type === "gallery") return 1;
  if (!folder.children) return 0;
  return folder.children.reduce((sum, child) => sum + countAllGalleries(child), 0);
}

// Find the parent folder path for a gallery by its ID
// Returns an array of folder names from root to parent, or null if not found
export function findGalleryParentPath(
  galleryId: string,
  items: FolderItem[],
  path: string[] = []
): string[] | null {
  for (const item of items) {
    if (item.type === "gallery" && item.id === galleryId) {
      return path.length > 0 ? path : null;
    }
    if (item.children) {
      const found = findGalleryParentPath(galleryId, item.children, [...path, item.name]);
      if (found) return found;
    }
  }
  return null;
}

// Get the display string for a gallery's current location
export function getGalleryLocationDisplay(galleryId: string, folderTree: FolderItem[]): string {
  const path = findGalleryParentPath(galleryId, folderTree);
  if (!path) return "Not in a folder";
  // Filter out "All Media" from display
  const filtered = path.filter(p => p !== "All Media");
  return filtered.length > 0 ? filtered.join(" > ") : "Not in a folder";
}

export const mockFolderCards: FolderCard[] = [
  { id: "season-2025", name: "Season 25-26", galleryCount: 8, timeAgo: "1 day ago" },
  { id: "season-2024", name: "Season 24-25", galleryCount: 8, timeAgo: "3 days ago" },
  { id: "season-2023", name: "Season 23-24", galleryCount: 8, timeAgo: "1 week ago" },
  { id: "in-game", name: "In-Game", galleryCount: 2, timeAgo: "2 days ago" },
  { id: "training", name: "Training", galleryCount: 8, timeAgo: "1 week ago" },
  { id: "fan-engagement", name: "Fan Engagement", galleryCount: 5, timeAgo: "3 days ago" },
  { id: "press-conferences", name: "Press Conferences", galleryCount: 12, timeAgo: "2 weeks ago" },
  { id: "draft-day", name: "Draft Day", galleryCount: 6, timeAgo: "1 month ago" },
  { id: "all-star-weekend", name: "All-Star Weekend", galleryCount: 15, timeAgo: "2 weeks ago" },
  { id: "playoffs", name: "Playoffs", galleryCount: 22, timeAgo: "3 weeks ago" },
  { id: "championship", name: "Championship", galleryCount: 18, timeAgo: "1 month ago" },
  { id: "community-events", name: "Community Events", galleryCount: 9, timeAgo: "2 weeks ago" },
];
