import { useMemo, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InsightsCard, InsightsDonut, StatTile } from "./InsightsShared";
import {
  TOP_USERS_METRICS,
  formatCompact,
  formatNumber,
  getOverview,
  getUserMetrics,
  type InsightsRange,
  type TopUsersMetric,
} from "@/lib/mockInsightsData";

function TopUsers({ range }: { range: InsightsRange }) {
  const [metric, setMetric] = useState<TopUsersMetric>("downloads");
  const top = useMemo(
    () => [...getUserMetrics(range)].sort((a, b) => b[metric] - a[metric]).slice(0, 5),
    [range, metric],
  );
  const label = TOP_USERS_METRICS.find((m) => m.value === metric)!.label;

  return (
    <InsightsCard
      title="Top Users"
      action={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[13px] font-normal bg-white" aria-label={`Rank by ${label}`}>
              {label}
              <i className="bi bi-chevron-down text-[11px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white">
            {TOP_USERS_METRICS.map((m) => (
              <DropdownMenuItem key={m.value} onClick={() => setMetric(m.value)} className="text-[13px] flex justify-between gap-4">
                {m.label}
                {m.value === metric && <i className="bi bi-check2 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      }
    >
      <ol className="space-y-3">
        {top.map((row, i) => (
          <li key={row.user.id} className="flex items-center gap-3 text-[13px]">
            <span className="w-4 text-muted-foreground tabular-nums">{i + 1}</span>
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-[11px] font-semibold inline-flex items-center justify-center flex-shrink-0">
              {row.user.initials}
            </span>
            <span className="flex-1 min-w-0 truncate text-foreground">{row.user.name}</span>
            <span className="tabular-nums font-medium text-foreground">{formatNumber(row[metric])}</span>
          </li>
        ))}
      </ol>
    </InsightsCard>
  );
}

export function InsightsOverview({ range }: { range: InsightsRange }) {
  const data = useMemo(() => getOverview(range), [range]);

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      <InsightsCard title="User Summary">
        <div className="grid grid-cols-2 gap-4">
          {/* Prod shows these without a change badge. */}
          <StatTile label="Total Users" value={data.totalUsers} />
          <StatTile label="New Users" value={data.newUsers} />
        </div>
      </InsightsCard>

      <TopUsers range={range} />

      <InsightsCard title="Total Content">
        {/* Two 168px rings don't fit side by side on a phone; stack them there. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InsightsDonut segments={data.downloads} totalLabel="Total Downloads" />
          <InsightsDonut segments={data.contentAdded} totalLabel="Total Content Added" />
        </div>
      </InsightsCard>

      <InsightsCard title="Shares" className="lg:col-span-2 xl:col-span-2">
        <div className="grid gap-6 sm:grid-cols-[220px_1fr] items-start">
          <InsightsDonut segments={data.shares} totalLabel="Shares" />
          <div className="space-y-3">
            <table className="w-full text-[13px]">
              <caption className="sr-only">Engagement by platform</caption>
              <tbody>
                {data.shareBreakdown.map((p) => (
                  <tr key={p.platform} className="border-b last:border-b-0 align-top">
                    <th scope="row" className="py-2 pr-4 text-left font-medium text-foreground whitespace-nowrap">{p.platform}</th>
                    <td className="py-2">
                      {p.stats.length === 0 ? (
                        <span className="text-muted-foreground">n/a</span>
                      ) : (
                        <div className="flex flex-wrap gap-x-6 gap-y-1">
                          {p.stats.map((s) => (
                            <span key={s.label}>
                              <span className="text-muted-foreground">{s.label} </span>
                              <span className="tabular-nums text-foreground">{formatCompact(s.value)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[12px] text-muted-foreground">* Share initiated events are included.</p>
          </div>
        </div>
      </InsightsCard>

      <InsightsCard title="Galleries">
        <div className="space-y-5">
          <InsightsDonut segments={data.galleryDownloads} totalLabel="Asset Downloads" />
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {data.galleryTiles.map((t) => (
              <StatTile key={t.label} label={t.label} value={t.value} />
            ))}
          </div>
        </div>
      </InsightsCard>

      <InsightsCard title="Share Requests">
        <div className="grid grid-cols-2 gap-4">
          {data.shareRequests.map((t) => (
            <StatTile key={t.label} label={t.label} value={t.value} />
          ))}
        </div>
      </InsightsCard>

      <InsightsCard title="Content Requests">
        <div className="grid grid-cols-2 gap-4">
          {data.contentRequests.map((t) => (
            <StatTile key={t.label} label={t.label} value={t.value} />
          ))}
        </div>
      </InsightsCard>
    </div>
  );
}
