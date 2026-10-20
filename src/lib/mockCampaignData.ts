// Mock campaign data for Requests page

export interface CampaignUser {
  id: string;
  name: string;
  initials: string;
}

export type CampaignStatus = "draft" | "scheduled" | "delivered" | "completed" | "expired";

export interface Campaign {
  id: string;
  name: string;
  thumbnailUrl?: string;
  status: CampaignStatus;
  statusDate: Date;
  requestType: string;
  creator: CampaignUser;
  createdDate: Date;
  assignees: CampaignUser[];
  recipients: CampaignUser[];
  lastModifiedBy?: CampaignUser;
  lastModifiedDate?: Date;
  lastNote?: string;
  views: number;
  shares: number;
}

// Mock users
const users: CampaignUser[] = [
  { id: "kb", name: "Katha Bickel-Halbig", initials: "KB" },
  { id: "ff", name: "Florian Frohnhoefer", initials: "FF" },
  { id: "js", name: "John Smith", initials: "JS" },
  { id: "ap", name: "Alex Patel", initials: "AP" },
  { id: "mc", name: "Maria Chen", initials: "MC" },
  { id: "rj", name: "Ryan Johnson", initials: "RJ" },
];

// Mock campaigns data
export const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "SL 72",
    thumbnailUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=128&h=128&fit=crop",
    status: "draft",
    statusDate: new Date("2025-01-15T12:00:00"),
    requestType: "Create and Post to Social",
    creator: users[0],
    createdDate: new Date("2025-01-15T12:00:00"),
    assignees: [users[1]],
    recipients: [users[2], users[3]],
    lastModifiedBy: users[4],
    lastModifiedDate: new Date("2025-01-15T12:00:00"),
    lastNote: "Awaiting approval from marketing team",
    views: 0,
    shares: 0,
  },
  {
    id: "2",
    name: "Messi Bad Bunny Gazelle",
    status: "scheduled",
    statusDate: new Date("2025-01-31T12:00:00"),
    requestType: "Product Launch",
    creator: users[0],
    createdDate: new Date("2025-01-15T12:00:00"),
    assignees: [users[1]],
    recipients: [users[2], users[3]],
    lastModifiedBy: users[4],
    lastModifiedDate: new Date("2025-01-15T12:00:00"),
    lastNote: "Ready for launch",
    views: 0,
    shares: 0,
  },
  {
    id: "3",
    name: "WB Superstar",
    status: "delivered",
    statusDate: new Date("2025-01-14T12:00:00"),
    requestType: "Influencer Collaboration",
    creator: users[1],
    createdDate: new Date("2025-01-15T12:00:00"),
    assignees: [users[2], users[3]],
    recipients: [users[0], users[4]],
    lastModifiedBy: users[5],
    lastModifiedDate: new Date("2025-01-15T12:00:00"),
    lastNote: "Content delivered successfully",
    views: 0,
    shares: 0,
  },
  {
    id: "4",
    name: "Y-3 Leather",
    status: "completed",
    statusDate: new Date("2024-12-21T12:00:00"),
    requestType: "Seasonal Campaign",
    creator: users[0],
    createdDate: new Date("2024-12-15T12:00:00"),
    assignees: [users[1], users[2]],
    recipients: [users[3], users[4]],
    lastModifiedBy: users[5],
    lastModifiedDate: new Date("2025-01-15T12:00:00"),
    lastNote: "Campaign concluded",
    views: 0,
    shares: 2,
  },
  {
    id: "5",
    name: "Clot Superstar",
    status: "expired",
    statusDate: new Date("2024-12-16T12:00:00"),
    requestType: "Limited Edition",
    creator: users[0],
    createdDate: new Date("2024-12-15T12:00:00"),
    assignees: [users[1], users[2]],
    recipients: [users[3], users[4]],
    lastModifiedBy: users[5],
    lastModifiedDate: new Date("2025-01-15T12:00:00"),
    lastNote: "Campaign expired",
    views: 0,
    shares: 0,
  },
  {
    id: "6",
    name: "Forum Low 84",
    thumbnailUrl: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=128&h=128&fit=crop",
    status: "draft",
    statusDate: new Date("2025-01-16T09:00:00"),
    requestType: "Create and Post to Social",
    creator: users[1],
    createdDate: new Date("2025-01-16T09:00:00"),
    assignees: [users[0]],
    recipients: [users[2]],
    lastModifiedBy: users[1],
    lastModifiedDate: new Date("2025-01-16T09:30:00"),
    lastNote: "Initial draft created",
    views: 5,
    shares: 0,
  },
  {
    id: "7",
    name: "Retro Runner Collection",
    status: "scheduled",
    statusDate: new Date("2025-02-01T10:00:00"),
    requestType: "Product Launch",
    creator: users[2],
    createdDate: new Date("2025-01-10T14:00:00"),
    assignees: [users[0], users[1]],
    recipients: [users[3], users[4], users[5]],
    lastModifiedBy: users[0],
    lastModifiedDate: new Date("2025-01-14T16:00:00"),
    lastNote: "Final review pending",
    views: 12,
    shares: 3,
  },
  {
    id: "8",
    name: "Stan Smith Sustainability",
    thumbnailUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=128&h=128&fit=crop",
    status: "delivered",
    statusDate: new Date("2025-01-12T11:00:00"),
    requestType: "Brand Awareness",
    creator: users[3],
    createdDate: new Date("2025-01-05T08:00:00"),
    assignees: [users[4]],
    recipients: [users[0], users[1]],
    lastModifiedBy: users[4],
    lastModifiedDate: new Date("2025-01-12T11:30:00"),
    views: 45,
    shares: 8,
  },
];

