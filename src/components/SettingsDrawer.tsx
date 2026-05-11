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
  displayLabel: DisplayLabelOption;
  onDisplayLabelChange: (value: DisplayLabelOption) => void;
  children?: React.ReactNode;
}

export function SettingsDrawer({
  open,
  onOpenChange,
  displayLabel,
  onDisplayLabelChange,
  children,
}: SettingsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] sm:w-[360px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <i className="bi bi-gear" />
            Settings
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Grid Display Section */}
          <div className="space-y-3">
            <h3 className="text-[15px] font-medium">Grid display</h3>
            <p className="text-xs text-muted-foreground">
              Choose how asset cards are labeled in grid view.
            </p>
            <RadioGroup
              value={displayLabel}
              onValueChange={(value) => onDisplayLabelChange(value as DisplayLabelOption)}
              className="flex flex-col gap-2"
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

          {/* Table Preferences Section (only shown when children are provided) */}
          {children && (
            <>
              <div className="border-t pt-6">
                <h3 className="text-[15px] font-medium mb-4">Table preferences</h3>
                {children}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
