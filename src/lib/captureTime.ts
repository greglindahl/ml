import { useEffect, useState } from "react";
import type { CustomRange, DateRangeValue } from "@/lib/dateRangeFilter";

/**
 * Capture-date time zones (PORTAL-12970 / 12973), prototype model.
 *
 * - captureDate is the true moment; captureOffsetMinutes is the camera's UTC
 *   offset, or null when the file never recorded one (~¼ of images, ~½ of video).
 * - Captured renders as the photographer's wall clock + zone label
 *   ("1:00 AM GMT+3"). Unknown offset: unlabeled, unshifted, "time zone not
 *   recorded" on hover / in details.
 * - Uploaded (and other true instants) render in the viewer's zone. When the
 *   capture zone differs, details label the upload time too, so two correct
 *   dates don't read as "captured after upload".
 * - Captured filter: viewer picks calendar days (presets resolve in the viewer's
 *   zone); a photo matches on the photographer's local day.
 *
 * "Viewing as" is a prototype switch so the cross-zone cases can be reviewed
 * from anywhere.
 */

export const VIEWER_ZONES = [
  { id: "browser", label: "Your browser" },
  { id: "America/Chicago", label: "Chicago" },
  { id: "Europe/London", label: "London" },
  { id: "Asia/Riyadh", label: "Riyadh" },
] as const;
export type ViewerZoneId = (typeof VIEWER_ZONES)[number]["id"];

const KEY = "proto.viewerTimeZone";
const EVENT = "proto-viewer-zone";

/**
 * Timestamp prototype switches (Viewing as, Uploader under date) only show with
 * ?proto=1. Kept for the tab's session so in-app navigation that rewrites the
 * URL doesn't drop it. Without it the switches' stored choices are ignored.
 */
export const SHOW_TIMESTAMP_PROTO = (() => {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("proto") === "1") sessionStorage.setItem("proto.timestamps", "1");
    return sessionStorage.getItem("proto.timestamps") === "1";
  } catch {
    return new URLSearchParams(window.location.search).get("proto") === "1";
  }
})();

const readZone = (): ViewerZoneId => {
  if (!SHOW_TIMESTAMP_PROTO) return "browser";
  try {
    const v = localStorage.getItem(KEY);
    return VIEWER_ZONES.some((z) => z.id === v) ? (v as ViewerZoneId) : "browser";
  } catch {
    return "browser";
  }
};

export function setViewerZone(id: ViewerZoneId) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    // per-viewer convenience only
  }
  window.dispatchEvent(new Event(EVENT));
}

/** The viewer's IANA zone (undefined = the browser's own). Re-renders on change. */
export function useViewerZone(): { id: ViewerZoneId; tz: string | undefined } {
  const [id, setId] = useState<ViewerZoneId>(readZone);
  useEffect(() => {
    const on = () => setId(readZone());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return { id, tz: id === "browser" ? undefined : id };
}

/** Viewer zone read outside React (filters). */
export const currentViewerTz = (): string | undefined => {
  const id = readZone();
  return id === "browser" ? undefined : id;
};

const DATE_OPTS: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
const TIME_OPTS: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };

/** "GMT+3", "GMT-5", "GMT+5:30", "GMT" */
export function offsetLabel(minutes: number): string {
  if (minutes === 0) return "GMT";
  const sign = minutes > 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

/** The photographer's wall clock as a Date whose UTC fields hold it. */
function wallClock(captureDate: Date, offsetMinutes: number | null | undefined): Date {
  return new Date(captureDate.getTime() + (offsetMinutes ?? 0) * 60_000);
}

export interface CaptureDisplay {
  date: string;
  time: string;
  /** Zone label, or null when the file never recorded one. */
  zone: string | null;
  /** Full line for hover / details. */
  full: string;
}

export function formatCaptured(captureDate: Date, offsetMinutes: number | null | undefined): CaptureDisplay {
  const wall = wallClock(captureDate, offsetMinutes);
  const date = wall.toLocaleDateString("en-US", { ...DATE_OPTS, timeZone: "UTC" });
  const time = wall.toLocaleTimeString("en-US", { ...TIME_OPTS, timeZone: "UTC" });
  const zone = offsetMinutes == null ? null : offsetLabel(offsetMinutes);
  return { date, time, zone, full: `${date}, ${time} ${zone ?? "(time zone not recorded)"}` };
}

/** A true instant in the viewer's zone, e.g. "Oct 22, 2026, 5:30 PM CDT". */
export function formatInstant(d: Date, tz: string | undefined, withZone = true) {
  const date = d.toLocaleDateString("en-US", { ...DATE_OPTS, timeZone: tz });
  const time = d.toLocaleTimeString("en-US", { ...TIME_OPTS, timeZone: tz, timeZoneName: withZone ? "short" : undefined });
  return { date, time, full: `${date}, ${time}` };
}

/** Viewer's UTC offset (minutes) at instant d, for "is the capture zone different?". */
export function viewerOffsetAt(d: Date, tz: string | undefined): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
  return Math.round((asUtc - Math.floor(d.getTime() / 60_000) * 60_000) / 60_000);
}

// ---- Captured filter -------------------------------------------------------

/** yyyy-mm-dd → comparable day number. */
const dayNum = (y: number, m: number, d: number) => Date.UTC(y, m, d) / 86_400_000;

/** The photographer's calendar day. */
function captureDay(captureDate: Date, offsetMinutes: number | null | undefined) {
  const w = wallClock(captureDate, offsetMinutes);
  return dayNum(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate());
}

/** A calendar day as the viewer sees it right now (or for a picked date). */
function viewerDay(d: Date, tz: string | undefined) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return dayNum(get("year"), get("month") - 1, get("day"));
}

/** A day picked in the calendar is already a plain calendar date. */
const pickedDay = (d: Date) => dayNum(d.getFullYear(), d.getMonth(), d.getDate());

const RANGE_DAYS: Record<string, number> = { week: 7, "two-weeks": 14, month: 30, quarter: 90, year: 365 };

/**
 * Captured filter: presets resolve to calendar days in the viewer's zone; a
 * photo matches when its *photographer's* day falls in that range. No zone
 * math for the user, and "Oct 22" means the same photos for every viewer.
 */
export function matchesCaptureRange(
  captureDate: Date,
  offsetMinutes: number | null | undefined,
  filter: DateRangeValue,
  custom?: CustomRange,
): boolean {
  const day = captureDay(captureDate, offsetMinutes);
  if (filter === "custom") {
    if (!custom?.from || !custom?.to) return true;
    return day >= pickedDay(custom.from) && day <= pickedDay(custom.to);
  }
  const today = viewerDay(new Date(), currentViewerTz());
  if (filter === "mtd") {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: currentViewerTz(), year: "numeric", month: "numeric" }).formatToParts(new Date());
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    return day >= dayNum(get("year"), get("month") - 1, 1) && day <= today;
  }
  if (filter === "today") return day === today;
  return day <= today && today - day <= (RANGE_DAYS[filter] ?? 365);
}
