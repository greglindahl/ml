import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import orgLogoPlaceholder from "@/assets/org-logo-placeholder.png";

interface Org {
  id: string;
  name: string;
  initial: string;
}

interface OrgSwitcherProps {
  orgs: Org[];
  activeOrg: Org;
  onOrgChange: (org: Org) => void;
  isExpanded: boolean;
}

function ChannelSwitcherContent({ 
  orgs, 
  activeOrg, 
  onOrgChange, 
  searchQuery, 
  setSearchQuery 
}: { 
  orgs: Org[]; 
  activeOrg: Org; 
  onOrgChange: (org: Org) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  const filteredOrgs = orgs.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <div className="px-4 pt-4 pb-1">
        <h3 className="text-[13px] font-medium text-channel-text mb-[5px]">Switch to a new Channel</h3>
      </div>

      {/* Search Input */}
      <div className="px-4 pb-3">
        <div className="relative">
          <i className="bi bi-search absolute left-2 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-channel-placeholder" />
          <input
            type="text"
            placeholder="Search for Channel"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-1.5 pl-[33px] pr-2 text-[14.25px] leading-[22px] border border-channel-input-border rounded-md bg-background text-foreground placeholder:text-channel-placeholder focus:outline-none focus:border-channel-focus"
          />
        </div>
      </div>

      {/* Org List */}
      <div className="px-4 pb-4 max-h-[50vh] overflow-auto">
        {filteredOrgs.map((org, index) => {
          const isCurrentOrg = activeOrg.id === org.id;
          const isLastItem = index === filteredOrgs.length - 1;
          
          return (
            <button
              key={org.id}
              onClick={() => {
                if (!isCurrentOrg) {
                  onOrgChange(org);
                  setSearchQuery("");
                }
              }}
              disabled={isCurrentOrg}
              className={`w-full flex items-center py-2.5 transition-colors ${
                !isLastItem ? "border-b border-channel-border" : ""
              } ${
                isCurrentOrg 
                  ? "text-channel-active font-bold cursor-default" 
                  : "text-channel-text hover:bg-channel-hover"
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-600 flex items-center justify-center mr-2.5">
                <img src={orgLogoPlaceholder} alt={org.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-[15px] flex-1 text-left truncate whitespace-nowrap overflow-hidden">
                {org.name}
              </span>
            </button>
          );
        })}
        {filteredOrgs.length === 0 && (
          <div className="min-h-[38px] flex items-center justify-center text-muted-foreground text-[15px]">
            No Channels found
          </div>
        )}
      </div>
    </>
  );
}

export function OrgSwitcher({ orgs, activeOrg, onOrgChange, isExpanded }: OrgSwitcherProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center hover:opacity-80 transition-opacity ${isExpanded ? "flex-col gap-2" : ""}`}>
          <div className="w-14 h-14 bg-[#95aac9]/20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src={orgLogoPlaceholder} alt={activeOrg.name} className="w-8 h-8 object-contain" />
          </div>
          {isExpanded && (
            <span className="text-[17px] font-normal text-white tracking-tight">{activeOrg.name}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        side="right" 
        align="start" 
        className="w-72 p-0 bg-background border-0 rounded-md shadow-channel"
      >
        <ChannelSwitcherContent
          orgs={orgs}
          activeOrg={activeOrg}
          onOrgChange={onOrgChange}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MobileOrgSwitcher({ orgs, activeOrg, onOrgChange }: Omit<OrgSwitcherProps, "isExpanded">) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
            <img src={orgLogoPlaceholder} alt={activeOrg.name} className="w-6 h-6 object-contain" />
          </div>
          <span className="text-sm font-medium text-sidebar-accent-foreground truncate">{activeOrg.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        side="bottom" 
        align="start" 
        className="w-72 p-0 bg-background border-0 rounded-md shadow-channel"
      >
        <ChannelSwitcherContent
          orgs={orgs}
          activeOrg={activeOrg}
          onOrgChange={onOrgChange}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
