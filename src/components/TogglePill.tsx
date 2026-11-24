import "bootstrap-icons/font/bootstrap-icons.css";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/** A toggle pill as a possible applied-filter chip. */
export interface ToggleChipDef {
  id: string;
  label: string;
  iconClass: string;
  active?: boolean;
  /** Absent when the page doesn't wire the toggle up; then it never chips. */
  onChange?: (on: boolean) => void;
}

/**
 * Prod (Tell's build): on phone the toggle pills live only in the filters sheet,
 * so each one that's on shows as a chip in the applied-filter row, its × turns
 * it off, and the row's Clear Filters clears it with the rest. Above phone width
 * the pill itself shows the state, so there's no chip. Returns the chips to draw.
 */
export function activeToggleChips(isPhone: boolean, defs: ToggleChipDef[]) {
  return isPhone ? defs.filter((d) => d.active && d.onChange) : [];
}

/** Turns every chipped toggle off: part of the chip row's Clear Filters. */
export function clearToggleChips(chips: ToggleChipDef[]) {
  chips.forEach((c) => c.onChange?.(false));
}

/** The toggle chips, styled like the facet chips beside them. */
export function ToggleChips({ chips }: { chips: ToggleChipDef[] }) {
  return (
    <>
      {chips.map((chip) => (
        <Badge
          key={`toggle-${chip.id}`}
          colorStyle="primary"
          theme="soft"
          shape="rounded"
          className="gap-1.5 pr-1.5 cursor-pointer transition-colors hover:bg-primary/30 text-[13px] normal-case tracking-normal font-normal"
          onClick={() => chip.onChange?.(false)}
        >
          <i className={cn("bi", chip.iconClass, "text-sm")} />
          {chip.label}
          <i className="bi bi-x text-sm ml-0.5" />
        </Badge>
      ))}
    </>
  );
}
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TogglePillProps {
  label: string;
  iconClass: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
  /** Optional tooltip text. Falls back to label if not provided. */
  tooltip?: string;
}

/**
 * A binary toggle pill for filter bars.
 * Icon-only button — active background color signals on/off state.
 * Label is used for tooltip on hover.
 */
export function TogglePill({
  label,
  iconClass,
  isActive,
  onClick,
  className,
  tooltip,
}: TogglePillProps) {
  return (
    <Tooltip delayDuration={700}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "filter-toggle-pill inline-flex items-center justify-center h-10 w-10 rounded-md transition-colors",
            isActive
              ? "bg-primary/10 border border-primary text-primary"
              : "bg-white border border-gray-300 text-[#6e84a3] hover:bg-accent/50",
            className
          )}
        >
          <i className={cn("bi", iconClass, "w-4 h-4 inline-flex items-center justify-center leading-none")} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {tooltip ?? label}
      </TooltipContent>
    </Tooltip>
  );
}
