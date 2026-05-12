import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItemProps {
  icon: string; // Bootstrap icon class name (e.g., "bi-house")
  label: string;
  isExpanded: boolean;
  isActive: boolean;
  onClick: () => void;
}

export function NavItem({
  icon,
  label,
  isExpanded,
  isActive,
  onClick,
}: NavItemProps) {
  const content = (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 py-3 
        transition-colors duration-150
        text-nav-text hover:text-nav-text-hover hover:bg-sidebar-accent
        border-l-2 border-transparent
        ${isExpanded ? "px-4" : "justify-center"}
        ${isActive ? "bg-sidebar-accent text-nav-text-active !border-nav-active-border" : ""}
      `}
    >
      <i className={`bi ${isActive ? `${icon}-fill` : icon} bi-md flex-shrink-0`} />
      {isExpanded && (
        <span className="flex-1 text-left text-[15px] truncate">{label}</span>
      )}
    </button>
  );

  if (!isExpanded) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="relative">{content}</div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}