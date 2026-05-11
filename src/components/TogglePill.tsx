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
 * Icon-only button — active background color signals on/off state.
 * Label is used for title tooltip on hover.
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
      title={label}
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
  );
}
