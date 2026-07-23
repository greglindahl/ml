import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SectionTab {
  value: string;
  label: string;
}

interface SectionTabsProps {
  tabs: SectionTab[];
  value: string;
  onValueChange: (value: string) => void;
  isMobile?: boolean;
}

// Page-level section navigation: an underline tab bar on desktop and a
// full-width dropdown on mobile, where the tab set doesn't fit horizontally
// (mirrors the prod app). Must be rendered inside a <Tabs> so the desktop
// TabsList picks up the tabs context; the mobile Select drives the same
// value/onValueChange the parent passes to <Tabs>.
export function SectionTabs({ tabs, value, onValueChange, isMobile = false }: SectionTabsProps) {
  if (isMobile) {
    return (
      <div className="flex-shrink-0">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-full h-10" aria-label="Section">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>{tab.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="border-b flex-shrink-0">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}
