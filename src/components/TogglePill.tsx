import "bootstrap-icons/font/bootstrap-icons.css";
import { cn } from "@/lib/utils";
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
            "inline-flex items-center justify-center h-10 w-10 rounded-md transition-colors",
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
