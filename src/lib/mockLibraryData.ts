// Mock library data for realistic search testing
import Fuse from 'fuse.js';

export interface TagInfo {
  value: string;
  isAiGenerated: boolean;
}

export interface LibraryAsset {
  id: string;
  name: string;
  creator: string;
  creatorId: string;
  type: "image" | "video";
  dateCreated: Date;
  captureDate: Date;
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3";
  status: "approved" | "pending" | "draft";
  tags: string[];
  tagInfo?: TagInfo[]; // Detailed tag info with AI-generated flag
  fileSize: string;
  dimensions?: string;
  duration?: string;
  folderId?: string; // Which folder/gallery this asset belongs to
  isFavorite?: boolean;
  isBranded?: boolean;
  downloads: number;
  shares: number;
  galleries: number;
  viewers: number;
  publicViews: number;
  publicDownloads: number;
  favorites: number;
  lastDownloadDate: Date | null;
}

// Define which tags are AI-generated (recognized by AI) vs manual
export const AI_GENERATED_TAGS = new Set([
  // Player recognition (AI face/person detection)
  "Lebron James",
  "Steph Curry", 
  "Kevin Durant",
  "Giannis Antetokounmpo",
  "Luka Doncic",
  // Object/logo detection
  "Nike",
  "Gatorade",
  "adidas",
  "Under Armour",
  // Action recognition
  "dunk",
  "slam dunk",
  "three pointer",
  "block",
  "assist",
  "crossover",
  "fastbreak",
  // Scene recognition
  "courtside",
  "celebration",
  "victory",
  // Sport detection
  "basketball",
  "football",
  "baseball",
  "esports",
]);

const creators = [
  { id: "john", name: "John Smith" },
  { id: "jane", name: "Jane Doe" },
  { id: "alex", name: "Alex Johnson" },
];