// Helper to get unique creators for filter dropdown
export function getUniqueCampaignCreators(): CampaignUser[] {
  const creatorMap = new Map<string, CampaignUser>();
  mockCampaigns.forEach(campaign => {
    creatorMap.set(campaign.creator.id, campaign.creator);
  });
  return Array.from(creatorMap.values());
}

// Helper to format status display
export function formatCampaignStatus(status: CampaignStatus): string {
  const statusMap: Record<CampaignStatus, string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    delivered: "Delivered",
    completed: "Completed",
    expired: "Expired",
  };
  return statusMap[status];
}

// Helper to format date
export function formatCampaignDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Request types
export type RequestStatus = "draft" | "scheduled" | "delivered" | "completed" | "expired";

export interface Request {
  id: string;
  name: string;
  thumbnailUrl?: string;
  status: RequestStatus;
  statusDate: Date;
  requestType: string;
  campaignId?: string;
  campaignName?: string;
  creator: CampaignUser;
  createdDate: Date;
  assignees: CampaignUser[];
  recipients: CampaignUser[];
  lastModifiedBy?: CampaignUser;
  lastModifiedDate?: Date;
  lastNote?: string;
  views: number;
  shares: number;
}

// Mock requests data
export const mockRequests: Request[] = [
  {
    id: "r1",
    name: "Summer Collection Photoshoot",
    thumbnailUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=128&h=128&fit=crop",
    status: "draft",
    statusDate: new Date("2025-01-15T12:00:00"),
    requestType: "Create and Post to Social",
    campaignId: "1",
    campaignName: "SL 72",
    creator: users[0],
    createdDate: new Date("2025-01-15T12:00:00"),
    assignees: [users[1]],
    recipients: [users[2], users[3]],
    lastModifiedBy: users[4],
    lastModifiedDate: new Date("2025-01-15T14:30:00"),
    lastNote: "Awaiting approval from marketing team",
    views: 12,
    shares: 0,
  },
  {
    id: "r2",
    name: "Product Launch Video",
    status: "scheduled",
    statusDate: new Date("2025-01-31T12:00:00"),
    requestType: "Video Production",
    campaignId: "2",
    campaignName: "Messi Bad Bunny Gazelle",
    creator: users[0],
    createdDate: new Date("2025-01-15T12:00:00"),
    assignees: [users[1]],
    recipients: [users[2], users[3]],
    lastModifiedBy: users[4],
    lastModifiedDate: new Date("2025-01-16T09:00:00"),
    lastNote: "Ready for launch",
    views: 45,
    shares: 3,
  },
  {
    id: "r3",
    name: "Influencer Collaboration Brief",
    status: "delivered",
    statusDate: new Date("2025-01-14T12:00:00"),
    requestType: "Influencer Collaboration",
    campaignId: "3",
    campaignName: "WB Superstar",
    creator: users[1],
    createdDate: new Date("2025-01-12T12:00:00"),
    assignees: [users[2], users[3]],
    recipients: [users[0], users[4]],
    lastModifiedBy: users[5],
    lastModifiedDate: new Date("2025-01-14T16:00:00"),
    lastNote: "Content delivered successfully",
    views: 89,
    shares: 12,
  },
  {
    id: "r4",
    name: "Holiday Campaign Assets",
    thumbnailUrl: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=128&h=128&fit=crop",
    status: "completed",
    statusDate: new Date("2024-12-21T12:00:00"),
    requestType: "Seasonal Campaign",
    campaignId: "4",
    campaignName: "Y-3 Leather",
    creator: users[0],
    createdDate: new Date("2024-12-15T12:00:00"),
    assignees: [users[1], users[2]],
    recipients: [users[3], users[4]],
    lastModifiedBy: users[5],
    lastModifiedDate: new Date("2024-12-21T18:00:00"),
    lastNote: "Campaign concluded",
    views: 234,
    shares: 28,
  },
  {
    id: "r5",
    name: "Limited Edition Announcement",
    status: "expired",
    statusDate: new Date("2024-12-16T12:00:00"),
    requestType: "Limited Edition",
    campaignId: "5",
    campaignName: "Clot Superstar",
    creator: users[0],
    createdDate: new Date("2024-12-10T12:00:00"),
    assignees: [users[1], users[2]],
    recipients: [users[3], users[4]],
    lastModifiedBy: users[5],
    lastModifiedDate: new Date("2024-12-16T10:00:00"),
    lastNote: "Campaign expired",
    views: 156,
    shares: 8,
  },
  {
    id: "r6",
    name: "Social Media Content Pack",
    thumbnailUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=128&h=128&fit=crop",
    status: "draft",
    statusDate: new Date("2025-01-16T09:00:00"),
    requestType: "Create and Post to Social",
    campaignId: "6",
    campaignName: "Forum Low 84",
    creator: users[1],
    createdDate: new Date("2025-01-16T09:00:00"),
    assignees: [users[0]],
    recipients: [users[2]],
    lastModifiedBy: users[1],
    lastModifiedDate: new Date("2025-01-16T09:30:00"),
    lastNote: "Initial draft created",
    views: 5,
    shares: 0,
  },
  {
    id: "r7",
    name: "Athlete Partnership Brief",
    status: "scheduled",
    statusDate: new Date("2025-02-01T10:00:00"),
    requestType: "Influencer Collaboration",
    campaignId: "7",
    campaignName: "Retro Runner Collection",
    creator: users[2],
    createdDate: new Date("2025-01-10T14:00:00"),
    assignees: [users[0], users[1]],
    recipients: [users[3], users[4], users[5]],
    lastModifiedBy: users[0],
    lastModifiedDate: new Date("2025-01-14T16:00:00"),
    lastNote: "Final review pending",
    views: 67,
    shares: 5,
  },
  {
    id: "r8",
    name: "Sustainability Campaign Video",
    status: "delivered",
    statusDate: new Date("2025-01-12T11:00:00"),
    requestType: "Video Production",
    campaignId: "8",
    campaignName: "Stan Smith Sustainability",
    creator: users[3],
    createdDate: new Date("2025-01-05T08:00:00"),
    assignees: [users[4]],
    recipients: [users[0], users[1]],
    lastModifiedBy: users[4],
    lastModifiedDate: new Date("2025-01-12T11:30:00"),
    lastNote: "Video approved and published",
    views: 312,
    shares: 45,
  },
  {
    id: "r9",
    name: "Brand Guidelines Update",
    status: "draft",
    statusDate: new Date("2025-01-17T08:00:00"),
    requestType: "Brand Awareness",
    campaignId: "6",
    campaignName: "Forum Low 84",
    creator: users[4],
    createdDate: new Date("2025-01-17T08:00:00"),
    assignees: [users[0], users[1], users[2]],
    recipients: [users[3], users[5]],
    lastModifiedBy: users[4],
    lastModifiedDate: new Date("2025-01-17T08:00:00"),
    lastNote: "New brand guidelines for Q1",
    views: 3,
    shares: 0,
  },
  {
    id: "r10",
    name: "Event Coverage Request",
    status: "scheduled",
    statusDate: new Date("2025-02-15T09:00:00"),
    requestType: "Event Coverage",
    campaignId: "7",
    campaignName: "Retro Runner Collection",
    creator: users[5],
    createdDate: new Date("2025-01-08T11:00:00"),
    assignees: [users[1]],
    recipients: [users[0], users[2], users[3]],
    lastModifiedBy: users[5],
    lastModifiedDate: new Date("2025-01-15T14:00:00"),
    lastNote: "Venue confirmed, equipment ordered",
    views: 28,
    shares: 2,
  },
  {
    id: "r11",
    name: "SL 72 Street Style Shoot",
    status: "draft",
    statusDate: new Date("2025-01-18T10:00:00"),
    requestType: "Create and Post to Social",
    campaignId: "1",
    campaignName: "SL 72",
    creator: users[2],
    createdDate: new Date("2025-01-18T10:00:00"),
    assignees: [users[0]],
    recipients: [users[3], users[4]],
    lastModifiedBy: users[2],
    lastModifiedDate: new Date("2025-01-18T11:15:00"),
    lastNote: "Shot list in progress",
    views: 4,
    shares: 0,
  },
  {
    id: "r12",
    name: "SL 72 Athlete Unboxing",
    status: "scheduled",
    statusDate: new Date("2025-02-03T09:00:00"),
    requestType: "Video Production",
    campaignId: "1",
    campaignName: "SL 72",
    creator: users[1],
    createdDate: new Date("2025-01-17T13:00:00"),
    assignees: [users[2], users[3]],
    recipients: [users[0], users[5]],
    lastModifiedBy: users[1],
    lastModifiedDate: new Date("2025-01-17T15:40:00"),
    lastNote: "Athletes confirmed for Monday",
    views: 19,
    shares: 1,
  },
  {
    id: "r13",
    name: "Gazelle Behind the Scenes",
    status: "delivered",
    statusDate: new Date("2025-01-20T16:00:00"),
    requestType: "Video Production",
    campaignId: "2",
    campaignName: "Messi Bad Bunny Gazelle",
    creator: users[3],
    createdDate: new Date("2025-01-13T09:30:00"),
    assignees: [users[4]],
    recipients: [users[1], users[2]],
    lastModifiedBy: users[3],
    lastModifiedDate: new Date("2025-01-20T16:30:00"),
    lastNote: "Cut delivered to social team",
    views: 132,
    shares: 17,
  },
  {
    id: "r14",
    name: "Superstar Archive Throwbacks",
    status: "completed",
    statusDate: new Date("2025-01-09T12:00:00"),
    requestType: "Brand Awareness",
    campaignId: "3",
    campaignName: "WB Superstar",
    creator: users[4],
    createdDate: new Date("2025-01-02T10:00:00"),
    assignees: [users[0], users[1]],
    recipients: [users[2], users[5]],
    lastModifiedBy: users[4],
    lastModifiedDate: new Date("2025-01-09T12:20:00"),
    lastNote: "All throwback posts published",
    views: 201,
    shares: 22,
  },
  {
    id: "r15",
    name: "Y-3 Leather Lookbook",
    status: "completed",
    statusDate: new Date("2024-12-19T15:00:00"),
    requestType: "Seasonal Campaign",
    campaignId: "4",
    campaignName: "Y-3 Leather",
    creator: users[5],
    createdDate: new Date("2024-12-12T09:00:00"),
    assignees: [users[3]],
    recipients: [users[0], users[1], users[2]],
    lastModifiedBy: users[5],
    lastModifiedDate: new Date("2024-12-19T15:10:00"),
    lastNote: "Lookbook shared with retail partners",
    views: 178,
    shares: 14,
  },
  {
    id: "r16",
    name: "Clot Superstar Fan Reactions",
    status: "expired",
    statusDate: new Date("2024-12-18T12:00:00"),
    requestType: "Create and Post to Social",
    campaignId: "5",
    campaignName: "Clot Superstar",
    creator: users[2],
    createdDate: new Date("2024-12-11T11:00:00"),
    assignees: [users[4], users[5]],
    recipients: [users[0], users[3]],
    lastModifiedBy: users[2],
    lastModifiedDate: new Date("2024-12-18T09:45:00"),
    lastNote: "Submission window closed",
    views: 94,
    shares: 6,
  },
  {
    id: "r17",
    name: "Stan Smith Recycled Materials Explainer",
    status: "scheduled",
    statusDate: new Date("2025-02-10T11:00:00"),
    requestType: "Brand Awareness",
    campaignId: "8",
    campaignName: "Stan Smith Sustainability",
    creator: users[0],
    createdDate: new Date("2025-01-11T14:00:00"),
    assignees: [users[1], users[3]],
    recipients: [users[2], users[4]],
    lastModifiedBy: users[0],
    lastModifiedDate: new Date("2025-01-16T10:00:00"),
    lastNote: "Script approved, filming next week",
    views: 11,
    shares: 0,
  },
];

// Helper to get unique request creators for filter dropdown
export function getUniqueRequestCreators(): CampaignUser[] {
  const creatorMap = new Map<string, CampaignUser>();
  mockRequests.forEach(request => {
    creatorMap.set(request.creator.id, request.creator);
  });
  return Array.from(creatorMap.values());
}

// Helper to format request status display
export function formatRequestStatus(status: RequestStatus): string {
  const statusMap: Record<RequestStatus, string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    delivered: "Delivered",
    completed: "Completed",
    expired: "Expired",
  };
  return statusMap[status];
}
