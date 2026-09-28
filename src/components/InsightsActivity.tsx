import { useEffect, useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { format, formatDistanceToNowStrict, isSameDay, isToday, isYesterday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { ListToolbar, useListControls } from "./ListToolbar";
import { matchesFilter, type ListFilterDef, type ListFilterState } from "./ListFilters";
import { RowActions } from "./ListTable";
import { getUniqueUserGroups, mockUsers } from "@/lib/mockUserData";
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_ENTITIES,
  ACTIVITY_EVENT_NAMES,
  mockActivityEvents,
  type ActivityEvent,
} from "@/lib/mockInsightsData";

const PAGE_SIZE = 25;

/** Prod's date-range presets; values are day counts (mtd = month to date). */
const ACTIVITY_DATE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "mtd", label: "Month to Date" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
];

const ACTIVITY_FILTERS: ListFilterDef[] = [
  { id: "category", label: "Category", icon: "bi-grid", options: ACTIVITY_CATEGORIES.map((c) => ({ value: c, label: c })) },
  { id: "includes", label: "Activity Includes", icon: "bi-collection", options: ACTIVITY_ENTITIES.map((e) => ({ value: e, label: e })) },
  { id: "event", label: "Event", icon: "bi-lightning", searchable: true, options: ACTIVITY_EVENT_NAMES.map((e) => ({ value: e, label: e })) },
  { id: "group", label: "Group", icon: "bi-people", searchable: true, options: getUniqueUserGroups().map((g) => ({ value: g.name, label: g.name })) },
  {
    id: "user",
    label: "User",
    icon: "bi-person",
    searchable: true,
    options: [...mockUsers].sort((a, b) => a.name.localeCompare(b.name)).map((u) => ({ value: u.id, label: u.name })),
  },
  { id: "date", label: "Date Range", icon: "bi-calendar", multi: false, options: ACTIVITY_DATE_OPTIONS },
];
const ACTIVITY_FILTER_SETTINGS = ACTIVITY_FILTERS.map((f) => ({ key: f.id, label: f.label }));

/** Prod abbreviates past a thousand: 16,240 → "16.2k". */
function formatEventCount(n: number) {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 100 ? Math.round(k) : Number(k.toFixed(1))}k`;
}

function withinRange(date: Date, value: string | undefined) {
  if (!value) return true;
  const now = new Date();
  if (value === "mtd") return date >= new Date(now.getFullYear(), now.getMonth(), 1);
  return now.getTime() - date.getTime() <= Number(value) * 86_400_000;
}

function dayLabel(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMM d");
}

/** Events arrive newest-first, so a day boundary is just a change from the previous row. */
function groupByDay(events: ActivityEvent[]) {
  const groups: { day: Date; events: ActivityEvent[] }[] = [];
  events.forEach((e) => {
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.day, e.timestamp)) last.events.push(e);
    else groups.push({ day: e.timestamp, events: [e] });
  });
  return groups;
}

function EventRow({
  event,
  onViewMore,
  onFilterLikeThis,
}: {
  event: ActivityEvent;
  onViewMore: () => void;
  onFilterLikeThis: () => void;
}) {
  return (
    <li className="flex items-start gap-3 px-5 py-3 border-b last:border-b-0 text-[13px]">
      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center flex-shrink-0 mt-0.5">
        <i className={`bi ${event.icon}`} aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-foreground">
          <span className="font-semibold">{event.user.name}</span> {event.description}
        </p>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {event.event}
          {event.groupName && <> · {event.groupName}</>}
          {" · "}
          <time dateTime={event.timestamp.toISOString()} title={format(event.timestamp, "PPpp")}>
            {formatDistanceToNowStrict(event.timestamp, { addSuffix: true })}
          </time>
        </p>
      </div>
      <RowActions
        actions={[
          { label: "View More", icon: "bi-info-circle", onSelect: onViewMore },
          { label: "Filter events like this", icon: "bi-filter", onSelect: onFilterLikeThis },
        ]}
      />
    </li>
  );
}

export function InsightsActivity() {
  const controls = useListControls("insights.activity", { filters: ACTIVITY_FILTER_SETTINGS });
  const { search, filters, setFilters } = controls;
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [details, setDetails] = useState<ActivityEvent | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockActivityEvents.filter(
      (e) =>
        (!q || `${e.user.name} ${e.description} ${e.event}`.toLowerCase().includes(q)) &&
        matchesFilter(filters, "category", e.category) &&
        matchesFilter(filters, "includes", e.entity) &&
        matchesFilter(filters, "event", e.event) &&
        matchesFilter(filters, "group", e.user.groups.map((g) => g.name)) &&
        matchesFilter(filters, "user", e.user.id) &&
        withinRange(e.timestamp, filters.date?.[0]?.value),
    );
  }, [search, filters]);

  // A new query starts back at the top of the feed.
  useEffect(() => setVisible(PAGE_SIZE), [rows]);

  const shown = rows.slice(0, visible);

  const filterLikeThis = (e: ActivityEvent) => {
    const next: ListFilterState = { ...filters, event: [{ value: e.event, label: e.event }] };
    setFilters(next);
  };

  return (
    <>
      <ListToolbar controls={controls} filterDefs={ACTIVITY_FILTERS} searchPlaceholder="Search activity" sheetTitle="Activity Filters" searchProposed />

      <div className="min-h-[400px] flex flex-col gap-3">
        {/* Prod's count treatment: muted label + success pill, right-aligned over the feed. */}
        <p className="flex items-center justify-end gap-2 text-[15px] font-medium text-muted-foreground" aria-live="polite">
          Viewing
          <Badge
            colorStyle="success"
            theme="default"
            shape="square"
            className="rounded-md px-2 py-1 text-[13px] normal-case tracking-normal font-medium tabular-nums"
            title={`${rows.length.toLocaleString("en-US")} ${rows.length === 1 ? "event" : "events"}`}
          >
            {formatEventCount(rows.length)} {rows.length === 1 ? "Event" : "Events"}
          </Badge>
        </p>

        {rows.length === 0 ? (
          <EmptyState icon="bi-activity" title="No events found." onClearAll={controls.clearAll} />
        ) : (
          <div className="border rounded-lg bg-white overflow-hidden">
            {groupByDay(shown).map(({ day, events }) => (
              <section key={day.toISOString()} aria-label={dayLabel(day)}>
                <h3 className="px-5 py-2 bg-[#f9fbfd] border-b text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {dayLabel(day)}
                </h3>
                <ul>
                  {events.map((e) => (
                    <EventRow key={e.id} event={e} onViewMore={() => setDetails(e)} onFilterLikeThis={() => filterLikeThis(e)} />
                  ))}
                </ul>
              </section>
            ))}
            {/* Prod infinite-scrolls in pages of 200; an explicit button keeps the demo predictable. */}
            {visible < rows.length && (
              <div className="p-4 flex justify-center border-t">
                <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!details} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{details?.event}</DialogTitle>
            <DialogDescription>{details && format(details.timestamp, "PPpp")}</DialogDescription>
          </DialogHeader>
          {details && (
            <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-[13px]">
              <dt className="text-muted-foreground">User</dt>
              <dd>{details.user.name} ({details.user.email})</dd>
              <dt className="text-muted-foreground">Activity</dt>
              <dd>{details.user.name} {details.description}</dd>
              <dt className="text-muted-foreground">Category</dt>
              <dd>{details.category}</dd>
              <dt className="text-muted-foreground">Includes</dt>
              <dd>{details.entity}</dd>
              <dt className="text-muted-foreground">Group</dt>
              <dd>{details.groupName ?? "—"}</dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
