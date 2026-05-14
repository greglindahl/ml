// Mock user data for Network → Manage Users tab

export type UserRole = "Admin" | "Producer" | "Reviewer" | "Advocate";
export type AIAssistStatus = "Opted-in" | "Opted-out" | "No Action";
export type NotificationSetting = "Enabled" | "Disabled";
export type OrganizationRole = "Player" | "Coach" | "Manager" | "Staff" | "Other";
export type OrgDepartment = "Client Success" | "Operations" | "Zebra";
export type DurationBucket = "1 year" | "2 years" | "3 years" | "4 years" | "5 years" | "6 years";

export interface UserGroup {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: UserRole;
  aiAssist: AIAssistStatus;
  inviteCode: string | null;
  groups: UserGroup[];
  joinDate: Date;
  lastLogin: Date;
  notifications: NotificationSetting;
  organizationRole: OrganizationRole;
  orgDepartment: OrgDepartment;
  duration: DurationBucket;
}

// Pool of groups users can belong to
const GROUPS: UserGroup[] = [
  { id: "marketing", name: "Marketing Team" },
  { id: "social", name: "Social Media Team" },
  { id: "creative", name: "Creative Team" },
  { id: "operations", name: "Operations Team" },
  { id: "leadership", name: "Leadership" },
  { id: "engineering", name: "Engineering" },
  { id: "sales", name: "Sales Team" },
  { id: "support", name: "Support Team" },
];

const INVITE_CODES = [
  "SPORTGEEKSTELL2",
  "SPORTGEEKS1234123",
  "SPORTGEEKSSPORTGEEKSTELL4",
  "SPORTGEEKSSPORTGEEKSUJMI",
  "SPORTGEEKSTELL",
  "SPORTGEEKSJAZZY",
];

const FIRST_NAMES = [
  "Maria", "Alex", "Florian", "Katha", "Ryan", "Sarah", "John", "Emma", "Liam", "Olivia",
  "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "Lucas", "Mia", "James", "Charlotte",
  "Benjamin", "Amelia", "Jacob", "Harper", "Michael", "Evelyn", "William", "Abigail", "Daniel", "Emily",
  "Henry", "Elizabeth", "Owen", "Ella", "Sebastian", "Camila", "Jack", "Scarlett", "Aiden", "Grace",
  "Matthew", "Chloe", "Joseph", "Aria", "Samuel", "Lily", "David", "Zoe", "Anthony", "Hannah",
];

const LAST_NAMES = [
  "Chen", "Patel", "Frohnhoefer", "Bickel-Halbig", "Johnson", "Smith", "Garcia", "Rodriguez",
  "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Anderson", "Taylor", "Thomas",
  "Moore", "Martin", "Lee", "Walker", "Hall", "Allen", "Young", "King", "Wright", "Scott",
  "Green", "Adams", "Baker", "Nelson", "Carter", "Mitchell", "Roberts", "Phillips", "Campbell",
  "Parker", "Evans", "Edwards", "Collins", "Stewart", "Sanchez", "Morris", "Rogers", "Reed",
  "Cook", "Bell", "Murphy", "Bailey", "Rivera",
];

function initialsFrom(name: string): string {
  const parts = name.split(" ");
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

function emailFrom(name: string, idx: number): string {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, "");
  const handles = ["greenfly.com", "gmail.com"];
  return idx % 4 === 0
    ? `${slug.split("").slice(0, 8).join("")}+${idx}@${handles[idx % 2]}`
    : `${slug.split("").slice(0, 12).join("")}@${handles[idx % 2]}`;
}

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

function pickN<T>(arr: readonly T[], seed: number, count: number): T[] {
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    const item = arr[(seed + i * 7) % arr.length];
    if (!result.includes(item)) result.push(item);
  }
  return result;
}

const ROLES: UserRole[] = ["Admin", "Producer", "Reviewer", "Advocate"];
const AI_ASSIST: AIAssistStatus[] = ["Opted-in", "Opted-out", "No Action"];
const NOTIFICATIONS: NotificationSetting[] = ["Enabled", "Disabled"];
const ORG_ROLES: OrganizationRole[] = ["Player", "Coach", "Manager", "Staff", "Other"];
const DEPARTMENTS: OrgDepartment[] = ["Client Success", "Operations", "Zebra"];
const DURATIONS: DurationBucket[] = ["1 year", "2 years", "3 years", "4 years", "5 years", "6 years"];

function buildUser(idx: number): User {
  const firstName = pick(FIRST_NAMES, idx);
  const lastName = pick(LAST_NAMES, idx * 3 + 1);
  const name = `${firstName} ${lastName}`;
  const joinDate = new Date(2024, idx % 12, ((idx * 7) % 28) + 1);
  const lastLogin = new Date(2026, 4, ((idx * 3) % 13) + 1);
  return {
    id: `u${idx}`,
    name,
    email: emailFrom(name, idx),
    initials: initialsFrom(name),
    role: pick(ROLES, idx),
    aiAssist: pick(AI_ASSIST, idx + 1),
    inviteCode: idx % 3 === 0 ? pick(INVITE_CODES, Math.floor(idx / 3)) : null,
    groups: pickN(GROUPS, idx, (idx % 4) + 1),
    joinDate,
    lastLogin,
    notifications: pick(NOTIFICATIONS, idx),
    organizationRole: pick(ORG_ROLES, idx + 2),
    orgDepartment: pick(DEPARTMENTS, idx),
    duration: pick(DURATIONS, idx + 3),
  };
}

export const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => buildUser(i));

// Helpers — mirror the getUniqueRequestCreators pattern in mockCampaignData.ts:174
export function getUniqueUserRoles(): UserRole[] {
  return Array.from(new Set(mockUsers.map(u => u.role)));
}

export function getUniqueUserGroups(): UserGroup[] {
  const map = new Map<string, UserGroup>();
  mockUsers.forEach(u => u.groups.forEach(g => map.set(g.id, g)));
  return Array.from(map.values());
}

export function getUniqueInviteCodes(): string[] {
  return Array.from(new Set(mockUsers.map(u => u.inviteCode).filter((c): c is string => c !== null)));
}

export function getUniqueOrganizationRoles(): OrganizationRole[] {
  return Array.from(new Set(mockUsers.map(u => u.organizationRole)));
}

export function getUniqueOrgDepartments(): OrgDepartment[] {
  return Array.from(new Set(mockUsers.map(u => u.orgDepartment)));
}
