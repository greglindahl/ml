export type ItemType = "folder" | "gallery";

export interface FolderItem {
  id: string;
  name: string;
  type: ItemType;
  count?: number;
  countType?: "folders" | "galleries" | "assets";
  children?: FolderItem[];
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
          { id: "rebounds-reels", name: "Rebounds Reels", type: "gallery", count: 48, countType: "assets" },
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
          { id: "film-sessions", name: "Film Sessions", type: "gallery", count: 18, countType: "assets" },
          {
            id: "conditioning",
            name: "Conditioning",
            type: "folder",
            count: 2,
            countType: "galleries",
            children: [
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
];

export const mockGalleries: Gallery[] = [
  { id: "scoring-highlights", name: "Scoring Highlights", assetCount: 48, timeAgo: "2 days ago" },
  { id: "rebounds-reels", name: "Rebounds Reels", assetCount: 48, timeAgo: "5 days ago" },
  { id: "big-moments", name: "Big Moments", assetCount: 48, timeAgo: "1 week ago" },
  { id: "shooting-drills", name: "Shooting Drills", assetCount: 24, timeAgo: "3 days ago" },
  { id: "scrimmage-footage", name: "Scrimmage Footage", assetCount: 36, timeAgo: "4 days ago" },
  { id: "film-sessions", name: "Film Sessions", assetCount: 18, timeAgo: "1 week ago" },
  { id: "cardio-sets", name: "Cardio Sets", assetCount: 15, timeAgo: "5 days ago" },
  { id: "agility-drills", name: "Agility Drills", assetCount: 20, timeAgo: "6 days ago" },
  { id: "halftime-shows", name: "Halftime Shows", assetCount: 30, timeAgo: "3 days ago" },
  { id: "autograph-signings", name: "Autograph Signings", assetCount: 22, timeAgo: "1 week ago" },
  { id: "kids-day", name: "Kids Day", assetCount: 40, timeAgo: "4 days ago" },
  { id: "scoring-highlights-2024", name: "Clutch Plays", assetCount: 48, timeAgo: "2 weeks ago" },
  { id: "rebounds-reels-2024", name: "Defensive Stops", assetCount: 48, timeAgo: "3 weeks ago" },
  { id: "big-moments-2024", name: "Playoff Run", assetCount: 48, timeAgo: "1 month ago" },
  { id: "tryout-highlights", name: "Tryout Highlights", assetCount: 32, timeAgo: "2 weeks ago" },
  { id: "rookie-introductions", name: "Rookie Introductions", assetCount: 18, timeAgo: "3 weeks ago" },
  { id: "team-bonding", name: "Team Bonding", assetCount: 25, timeAgo: "2 weeks ago" },
  { id: "combine-results", name: "Combine Results", assetCount: 14, timeAgo: "1 month ago" },
  { id: "endurance-tests", name: "Endurance Tests", assetCount: 19, timeAgo: "1 month ago" },
  { id: "vip-courtside", name: "VIP Courtside", assetCount: 28, timeAgo: "3 weeks ago" },
  { id: "school-visits", name: "School Visits", assetCount: 35, timeAgo: "1 month ago" },
  { id: "charity-gala", name: "Charity Gala", assetCount: 42, timeAgo: "1 month ago" },
  { id: "scoring-highlights-2023", name: "Top 10 Dunks", assetCount: 48, timeAgo: "2 months ago" },
  { id: "rebounds-reels-2023", name: "Block Party", assetCount: 48, timeAgo: "2 months ago" },
  { id: "big-moments-2023", name: "Championship Parade", assetCount: 48, timeAgo: "3 months ago" },
  { id: "open-gym-sessions", name: "Open Gym Sessions", assetCount: 22, timeAgo: "2 months ago" },
  { id: "skills-camp", name: "Skills Camp", assetCount: 30, timeAgo: "2 months ago" },
  { id: "recovery-rehab", name: "Recovery & Rehab", assetCount: 16, timeAgo: "3 months ago" },
  { id: "strength-training", name: "Strength Training", assetCount: 26, timeAgo: "2 months ago" },
  { id: "mobility-work", name: "Mobility Work", assetCount: 18, timeAgo: "3 months ago" },
  { id: "hospital-visits", name: "Hospital Visits", assetCount: 20, timeAgo: "2 months ago" },
  { id: "food-drive", name: "Food Drive", assetCount: 15, timeAgo: "3 months ago" },
  { id: "youth-basketball-clinic", name: "Youth Basketball Clinic", assetCount: 38, timeAgo: "2 months ago" },
];

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

// Count sub-folders (direct children only that are folders)
export function countSubFolders(folder: FolderItem): number {
  if (!folder.children) return 0;
  return folder.children.filter(c => c.type === "folder").length;
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
