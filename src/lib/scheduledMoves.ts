/**
 * Folder moves too large to run during the day (see limits.ts) get queued for
 * the overnight window instead. Prototype-only model: prod would hold these
 * server-side as jobs.
 */

export interface ScheduledMove {
  folderId: string;
  folderName: string;
  targetLocationId: string | null;
  /** Destination as the user picked it, e.g. "Season 25-26 > In-Game". */
  targetName: string;
  mediaCount: number;
  runsAt: Date;
}

export interface CompletedMove {
  folderId: string;
  folderName: string;
  targetName: string;
  mediaCount: number;
  completedAt: Date;
}

/** Tonight at 11 PM, or tomorrow's if it's already past that. */
export function nextOvernightWindow(now = new Date()): Date {
  const at = new Date(now);
  at.setHours(23, 0, 0, 0);
  if (at <= now) at.setDate(at.getDate() + 1);
  return at;
}

export const formatTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
