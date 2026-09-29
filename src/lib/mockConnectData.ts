/**
 * Mock Connect data. Shapes follow prod's `core/connect/connect.model.ts`:
 * DamImport (Imports tab), PublishWorkflowConfig (Exports), routing rules with
 * tag → gallery mappings, and DamTypeDetails + credential (Integrations).
 * Status labels mirror prod's derived display states, not the raw enums.
 */

import { mockGalleries } from "@/lib/mockFolderData";

export interface ConnectGalleryRef {
  id: string;
  name: string;
}

export type CredentialStatus = "ACTIVE" | "INVALID";

export interface DamCredential {
  id: string;
  name: string;
  damType: string;
  status: CredentialStatus;
  authorizedBy: string;
}

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

export interface Integration {
  damType: string;
  label: string;
  /** Bootstrap icon — stands in for the provider logo. */
  icon: string;
  credential: DamCredential | null;
  /** Box only: connected via Client Credentials Grant. */
  isCcg?: boolean;
}

export type IntegrationStatus = "connected" | "reauthorize" | "not-connected";

export function getIntegrationStatus(integration: Integration): IntegrationStatus {
  if (!integration.credential) return "not-connected";
  return integration.credential.status === "ACTIVE" ? "connected" : "reauthorize";
}

export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  connected: "Connected",
  reauthorize: "Needs Reauthorization",
  "not-connected": "Not Connected",
};

const cred = (damType: string, name: string, authorizedBy: string, status: CredentialStatus = "ACTIVE"): DamCredential => ({
  id: `cred-${damType.toLowerCase()}-${name.toLowerCase().replace(/\W+/g, "-")}`,
  name,
  damType,
  status,
  authorizedBy,
});

export const mockIntegrations: Integration[] = [
  { damType: "BOX", label: "Box", icon: "bi-box", credential: cred("BOX", "Team Box", "Amber Chen"), isCcg: true },
  { damType: "DROPBOX", label: "Dropbox", icon: "bi-dropbox", credential: cred("DROPBOX", "Photo Dept Dropbox", "Marcus Webb") },
  { damType: "SLACK", label: "Slack", icon: "bi-slack", credential: cred("SLACK", "Greenfly Workspace", "Amber Chen") },
  { damType: "GOOGLE_DRIVE", label: "Google Drive", icon: "bi-google", credential: cred("GOOGLE_DRIVE", "Social Team Drive", "Priya Natarajan", "INVALID") },
  { damType: "GOOGLE_PHOTOS", label: "Google Photos", icon: "bi-images", credential: null },
  { damType: "MICROSOFT_TEAMS", label: "Microsoft Teams", icon: "bi-microsoft-teams", credential: null },
  { damType: "ONEDRIVE", label: "OneDrive", icon: "bi-cloud", credential: cred("ONEDRIVE", "Broadcast OneDrive", "Jordan Price") },
  { damType: "FRAME_IO", label: "Frame.io", icon: "bi-film", credential: cred("FRAME_IO", "Post Production", "Marcus Webb", "INVALID") },
  { damType: "BYNDER", label: "Bynder", icon: "bi-collection", credential: null },
  { damType: "CANTO", label: "Canto", icon: "bi-hdd-stack", credential: null },
  { damType: "PHOTOSHELTER", label: "PhotoShelter", icon: "bi-camera", credential: cred("PHOTOSHELTER", "Game Day Archive", "Jordan Price") },
  { damType: "SMUGMUG", label: "SmugMug", icon: "bi-camera2", credential: null },
];

const connectedCredentials = mockIntegrations
  .map((i) => i.credential)
  .filter((c): c is DamCredential => !!c);

const credByType = (damType: string) => connectedCredentials.find((c) => c.damType === damType)!;

export function getDamTypeLabel(damType: string): string {
  return mockIntegrations.find((i) => i.damType === damType)?.label ?? damType;
}

const gallery = (id: string): ConnectGalleryRef => {
  const g = mockGalleries.find((m) => m.id === id);
  return { id, name: g?.name ?? id };
};

const daysAgo = (days: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d;
};

const daysFromNow = (days: number) => daysAgo(-days);

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

export type ImportType = "ONE_TIME" | "POLLING" | "SCHEDULED";
export type ImportRawStatus =
  | "QUEUED"
  | "STARTED"
  | "DOWNLOADING"
  | "FAILED"
  | "COMPLETED"
  | "STOPPED"
  | "ARCHIVED";

export const IMPORT_TYPE_LABELS: Record<ImportType, string> = {
  ONE_TIME: "One-time",
  POLLING: "Polling",
  SCHEDULED: "Scheduled",
};

export interface DamImport {
  id: string;
  type: ImportType;
  credential: DamCredential;
  folderName: string | null;
  tags: string[];
  galleries: ConnectGalleryRef[];
  routingRules: { id: string; name: string }[];
  dateRequested: Date;
  runAfter: Date | null;
  runUntil: Date | null;
  capturedAfter: Date | null;
  capturedBefore: Date | null;
  dateCompleted: Date | null;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  status: ImportRawStatus;
}

