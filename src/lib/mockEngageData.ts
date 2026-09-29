/**
 * Mock Engage data. Shapes follow prod's `core/engage/engage.model.ts`:
 * fan-engagement MediaRequests (Campaigns tab), EngageTheme (Themes tab) and
 * EngageDefaultTOS (Settings tab).
 */

import { mockGalleries } from "@/lib/mockFolderData";

const daysAgo = (days: number, hour = 11) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const gallery = (id: string) => {
  const g = mockGalleries.find((m) => m.id === id);
  return { id, name: g?.name ?? id };
};

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export interface EngageCampaign {
  id: string;
  /** Public fan-submission URL; the table shows its last path segment. */
  attachmentUrl: string;
  /** Campaign title (prod field name: `content`). */
  content: string;
  instructions: string;
  mediaRequested: "PHOTO" | "VIDEO" | "ANY";
  gallery: { id: string; name: string } | null;
  totalResponses: number;
  createdBy: string;
  created: Date;
  expires: Date | null;
  expired: boolean;
}

export const MEDIA_REQUESTED_LABELS: Record<EngageCampaign["mediaRequested"], string> = {
  PHOTO: "Photos",
  VIDEO: "Videos",
  ANY: "Photos & Videos",
};

export const campaignSlug = (c: EngageCampaign) => c.attachmentUrl.split("/").filter(Boolean).pop() ?? "";

const campaign = (
  i: number,
  slug: string,
  over: Omit<EngageCampaign, "id" | "attachmentUrl" | "expired" | "expires"> & { expiresDaysAgo?: number },
): EngageCampaign => {
  const { expiresDaysAgo, ...rest } = over;
  return {
    id: `engage-${i}`,
    attachmentUrl: `https://engage.greenfly.com/zephyr/${slug}`,
    expired: expiresDaysAgo !== undefined,
    expires: expiresDaysAgo !== undefined ? daysAgo(expiresDaysAgo) : null,
    ...rest,
  };
};

export const mockEngageCampaigns: EngageCampaign[] = [
  campaign(1, "fan-cam-home-opener", {
    content: "Fan Cam: Home Opener",
    instructions: "Share your best photos and videos from the home opener. Selected submissions will appear on the videoboard during the second half.",
    mediaRequested: "ANY", gallery: gallery("big-moments"), totalResponses: 184, createdBy: "Amber Chen", created: daysAgo(2),
  }),
  campaign(2, "kids-day-drawings", {
    content: "Kids Day Drawings",
    instructions: "Parents: upload a photo of your child's drawing of their favorite player. We'll feature our favorites on social.",
    mediaRequested: "PHOTO", gallery: gallery("kids-day"), totalResponses: 57, createdBy: "Priya Natarajan", created: daysAgo(6),
  }),
  campaign(3, "tailgate-tuesday", {
    content: "Tailgate Tuesday",
    instructions: "Show us your tailgate setup. Grills, flags, face paint — all of it.",
    mediaRequested: "PHOTO", gallery: gallery("halftime-shows"), totalResponses: 312, createdBy: "Marcus Webb", created: daysAgo(11),
  }),
  campaign(4, "watch-party-reactions", {
    content: "Watch Party Reactions",
    instructions: "Film your reaction to the final two minutes. Keep it under 30 seconds and please no profanity.",
    mediaRequested: "VIDEO", gallery: gallery("rebounds-reels"), totalResponses: 41, createdBy: "Amber Chen", created: daysAgo(19),
  }),
  campaign(5, "anthem-singers-2026", {
    content: "Anthem Singer Auditions",
    instructions: "Submit a video of yourself performing the national anthem, unaccompanied, in one continuous take.",
    mediaRequested: "VIDEO", gallery: null, totalResponses: 0, createdBy: "Jordan Price", created: daysAgo(1),
  }),
  campaign(6, "playoff-signs", {
    content: "Playoff Signs",
    instructions: "Upload a photo of your homemade playoff sign. The most creative sign each round wins signed merchandise.",
    mediaRequested: "PHOTO", gallery: gallery("autograph-signings"), totalResponses: 228, createdBy: "Marcus Webb", created: daysAgo(140), expiresDaysAgo: 110,
  }),
  campaign(7, "season-ticket-stories", {
    content: "Season Ticket Holder Stories",
    instructions: "Tell us how long you've held season tickets and share a photo from your seats.",
    mediaRequested: "PHOTO", gallery: gallery("scoring-highlights"), totalResponses: 96, createdBy: "Priya Natarajan", created: daysAgo(90), expiresDaysAgo: 60,
  }),
  campaign(8, "holiday-sweaters", {
    content: "Ugly Holiday Sweater Contest",
    instructions: "Wear team colors, the uglier the better. One photo per entry.",
    mediaRequested: "PHOTO", gallery: gallery("film-sessions"), totalResponses: 143, createdBy: "Jordan Price", created: daysAgo(280), expiresDaysAgo: 265,
  }),
  campaign(9, "draft-night-predictions", {
    content: "Draft Night Predictions",
    instructions: "Record a 15-second video with your first-round pick prediction.",
    mediaRequested: "VIDEO", gallery: gallery("scrimmage-footage"), totalResponses: 22, createdBy: "Amber Chen", created: daysAgo(35),
  }),
];

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

export interface EngageTheme {
  id: string;
  name: string;
  default: boolean;
  foregroundColor: string;
  backgroundColor: string;
  ctaForegroundColor: string;
  ctaBackgroundColor: string;
  bannerColor: string;
}

export type ThemeColorKey = "foregroundColor" | "backgroundColor" | "ctaForegroundColor" | "ctaBackgroundColor" | "bannerColor";

/** Prod's swatch order and labels. */
export const THEME_COLOR_FIELDS: { key: ThemeColorKey; label: string }[] = [
  { key: "foregroundColor", label: "Text Color" },
  { key: "backgroundColor", label: "Background Color" },
  { key: "ctaForegroundColor", label: "Button Text Color" },
  { key: "ctaBackgroundColor", label: "Button and Link Color" },
  { key: "bannerColor", label: "Cover Background Color" },
];

export const mockEngageThemes: EngageTheme[] = [
  { id: "theme-1", name: "Zephyr Home", default: true, foregroundColor: "#12263F", backgroundColor: "#FFFFFF", ctaForegroundColor: "#FFFFFF", ctaBackgroundColor: "#2C7BE5", bannerColor: "#12263F" },
  { id: "theme-2", name: "Night Game", default: false, foregroundColor: "#F9FBFD", backgroundColor: "#0B1526", ctaForegroundColor: "#0B1526", ctaBackgroundColor: "#F6C343", bannerColor: "#1F2F4A" },
  { id: "theme-3", name: "Pink Out", default: false, foregroundColor: "#3B0A24", backgroundColor: "#FFF4F8", ctaForegroundColor: "#FFFFFF", ctaBackgroundColor: "#E83E8C", bannerColor: "#F7C6DA" },
  { id: "theme-4", name: "Community Green", default: false, foregroundColor: "#0F2E1D", backgroundColor: "#F3FAF6", ctaForegroundColor: "#FFFFFF", ctaBackgroundColor: "#00A76F", bannerColor: "#CDEBDC" },
];

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface EngageDefaultTOS {
  termsOfService: string;
  termsOfServiceDate: Date | null;
}

export const mockEngageDefaultTOS: EngageDefaultTOS = {
  termsOfService:
    "By submitting content you confirm you own it or have permission to share it, and you grant Zephyr Inc a non-exclusive license to use it across team channels.",
  termsOfServiceDate: daysAgo(120),
};
