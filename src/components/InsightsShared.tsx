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

export function StatTile({
  label,
  value,
  format = formatNumber,
  showChange = true,
}: {
  label: string;
  value: MetricValue | number | null;
  format?: (n: number) => string;
  showChange?: boolean;
}) {
  const metric = typeof value === "number" ? { current: value, previous: value } : value;
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[24px] font-semibold text-foreground tabular-nums leading-tight">
          {metric ? format(metric.current) : "n/a"}
        </span>
        {metric && showChange && typeof value !== "number" && <ChangeBadge value={metric} />}
      </div>
    </div>
  );
}

export function InsightsCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border rounded-lg bg-white flex flex-col", className)} aria-label={title}>
      <header className="flex items-center justify-between gap-3 px-5 py-3 border-b min-h-[52px]">
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {action}
      </header>
      <div className="p-5 flex-1">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Doughnut (Visx)
// ---------------------------------------------------------------------------

/**
 * Categorical slots from the dataviz reference palette, fixed order, never
 * cycled. Validated on white: adjacent pairs (incl. the ring's wraparound) pass
 * CVD ≥ 8 and normal-vision ≥ 15. Slots 3–4 sit under 3:1 contrast, so the
 * legend always prints values — the required relief.
 */
export const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100"];

const SIZE = 168;
const THICKNESS = 20;

export function InsightsDonut({
  segments,
  totalLabel,
  showChange = true,
}: {
  segments: Segment[];
  totalLabel: string;
  showChange?: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  const total: MetricValue = segments.reduce(
    (sum, s) => ({ current: sum.current + s.value.current, previous: sum.previous + s.value.previous }),
    { current: 0, previous: 0 },
  );
  const activeSegment = segments.find((s) => s.key === active);
  const share = (n: number) => (total.current === 0 ? 0 : Math.round((n / total.current) * 100));
  const radius = SIZE / 2;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} role="img" aria-label={`${totalLabel}: ${formatNumber(total.current)}`}>
          <Group top={radius} left={radius}>
            {total.current === 0 ? (
              <circle r={radius - THICKNESS / 2} fill="none" stroke="#edf2f9" strokeWidth={THICKNESS} />
            ) : (
              <Pie
                data={segments}
                pieValue={(s) => s.value.current}
                pieSort={null}
                outerRadius={radius}
                innerRadius={radius - THICKNESS}
                cornerRadius={3}
              >
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
                      className="transition-opacity duration-150 motion-reduce:transition-none cursor-default"
                      onMouseEnter={() => setActive(arc.data.key)}
                      onMouseLeave={() => setActive(null)}
                    />
                  ))
                }
              </Pie>
            )}
          </Group>
        </svg>
        {/* Center readout doubles as the hover tooltip: total by default, the hovered segment otherwise. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6" aria-live="polite">
          <span className="text-[22px] font-semibold text-foreground tabular-nums leading-tight">
            {formatNumber(activeSegment ? activeSegment.value.current : total.current)}
          </span>
          <span className="text-[12px] text-muted-foreground leading-tight">
            {activeSegment ? `${activeSegment.label} · ${share(activeSegment.value.current)}%` : totalLabel}
          </span>
          {showChange && <ChangeBadge value={activeSegment ? activeSegment.value : total} className="mt-1" />}
        </div>
      </div>

      <ul className="w-full space-y-1.5">
        {segments.map((s, i) => (
          <li key={s.key}>
            <button
              type="button"
              className={cn(
                "w-full flex items-center gap-2 text-[13px] rounded px-1 -mx-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                active && active !== s.key && "opacity-50",
              )}
              onMouseEnter={() => setActive(s.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(s.key)}
              onBlur={() => setActive(null)}
            >
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: SERIES_COLORS[i] }} aria-hidden="true" />
              <span className="text-foreground flex-1 min-w-0 truncate">{s.label}</span>
              <span className="tabular-nums text-foreground">{formatNumber(s.value.current)}</span>
              <span className="tabular-nums text-muted-foreground w-10 text-right">{share(s.value.current)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