/** Prod's Status column: Archived / Paused / Active. */
export type ImportDisplayStatus = "active" | "paused" | "archived";

export function getImportDisplayStatus(imp: DamImport): ImportDisplayStatus {
  if (imp.status === "ARCHIVED") return "archived";
  if (imp.status === "STOPPED") return "paused";
  return "active";
}

export const IMPORT_STATUS_LABELS: Record<ImportDisplayStatus, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

/** Prod's Last Run column, collapsed to filterable buckets. */
export type ImportRunState = "preparing" | "importing" | "completed" | "errors" | "failed";

export function getImportRunState(imp: DamImport): ImportRunState {
  switch (imp.status) {
    case "QUEUED":
    case "STARTED":
      return "preparing";
    case "DOWNLOADING":
      return "importing";
    case "FAILED":
      return "failed";
    default:
      return imp.failedFiles > 0 ? "errors" : "completed";
  }
}

export const IMPORT_RUN_STATE_LABELS: Record<ImportRunState, string> = {
  preparing: "Preparing",
  importing: "Importing",
  completed: "Completed",
  errors: "Completed with errors",
  failed: "Failed",
};

const imp = (i: number, over: Partial<DamImport> & Pick<DamImport, "credential" | "type" | "status">): DamImport => ({
  id: `import-${i}`,
  folderName: null,
  tags: [],
  galleries: [],
  routingRules: [],
  dateRequested: daysAgo(i * 3 + 1),
  runAfter: null,
  runUntil: null,
  capturedAfter: null,
  capturedBefore: null,
  dateCompleted: daysAgo(i),
  totalFiles: 120,
  completedFiles: 120,
  failedFiles: 0,
  ...over,
});

export const mockImports: DamImport[] = [
  imp(1, { credential: credByType("BOX"), type: "POLLING", status: "DOWNLOADING", folderName: "Game Day / 2026-09-27 vs Bulls", galleries: [gallery("scoring-highlights")], totalFiles: 412, completedFiles: 188, dateCompleted: null, runAfter: daysAgo(1), runUntil: daysFromNow(30) }),
  imp(2, { credential: credByType("DROPBOX"), type: "ONE_TIME", status: "COMPLETED", folderName: "Media Day Selects", galleries: [gallery("big-moments"), gallery("autograph-signings")], totalFiles: 86, completedFiles: 86 }),
  imp(3, { credential: credByType("PHOTOSHELTER"), type: "SCHEDULED", status: "COMPLETED", tags: ["postgame", "locker room"], routingRules: [{ id: "rule-1", name: "Postgame routing" }], totalFiles: 240, completedFiles: 231, failedFiles: 9, runAfter: daysAgo(20), runUntil: daysFromNow(60), capturedAfter: daysAgo(40) }),
  imp(4, { credential: credByType("ONEDRIVE"), type: "POLLING", status: "STOPPED", folderName: "Broadcast / B-roll", galleries: [gallery("film-sessions")], totalFiles: 57, completedFiles: 57, runAfter: daysAgo(45), runUntil: daysFromNow(15) }),
  imp(5, { credential: credByType("GOOGLE_DRIVE"), type: "ONE_TIME", status: "FAILED", folderName: "Sponsor Deliverables Q3", galleries: [gallery("halftime-shows")], totalFiles: 34, completedFiles: 0, dateCompleted: daysAgo(2) }),
  imp(6, { credential: credByType("BOX"), type: "ONE_TIME", status: "QUEUED", folderName: "Community / Kids Day", galleries: [gallery("kids-day")], totalFiles: 0, completedFiles: 0, dateRequested: daysAgo(0, 9), dateCompleted: null }),
  imp(7, { credential: credByType("FRAME_IO"), type: "POLLING", status: "COMPLETED", folderName: "Hype Video Cuts", routingRules: [{ id: "rule-3", name: "Video to Film Sessions" }], totalFiles: 18, completedFiles: 18, runAfter: daysAgo(60), runUntil: daysFromNow(5) }),
  imp(8, { credential: credByType("DROPBOX"), type: "SCHEDULED", status: "ARCHIVED", tags: ["practice", "drills", "agility", "shooting", "cardio", "conditioning", "warmups"], galleries: [gallery("shooting-drills"), gallery("agility-drills")], totalFiles: 310, completedFiles: 310, runAfter: daysAgo(120), runUntil: daysAgo(30) }),
  imp(9, { credential: credByType("PHOTOSHELTER"), type: "ONE_TIME", status: "COMPLETED", folderName: "Preseason Archive", galleries: [gallery("scrimmage-footage")], totalFiles: 1204, completedFiles: 1198, failedFiles: 6, dateRequested: daysAgo(75) }),
  imp(10, { credential: credByType("BOX"), type: "POLLING", status: "STARTED", folderName: "Photographers / Uploads", routingRules: [{ id: "rule-2", name: "Player tags" }], totalFiles: 0, completedFiles: 0, dateCompleted: null, runAfter: daysAgo(3), runUntil: daysFromNow(90) }),
  imp(11, { credential: credByType("ONEDRIVE"), type: "ONE_TIME", status: "ARCHIVED", folderName: "2025 Season Recap", galleries: [gallery("scoring-highlights-2024")], totalFiles: 640, completedFiles: 640, dateRequested: daysAgo(200) }),
  imp(12, { credential: credByType("SLACK"), type: "POLLING", status: "COMPLETED", folderName: "#photo-drops", galleries: [gallery("rebounds-reels")], totalFiles: 73, completedFiles: 73, runAfter: daysAgo(10), runUntil: daysFromNow(20) }),
];

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export interface ConnectExport {
  id: string;
  credential: DamCredential | null;
  damType: string;
  sourceGallery: ConnectGalleryRef;
  /** Slack is the only destination prod supports today. */
  destinationChannel: string;
  enabled: boolean;
  created: Date;
  createdBy: string;
}

