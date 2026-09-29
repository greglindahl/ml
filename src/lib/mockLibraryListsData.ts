/**
 * Mock data for Library › Branding and Library › Workflows. Shapes follow
 * prod's `core/library/branding.model.ts` (BrandingPackage) and
 * `core/library/workflow.model.ts` (Workflow).
 */

const daysAgo = (days: number, hour = 11) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

export interface BrandingPackage {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  created: Date;
  totalAssetsBranded: number;
}

export const mockBrandingPackages: BrandingPackage[] = [
  { id: "brand-1", title: "Game Day Frame", description: "Primary logo lockup bottom-right with the game day bar.", createdBy: "Maya Chen", created: daysAgo(2), totalAssetsBranded: 1284 },
  { id: "brand-2", title: "Sponsor: Summit Bank", description: "Presenting-partner watermark for sponsored posts.", createdBy: "Jordan Ellis", created: daysAgo(6), totalAssetsBranded: 412 },
  { id: "brand-3", title: "Playoffs 2026", description: "Playoff wordmark and gold border.", createdBy: "Maya Chen", created: daysAgo(11), totalAssetsBranded: 2310 },
  { id: "brand-4", title: "Player Spotlight", description: "Name plate lower third with jersey number.", createdBy: "Priya Natarajan", created: daysAgo(19), totalAssetsBranded: 736 },
  { id: "brand-5", title: "Vertical Stories", description: "9:16 safe-area logo for stories and reels.", createdBy: "Sam Okafor", created: daysAgo(27), totalAssetsBranded: 958 },
  { id: "brand-6", title: "Community Night", description: "", createdBy: "Jordan Ellis", created: daysAgo(40), totalAssetsBranded: 88 },
  { id: "brand-7", title: "Throwback Thursday", description: "Retro wordmark and film-grain frame.", createdBy: "Priya Natarajan", created: daysAgo(63), totalAssetsBranded: 164 },
  { id: "brand-8", title: "Clean Watermark", description: "Small monochrome mark only, for press use.", createdBy: "Sam Okafor", created: daysAgo(120), totalAssetsBranded: 5402 },
];

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------

/** Prod's statuses minus DELETED and SCHEDULED, which the list never shows. */
export type WorkflowStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export const WORKFLOW_STATUS_CONFIG: Record<WorkflowStatus, { label: string; tone: "secondary" | "success" | "warning" }> = {
  DRAFT: { label: "Draft", tone: "secondary" },
  ACTIVE: { label: "Active", tone: "success" },
  ARCHIVED: { label: "Archived", tone: "warning" },
};

export interface Workflow {
  id: string;
  name: string;
  status: WorkflowStatus;
  description: string;
  createdBy: string;
  created: Date;
  galleryCount: number;
}

export const mockWorkflows: Workflow[] = [
  { id: "wf-1", name: "Social Team Approval", status: "ACTIVE", description: "Social lead signs off before assets go to the content hub.", createdBy: "Maya Chen", created: daysAgo(3), galleryCount: 6 },
  { id: "wf-2", name: "Legal Review: Sponsored", status: "ACTIVE", description: "Partnerships, then legal, for anything with a sponsor mark.", createdBy: "Jordan Ellis", created: daysAgo(9), galleryCount: 3 },
  { id: "wf-3", name: "Player Likeness Check", status: "DRAFT", description: "", createdBy: "Priya Natarajan", created: daysAgo(14), galleryCount: 0 },
  { id: "wf-4", name: "Photo Desk Two-Step", status: "ACTIVE", description: "Photo editor selects, comms approves.", createdBy: "Sam Okafor", created: daysAgo(22), galleryCount: 11 },
  { id: "wf-5", name: "Playoffs Rush", status: "DRAFT", description: "Single-approver fast lane for playoff nights.", createdBy: "Maya Chen", created: daysAgo(31), galleryCount: 0 },
  { id: "wf-6", name: "2025 Season Approvals", status: "ARCHIVED", description: "Last season's approval chain.", createdBy: "Jordan Ellis", created: daysAgo(210), galleryCount: 14 },
  { id: "wf-7", name: "Broadcast Clips", status: "ACTIVE", description: "Broadcast producer approves game clips.", createdBy: "Priya Natarajan", created: daysAgo(48), galleryCount: 4 },
];
