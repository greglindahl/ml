import "bootstrap-icons/font/bootstrap-icons.css";
import { cn } from "@/lib/utils";

interface TogglePillProps {
  label: string;
  iconClass: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * A binary toggle pill for filter bars.
 * Looks like a filter chip but has NO chevron — that's the affordance signal vs. dropdowns.
 * Active state uses filled background (primary-tint pattern).
 * Inactive state uses standard outline.
 */
export function TogglePill({
  label,
  iconClass,
  isActive,
  onClick,
  className,
}: TogglePillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 text-[15px] font-normal rounded-md transition-colors",
        isActive
          ? "bg-primary/10 border border-primary text-primary"
          : "bg-white border border-gray-300 text-[#6e84a3] hover:bg-accent/50",
        className
      )}
    >
      <i className={cn("bi", iconClass)} />
      <span>{label}</span>
    </button>
  );
}
