import { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export type DisplayLabelOption = "title" | "creator" | "none";

const DISPLAY_LABEL_KEY = "library-display-label";

export function useDisplayLabel() {
  const [displayLabel, setDisplayLabel] = useState<DisplayLabelOption>(() => {
    if (typeof window === "undefined") return "title";
    const stored = localStorage.getItem(DISPLAY_LABEL_KEY);
    return (stored as DisplayLabelOption) || "title";
  });

  useEffect(() => {
    localStorage.setItem(DISPLAY_LABEL_KEY, displayLabel);
  }, [displayLabel]);

  return [displayLabel, setDisplayLabel] as const;
}

export function usePerPagePreference(key: string, defaultValue = 40) {
  const storageKey = `tablePerPage.${key}`;
  const [perPage, setPerPage] = useState<number>(() => {
    if (typeof window === "undefined") return defaultValue;
    const stored = localStorage.getItem(storageKey);
    return stored ? Number(stored) : defaultValue;
  });
  useEffect(() => {
    localStorage.setItem(storageKey, String(perPage));
  }, [perPage, storageKey]);
  return [perPage, setPerPage] as const;
}

export function useColumnVisibility<T extends Record<string, boolean>>(
  key: string,
  defaultVisibility: T
) {
  const storageKey = `tableColumns.${key}`;
  const [columnVisibility, setColumnVisibility] = useState<T>(() => {
    if (typeof window === "undefined") return defaultVisibility;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try { return { ...defaultVisibility, ...JSON.parse(stored) }; }
      catch { return defaultVisibility; }
    }
    return defaultVisibility;
  });
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(columnVisibility));
  }, [columnVisibility, storageKey]);
  return [columnVisibility, setColumnVisibility] as const;
}

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayLabel?: DisplayLabelOption;
  onDisplayLabelChange?: (value: DisplayLabelOption) => void;
  children?: React.ReactNode;
  title?: string;
  showGridViewPreferences?: boolean;
}

function SectionHeader({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
        <i className={`bi ${icon} text-primary text-[15px]`} />
      </div>
      <h3 className="text-[15px] font-medium tracking-[-0.3px]">{children}</h3>
    </div>
  );
}

export function SettingsDrawer({
  open,
  onOpenChange,
  displayLabel,
  onDisplayLabelChange,
  children,
  title = "Library Settings",
  showGridViewPreferences = true,
}: SettingsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Grid View Preferences Section */}
          {showGridViewPreferences && displayLabel && onDisplayLabelChange && (
            <div className="space-y-6">
              <SectionHeader icon="bi-grid">Grid View Preferences</SectionHeader>
              <div className="space-y-3">
                <p className="text-[13px] text-muted-foreground tracking-[-0.13px]">
                  Display by:
                </p>
                <RadioGroup
                  value={displayLabel}
                  onValueChange={(value) => onDisplayLabelChange(value as DisplayLabelOption)}
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="title" id="display-title" />
                    <Label htmlFor="display-title" className="font-normal cursor-pointer">
                      Title
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="creator" id="display-creator" />
                    <Label htmlFor="display-creator" className="font-normal cursor-pointer">
                      Creator
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="display-none" />
                    <Label htmlFor="display-none" className="font-normal cursor-pointer">
                      None
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Table View Preferences Section */}
          {children && (
            <>
              {showGridViewPreferences && displayLabel && <Separator />}
              <div className="space-y-6">
                <SectionHeader icon="bi-table">Table View Preferences</SectionHeader>
                {children}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