const assetNames = {
  image: [
    "Hero Banner Spring Campaign",
    "Product Shot - Blue Sneakers",
    "Team Photo 2024",
    "Logo Variation Dark",
    "Social Post Background",
    "Email Header Design",
    "Instagram Story Template",
    "Facebook Cover Photo",
    "Product Lifestyle Shot",
    "Brand Pattern Tile",
    "Icon Set Preview",
    "Mockup Phone Display",
    "Billboard Design Draft",
    "Newsletter Banner",
    "Landing Page Hero",
    // NBA player photos
    "Lebron James Pregame Warmup",
    "Steph Curry Three Point Celebration",
    "Kevin Durant Dunk Shot",
    "Giannis Antetokounmpo Block",
    "Luka Doncic Assist Highlight",
    // Additional unique names
    "Arena Exterior Wide Shot",
    "Halftime Show Pyrotechnics",
    "Fan Section Panorama",
    "Press Conference Backdrop",
    "Locker Room Celebration",
    "Championship Trophy Display",
    "Stadium Aerial View",
    "Tunnel Walk Moment",
    "Bench Reaction Shot",
    "Timeout Huddle Formation",
    "Mascot Crowd Interaction",
    "Scoreboard Close-up",
    "VIP Suite Interior",
    "Parking Lot Tailgate",
    "Jersey Reveal Event",
    "Draft Night Selection",
    "Trade Deadline Announcement",
    "All-Star Weekend Setup",
    "Playoffs Bracket Display",
    "Victory Parade Float",
    "Training Camp Drills",
    "Media Day Portraits",
    "Charity Event Group Photo",
    "Youth Clinic Session",
    "Hall of Fame Induction",
  ],
  video: [
    "Brand Anthem 60s",
    "Product Demo Reel",
    "Customer Testimonial - Sarah",
    "Behind the Scenes Footage",
    "Social Teaser 15s",
    "Tutorial How-To Guide",
    "Event Highlight Reel",
    "Animated Logo Intro",
    // NBA player videos
    "Lebron James Slam Dunk Compilation",
    "Lebron James Game Winner vs Celtics",
    "Steph Curry 60 Points Highlights",
    "Kevin Durant Crossover Mix",
    "Giannis Antetokounmpo Fastbreak Dunk",
    "Luka Doncic Behind the Back Pass",
    // Additional unique names
    "Pregame Hype Montage",
    "Post-Game Interview Clip",
    "Season Recap 2024",
    "Rookie Introductions",
    "Coach Strategy Breakdown",
    "Fan Reactions Compilation",
    "Buzzer Beater Collection",
    "Defensive Stops Reel",
    "Assist of the Night",
    "Block Party Highlights",
    "Three Point Contest",
    "Slam Dunk Competition",
    "Skills Challenge Recap",
    "Celebrity Game Moments",
    "Legends Tribute Video",
    "Community Outreach Story",
    "Arena Tour Walkthrough",
    "Merchandise Promo Spot",
    "Ticket Sales Campaign",
    "Season Opener Intro",
  ],
};
// Tags that match facets from both FacetedSearch (V1) and FacetedPillsSearch (V3)
const tagSets = [
  // Sports tags with team names
  ["football", "team shot (5+)", "candid", "Chiefs"],
  ["basketball", "small group (2-4)", "looking at camera", "Lakers"],
  ["baseball", "solo (1)", "headshot", "Yankees"],
  ["esports", "small group (2-4)", "candid"],
  ["football", "crowd/fans", "landscape", "49ers"],
  ["basketball", "team shot (5+)", "portrait", "Warriors"],
  ["football", "solo (1)", "looking at camera", "Cowboys"],
  ["baseball", "team shot (5+)", "candid", "Dodgers"],
  // Mixed tags with teams
  ["marketing", "social", "football", "Patriots"],
  ["product", "brand", "basketball", "Celtics"],
  ["social", "brand", "baseball", "Red Sox"],
  ["marketing", "product", "esports"],
  ["brand", "football", "Eagles"],
  ["marketing", "basketball", "Heat"],
  ["product", "football", "Packers"],
  ["social", "baseball", "Cubs"],
  ["marketing", "brand", "product", "football", "Bills"],
  ["social", "product", "basketball", "Nets"],
  // NBA player + action + team tags
  ["Lebron James", "dunk", "slam dunk", "basketball", "NBA", "Lakers"],
  ["Lebron James", "game winner", "clutch", "basketball", "NBA", "Lakers", "Cavaliers"],
  ["Steph Curry", "three pointer", "shooting", "basketball", "NBA", "Warriors"],
  ["Steph Curry", "celebration", "basketball", "NBA", "Warriors"],
  ["Kevin Durant", "dunk", "crossover", "basketball", "NBA", "Suns", "Warriors", "Nets"],
  ["Giannis Antetokounmpo", "dunk", "block", "basketball", "NBA", "Bucks"],
  ["Luka Doncic", "assist", "passing", "basketball", "NBA", "Mavericks"],
];

