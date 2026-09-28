/**
 * Mock Insights data. Metric names follow prod's `DashboardMetricType`
 * (core/dashboard/dashboard.model.ts); each metric is a `{ current, previous }`
 * pair, where previous is the same-length period before the selected range —
 * that pair is what drives the change badge.
 *
 * Everything is deterministic (seeded), so numbers don't wobble on re-render
 * and switching ranges back and forth lands on the same values.
 */

import { mockUsers, type User } from "@/lib/mockUserData";
import { mockGalleries } from "@/lib/mockFolderData";

// ---------------------------------------------------------------------------
// Date ranges (prod's gf-date-range-select presets, minus Custom)
// ---------------------------------------------------------------------------

export type InsightsRange = "last-7-days" | "last-14-days" | "last-30-days" | "month-to-date" | "last-90-days" | "last-12-months";

export const INSIGHTS_RANGES: { value: InsightsRange; label: string }[] = [
  { value: "last-7-days", label: "Last 7 days" },
  { value: "last-14-days", label: "Last 14 days" },
  { value: "last-30-days", label: "Last 30 days" },
  { value: "month-to-date", label: "Month to Date" },
  { value: "last-90-days", label: "Last 90 days" },
  { value: "last-12-months", label: "Last 12 months" },
];

export const DEFAULT_INSIGHTS_RANGE: InsightsRange = "last-30-days";

/** Prod ranges end yesterday. */
export function rangeBounds(range: InsightsRange): { from: Date; until: Date; days: number } {
  const until = new Date();
  until.setDate(until.getDate() - 1);
  until.setHours(0, 0, 0, 0);
  const from = new Date(until);
  let days: number;
  switch (range) {
    case "month-to-date":
      from.setDate(1);
      days = until.getDate();
      break;
    case "last-12-months":
      from.setFullYear(from.getFullYear() - 1);
      from.setDate(from.getDate() + 1);
      days = 365;
      break;
    default:
      days = Number(range.split("-")[1]);
      from.setDate(from.getDate() - (days - 1));
  }
  return { from, until, days: Math.max(1, days) };
}

// ---------------------------------------------------------------------------
// Seeded helpers
// ---------------------------------------------------------------------------

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Stable 0–1 noise for a (key, salt) pair. */
const noise = (key: string, salt: string) => hash(`${key}:${salt}`);

export interface MetricValue {
  current: number;
  previous: number;
}

/** `perDay` baseline scaled to the range, ±25% period-over-period drift. */
function metric(name: string, perDay: number, range: InsightsRange): MetricValue {
  const { days } = rangeBounds(range);
  const current = Math.round(perDay * days * (0.85 + noise(name, range) * 0.3));
  const previous = Math.round(current * (0.75 + noise(name, `${range}-prev`) * 0.5));
  return { current, previous };
}

