import { useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { format } from "date-fns";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "@/hooks/use-toast";
import { ListToolbar, useListControls } from "./ListToolbar";
import { matchesFilter, type ListFilterDef, type ListFilterState } from "./ListFilters";
import { HeadCell, RowActions, SortableHeadCell, TableShell, sortRows, usePage, useSort } from "./ListTable";
import { TablePagination } from "./TablePagination";
import type { VisibilityMap } from "./TableSettingsDrawer";
import { cn } from "@/lib/utils";
import { mockUsers } from "@/lib/mockUserData";
import {
  PLATFORM_ICONS,
  SHARE_PLATFORMS,
  formatCompact,
  formatNumber,
  type SocialShare,
} from "@/lib/mockInsightsData";

// ---------------------------------------------------------------------------
// Shared filters (prod's shares-filters, same set on both sub-tabs)
// ---------------------------------------------------------------------------

const SHARE_DATE_OPTIONS = [
  { value: "2", label: "Last 2 days" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "mtd", label: "Month to Date" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
];

const SHARE_FILTERS: ListFilterDef[] = [
  { id: "date", label: "Share Date", icon: "bi-calendar", multi: false, options: SHARE_DATE_OPTIONS },
  {
    id: "shareType",
    label: "Share Type",
    icon: "bi-megaphone",
    options: [
      { value: "requested", label: "Requested Shares" },
      { value: "unprompted", label: "Unprompted Shares" },
    ],
  },
  {
    id: "assetType",
    label: "Asset Type",
    icon: "bi-image",
    options: ["Video", "Image", "Text (Links)"].map((t) => ({ value: t, label: t })),
  },
  { id: "platform", label: "Platform", icon: "bi-globe", options: SHARE_PLATFORMS.map((p) => ({ value: p, label: p })) },
  {
    id: "user",
    label: "User",
    icon: "bi-person",
    searchable: true,
    options: [...mockUsers].sort((a, b) => a.name.localeCompare(b.name)).map((u) => ({ value: u.id, label: u.name })),
  },
];
const SHARE_FILTER_SETTINGS = SHARE_FILTERS.map((f) => ({ key: f.id, label: f.label }));

function withinDays(date: Date, value: string | undefined) {
  if (!value) return true;
  const now = new Date();
  if (value === "mtd") return date >= new Date(now.getFullYear(), now.getMonth(), 1);
  return now.getTime() - date.getTime() <= Number(value) * 86_400_000;
}

function filterShares(shares: SocialShare[], search: string, filters: ListFilterState) {
  const q = search.trim().toLowerCase();
  return shares.filter(
    (s) =>
      (!q || [s.caption, s.user.name, s.socialAccount, s.assetName].some((f) => f.toLowerCase().includes(q))) &&
      withinDays(s.shared, filters.date?.[0]?.value) &&
      matchesFilter(filters, "shareType", s.requested ? "requested" : "unprompted") &&
      matchesFilter(filters, "assetType", s.assetType) &&
      matchesFilter(filters, "platform", s.platform) &&
      matchesFilter(filters, "user", s.user.id),
  );
}

function PlatformCell({ platform }: { platform: SocialShare["platform"] }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <i className={cn("bi", PLATFORM_ICONS[platform], "text-muted-foreground")} aria-hidden="true" />
      {platform}
    </span>
  );
}

function AssetThumb({ share }: { share: SocialShare }) {
  return share.assetType === "Text (Links)" ? (
    <span className="w-10 h-10 rounded bg-muted text-muted-foreground inline-flex items-center justify-center flex-shrink-0">
      <i className="bi bi-link-45deg text-[18px]" aria-hidden="true" />
    </span>
  ) : (
    <span className="relative flex-shrink-0">
      <img src={share.thumbnailUrl} alt="" className="w-10 h-10 rounded object-cover bg-muted" loading="lazy" />
      {share.assetType === "Video" && (
        <i className="bi bi-play-circle-fill absolute bottom-0.5 right-0.5 text-white text-[12px] drop-shadow" aria-hidden="true" />
      )}
    </span>
  );
}

const num = (n: number) => <span title={formatNumber(n)}>{formatCompact(n)}</span>;

// ---------------------------------------------------------------------------
// Verified shares
// ---------------------------------------------------------------------------

export const VERIFIED_COLUMNS = [
  { key: "post", label: "Post" },
  { key: "postDate", label: "Post Date" },
  { key: "platform", label: "Platform" },
  { key: "socialAccount", label: "Social Account" },
  { key: "assets", label: "Assets" },
  { key: "downloads", label: "Downloads" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "followers", label: "Followers" },
  { key: "reshares", label: "Retweets/Shares" },
  { key: "views", label: "Views" },
];

type VerifiedSort = "postDate" | "platform" | "likes" | "comments" | "followers" | "reshares" | "views";

function VerifiedTable({ rows, perPage, columnVisibility }: { rows: SocialShare[]; perPage: number; columnVisibility: VisibilityMap }) {
  const show = (k: string) => columnVisibility[k] !== false;
  const sort = useSort<VerifiedSort>("postDate");
  const sorted = useMemo(
    () =>
      sortRows(rows, sort.field, sort.direction, (r, f) =>
        f === "postDate" ? r.shared.getTime() : f === "platform" ? r.platform : r[f],
      ),
    [rows, sort.field, sort.direction],
  );
  const { page, setPage, paged } = usePage(sorted, perPage);

  return (
    <TableShell footer={<TablePagination page={page} perPage={perPage} total={sorted.length} onPageChange={setPage} />}>
      <TableHeader>
        <TableRow className="bg-[#f9fbfd]">
          {/* Prod doesn't sort Post, Social Account, Assets or Downloads. */}
          {show("post") && <HeadCell label="Post" />}
          {show("postDate") && <SortableHeadCell label="Post Date" field="postDate" sort={sort} />}
          {show("platform") && <SortableHeadCell label="Platform" field="platform" sort={sort} />}
          {show("socialAccount") && <HeadCell label="Social Account" />}
          {show("assets") && <HeadCell label="Assets" />}
          {show("downloads") && <HeadCell label="Downloads" />}
          {show("likes") && <SortableHeadCell label="Likes" field="likes" sort={sort} />}
          {show("comments") && <SortableHeadCell label="Comments" field="comments" sort={sort} />}
          {show("followers") && <SortableHeadCell label="Followers" field="followers" sort={sort} />}
          {show("reshares") && <SortableHeadCell label="Retweets/Shares" field="reshares" sort={sort} />}
          {show("views") && <SortableHeadCell label="Views" field="views" sort={sort} />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {paged.map((s) => (
          <TableRow key={s.id} className="text-[13px]">
            {show("post") && (
              <TableCell className="min-w-[240px] max-w-[320px]">
                <div className="flex items-center gap-2.5">
                  <AssetThumb share={s} />
                  <a href={s.socialLink ?? "#"} target="_blank" rel="noreferrer" className="text-primary hover:underline line-clamp-2">
                    {s.caption}
                  </a>
                </div>
              </TableCell>
            )}
            {show("postDate") && <TableCell className="whitespace-nowrap">{format(s.shared, "M/d/yy")}</TableCell>}
            {show("platform") && <TableCell><PlatformCell platform={s.platform} /></TableCell>}
            {show("socialAccount") && (
              <TableCell className="whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-foreground">{s.socialAccount}</span>
                  <span className="text-[12px] text-muted-foreground">{s.user.name}</span>
                </div>
              </TableCell>
            )}
            {show("assets") && <TableCell className="tabular-nums">{s.assetCount}</TableCell>}
            {show("downloads") && <TableCell className="tabular-nums">{s.downloadCount}</TableCell>}
            {show("likes") && <TableCell className="tabular-nums">{num(s.likes)}</TableCell>}
            {show("comments") && <TableCell className="tabular-nums">{num(s.comments)}</TableCell>}
            {show("followers") && <TableCell className="tabular-nums">{num(s.followers)}</TableCell>}
            {show("reshares") && <TableCell className="tabular-nums">{num(s.reshares)}</TableCell>}
            {show("views") && <TableCell className="tabular-nums">{num(s.views)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </TableShell>
  );
}

// ---------------------------------------------------------------------------
// Initiated shares
// ---------------------------------------------------------------------------

export const INITIATED_COLUMNS = [
  { key: "asset", label: "Asset/Link" },
  { key: "user", label: "User" },
  { key: "date", label: "Date" },
  { key: "platform", label: "Platform" },
  { key: "socialLink", label: "Social Link" },
];

// No engagement columns here: prod shows Likes/Comments/Retweets/Views on
// Initiated Shares, but that's a known bug — initiated shares aren't tracked.
type InitiatedSort = "user" | "date" | "platform";

function InitiatedTable({
  rows,
  perPage,
  columnVisibility,
  onEditLink,
  onDeleteLink,
}: {
  rows: SocialShare[];
  perPage: number;
  columnVisibility: VisibilityMap;
  onEditLink: (s: SocialShare) => void;
  onDeleteLink: (s: SocialShare) => void;
}) {
  const show = (k: string) => columnVisibility[k] !== false;
  const sort = useSort<InitiatedSort>("date");
  const sorted = useMemo(
    () =>
      sortRows(rows, sort.field, sort.direction, (r, f) =>
        f === "date" ? r.shared.getTime() : f === "user" ? r.user.name : r.platform,
      ),
    [rows, sort.field, sort.direction],
  );
  const { page, setPage, paged } = usePage(sorted, perPage);

  return (
    <TableShell footer={<TablePagination page={page} perPage={perPage} total={sorted.length} onPageChange={setPage} />}>
      <TableHeader>
        <TableRow className="bg-[#f9fbfd]">
          {show("asset") && <HeadCell label="Asset/Link" />}
          {show("user") && <SortableHeadCell label="User" field="user" sort={sort} />}
          {show("date") && <SortableHeadCell label="Date" field="date" sort={sort} />}
          {show("platform") && <SortableHeadCell label="Platform" field="platform" sort={sort} />}
          {show("socialLink") && <HeadCell label="Social Link" />}
          <TableHead className="w-[40px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {paged.map((s) => (
          <TableRow key={s.id} className="text-[13px]">
            {show("asset") && (
              <TableCell className="min-w-[200px]">
                <div className="flex items-center gap-2.5">
                  <AssetThumb share={s} />
                  <span className="truncate max-w-[200px]">{s.assetName}</span>
                </div>
              </TableCell>
            )}
            {show("user") && <TableCell className="whitespace-nowrap">{s.user.name}</TableCell>}
            {show("date") && <TableCell className="whitespace-nowrap">{format(s.shared, "M/d/yy")}</TableCell>}
            {show("platform") && <TableCell><PlatformCell platform={s.platform} /></TableCell>}
            {show("socialLink") && (
              <TableCell className="max-w-[220px]">
                {s.socialLink ? (
                  <a href={s.socialLink} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate block">
                    {s.socialLink.replace(/^https:\/\//, "")}
                  </a>
                ) : (
                  <button className="inline-flex items-center gap-1 text-primary hover:underline" onClick={() => onEditLink(s)}>
                    <i className="bi bi-plus-circle" aria-hidden="true" />
                    Add Link
                  </button>
                )}
              </TableCell>
            )}
            <TableCell>
              <RowActions
                actions={[
                  { label: "View Asset", icon: "bi-image", onSelect: () => {} },
                  ...(s.requested ? [{ label: "View Share Request", icon: "bi-megaphone", onSelect: () => {} }] : []),
                  ...(s.socialLink
                    ? [
                        { label: "Edit Social Link", icon: "bi-pencil", onSelect: () => onEditLink(s) },
                        { label: "Delete Social Link", icon: "bi-trash", onSelect: () => onDeleteLink(s), destructive: true },
                      ]
                    : []),
                ]}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableShell>
  );
}

function SocialLinkDialog({
  share,
  onOpenChange,
  onSave,
}: {
  share: SocialShare | null;
  onOpenChange: (open: boolean) => void;
  onSave: (link: string) => void;
}) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [lastShareId, setLastShareId] = useState<string | null>(null);
  // Re-seed whenever a different share opens the dialog.
  if (share && share.id !== lastShareId) {
    setLastShareId(share.id);
    setValue(share.socialLink ?? "");
    setSubmitted(false);
  }

  let error: string | undefined;
  try {
    const url = new URL(value.trim());
    if (!/^https?:$/.test(url.protocol)) error = "Enter a link that starts with https://";
  } catch {
    error = "Enter the full link to the post, e.g. https://instagram.com/p/…";
  }

  return (
    <Dialog open={!!share} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{share?.socialLink ? "Edit Social Link" : "Add Social Link"}</DialogTitle>
          <DialogDescription>Add the link to the published post.</DialogDescription>
        </DialogHeader>
        <FormField label="Post link" htmlFor="social-link" required error={submitted ? error : undefined}>
          <Input
            id="social-link"
            placeholder="https://"
            value={value}
            variant={submitted && error ? "error" : "default"}
            onChange={(e) => setValue(e.target.value)}
          />
        </FormField>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setSubmitted(true);
              if (!error) onSave(value.trim());
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Sub-tab bodies
// ---------------------------------------------------------------------------

export function VerifiedSharesTab({ shares }: { shares: SocialShare[] }) {
  const controls = useListControls("insights.verifiedShares", { columns: VERIFIED_COLUMNS, filters: SHARE_FILTER_SETTINGS });
  const verified = useMemo(() => shares.filter((s) => s.status === "SHARED"), [shares]);
  const rows = useMemo(() => filterShares(verified, controls.search, controls.filters), [verified, controls.search, controls.filters]);

  return (
    <>
      <ListToolbar controls={controls} filterDefs={SHARE_FILTERS} columns={VERIFIED_COLUMNS} searchPlaceholder="Search shares" sheetTitle="Share Filters" />
      <div className="min-h-[400px]">
        {rows.length === 0 ? (
          <EmptyState icon="bi-patch-check" title="No verified shares found." onClearAll={controls.clearAll} />
        ) : (
          <VerifiedTable rows={rows} perPage={controls.perPage} columnVisibility={controls.columnVisibility} />
        )}
      </div>
    </>
  );
}

export function InitiatedSharesTab({ shares, onChange }: { shares: SocialShare[]; onChange: (next: SocialShare[]) => void }) {
  const controls = useListControls("insights.initiatedShares", { columns: INITIATED_COLUMNS, filters: SHARE_FILTER_SETTINGS });
  const initiated = useMemo(() => shares.filter((s) => s.status === "INITIATED"), [shares]);
  const rows = useMemo(() => filterShares(initiated, controls.search, controls.filters), [initiated, controls.search, controls.filters]);
  const [editing, setEditing] = useState<SocialShare | null>(null);

  const setLink = (target: SocialShare, socialLink: string | null) =>
    onChange(shares.map((s) => (s.id === target.id ? { ...s, socialLink } : s)));

  return (
    <>
      <ListToolbar controls={controls} filterDefs={SHARE_FILTERS} columns={INITIATED_COLUMNS} searchPlaceholder="Search shares" sheetTitle="Share Filters" />
      <div className="min-h-[400px]">
        {rows.length === 0 ? (
          <EmptyState icon="bi-send" title="No initiated shares found." onClearAll={controls.clearAll} />
        ) : (
          <InitiatedTable
            rows={rows}
            perPage={controls.perPage}
            columnVisibility={controls.columnVisibility}
            onEditLink={setEditing}
            onDeleteLink={(s) => {
              setLink(s, null);
              toast({ title: "Social link deleted" });
            }}
          />
        )}
      </div>
      <SocialLinkDialog
        share={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSave={(link) => {
          if (editing) setLink(editing, link);
          toast({ title: editing?.socialLink ? "Social link updated" : "Social link added" });
          setEditing(null);
        }}
      />
    </>
  );
}