// Helper functions for random generation (used only as fallback)
function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Fixed assets for user testing scenarios
const fixedAssets: Omit<LibraryAsset, 'downloads' | 'shares' | 'galleries' | 'viewers' | 'publicViews' | 'publicDownloads' | 'favorites' | 'lastDownloadDate' | 'captureDate'>[] = [
  // Task A1: Known-Item, Time-Sensitive - Lebron from last night
  {
    id: "asset-hero-1",
    name: "Lebron James Game Action vs Celtics.jpg",
    creator: "Jane Doe",
    creatorId: "jane",
    type: "image",
    dateCreated: (() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(22, 45, 0, 0); // Last night at 10:45 PM
      return yesterday;
    })(),
    aspectRatio: "16:9",
    status: "approved",
    tags: ["Lebron James", "basketball", "dunk", "Lebron Dunks", "Lebron Highlights"],
    fileSize: "4.2 MB",
    dimensions: "3840x2160",
  },
  // Task A2: Partial Memory / Uncertain Metadata - Last season with Sponsor Y
  {
    id: "asset-sponsor-1",
    name: "Lakers Courtside Sponsor Feature.jpg",
    creator: "Alex Johnson",
    creatorId: "alex",
    type: "image",
    dateCreated: (() => {
      const lastSeason = new Date();
      lastSeason.setMonth(lastSeason.getMonth() - 4); // ~4 months ago
      lastSeason.setHours(19, 30, 0, 0);
      return lastSeason;
    })(),
    aspectRatio: "16:9",
    status: "approved",
    tags: ["Lakers", "Sponsor Y", "Gatorade", "Nike", "adidas", "courtside", "basketball", "NBA", "sponsor", "branding"],
    fileSize: "3.8 MB",
    dimensions: "1920x1080",
  },
  // Task B: Time Pressure + Accuracy - Player X action with Sponsor Y branding
  {
    id: "asset-action-sponsor-1",
    name: "Lebron James Dunk with Gatorade Courtside.jpg",
    creator: "Jane Doe",
    creatorId: "jane",
    type: "image",
    dateCreated: (() => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 3); // 3 days ago
      recent.setHours(20, 15, 0, 0);
      return recent;
    })(),
    aspectRatio: "16:9",
    status: "approved",
    tags: ["Lebron James", "dunk", "slam dunk", "action", "celebration", "Gatorade", "Sponsor Y", "courtside", "basketball", "branding", "Lebron Dunks", "Lebron Lakers"],
    fileSize: "5.1 MB",
    dimensions: "3840x2160",
  },
  {
    id: "asset-action-sponsor-2",
    name: "Lebron James Celebration Nike Banner.jpg",
    creator: "Alex Johnson",
    creatorId: "alex",
    type: "image",
    dateCreated: (() => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 5); // 5 days ago
      recent.setHours(21, 30, 0, 0);
      return recent;
    })(),
    aspectRatio: "16:9",
    status: "approved",
    tags: ["Lebron James", "celebration", "fist pump", "action", "Nike", "Sponsor Y", "basketball", "branding", "victory", "Lebron Highlights", "Lebron Lakers"],
    fileSize: "4.8 MB",
    dimensions: "1920x1080",
  },
  // Additional Lebron + Nike assets for filter testing
  {
    id: "asset-lebron-nike-3",
    name: "Lebron James Nike Swoosh Portrait.jpg",
    creator: "John Smith",
    creatorId: "john",
    type: "image",
    dateCreated: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d;
    })(),
    aspectRatio: "1:1",
    status: "approved",
    tags: ["Lebron James", "Nike", "portrait", "basketball", "Lebron Lakers"],
    fileSize: "2.1 MB",
    dimensions: "1080x1080",
  },
  {
    id: "asset-lebron-nike-4",
    name: "Lebron James Nike Ad Campaign.jpg",
    creator: "Jane Doe",
    creatorId: "jane",
    type: "image",
    dateCreated: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 10);
      return d;
    })(),
    aspectRatio: "9:16",
    status: "approved",
    tags: ["Lebron James", "Nike", "advertisement", "vertical", "basketball", "Lebron Highlights", "Lebron Lakers"],
    fileSize: "1.8 MB",
    dimensions: "1080x1920",
  },
  {
    id: "asset-lebron-nike-5",
    name: "Lebron James Nike Warmup Jacket.jpg",
    creator: "Alex Johnson",
    creatorId: "alex",
    type: "image",
    dateCreated: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 14);
      return d;
    })(),
    aspectRatio: "4:3",
    status: "approved",
    tags: ["Lebron James", "Lakers", "Nike", "warmup", "pregame", "basketball", "NBA"],
    fileSize: "3.2 MB",
    dimensions: "1600x1200",
  },
  {
    id: "asset-lebron-nike-6",
    name: "Lebron James Nike Shoe Close-up.jpg",
    creator: "John Smith",
    creatorId: "john",
    type: "image",
    dateCreated: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      return d;
    })(),
    aspectRatio: "16:9",
    status: "pending",
    tags: ["Lebron James", "Lakers", "Nike", "shoes", "product", "basketball", "NBA"],
    fileSize: "2.9 MB",
    dimensions: "1920x1080",
  },
  // Steph Curry + Sponsor combinations
  {
    id: "asset-curry-nike-1",
    name: "Steph Curry Nike Three Point Celebration.jpg",
    creator: "Jane Doe",
    creatorId: "jane",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 2); return d; })(),
    aspectRatio: "16:9",
    status: "approved",
    tags: ["Steph Curry", "Warriors", "Nike", "celebration", "three pointer", "basketball", "NBA", "Sponsor Y"],
    fileSize: "4.5 MB",
    dimensions: "3840x2160",
  },
  {
    id: "asset-curry-ua-1",
    name: "Steph Curry Under Armour Dunk.jpg",
    creator: "John Smith",
    creatorId: "john",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 4); return d; })(),
    aspectRatio: "1:1",
    status: "approved",
    tags: ["Steph Curry", "Warriors", "Under Armour", "dunk", "action", "basketball", "NBA"],
    fileSize: "2.3 MB",
    dimensions: "1080x1080",
  },
  {
    id: "asset-curry-gatorade-1",
    name: "Steph Curry Gatorade Timeout.jpg",
    creator: "Alex Johnson",
    creatorId: "alex",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d; })(),
    aspectRatio: "4:3",
    status: "approved",
    tags: ["Steph Curry", "Warriors", "Gatorade", "timeout", "courtside", "basketball", "NBA", "Sponsor Y"],
    fileSize: "3.1 MB",
    dimensions: "1600x1200",
  },
  {
    id: "asset-curry-nike-2",
    name: "Steph Curry Nike Story Vertical.jpg",
    creator: "Jane Doe",
    creatorId: "jane",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 8); return d; })(),
    aspectRatio: "9:16",
    status: "approved",
    tags: ["Steph Curry", "Warriors", "Nike", "vertical", "story", "basketball", "NBA"],
    fileSize: "1.9 MB",
    dimensions: "1080x1920",
  },
  {
    id: "asset-curry-adidas-1",
    name: "Steph Curry adidas Warmup Session.jpg",
    creator: "John Smith",
    creatorId: "john",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 12); return d; })(),
    aspectRatio: "16:9",
    status: "pending",
    tags: ["Steph Curry", "Warriors", "adidas", "warmup", "pregame", "basketball", "NBA"],
    fileSize: "2.8 MB",
    dimensions: "1920x1080",
  },
  // Kevin Durant + Sponsor combinations
  {
    id: "asset-kd-nike-1",
    name: "Kevin Durant Nike Crossover Action.jpg",
    creator: "Alex Johnson",
    creatorId: "alex",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d; })(),
    aspectRatio: "16:9",
    status: "approved",
    tags: ["Kevin Durant", "Suns", "Nike", "crossover", "action", "basketball", "NBA", "Sponsor Y"],
    fileSize: "4.8 MB",
    dimensions: "3840x2160",
  },
  {
    id: "asset-kd-gatorade-1",
    name: "Kevin Durant Gatorade Dunk Slam.jpg",
    creator: "Jane Doe",
    creatorId: "jane",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 3); return d; })(),
    aspectRatio: "1:1",
    status: "approved",
    tags: ["Kevin Durant", "Suns", "Gatorade", "dunk", "slam dunk", "action", "basketball", "NBA"],
    fileSize: "2.5 MB",
    dimensions: "1080x1080",
  },
  {
    id: "asset-kd-nike-2",
    name: "Kevin Durant Nike Portrait Banner.jpg",
    creator: "John Smith",
    creatorId: "john",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 5); return d; })(),
    aspectRatio: "9:16",
    status: "approved",
    tags: ["Kevin Durant", "Suns", "Nike", "portrait", "banner", "basketball", "NBA", "Sponsor Y"],
    fileSize: "2.1 MB",
    dimensions: "1080x1920",
  },
  {
    id: "asset-kd-adidas-1",
    name: "Kevin Durant adidas Celebration Victory.jpg",
    creator: "Alex Johnson",
    creatorId: "alex",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 9); return d; })(),
    aspectRatio: "4:3",
    status: "approved",
    tags: ["Kevin Durant", "Suns", "adidas", "celebration", "victory", "basketball", "NBA"],
    fileSize: "3.4 MB",
    dimensions: "1600x1200",
  },
  {
    id: "asset-kd-nike-3",
    name: "Kevin Durant Nike Shoe Launch.jpg",
    creator: "Jane Doe",
    creatorId: "jane",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 15); return d; })(),
    aspectRatio: "16:9",
    status: "pending",
    tags: ["Kevin Durant", "Suns", "Nike", "shoes", "product", "launch", "basketball", "NBA"],
    fileSize: "3.0 MB",
    dimensions: "1920x1080",
  },
  // Giannis Antetokounmpo + Sponsor combinations
  {
    id: "asset-giannis-nike-1",
    name: "Giannis Antetokounmpo Nike Dunk Poster.jpg",
    creator: "John Smith",
    creatorId: "john",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d; })(),
    aspectRatio: "16:9",
    status: "approved",
    tags: ["Giannis Antetokounmpo", "Bucks", "Nike", "dunk", "poster", "action", "basketball", "NBA", "Sponsor Y"],
    fileSize: "5.2 MB",
    dimensions: "3840x2160",
  },
  {
    id: "asset-giannis-gatorade-1",
    name: "Giannis Antetokounmpo Gatorade Block.jpg",
    creator: "Alex Johnson",
    creatorId: "alex",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 4); return d; })(),
    aspectRatio: "1:1",
    status: "approved",
    tags: ["Giannis Antetokounmpo", "Bucks", "Gatorade", "block", "defense", "action", "basketball", "NBA"],
    fileSize: "2.6 MB",
    dimensions: "1080x1080",
  },
  {
    id: "asset-giannis-nike-2",
    name: "Giannis Antetokounmpo Nike Story Vertical.jpg",
    creator: "Jane Doe",
    creatorId: "jane",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; })(),
    aspectRatio: "9:16",
    status: "approved",
    tags: ["Giannis Antetokounmpo", "Bucks", "Nike", "vertical", "story", "basketball", "NBA", "Sponsor Y"],
    fileSize: "2.0 MB",
    dimensions: "1080x1920",
  },
  {
    id: "asset-giannis-adidas-1",
    name: "Giannis Antetokounmpo adidas Fastbreak.jpg",
    creator: "John Smith",
    creatorId: "john",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 11); return d; })(),
    aspectRatio: "4:3",
    status: "approved",
    tags: ["Giannis Antetokounmpo", "Bucks", "adidas", "fastbreak", "action", "basketball", "NBA"],
    fileSize: "3.3 MB",
    dimensions: "1600x1200",
  },
  {
    id: "asset-giannis-nike-3",
    name: "Giannis Antetokounmpo Nike Celebration.jpg",
    creator: "Alex Johnson",
    creatorId: "alex",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 18); return d; })(),
    aspectRatio: "16:9",
    status: "pending",
    tags: ["Giannis Antetokounmpo", "Bucks", "Nike", "celebration", "victory", "basketball", "NBA"],
    fileSize: "2.7 MB",
    dimensions: "1920x1080",
  },
  // Luka Doncic + Sponsor combinations
  {
    id: "asset-luka-nike-1",
    name: "Luka Doncic Nike Assist Highlight.jpg",
    creator: "Jane Doe",
    creatorId: "jane",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 2); return d; })(),
    aspectRatio: "16:9",
    status: "approved",
    tags: ["Luka Doncic", "Mavericks", "Nike", "assist", "passing", "action", "basketball", "NBA", "Sponsor Y"],
    fileSize: "4.6 MB",
    dimensions: "3840x2160",
  },
  {
    id: "asset-luka-gatorade-1",
    name: "Luka Doncic Gatorade Stepback Three.jpg",
    creator: "John Smith",
    creatorId: "john",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 5); return d; })(),
    aspectRatio: "1:1",
    status: "approved",
    tags: ["Luka Doncic", "Mavericks", "Gatorade", "stepback", "three pointer", "action", "basketball", "NBA"],
    fileSize: "2.4 MB",
    dimensions: "1080x1080",
  },
  {
    id: "asset-luka-nike-2",
    name: "Luka Doncic Nike Story Banner.jpg",
    creator: "Alex Johnson",
    creatorId: "alex",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 8); return d; })(),
    aspectRatio: "9:16",
    status: "approved",
    tags: ["Luka Doncic", "Mavericks", "Nike", "vertical", "story", "banner", "basketball", "NBA", "Sponsor Y"],
    fileSize: "1.8 MB",
    dimensions: "1080x1920",
  },
  {
    id: "asset-luka-adidas-1",
    name: "Luka Doncic adidas Celebration Dance.jpg",
    creator: "Jane Doe",
    creatorId: "jane",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 10); return d; })(),
    aspectRatio: "4:3",
    status: "approved",
    tags: ["Luka Doncic", "Mavericks", "adidas", "celebration", "dance", "basketball", "NBA"],
    fileSize: "3.5 MB",
    dimensions: "1600x1200",
  },
  {
    id: "asset-luka-nike-3",
    name: "Luka Doncic Nike Pregame Warmup.jpg",
    creator: "John Smith",
    creatorId: "john",
    type: "image",
    dateCreated: (() => { const d = new Date(); d.setDate(d.getDate() - 20); return d; })(),
    aspectRatio: "16:9",
    status: "pending",
    tags: ["Luka Doncic", "Mavericks", "Nike", "warmup", "pregame", "basketball", "NBA"],
    fileSize: "2.9 MB",
    dimensions: "1920x1080",
  },
];

