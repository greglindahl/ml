import { useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/EmptyState";
import { useScreenSlug } from "@/hooks/useScreenSlug";
import { toast } from "@/hooks/use-toast";
import { ListToolbar, useListControls } from "./ListToolbar";
import { matchesFilter, type ListFilterDef } from "./ListFilters";
import { HeadCell, RowActions, SortableHeadCell, TableShell, sortRows, usePage, useSort } from "./ListTable";
import { cn } from "@/lib/utils";
import {
  ANNOUNCEMENT_STATUS_ICONS,
  ANNOUNCEMENT_STATUS_LABELS,
  mockAnnouncements,
  type Announcement,
  type AnnouncementStatus,
} from "@/lib/mockAnnouncementsData";

/**
 * Announcements on the ML 2.0 list layout. Columns, filters, sort and row menu
 * follow prod's feature/announcements page.
 */

// Prod renders these with Angular's `date: 'short'`.
const shortDateTime = (d: Date) =>
  d.toLocaleString("en-US", { month: "numeric", day: "numeric", year: "2-digit", hour: "numeric", minute: "2-digit" });

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

const COLUMNS = [
  { key: "author", label: "Author" },
  { key: "message", label: "Message" },
  { key: "to", label: "To" },
  { key: "created", label: "Created" },
  { key: "status", label: "Status" },
  { key: "schedule", label: "Schedule" },
];

// Prod's two filters: Status (multi) and Author (one user).
const FILTERS: ListFilterDef[] = [
  {
    id: "status",
    label: "Status",
    icon: "bi-circle-half",
    options: (Object.keys(ANNOUNCEMENT_STATUS_LABELS) as AnnouncementStatus[]).map((s) => ({
      value: s,
      label: ANNOUNCEMENT_STATUS_LABELS[s],
    })),
  },
  {
    id: "author",
    label: "Author",
    icon: "bi-person",
    multi: false,
    searchable: true,
    options: unique(mockAnnouncements.map((a) => a.author)).map((name) => ({ value: name, label: name })),
  },
];
const FILTER_SETTINGS = FILTERS.map((f) => ({ key: f.id, label: f.label }));

type SortField = "message" | "to" | "created" | "status" | "schedule";

interface AnnouncementsScreenProps {
  isMobile?: boolean;
}

export function AnnouncementsScreen({ isMobile = false }: AnnouncementsScreenProps) {
  useScreenSlug("announcements");
  const controls = useListControls("announcements", { columns: COLUMNS, filters: FILTER_SETTINGS });
  const { search, filters, columnVisibility, perPage } = controls;
  const show = (key: string) => columnVisibility[key] !== false;
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [expireTarget, setExpireTarget] = useState<Announcement | null>(null);

  // Prod's default: Created, newest first.
  const sort = useSort<SortField>("created");
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = announcements.filter(
      (a) =>
        (!q || a.message.toLowerCase().includes(q)) &&
        matchesFilter(filters, "status", a.status) &&
        matchesFilter(filters, "author", a.author),
    );
    return sortRows(matched, sort.field, sort.direction, (a, field) => {
      switch (field) {
        case "message": return a.message.toLowerCase();
        case "to": return a.totalUsers;
        case "created": return a.created.getTime();
        case "status": return ANNOUNCEMENT_STATUS_LABELS[a.status];
        case "schedule": return a.scheduledStart?.getTime() ?? null;
      }
    });
  }, [announcements, search, filters, sort.field, sort.direction]);
  const { page, setPage, paged } = usePage(rows, perPage);

  return (
    <div className={`flex-1 flex flex-col pb-12 content-container ${isMobile ? "pt-[72px]" : ""}`}>
      {/* Spacer for consistent header position - matches LibraryScreen */}
      {!isMobile && <div className="mb-2 h-[44px] flex-shrink-0" />}
      <div className="px-6 md:px-9 pb-4 flex items-center justify-between gap-3 min-h-[56px]">
        <h1 className="text-[26px] font-semibold text-foreground">Announcements</h1>
        <Button onClick={() => {}}>
          <i className="bi bi-plus-circle text-base" />
          New Announcement
        </Button>
      </div>

      <div className="px-6 md:px-9 py-2 flex flex-col gap-4">
        <ListToolbar
          controls={controls}
          filterDefs={FILTERS}
          columns={COLUMNS}
          searchPlaceholder="Search announcements"
          sheetTitle="Announcement Filters"
        />
        <div className="min-h-[400px]">
          {rows.length === 0 ? (
            <EmptyState
              icon="bi-megaphone"
              title="No announcements found."
              onClearAll={controls.isFiltered ? controls.clearAll : undefined}
            />
          ) : (
            <TableShell pagination={{ page, perPage, total: rows.length, onPageChange: setPage }}>
              <TableHeader>
                <TableRow className="bg-[#f9fbfd]">
                  {show("author") && <HeadCell label="Author" />}
                  {show("message") && <SortableHeadCell label="Message" field="message" sort={sort} />}
                  {show("to") && <SortableHeadCell label="To" field="to" sort={sort} />}
                  {show("created") && <SortableHeadCell label="Created" field="created" sort={sort} />}
                  {show("status") && <SortableHeadCell label="Status" field="status" sort={sort} />}
                  {show("schedule") && <SortableHeadCell label="Schedule" field="schedule" sort={sort} />}
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((a) => (
                  <TableRow key={a.id} className="text-[13px] align-top">
                    {show("author") && <TableCell className="whitespace-nowrap">{a.author}</TableCell>}
                    {show("message") && (
                      <TableCell className="min-w-[280px] w-1/2">
                        {/* Prod clamps to 5 lines with "view more". */}
                        <p className="line-clamp-5 text-foreground">{a.message}</p>
                      </TableCell>
                    )}
                    {show("to") && (
                      <TableCell className="whitespace-nowrap">
                        {/* Prod opens the recipient list here. */}
                        <button className="text-primary hover:underline">
                          {a.totalUsers.toLocaleString()} {a.totalUsers === 1 ? "user" : "users"}
                        </button>
                      </TableCell>
                    )}
                    {show("created") && <TableCell className="whitespace-nowrap">{shortDateTime(a.created)}</TableCell>}
                    {show("status") && (
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <i className={cn("bi", ANNOUNCEMENT_STATUS_ICONS[a.status])} aria-hidden="true" />
                          {ANNOUNCEMENT_STATUS_LABELS[a.status]}
                        </span>
                      </TableCell>
                    )}
                    {show("schedule") && (
                      <TableCell className="whitespace-nowrap">
                        {(a.scheduledStart || a.scheduledEnd) && (
                          <div className="grid grid-cols-[auto_auto] gap-x-2 gap-y-0.5 w-fit">
                            <span className="text-muted-foreground">Start:</span>
                            <span>{a.scheduledStart ? shortDateTime(a.scheduledStart) : "--"}</span>
                            <span className="text-muted-foreground">End:</span>
                            <span>{a.scheduledEnd ? shortDateTime(a.scheduledEnd) : "--"}</span>
                          </div>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {/* Prod: only live or upcoming announcements can be edited or expired. */}
                      {(a.status === "ACTIVE" || a.status === "SCHEDULED") && (
                        <RowActions
                          actions={[
                            { label: "Edit Announcement", icon: "bi-pencil-square", onSelect: () => {} },
                            { label: "Expire Announcement", icon: "bi-stop-circle", onSelect: () => setExpireTarget(a), destructive: true },
                          ]}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableShell>
          )}
        </div>
      </div>

      {/* Prod's confirm copy. */}
      <AlertDialog open={!!expireTarget} onOpenChange={(open) => !open && setExpireTarget(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Expire Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Do you really want to expire this announcement? Once expired, the message is removed for all recipients.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!expireTarget) return;
                setAnnouncements((prev) =>
                  prev.map((x) => (x.id === expireTarget.id ? { ...x, status: "STOPPED", scheduledEnd: x.scheduledEnd ?? new Date() } : x)),
                );
                toast({ title: "Announcement expired" });
                setExpireTarget(null);
              }}
            >
              Expire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
