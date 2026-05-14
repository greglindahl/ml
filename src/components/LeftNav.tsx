import "bootstrap-icons/font/bootstrap-icons.css";
import { NavItem } from "./NavItem";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { OrgSwitcher, MobileOrgSwitcher } from "./OrgSwitcher";

function AvatarMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="User menu"
          className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Avatar className="h-10 w-10 cursor-pointer">
            <AvatarFallback className="bg-sidebar-accent text-nav-text">
              <i className="bi bi-person text-xl" />
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="bg-white z-50 min-w-[200px]"
      >
        <DropdownMenuItem onSelect={() => {}}>View Profile</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => {}}>Manage Notifications</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => {}}>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => {}}>Log Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type Screen =
  | "home"
  | "library"
  | "network"
  | "connect"
  | "engage"
  | "requests"
  | "stats";

interface LeftNavProps {
  isExpanded: boolean;
  activeScreen: Screen;
  onToggle: () => void;
  onNavigate: (screen: Screen) => void;
  isMobile?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const mainNavItems: {
  id: Screen;
  icon: string;
  label: string;
}[] = [
  { id: "home", icon: "bi-house", label: "Home" },
  { id: "library", icon: "bi-image", label: "Library" },
  { id: "network", icon: "bi-people", label: "Network" },
  { id: "connect", icon: "bi-plug", label: "Connect" },
  { id: "engage", icon: "bi-cloud-arrow-up", label: "Engage" },
  { id: "requests", icon: "bi-camera", label: "Requests" },
  { id: "stats", icon: "bi-bar-chart", label: "Insights" },
];

const orgs = [
  { id: "zephyr", name: "Zephyr Inc", initial: "Z" },
  { id: "acme", name: "Acme Corp", initial: "A" },
  { id: "nova", name: "Nova Labs", initial: "N" },
];

export function LeftNav({
  isExpanded,
  activeScreen,
  onToggle,
  onNavigate,
  isMobile = false,
  isMobileOpen = false,
  onCloseMobile,
}: LeftNavProps) {
  const [activeOrg, setActiveOrg] = useState(orgs[0]);

  // Mobile: slide-in drawer behavior
  if (isMobile) {
    return (
      <nav
        className={`fixed top-0 left-0 h-screen w-[280px] bg-nav-background border-r border-nav-border flex flex-col z-50 transition-transform duration-300 ease-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile header with close button */}
        <div className="p-4 border-b border-nav-border flex items-center justify-between">
          <MobileOrgSwitcher
            orgs={orgs}
            activeOrg={activeOrg}
            onOrgChange={setActiveOrg}
          />
          <button
            onClick={onCloseMobile}
            className="p-2 hover:bg-sidebar-accent rounded-md transition-colors text-nav-text hover:text-nav-text-hover"
            aria-label="Close navigation"
          >
            <i className="bi bi-x-lg w-5 h-5 inline-flex items-center justify-center leading-none" />
          </button>
        </div>

        {/* Main navigation */}
        <div className="flex-1 py-2 overflow-y-auto">
          {mainNavItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isExpanded={true}
              isActive={activeScreen === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </div>


      {/* Greenfly logo */}
      <div className="px-4 py-3 flex items-center justify-center">
        <img src="/assets/gf-logo/gf-logo-white.svg" alt="Greenfly" className="h-6 opacity-70" />
      </div>

      {/* Utility icons row */}
      <div className="py-3 pb-4 flex items-center justify-between px-4">
        <AvatarMenu />
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-sidebar-accent rounded-md transition-colors">
            <i className="bi bi-question-circle text-nav-text text-xl" />
          </button>
          <button className="relative p-2 hover:bg-sidebar-accent rounded-md transition-colors">
            <i className="bi bi-envelope text-nav-text text-xl" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
              99+
            </span>
          </button>
          <button className="p-2 hover:bg-sidebar-accent rounded-md transition-colors">
            <i className="bi bi-megaphone text-nav-text text-xl" />
          </button>
        </div>
      </div>
    </nav>
    );
  }

  // Desktop: original behavior
  return (
    <nav
      className="h-screen bg-nav-background border-r border-nav-border flex flex-col nav-transition flex-shrink-0 relative group"
      style={{ width: isExpanded ? "260px" : "72px" }}
    >
      {/* Floating toggle button - appears on right edge on hover */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            className="absolute top-8 -translate-y-1/2 -right-3 z-10 w-6 h-6 bg-nav-background border border-nav-border rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sidebar-accent"
            aria-label={isExpanded ? "Collapse navigation" : "Expand navigation"}
          >
            <i className={`bi ${isExpanded ? "bi-chevron-double-left" : "bi-chevron-double-right"} text-nav-text text-[15px]`} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {isExpanded ? "Collapse" : "Expand"}
        </TooltipContent>
      </Tooltip>

      {/* Header with org logo dropdown */}
      <div className={`${isExpanded ? "py-9 px-4 flex justify-center" : "py-9 px-4 flex justify-center"}`}>
        <OrgSwitcher
          orgs={orgs}
          activeOrg={activeOrg}
          onOrgChange={setActiveOrg}
          isExpanded={isExpanded}
        />
      </div>

      {/* Main navigation */}
      <div className="flex-1 py-2">
        {mainNavItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isExpanded={isExpanded}
            isActive={activeScreen === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </div>


      {/* Greenfly logo */}
      <div className={`py-3 flex items-center justify-center ${isExpanded ? "px-4" : ""}`}>
        {isExpanded ? (
          <img src="/assets/gf-logo/gf-logo-white.svg" alt="Greenfly" className="h-6 opacity-70" />
        ) : (
          <img src="/assets/gf-fly-icon/gf-fly-icon-white.svg" alt="Greenfly" className="h-6 opacity-70" />
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 my-6 border-t border-nav-border" />

      {/* Utility icons row */}
      {isExpanded ? (
        <div className="py-3 pb-4 flex items-center justify-between px-4">
          <AvatarMenu />
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-sidebar-accent rounded-md transition-colors">
              <i className="bi bi-question-circle text-nav-text text-xl" />
            </button>
            <button className="relative p-2 hover:bg-sidebar-accent rounded-md transition-colors">
              <i className="bi bi-envelope text-nav-text text-xl" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                99+
              </span>
            </button>
            <button className="p-2 hover:bg-sidebar-accent rounded-md transition-colors">
              <i className="bi bi-megaphone text-nav-text text-xl" />
            </button>
          </div>
        </div>
      ) : (
        <div className="py-3 pb-4 flex flex-col items-center gap-3">
          <button className="p-2 hover:bg-sidebar-accent rounded-md transition-colors">
            <i className="bi bi-megaphone text-nav-text text-xl" />
          </button>
          <button className="relative p-2 hover:bg-sidebar-accent rounded-md transition-colors">
            <i className="bi bi-envelope text-nav-text text-xl" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
              99+
            </span>
          </button>
          <button className="p-2 hover:bg-sidebar-accent rounded-md transition-colors">
            <i className="bi bi-question-circle text-nav-text text-xl" />
          </button>
          <AvatarMenu />
        </div>
      )}
    </nav>
  );
}