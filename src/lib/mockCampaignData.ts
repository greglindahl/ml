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
