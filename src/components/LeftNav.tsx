import { X, User } from "lucide-react";
import { NavItem } from "./NavItem";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { OrgSwitcher, MobileOrgSwitcher } from "./OrgSwitcher";
import gfLogoHorizontal from "@/assets/gf-logo-white-horizontal.svg";
import gfLogoMark from "@/assets/gf-logo-white-mark.svg";

export type Screen =
  | "home"
  | "library"
  | "engage"
  | "requests"
  | "connect"
  | "stats"
  | "admin"
  | "help";

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
  { id: "connect", icon: "bi-plug", label: "Connect" },
  { id: "engage", icon: "bi-cloud-arrow-up", label: "Engage" },
  { id: "requests", icon: "bi-camera", label: "Requests" },
  { id: "stats", icon: "bi-bar-chart", label: "Insights" },
  { id: "admin", icon: "bi-shield-lock", label: "Admin" },
];

const bottomNavItems: { id: Screen; icon: string; label: string }[] = [
  { id: "help", icon: "bi-question-circle", label: "Help" },
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
            <X className="w-5 h-5" />
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


      {/* Utility icons */}
      <div className="py-2 flex items-center justify-center gap-3 px-4">
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="bg-sidebar-accent text-nav-text">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <button className="relative p-2 hover:bg-sidebar-accent rounded-md transition-colors">
          <i className="bi bi-envelope text-nav-text text-lg" />
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium px-1 py-0.5 rounded-full min-w-[18px] text-center leading-none">
            99+
          </span>
        </button>
        <button className="p-2 hover:bg-sidebar-accent rounded-md transition-colors">
          <i className="bi bi-megaphone text-nav-text text-lg" />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-nav-border" />

      {/* Bottom navigation + Greenfly logo */}
      <div className="px-2 pb-4 flex items-center justify-between">
        <div>
          {bottomNavItems.map((item) => (
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
        <div className="px-2">
          <img src={gfLogoHorizontal} alt="Greenfly" className="h-5 opacity-60" />
        </div>
      </div>
    </nav>
    );
  }

  // Desktop: original behavior
  return (
    <nav
      className="h-screen bg-nav-background border-r border-nav-border flex flex-col nav-transition flex-shrink-0 relative group"
      style={{ width: isExpanded ? "256px" : "72px" }}
    >
      {/* Floating toggle button - appears on right edge on hover */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            className="absolute top-8 -translate-y-1/2 -right-3 z-10 w-6 h-6 bg-nav-background border border-nav-border rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sidebar-accent"
            aria-label={isExpanded ? "Collapse navigation" : "Expand navigation"}
          >
            <i className="bi bi-layout-sidebar text-nav-text text-xs" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {isExpanded ? "Collapse" : "Expand"}
        </TooltipContent>
      </Tooltip>

      {/* Header with org logo dropdown */}
      <div className={`border-b border-nav-border ${isExpanded ? "p-4" : "p-4 flex justify-center"}`}>
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


      {/* Utility icons */}
      <div className={`py-3 ${isExpanded ? "flex items-center justify-center gap-3 px-4" : "flex flex-col items-center gap-2"}`}>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="bg-sidebar-accent text-nav-text">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <button className="relative p-2 hover:bg-sidebar-accent rounded-md transition-colors">
          <i className="bi bi-envelope text-nav-text text-lg" />
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium px-1 py-0.5 rounded-full min-w-[18px] text-center leading-none">
            99+
          </span>
        </button>
        <button className="p-2 hover:bg-sidebar-accent rounded-md transition-colors">
          <i className="bi bi-megaphone text-nav-text text-lg" />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-nav-border" />

      {/* Bottom navigation + Greenfly logo */}
      {isExpanded ? (
        <div className="px-2 pb-4 flex items-center justify-between">
          <div>
            {bottomNavItems.map((item) => (
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
          <div className="px-2">
            <img src={gfLogoHorizontal} alt="Greenfly" className="h-5 opacity-60" />
          </div>
        </div>
      ) : (
        <div className="py-2 flex flex-col items-center gap-2 pb-4">
          {bottomNavItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isExpanded={false}
              isActive={activeScreen === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
          <img src={gfLogoMark} alt="Greenfly" className="h-6 opacity-60" />
        </div>
      )}
    </nav>
  );
}