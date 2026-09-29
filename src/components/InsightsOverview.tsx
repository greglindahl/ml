import { useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChangeBadge, InsightsDonut } from "./InsightsShared";
import { cn } from "@/lib/utils";
import {
  TOP_USERS_METRICS,
  formatNumber,
  getOverview,
  getUserMetrics,
  type InsightsRange,
  type MetricValue,
  type TopUsersMetric,
} from "@/lib/mockInsightsData";

/**
 * Insights › Overview, laid out per the Overview redesign in Figma
 * ("Portal | Insights | CSV Export Loading State", Insights.Reports.Overview).
 * The design's new brand colors are for another branch — this keeps the
 * prototype's palette and chart colors.
 *
 *   row 1  User Summary · Top Users · Total Content      (308 : 303 : 450)
 *   row 2  Shares · Galleries                            (1 : 1)
 *   row 3  Share Requests · Content Requests             (1 : 1)
 */

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function InfoTip({ text, label }: { text: string; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-muted-foreground hover:text-foreground inline-flex" aria-label={`About ${label}`}>
          <i className="bi bi-info-circle text-[11px]" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px]">{text}</TooltipContent>
    </Tooltip>
  );
}

/** Card with the design's 48px header: title + info tooltip, optional right-hand control. */
function OverviewCard({
  title,
  tooltip,
  action,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  tooltip: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("border rounded-lg bg-white flex flex-col min-w-0", className)} aria-label={title}>
      <header className="flex items-center justify-between gap-3 h-12 px-5 border-b flex-shrink-0">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          {title}
          <InfoTip text={tooltip} label={title} />
        </h2>
        {action}
      </header>
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

/**
 * The design's "Stats Top Card": a bordered box with an uppercase label and a
 * number. Change badge sits beside the number (`inline`) or under it
 * (`below`, the narrow Galleries boxes); the icon is optional.
 */
function StatBox({
  label,
  value,
  icon,
  change,
  badge = "inline",
}: {
  label: string;
  value: number;
  icon?: string;
  change?: MetricValue;
  badge?: "inline" | "below";
}) {
  return (
    <div className="border rounded-lg bg-white px-6 py-4 flex items-center justify-between gap-3 min-w-0">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground leading-tight">{label}</p>
        <div className={cn("mt-1 flex gap-2", badge === "inline" ? "items-center" : "flex-col items-start")}>
          <span className="text-[22px] font-semibold text-foreground tabular-nums leading-tight">{formatNumber(value)}</span>
          {change && <ChangeBadge value={change} className="text-[11px] px-1.5" />}
        </div>
      </div>
      {icon && <i className={cn("bi", icon, "text-[16px] text-foreground flex-shrink-0")} aria-hidden="true" />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top Users
// ---------------------------------------------------------------------------

function TopUsers({ range }: { range: InsightsRange }) {
  const [metric, setMetric] = useState<TopUsersMetric>("downloads");
  const top = useMemo(() => [...getUserMetrics(range)].sort((a, b) => b[metric] - a[metric]).slice(0, 5), [range, metric]);
  const label = TOP_USERS_METRICS.find((m) => m.value === metric)!.label;

  return (
    <OverviewCard
      title="Top Users"
      // Prod's tooltip copy.
      tooltip="View top 5 users by action (Downloads, Shares, Uploads, Views)."
      action={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[11px] text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              aria-label={`Rank by ${label}`}
            >
              {label}
              <i className="bi bi-chevron-down text-[10px]" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white">
            {TOP_USERS_METRICS.map((m) => (
              <DropdownMenuCheckboxItem key={m.value} className="text-[13px]" checked={m.value === metric} onCheckedChange={() => setMetric(m.value)}>
                {m.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      }
      bodyClassName="px-6 py-2"
    >
      <ol>
        {top.map((row, i) => (
          <li key={row.user.id} className="flex items-center gap-2 py-3 border-b text-[13px]">
            <span className="w-2 text-foreground tabular-nums">{i + 1}</span>
            <span className="w-8 h-8 rounded-md bg-primary/10 text-primary text-[11px] font-semibold inline-flex items-center justify-center flex-shrink-0">
              {row.user.initials}
            </span>
            <button className="flex-1 min-w-0 truncate text-left text-primary hover:underline">{row.user.name}</button>
            <span className="tabular-nums text-foreground">{formatNumber(row[metric])}</span>
          </li>
        ))}
      </ol>
    </OverviewCard>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function InsightsOverview({ range }: { range: InsightsRange }) {
  const data = useMemo(() => getOverview(range), [range]);
  const tile = (list: { label: string; value: MetricValue }[], label: string) => list.find((t) => t.label === label)!.value;

  return (
    <div className="flex flex-col gap-5">
      {/* Row 1 */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-[308fr_303fr_450fr]">
        <OverviewCard
          title="User Summary"
          // Prod renders this icon with no tooltip text; this fills the gap.
          tooltip="Total users in your network, and how many joined in the selected period."
          bodyClassName="px-6 py-6 flex flex-col justify-center gap-3"
        >
          <StatBox label="Total Users" value={data.totalUsers} icon="bi-people" />
          <StatBox label="New Users" value={data.newUsers} icon="bi-person-plus" />
        </OverviewCard>

        <TopUsers range={range} />

        <OverviewCard
          title="Total Content"
          // Prod renders this icon with no tooltip text; this fills the gap.
          tooltip="Images and videos downloaded and added across your network in the selected period."
          className="lg:col-span-2 xl:col-span-1"
          bodyClassName="px-6 py-8 flex items-center justify-center"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <InsightsDonut segments={data.downloads} totalLabel="Total Downloads" />
            <InsightsDonut segments={data.contentAdded} totalLabel="Total Content Added" />
          </div>
        </OverviewCard>
      </div>

      {/* Row 2 */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <OverviewCard
          title="Shares"
          tooltip="# of shares and interactions from Instagram, X, Facebook and additional platforms/downloads."
          bodyClassName="px-6 py-5 flex items-center justify-center"
        >
          <InsightsDonut segments={data.shares} totalLabel="Shares" size={180} thickness={18} legend="side" />
        </OverviewCard>

        <OverviewCard title="Galleries" tooltip="View metrics around Gallery activity." bodyClassName="px-3 py-5">
          <div className="grid gap-6 items-center grid-cols-1 sm:grid-cols-[190px_1fr] sm:pl-3">
            <InsightsDonut segments={data.galleryDownloads} totalLabel="Asset Downloads" />
            <div className="grid grid-cols-2 gap-3">
              {data.galleryTiles.map((t) => (
                <StatBox key={t.label} label={t.label} value={t.value.current} change={t.value} badge="below" />
              ))}
            </div>
          </div>
        </OverviewCard>
      </div>

      {/* Row 3 */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {(
          [
            ["Share Requests", data.shareRequests, "View metrics on Share Request activity. The requests fulfilled includes all unique responders."],
            ["Content Requests", data.contentRequests, "View metrics on Content Request activity. The requests fulfilled includes all unique responders."],
          ] as const
        ).map(([title, tiles, tooltip]) => (
          <OverviewCard key={title} title={title} tooltip={tooltip} bodyClassName="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatBox label="Sent" value={tile(tiles, "Sent").current} change={tile(tiles, "Sent")} icon="bi-send" />
            <StatBox label="Fulfilled" value={tile(tiles, "Fulfilled").current} change={tile(tiles, "Fulfilled")} icon="bi-check-circle" />
          </OverviewCard>
        ))}
      </div>
    </div>
  );
}
