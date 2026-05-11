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

export type DisplayLabelOption = "title" | "creator";

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

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayLabel: DisplayLabelOption;
  onDisplayLabelChange: (value: DisplayLabelOption) => void;
}

export function SettingsDrawer({
  open,
  onOpenChange,
  displayLabel,
  onDisplayLabelChange,
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
          {/* Display Label Setting */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Display label</Label>
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
            </RadioGroup>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
