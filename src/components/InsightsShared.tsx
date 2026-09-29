import { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Pie } from "@visx/shape";
import { Group } from "@visx/group";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DEFAULT_INSIGHTS_RANGE,
  INSIGHTS_RANGES,
  formatNumber,
  percentChange,
  rangeBounds,
  type InsightsRange,
  type MetricValue,
  type Segment,
} from "@/lib/mockInsightsData";

// ---------------------------------------------------------------------------
// Date range
// ---------------------------------------------------------------------------

const RANGE_KEY = "insights.dateRange";

/** Prod remembers the last range in localStorage and falls back to Last 30 days. */
export function useInsightsRange() {
  const [range, setRange] = useState<InsightsRange>(() => {
    try {
      const stored = localStorage.getItem(RANGE_KEY) as InsightsRange | null;
      return stored && INSIGHTS_RANGES.some((r) => r.value === stored) ? stored : DEFAULT_INSIGHTS_RANGE;
    } catch {
      return DEFAULT_INSIGHTS_RANGE;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(RANGE_KEY, range);
    } catch {
      // Storage unavailable — the range just won't persist.
    }
  }, [range]);
  return [range, setRange] as const;
}

/** Not clearable, same as prod's gf-date-range-select. */
export function DateRangeSelect({ value, onChange }: { value: InsightsRange; onChange: (value: InsightsRange) => void }) {
  const label = INSIGHTS_RANGES.find((r) => r.value === value)?.label;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 min-w-[200px] justify-between gap-2 px-4 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]"
          aria-label={`Date range: ${label}`}
        >
          <span className="text-foreground">{label}</span>
          <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white w-[var(--radix-dropdown-menu-trigger-width)]">
        {INSIGHTS_RANGES.map((r) => (
          <DropdownMenuItem key={r.value} onClick={() => onChange(r.value)} className="flex items-center justify-between text-[13px]">
            {r.label}
            {r.value === value && <i className="bi bi-check2 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const escape = (cell: string | number | null) => {
    const s = cell == null ? "" : String(cell);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob([rows.map((r) => r.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Change badge + tiles + cards
// ---------------------------------------------------------------------------

/**
 * Prod's gf-change-over-time-badge: "+ 123.1%" (success), "-12.5%" (danger),
 * "0%" (neutral), up to one decimal, "n/a" when there's no previous period to
 * compare against. The sign is text, never color alone.
 */
export function ChangeBadge({ value, className }: { value: MetricValue; className?: string }) {
  const change = percentChange(value);
  const rounded = change === null ? null : Math.round(change * 10) / 10;
  const tone = rounded === null || rounded === 0 ? "flat" : rounded > 0 ? "up" : "down";
  const text =
    rounded === null ? "n/a" : `${rounded > 0 ? "+ " : ""}${rounded.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[13px] font-medium tabular-nums whitespace-nowrap",
        tone === "up" && "bg-[#CCF2E0] text-[#00854D]",
        tone === "down" && "bg-[#FAD7DD] text-[#B4213D]",
        tone === "flat" && "bg-[#EDF2F9] text-[#6E84A3]",
        className,
      )}
      title={rounded === null ? "No previous period to compare" : `${formatNumber(value.previous)} in the previous period`}
    >
      {text}
      <span className="sr-only">{rounded === null ? "" : " vs previous period"}</span>
    </span>
  );
}

/**
 * Prod's dashboard-metric-number-module inside a card: uppercase title with an
 * info tooltip, the number and its change badge, and an icon on the right.
 */
export function MetricCard({
  title,
  tooltip,
  icon,
  value,
  isPercent = false,
}: {
  title: string;
  tooltip: string;
  icon: string;
  value: MetricValue | null;
  isPercent?: boolean;
}) {
  return (
    <div className="border rounded-lg bg-white px-5 py-4">
      <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-3">
        {title}
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground hover:text-foreground" aria-label={`About ${title}`}>
              <i className="bi bi-info-circle text-[13px]" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px] normal-case tracking-normal font-normal">{tooltip}</TooltipContent>
        </Tooltip>
      </h3>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <span className={cn("text-[26px] font-semibold tabular-nums leading-none", value ? "text-foreground" : "text-muted-foreground")}>
            {value ? `${formatNumber(value.current)}${isPercent ? "%" : ""}` : "n/a"}
          </span>
          {value && <ChangeBadge value={value} />}
        </div>
        <i className={cn("bi", icon, "text-[24px] text-foreground flex-shrink-0")} aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * Prod's dashboard-date-range-print-out: "+ / - Quantities are looking back at
 * the previous 7 days, Data for: 9/22/26, 12:00 AM - 9/28/26, 11:59 PM".
 */
export function RangePrintOut({ range }: { range: InsightsRange }) {
  const label = INSIGHTS_RANGES.find((r) => r.value === range)?.label ?? "";
  const phrase = label.startsWith("Last ") ? `previous ${label.slice(5)}` : label.toLowerCase();
  const { from, until } = rangeBounds(range);
  const end = new Date(until);
  end.setHours(23, 59, 0, 0);
  const short = (d: Date) =>
    d.toLocaleString("en-US", { month: "numeric", day: "numeric", year: "2-digit", hour: "numeric", minute: "2-digit" });
  return (
    <p className="text-[13px] text-muted-foreground">
      + / - Quantities are looking back at the {phrase},{" "}
      <strong className="font-semibold">Data for:</strong> {short(from)} - {short(end)}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Doughnut (Visx)
// ---------------------------------------------------------------------------

/**
 * Categorical slots from the dataviz reference palette, fixed order, never
 * cycled (blue, orange, aqua, yellow, magenta, green). Validated on white for a
 * ring — every adjacent pair incl. the wraparound passes CVD ≥ 8 and
 * normal-vision ≥ 15. Aqua, yellow and magenta sit under 3:1 contrast, so every
 * legend prints its values: that's the required relief.
 */
export const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];

/** "2,480" → "2.5K", "1,204,000" → "1.2M" — the doughnut centers in the Overview design. */
export function formatShort(n: number): string {
  if (n >= 1_000_000) return `${Number((n / 1_000_000).toFixed(1))}M`;
  if (n >= 1_000) return `${Number((n / 1_000).toFixed(1))}K`;
  return String(n);
}

/**
 * Overview doughnut (Visx). Center: uppercase label, short total, change badge;
 * hovering or focusing a segment swaps the center to that segment's value and
 * share. Legend is "Label: value" — `inline` under the ring (Total Content,
 * Galleries) or a `side` list beside it (Shares).
 */
export function InsightsDonut({
  segments,
  totalLabel,
  size = 150,
  thickness = 16,
  legend = "inline",
  showChange = true,
}: {
  segments: Segment[];
  totalLabel: string;
  size?: number;
  thickness?: number;
  legend?: "inline" | "side";
  showChange?: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  const total: MetricValue = segments.reduce(
    (sum, seg) => ({ current: sum.current + seg.value.current, previous: sum.previous + seg.value.previous }),
    { current: 0, previous: 0 },
  );
  const activeSegment = segments.find((seg) => seg.key === active);
  const share = (n: number) => (total.current === 0 ? 0 : Math.round((n / total.current) * 100));
  const radius = size / 2;

  const ring = (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${totalLabel}: ${formatNumber(total.current)}`}>
        <Group top={radius} left={radius}>
          {total.current === 0 ? (
            <circle r={radius - thickness / 2} fill="none" stroke="#edf2f9" strokeWidth={thickness} />
          ) : (
            <Pie data={segments} pieValue={(seg) => seg.value.current} pieSort={null} outerRadius={radius} innerRadius={radius - thickness} cornerRadius={2}>
              {(pie) =>
                pie.arcs.map((arc, i) => (
                  <path
                    key={arc.data.key}
                    d={pie.path(arc) ?? ""}
                    fill={SERIES_COLORS[i]}
                    // 2px surface gap between segments.
                    stroke="#ffffff"
                    strokeWidth={2}
                    opacity={active && active !== arc.data.key ? 0.35 : 1}
                    className="transition-opacity duration-150 motion-reduce:transition-none"
                    onMouseEnter={() => setActive(arc.data.key)}
                    onMouseLeave={() => setActive(null)}
                  />
                ))
              }
            </Pie>
          )}
        </Group>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center" style={{ padding: thickness + 8 }} aria-live="polite">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-tight">
          {activeSegment ? activeSegment.label : totalLabel}
        </span>
        <span className="text-[22px] font-semibold text-foreground tabular-nums leading-tight mt-0.5" title={formatNumber(activeSegment ? activeSegment.value.current : total.current)}>
          {formatShort(activeSegment ? activeSegment.value.current : total.current)}
        </span>
        {activeSegment ? (
          <span className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{share(activeSegment.value.current)}%</span>
        ) : (
          showChange && <ChangeBadge value={total} className="mt-1 text-[11px] px-1.5" />
        )}
      </div>
    </div>
  );

  const items = segments.map((seg, i) => (
    <li key={seg.key}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-0.5 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          legend === "side" ? "text-[13px]" : "text-[11px]",
          active && active !== seg.key && "opacity-50",
        )}
        onMouseEnter={() => setActive(seg.key)}
        onMouseLeave={() => setActive(null)}
        onFocus={() => setActive(seg.key)}
        onBlur={() => setActive(null)}
      >
        <span className="w-[9px] h-[9px] rounded-full flex-shrink-0" style={{ backgroundColor: SERIES_COLORS[i] }} aria-hidden="true" />
        <span className="tabular-nums whitespace-nowrap">
          {seg.label}: {formatNumber(seg.value.current)}
        </span>
      </button>
    </li>
  ));

  return legend === "side" ? (
    <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-4">
      {ring}
      <ul className="flex flex-col gap-2">{items}</ul>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3">
      {ring}
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">{items}</ul>
    </div>
  );
}