export function percentChange(m: MetricValue): number | null {
  if (m.previous === 0) return null;
  return ((m.current - m.previous) / m.previous) * 100;
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export interface Segment {
  key: string;
  label: string;
  value: MetricValue;
}

export interface OverviewData {
  totalUsers: number;
  newUsers: number;
  downloads: Segment[];
  contentAdded: Segment[];
  shares: Segment[];
  shareBreakdown: { platform: string; stats: { label: string; value: number }[] }[];
  galleryDownloads: Segment[];
  galleryTiles: { label: string; value: MetricValue }[];
  shareRequests: { label: string; value: MetricValue }[];
  contentRequests: { label: string; value: MetricValue }[];
}

export function getOverview(range: InsightsRange): OverviewData {
  const { days } = rangeBounds(range);
  const newUsers = Math.round(days * 0.6 * (0.8 + noise("NewUsers", range) * 0.4));
  const insta = metric("InstagramShares", 22, range);
  const x = metric("XShares", 9, range);
  const fb = metric("FacebookShares", 11, range);
  const other = metric("OtherShares", 4, range);
  const k = (n: number) => Math.round(n);

  return {
    totalUsers: 1284,
    newUsers,
    downloads: [
      { key: "videos", label: "Videos", value: metric("VideosDownloaded", 38, range) },
      { key: "images", label: "Images", value: metric("ImagesDownloaded", 142, range) },
    ],
    contentAdded: [
      { key: "videos", label: "Videos", value: metric("VideosCreated", 21, range) },
      { key: "images", label: "Images", value: metric("ImagesCreated", 96, range) },
    ],
    shares: [
      { key: "instagram", label: "Instagram", value: insta },
      { key: "x", label: "X", value: x },
      { key: "facebook", label: "Facebook", value: fb },
      { key: "other", label: "Additional Platforms", value: other },
    ],
    shareBreakdown: [
      { platform: "*Instagram", stats: [
        { label: "Likes", value: k(insta.current * 412) },
        { label: "Views", value: k(insta.current * 5230) },
        { label: "Comments", value: k(insta.current * 18) },
      ] },
      { platform: "X", stats: [
        { label: "Likes", value: k(x.current * 96) },
        { label: "Reposts", value: k(x.current * 14) },
      ] },
      { platform: "Facebook", stats: [
        { label: "Likes", value: k(fb.current * 133) },
        { label: "Comments", value: k(fb.current * 9) },
        { label: "Shares", value: k(fb.current * 6) },
      ] },
      { platform: "Additional Platforms", stats: [] },
    ],
    galleryDownloads: [
      { key: "videos", label: "Videos", value: metric("GalleryVideosDownloaded", 14, range) },
      { key: "images", label: "Images", value: metric("GalleryImagesDownloaded", 61, range) },
    ],
    galleryTiles: [
      { label: "Galleries Shared", value: metric("GalleriesShared", 3, range) },
      { label: "Assets Added", value: metric("GalleryAssetsAdded", 88, range) },
      { label: "Asset Views", value: metric("GalleryAssetViews", 640, range) },
      { label: "Tracked Shares", value: metric("GalleryTrackedShares", 12, range) },
    ],
    shareRequests: [
      { label: "Sent", value: metric("ShareRequestOpportunitiesSent", 40, range) },
      { label: "Fulfilled", value: metric("ShareRequestOpportunitiesFulfilled", 17, range) },
    ],
    contentRequests: [
      { label: "Sent", value: metric("MediaRequestOpportunitiesSent", 25, range) },
      { label: "Fulfilled", value: metric("MediaRequestOpportunitiesFulfilled", 11, range) },
    ],
  };
}

export type TopUsersMetric = "downloads" | "shares" | "uploads" | "views";

export const TOP_USERS_METRICS: { value: TopUsersMetric; label: string }[] = [
  { value: "downloads", label: "Downloads" },
  { value: "shares", label: "Shares" },
  { value: "uploads", label: "Uploads" },
  { value: "views", label: "Views" },
];

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface UserMetricsRow {
  user: User;
  downloads: number;
  shares: number;
  uploads: number;
  views: number;
  shareRequestsSent: number;
  shareRequestsFulfilled: number;
  shareRequestPct: number | null;
  contentRequestsSent: number;
  contentRequestsFulfilled: number;
  contentRequestPct: number | null;
  galleriesShared: number;
  galleryAssets: number;
  galleryViews: number;
  galleryDownloads: number;
  galleryShares: number;
}

const pct = (part: number, whole: number) => (whole === 0 ? null : Math.round((part / whole) * 100));

export function getUserMetrics(range: InsightsRange): UserMetricsRow[] {
  const { days } = rangeBounds(range);
  return mockUsers.map((user) => {
    // Some users are power users, most are occasional — skew with a square.
    const activity = Math.pow(noise(user.id, "activity"), 2);
    const n = (salt: string, perDay: number) => Math.round(perDay * days * activity * (0.5 + noise(user.id, `${salt}-${range}`)));
    const shareRequestsSent = n("srs", 0.8);
    const contentRequestsSent = n("crs", 0.5);
    const shareRequestsFulfilled = Math.round(shareRequestsSent * noise(user.id, "srf"));
    const contentRequestsFulfilled = Math.round(contentRequestsSent * noise(user.id, "crf"));
    return {
      user,
      downloads: n("dl", 6),
      shares: n("sh", 1.4),
      uploads: n("up", 3),
      views: n("vw", 40),
      shareRequestsSent,
      shareRequestsFulfilled,
      shareRequestPct: pct(shareRequestsFulfilled, shareRequestsSent),
      contentRequestsSent,
      contentRequestsFulfilled,
      contentRequestPct: pct(contentRequestsFulfilled, contentRequestsSent),
      galleriesShared: n("gs", 0.15),
      galleryAssets: n("ga", 2.2),
      galleryViews: n("gv", 18),
      galleryDownloads: n("gd", 2.5),
      galleryShares: n("gsh", 0.6),
    };
  });
}

export function getUsersTiles(range: InsightsRange) {
  return {
    counts: [
      { label: "Total Uploads", value: metric("TotalUploads", 117, range) },
      { label: "Total Downloads", value: metric("TotalDownloads", 180, range) },
      { label: "Total Shares", value: metric("TotalShares", 46, range) },
    ],
    // Percentages: current/previous are whole percents.
    percents: [
      { label: "Share Request Fulfillment", value: { current: 43, previous: 38 } },
      { label: "Content Request Fulfillment", value: { current: 44, previous: 47 } },
      { label: "Gallery Engagement", value: { current: 61, previous: 58 } },
    ],
  };
}

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------

export type ActivityEntity =
  | "Announcement"
  | "Campaign"
  | "Content Request"
  | "Engage Campaign"
  | "Gallery"
  | "Group"
  | "Invite Code"
  | "Media"
  | "Request"
  | "Share"
  | "Share Request";

/** Prod's "Activity Includes" list, in its order. */
export const ACTIVITY_ENTITIES: ActivityEntity[] = [
  "Announcement", "Campaign", "Content Request", "Engage Campaign", "Gallery", "Group",
  "Invite Code", "Media", "Request", "Share", "Share Request",
];

export type ActivityCategory = "Content" | "Sharing" | "Requests" | "Users & Groups" | "Messaging";

interface EventTemplate {
  event: string;
  category: ActivityCategory;
  entity: ActivityEntity;
  icon: string;
  describe: (subject: string) => string;
}

const EVENT_TEMPLATES: EventTemplate[] = [
  { event: "Media Uploaded", category: "Content", entity: "Media", icon: "bi-cloud-arrow-up", describe: (s) => `uploaded ${s}` },
  { event: "Media Downloaded", category: "Content", entity: "Media", icon: "bi-download", describe: (s) => `downloaded ${s}` },
  { event: "Gallery Created", category: "Content", entity: "Gallery", icon: "bi-images", describe: (s) => `created the gallery ${s}` },
  { event: "Gallery Shared", category: "Sharing", entity: "Gallery", icon: "bi-share", describe: (s) => `shared the gallery ${s}` },
  { event: "Share Verified", category: "Sharing", entity: "Share", icon: "bi-patch-check", describe: (s) => `posted ${s} to Instagram` },
  { event: "Share Initiated", category: "Sharing", entity: "Share", icon: "bi-send", describe: (s) => `started a share of ${s}` },
  { event: "Share Request Sent", category: "Requests", entity: "Share Request", icon: "bi-megaphone", describe: (s) => `sent a share request for ${s}` },
  { event: "Content Request Fulfilled", category: "Requests", entity: "Content Request", icon: "bi-camera", describe: (s) => `fulfilled a content request with ${s}` },
  { event: "Request Created", category: "Requests", entity: "Request", icon: "bi-card-checklist", describe: (s) => `created the request “${s}”` },
  { event: "Campaign Delivered", category: "Requests", entity: "Campaign", icon: "bi-layers", describe: (s) => `delivered the campaign “${s}”` },
  { event: "Engage Submission", category: "Content", entity: "Engage Campaign", icon: "bi-person-heart", describe: (s) => `received a fan submission for ${s}` },
  { event: "User Joined Group", category: "Users & Groups", entity: "Group", icon: "bi-people", describe: (s) => `joined ${s}` },
  { event: "Invite Code Redeemed", category: "Users & Groups", entity: "Invite Code", icon: "bi-ticket", describe: (s) => `joined with invite code ${s}` },
  { event: "Announcement Sent", category: "Messaging", entity: "Announcement", icon: "bi-broadcast", describe: (s) => `sent the announcement “${s}”` },
];

const SUBJECTS: Record<ActivityEntity, string[]> = {
  Media: ["tunnel_walk_4412.jpg", "q1_highlight_reel_218.mov", "crowd_reaction_7730.jpg", "postgame_interview_904.mov"],
  Gallery: mockGalleries.slice(0, 6).map((g) => g.name),
  Share: ["bench_celebration_2291.jpg", "warmups_sideline_1180.jpg", "sideline_iso_cam_551.mov"],
  "Share Request": ["Home Opener Hype", "Playoff Push"],
  "Content Request": ["drone_stadium_flyover_77.mov", "locker_room_huddle_3310.jpg"],
  Request: ["Sponsor Night Selects", "Community Day Recap"],
  Campaign: ["Rivalry Week", "Season Ticket Renewals"],
  "Engage Campaign": ["Fan Cam: Home Opener", "Tailgate Tuesday"],
  Group: ["Social Media Team", "Creative Team", "Marketing Team"],
  "Invite Code": ["ZEPHYR-2026", "MEDIA-DAY"],
  Announcement: ["Media day moved to Friday", "New brand guidelines"],
};

export interface ActivityEvent {
  id: string;
  timestamp: Date;
  event: string;
  category: ActivityCategory;
  entity: ActivityEntity;
  icon: string;
  user: User;
  groupName: string | null;
  description: string;
}

export const mockActivityEvents: ActivityEvent[] = Array.from({ length: 140 }, (_, i) => {
  const template = EVENT_TEMPLATES[Math.floor(noise(`evt-${i}`, "template") * EVENT_TEMPLATES.length)];
  const user = mockUsers[Math.floor(noise(`evt-${i}`, "user") * mockUsers.length)];
  const subjects = SUBJECTS[template.entity];
  const subject = subjects[Math.floor(noise(`evt-${i}`, "subject") * subjects.length)];
  const timestamp = new Date();
  // Denser recently, thinning out over ~120 days.
  timestamp.setMinutes(timestamp.getMinutes() - Math.round(Math.pow(i, 1.6) * 30 + noise(`evt-${i}`, "jitter") * 45));
  return {
    id: `evt-${i}`,
    timestamp,
    event: template.event,
    category: template.category,
    entity: template.entity,
    icon: template.icon,
    user,
    groupName: user.groups[0]?.name ?? null,
    description: template.describe(subject),
  };
});

export const ACTIVITY_CATEGORIES: ActivityCategory[] = ["Content", "Sharing", "Requests", "Users & Groups", "Messaging"];
export const ACTIVITY_EVENT_NAMES = [...new Set(EVENT_TEMPLATES.map((t) => t.event))].sort();

// ---------------------------------------------------------------------------
// Social shares
// ---------------------------------------------------------------------------

export type SharePlatform = "Instagram" | "X" | "Facebook" | "TikTok" | "LinkedIn" | "Threads";
export const SHARE_PLATFORMS: SharePlatform[] = ["Instagram", "X", "Facebook", "TikTok", "LinkedIn", "Threads"];

export const PLATFORM_ICONS: Record<SharePlatform, string> = {
  Instagram: "bi-instagram",
  X: "bi-twitter-x",
  Facebook: "bi-facebook",
  TikTok: "bi-tiktok",
  LinkedIn: "bi-linkedin",
  Threads: "bi-threads",
};

export type ShareAssetType = "Video" | "Image" | "Text (Links)";

export interface SocialShare {
  id: string;
  status: "SHARED" | "INITIATED";
  shared: Date;
  platform: SharePlatform;
  user: User;
  socialAccount: string;
  socialLink: string | null;
  requested: boolean;
  assetType: ShareAssetType;
  assetName: string;
  thumbnailUrl: string;
  caption: string;
  assetCount: number;
  downloadCount: number;
  likes: number;
  comments: number;
  followers: number;
  reshares: number;
  views: number;
}

const CAPTIONS = [
  "Game day energy ⚡️ #ZephyrUp",
  "That finish though 🔥",
  "Home opener vibes. Thank you fans!",
  "Behind the scenes at media day 📸",
  "Locked in for the playoff push",
  "Big W tonight 🙌",
  "Community day was one for the books",
];

export const mockSocialShares: SocialShare[] = Array.from({ length: 96 }, (_, i) => {
  const r = (salt: string) => noise(`share-${i}`, salt);
  const user = mockUsers[Math.floor(r("user") * mockUsers.length)];
  const platform = SHARE_PLATFORMS[Math.floor(Math.pow(r("platform"), 1.7) * SHARE_PLATFORMS.length)];
  const status = r("status") < 0.62 ? "SHARED" : "INITIATED";
  const assetType: ShareAssetType = r("type") < 0.55 ? "Image" : r("type") < 0.9 ? "Video" : "Text (Links)";
  const followers = Math.round(800 + Math.pow(r("followers"), 3) * 240000);
  const reach = followers * (0.02 + r("reach") * 0.2);
  const shared = new Date();
  shared.setHours(shared.getHours() - Math.round(Math.pow(i, 1.5) * 9 + r("jitter") * 6));
  const handle = user.name.toLowerCase().replace(/[^a-z]+/g, "");
  const hasLink = status === "SHARED" || r("link") < 0.3;
  const engaged = status === "SHARED" || hasLink;
  return {
    id: `share-${i}`,
    status,
    shared,
    platform,
    user,
    socialAccount: `@${handle}`,
    socialLink: hasLink ? `https://${platform.toLowerCase()}.com/${handle}/p/${(i * 7919).toString(36)}` : null,
    requested: r("requested") < 0.45,
    assetType,
    assetName: assetType === "Text (Links)" ? "zephyr.com/tickets" : `${["tunnel_walk", "bench_celebration", "q1_highlight", "crowd_reaction"][i % 4]}_${1000 + i}.${assetType === "Video" ? "mov" : "jpg"}`,
    thumbnailUrl: `https://picsum.photos/seed/share${i}/96/96`,
    caption: CAPTIONS[i % CAPTIONS.length],
    assetCount: assetType === "Text (Links)" ? 0 : 1 + Math.floor(r("assets") * 3),
    downloadCount: 1 + Math.floor(r("downloads") * 4),
    likes: engaged ? Math.round(reach * 0.08) : 0,
    comments: engaged ? Math.round(reach * 0.004) : 0,
    followers,
    reshares: engaged ? Math.round(reach * 0.006) : 0,
    views: engaged ? Math.round(reach) : 0,
  };
});

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString("en-US");
}

export const formatNumber = (n: number) => n.toLocaleString("en-US");

export function formatRange(range: InsightsRange): string {
  const { from, until } = rangeBounds(range);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${from.toLocaleDateString("en-US", opts)} – ${until.toLocaleDateString("en-US", opts)}`;
}