// Available folder IDs for asset assignment
const folderIds = [
  "in-game", "training", "fan-engagement", "big-moments", "scoring-highlights", "rebounds-reels",
  "in-game-2024", "training-2024", "fan-engagement-2024", "big-moments-2024", "scoring-highlights-2024", "rebounds-reels-2024",
  "in-game-2023", "training-2023", "fan-engagement-2023", "big-moments-2023", "scoring-highlights-2023", "rebounds-reels-2023",
];

// Generate 80 mock assets with good distribution of tags
export const mockLibraryAssets: LibraryAsset[] = (() => {
  // Use a simple seeded random for consistent results
  let seed = 12345;
  const seededRandom = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  
  const seededFromArray = <T,>(arr: T[]): T => {
    return arr[Math.floor(seededRandom() * arr.length)];
  };
  
  const seededDate = (daysAgo: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(seededRandom() * daysAgo));
    date.setHours(Math.floor(seededRandom() * 24));
    date.setMinutes(Math.floor(seededRandom() * 60));
    return date;
  };
  
  const generateSeededAsset = (id: number): LibraryAsset => {
    const type = seededFromArray(["image", "video"] as const);
    const names = assetNames[type];
    const creator = seededFromArray(creators);
    const aspectRatio = seededFromArray(["1:1", "16:9", "9:16", "4:3"] as const);
    const status = seededFromArray(["approved", "pending", "draft"] as const);
    const tags = seededFromArray(tagSets);
    const folderId = seededFromArray(folderIds);
    
    const fileSizes = {
      image: ["1.2 MB", "2.4 MB", "856 KB", "3.1 MB", "1.8 MB"],
      video: ["45 MB", "120 MB", "28 MB", "250 MB", "85 MB"],
    };

    const dimensions = {
      "1:1": ["1080x1080", "2048x2048", "512x512"],
      "16:9": ["1920x1080", "3840x2160", "1280x720"],
      "9:16": ["1080x1920", "720x1280"],
      "4:3": ["1600x1200", "2048x1536", "1024x768"],
    };

    const durations = ["0:15", "0:30", "1:00", "2:30", "5:00", "10:15"];

    const extension = {
      image: seededFromArray([".png", ".jpg", ".webp"]),
      video: seededFromArray([".mp4", ".mov"]),
    };

    return {
      id: `asset-${id}`,
      name: `${seededFromArray(names)}${extension[type]}`,
      creator: creator.name,
      creatorId: creator.id,
      type,
      dateCreated: seededDate(365),
      aspectRatio,
      status,
      tags,
      fileSize: seededFromArray(fileSizes[type]),
      dimensions: type === "image" || type === "video" ? seededFromArray(dimensions[aspectRatio]) : undefined,
      duration: type === "video" ? seededFromArray(durations) : undefined,
      folderId,
      // Placeholder values — will be overwritten by the deterministic pass below
      downloads: 0, shares: 0, galleries: 0, viewers: 0, publicViews: 0,
      publicDownloads: 0, favorites: 0, lastDownloadDate: null,
      captureDate: new Date(),
    } as LibraryAsset;
  };
  
  // Assign folder IDs to fixed assets based on their content
  const fixedAssetsWithFolders = fixedAssets.map((asset, index) => ({
    ...asset,
    folderId: folderIds[index % folderIds.length],
  }));
  
  // Combine fixed assets with generated ones
  const allAssets = [...fixedAssetsWithFolders, ...Array.from({ length: 80 }, (_, i) => generateSeededAsset(i + 1))];
  
  // Assign extra fields deterministically
  let favSeed = 54321;
  const favRandom = () => {
    favSeed = (favSeed * 16807) % 2147483647;
    return (favSeed - 1) / 2147483646;
  };
  return allAssets.map(asset => {
    const downloads = Math.floor(favRandom() * 500);
    const shares = Math.floor(favRandom() * 100);
    const galleries = Math.floor(favRandom() * 8);
    const viewers = Math.floor(favRandom() * 300);
    const publicViews = Math.floor(favRandom() * 1000);
    const publicDownloads = Math.floor(favRandom() * 200);
    const favorites = Math.floor(favRandom() * 50);
    const hasLastDownload = favRandom() > 0.2;
    const lastDownloadDate = hasLastDownload
      ? (() => { const d = new Date(); d.setDate(d.getDate() - Math.floor(favRandom() * 60)); return d; })()
      : null;
    // captureDate is always before dateCreated
    const captureDate = new Date(asset.dateCreated.getTime() - Math.floor(favRandom() * 30 + 1) * 86400000);
    return {
      ...asset,
      isFavorite: favRandom() < 0.35,
      isBranded: favRandom() < 0.35,
      downloads,
      shares,
      galleries,
      viewers,
      publicViews,
      publicDownloads,
      favorites,
      lastDownloadDate,
      captureDate,
    };
  });
})();

