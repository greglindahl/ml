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
        count: 8,
        countType: "galleries",
      },
      { 
        id: "fan-engagement", 
        name: "Fan Engagement", 
        type: "folder",
        count: 5,
        countType: "galleries",
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
        name: "In-Game", 
        type: "folder",
        count: 2,
        countType: "galleries",
        children: [
          { id: "scoring-highlights-2024", name: "Scoring Highlights", type: "gallery", count: 48, countType: "assets" },
          { id: "rebounds-reels-2024", name: "Rebounds Reels", type: "gallery", count: 48, countType: "assets" },
        ],
      },
      { 
        id: "training-2024", 
        name: "Training", 
        type: "folder",
        count: 8,
        countType: "galleries",
      },
      { 
        id: "fan-engagement-2024", 
        name: "Fan Engagement", 
        type: "folder",
        count: 5,
        countType: "galleries",
      },
      { 
        id: "big-moments-2024", 
        name: "Big Moments", 
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
        name: "In-Game", 
        type: "folder",
        count: 2,
        countType: "galleries",
        children: [
          { id: "scoring-highlights-2023", name: "Scoring Highlights", type: "gallery", count: 48, countType: "assets" },
          { id: "rebounds-reels-2023", name: "Rebounds Reels", type: "gallery", count: 48, countType: "assets" },
        ],
      },
      { 
        id: "training-2023", 
        name: "Training", 
        type: "folder",
        count: 8,
        countType: "galleries",
      },
      { 
        id: "fan-engagement-2023", 
        name: "Fan Engagement", 
        type: "folder",
        count: 5,
        countType: "galleries",
      },
      { 
        id: "big-moments-2023", 
        name: "Big Moments", 
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
  { id: "scoring-highlights-2024", name: "Scoring Highlights 24-25", assetCount: 48, timeAgo: "2 weeks ago" },
  { id: "rebounds-reels-2024", name: "Rebounds Reels 24-25", assetCount: 48, timeAgo: "3 weeks ago" },
  { id: "big-moments-2024", name: "Big Moments 24-25", assetCount: 48, timeAgo: "1 month ago" },
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
