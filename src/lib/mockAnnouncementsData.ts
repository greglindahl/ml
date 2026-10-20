/**
 * Mock announcements. Shape follows prod's `core/announcements/announcements.model.ts`.
 */

const at = (daysFromNow: number, hour = 11, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
};

export type AnnouncementStatus = "ACTIVE" | "SCHEDULED" | "SENDING" | "STOPPED";

/** Prod's labels: STOPPED reads "Expired". */
export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  ACTIVE: "Active",
  SCHEDULED: "Scheduled",
  SENDING: "Sending",
  STOPPED: "Expired",
};

/** Prod's status icons and colors. */
export const ANNOUNCEMENT_STATUS_ICONS: Record<AnnouncementStatus, string> = {
  ACTIVE: "bi-play-circle-fill text-[#00D97E]",
  SCHEDULED: "bi-calendar text-[#6e84a3]",
  SENDING: "bi-send-fill text-primary",
  STOPPED: "bi-stop-circle-fill text-[#E63757]",
};

export interface Announcement {
  id: string;
  message: string;
  author: string;
  totalUsers: number;
  created: Date;
  status: AnnouncementStatus;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
}

export const mockAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    message:
      "Playoff media day is Thursday at 10 AM in the practice facility. Please upload all player portraits to the Playoffs 2026 gallery by end of day so the social team can schedule posts for the weekend.",
    author: "Maya Chen",
    totalUsers: 148,
    created: at(-1, 9, 15),
    status: "ACTIVE",
    scheduledStart: null,
    scheduledEnd: at(3, 18),
  },
  {
    id: "ann-2",
    message: "New branding package is live. Use \"Playoffs 2026\" for anything posted between now and the end of the postseason.",
    author: "Jordan Ellis",
    totalUsers: 312,
    created: at(-3, 14, 40),
    status: "ACTIVE",
    scheduledStart: null,
    scheduledEnd: null,
  },
  {
    id: "ann-3",
    message:
      "Reminder: the app will be down for scheduled maintenance Sunday from 1 to 3 AM ET. Uploads started before then will resume automatically once it's back.",
    author: "Sam Okafor",
    totalUsers: 1204,
    created: at(-2, 16, 5),
    status: "SCHEDULED",
    scheduledStart: at(4, 8),
    scheduledEnd: at(6, 9),
  },
  {
    id: "ann-4",
    message: "Welcome to the 2026 season! Download the latest app update to get faster uploads and the new gallery view.",
    author: "Priya Natarajan",
    totalUsers: 1204,
    created: at(0, 8, 2),
    status: "SENDING",
    scheduledStart: null,
    scheduledEnd: null,
  },
  {
    id: "ann-5",
    message:
      "Community Night photos are due Friday. Tag every photo with the school name so the partnerships team can send each school their set. Questions go to the community relations channel.",
    author: "Maya Chen",
    totalUsers: 86,
    created: at(-12, 10, 30),
    status: "STOPPED",
    scheduledStart: at(-11, 9),
    scheduledEnd: at(-5, 17),
  },
  {
    id: "ann-6",
    message: "Trade deadline coverage: send anything from the locker room straight to the Breaking News gallery. Approvals are on for that gallery tonight.",
    author: "Jordan Ellis",
    totalUsers: 24,
    created: at(-30, 13, 0),
    status: "STOPPED",
    scheduledStart: null,
    scheduledEnd: at(-28, 23, 59),
  },
  {
    id: "ann-7",
    message: "Season ticket holder event photos are scheduled to go out next week. Make sure faces are tagged before Monday.",
    author: "Sam Okafor",
    totalUsers: 412,
    created: at(-1, 17, 20),
    status: "SCHEDULED",
    scheduledStart: at(7, 9),
    scheduledEnd: null,
  },
];