// Helper to get relative time string
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
}

// Filter interface matching facet structure
export interface SearchFilters {
  query: string;
  creator?: string[];
  type?: string[];
  date?: string;
  aspect?: string[];
  status?: string[];
  tag?: string[];
}

// Date filter logic
function matchesDateFilter(date: Date, filter: string): boolean {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  switch (filter) {
    case "today":
      return diffDays === 0;
    case "week":
      return diffDays <= 7;
    case "month":
      return diffDays <= 30;
    case "year":
      return diffDays <= 365;
    default:
      return true;
  }
}

// Fuse.js configuration for fuzzy search
const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.4 },
    { name: 'creator', weight: 0.2 },
    { name: 'tags', weight: 0.4 }
  ],
  threshold: 0.4, // 0 = exact match, 1 = match anything
  distance: 100, // How close the match must be to the fuzzy location
  ignoreLocation: true, // Search the entire string
  includeScore: true,
  minMatchCharLength: 2,
};

// Search and filter function with fuzzy search support
export function searchAssets(assets: LibraryAsset[], filters: SearchFilters): LibraryAsset[] {
  let results = assets;

  // Apply fuzzy text search if query exists
  if (filters.query && filters.query.trim().length > 0) {
    const fuse = new Fuse(assets, fuseOptions);
    const fuseResults = fuse.search(filters.query.trim());
    results = fuseResults.map(result => result.item);
  }

  // Apply additional filters
  return results.filter((asset) => {
    // Creator filter
    if (filters.creator?.length) {
      if (!filters.creator.includes(asset.creatorId)) return false;
    }

    // Type filter
    if (filters.type?.length) {
      if (!filters.type.includes(asset.type)) return false;
    }

    // Date filter
    if (filters.date) {
      if (!matchesDateFilter(asset.dateCreated, filters.date)) return false;
    }

    // Aspect ratio filter
    if (filters.aspect?.length) {
      if (!filters.aspect.includes(asset.aspectRatio)) return false;
    }

    // Status filter
    if (filters.status?.length) {
      if (!filters.status.includes(asset.status)) return false;
    }

    // Tag filter - ANY tag must match (OR logic, case-insensitive)
    if (filters.tag?.length) {
      const lowerTags = asset.tags.map(t => t.toLowerCase());
      if (!filters.tag.some((t) => lowerTags.includes(t.toLowerCase()))) return false;
    }

    return true;
  });
}
