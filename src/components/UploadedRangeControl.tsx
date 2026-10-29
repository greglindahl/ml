import { useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UPLOADED_RANGE_OPTIONS, type CustomRange, type DateRangeValue } from "@/lib/dateRangeFilter";

/**
 * All Assets' Uploaded range as a scope control beside Sort (option B of the
 * default-sort follow-up): a dropdown that always has a value, so there is
 * nothing to clear and no chip. Custom opens a range calendar.
 */
export function UploadedRangeControl({
  value,
  customRange,
  onChange,
}: {
  value: DateRangeValue;
  customRange?: CustomRange;
  onChange: (value: DateRangeValue, range?: CustomRange) => void;
}) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(undefined);

  const label =
    value === "custom" && customRange?.from && customRange?.to
      ? `${format(customRange.from, "MMM d")} – ${format(customRange.to, "MMM d, yyyy")}`
      : UPLOADED_RANGE_OPTIONS.find((o) => o.value === value)?.label ?? "Last 30 days";

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <Tooltip delayDuration={700}>
        <DropdownMenu>
          <PopoverAnchor asChild>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-2 px-3 text-[15px] font-normal rounded-md bg-white border-gray-300 text-[#6e84a3]">
                  <i className="bi bi-calendar-plus w-4 h-4 inline-flex items-center justify-center leading-none" />
                  <span className="whitespace-nowrap">
                    <span className="uploaded-range-prefix">Uploaded: </span>
                    {label}
                  </span>
                  <i className="bi bi-chevron-down w-4 h-4 inline-flex items-center justify-center leading-none" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
          </PopoverAnchor>
          <DropdownMenuContent className="bg-white w-48">
            {UPLOADED_RANGE_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => {
                  if (opt.value === "custom") {
                    setDraft(customRange?.from ? { from: customRange.from, to: customRange.to } : undefined);
                    setCalendarOpen(true);
                  } else {
                    onChange(opt.value);
                  }
                }}
                className="flex items-center justify-between"
              >
                {opt.label}
                {value === opt.value && <i className="bi bi-check text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent side="bottom">Uploaded date</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-auto p-0 bg-white">
        <div className="p-4 pb-0">
          <Calendar mode="range" selected={draft} onSelect={setDraft} disabled={(d) => d > new Date()} showOutsideDays />
        </div>
        <Separator className="mt-4" />
        <div className="flex items-center justify-between p-3">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setCalendarOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="text-xs px-6"
            disabled={!draft?.from}
            onClick={() => {
              if (!draft?.from) return;
              onChange("custom", { from: draft.from, to: draft.to ?? draft.from });
              setCalendarOpen(false);
            }}
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