export type ExportDisplayStatus = "active" | "invalid" | "archived";

export function getExportDisplayStatus(exp: ConnectExport): ExportDisplayStatus {
  if (!exp.enabled) return "archived";
  return exp.credential?.status === "ACTIVE" ? "active" : "invalid";
}

export const EXPORT_STATUS_LABELS: Record<ExportDisplayStatus, string> = {
  active: "Active",
  invalid: "Invalid Credential",
  archived: "Archived",
};

export const mockExports: ConnectExport[] = [
  { id: "export-1", credential: credByType("SLACK"), damType: "SLACK", sourceGallery: gallery("scoring-highlights"), destinationChannel: "#social-team", enabled: true, created: daysAgo(2), createdBy: "Amber Chen" },
  { id: "export-2", credential: credByType("SLACK"), damType: "SLACK", sourceGallery: gallery("big-moments"), destinationChannel: "#game-day-live", enabled: true, created: daysAgo(9), createdBy: "Marcus Webb" },
  { id: "export-3", credential: credByType("SLACK"), damType: "SLACK", sourceGallery: gallery("kids-day"), destinationChannel: "#community", enabled: false, created: daysAgo(48), createdBy: "Priya Natarajan" },
  { id: "export-4", credential: { ...credByType("SLACK"), status: "INVALID" }, damType: "SLACK", sourceGallery: gallery("halftime-shows"), destinationChannel: "#partnerships", enabled: true, created: daysAgo(21), createdBy: "Jordan Price" },
  { id: "export-5", credential: null, damType: "SLACK", sourceGallery: gallery("film-sessions"), destinationChannel: "#coaching-staff", enabled: true, created: daysAgo(64), createdBy: "Marcus Webb" },
  { id: "export-6", credential: credByType("SLACK"), damType: "SLACK", sourceGallery: gallery("autograph-signings"), destinationChannel: "#fan-experience", enabled: true, created: daysAgo(5), createdBy: "Amber Chen" },
];

// ---------------------------------------------------------------------------
// Routing rules
// ---------------------------------------------------------------------------

export interface RoutingRule {
  id: string;
  name: string;
  tagMappings: { tag: string; galleries: ConnectGalleryRef[] }[];
  created: Date;
}

export const mockRoutingRules: RoutingRule[] = [
  { id: "rule-1", name: "Postgame routing", created: daysAgo(3), tagMappings: [
    { tag: "postgame", galleries: [gallery("big-moments")] },
    { tag: "locker room", galleries: [gallery("big-moments"), gallery("film-sessions")] },
  ] },
  { id: "rule-2", name: "Player tags", created: daysAgo(12), tagMappings: [
    { tag: "Lebron James", galleries: [gallery("scoring-highlights")] },
    { tag: "Steph Curry", galleries: [gallery("scoring-highlights"), gallery("rebounds-reels")] },
    { tag: "Kevin Durant", galleries: [gallery("scoring-highlights")] },
  ] },
  { id: "rule-3", name: "Video to Film Sessions", created: daysAgo(30), tagMappings: [
    { tag: "video", galleries: [gallery("film-sessions")] },
  ] },
  { id: "rule-4", name: "Practice sort", created: daysAgo(44), tagMappings: [
    { tag: "shooting", galleries: [gallery("shooting-drills")] },
    { tag: "agility", galleries: [gallery("agility-drills")] },
    { tag: "cardio", galleries: [gallery("cardio-sets")] },
  ] },
  { id: "rule-5", name: "Community events", created: daysAgo(70), tagMappings: [
    { tag: "kids day", galleries: [gallery("kids-day")] },
    { tag: "autographs", galleries: [gallery("autograph-signings"), gallery("kids-day"), gallery("halftime-shows")] },
  ] },
  { id: "rule-6", name: "Sponsor activations", created: daysAgo(95), tagMappings: [
    { tag: "Nike", galleries: [gallery("halftime-shows")] },
    { tag: "Adidas", galleries: [gallery("halftime-shows")] },
  ] },
];

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export function formatConnectDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Map<string, T>();
  items.forEach((item) => {
    const k = key(item);
    if (!seen.has(k)) seen.set(k, item);
  });
  return [...seen.values()];
}
