import { useState, useEffect, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Generic filter snapshot type - each screen will define its own shape
export type FilterSnapshot = Record<string, unknown>;

// Context for draft state within the sheet
interface FiltersSheetContextValue<T extends FilterSnapshot> {
  draft: T;
  setDraft: React.Dispatch<React.SetStateAction<T>>;
}

const FiltersSheetContext = createContext<FiltersSheetContextValue<FilterSnapshot> | null>(null);

export function useFiltersSheetDraft<T extends FilterSnapshot>() {
  const context = useContext(FiltersSheetContext);
  if (!context) {
    throw new Error("useFiltersSheetDraft must be used within a FiltersSheet");
  }
  return context as FiltersSheetContextValue<T>;
}

interface FiltersSheetProps<T extends FilterSnapshot> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: T;
  onApply: (next: T) => void;
  children: React.ReactNode | ((context: FiltersSheetContextValue<T>) => React.ReactNode);
  title?: string;
}

export function FiltersSheet<T extends FilterSnapshot>({
  open,
  onOpenChange,
  value,
  onApply,
  children,
  title = "Filters",
}: FiltersSheetProps<T>) {
  // Initialize draft from value when sheet opens
  const [draft, setDraft] = useState<T>(value);

  // Reset draft when sheet opens
  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const contextValue: FiltersSheetContextValue<T> = { draft, setDraft };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
      >
        <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <i className="bi bi-sliders text-lg" />
            <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
          </div>
        </SheetHeader>

        {/* Scrollable filter content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <FiltersSheetContext.Provider value={contextValue as FiltersSheetContextValue<FilterSnapshot>}>
            {typeof children === "function" ? children(contextValue) : children}
          </FiltersSheetContext.Provider>
        </div>

        {/* Fixed footer */}
        <div className="flex-shrink-0 border-t px-4 py-3">
          <Button onClick={handleApply} className="w-full">
            View Results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper component for filter sections inside the sheet
interface FilterSectionProps {
  label: string;
  icon?: string;
  children: React.ReactNode;
}

export function FilterSection({ label, icon, children }: FilterSectionProps) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center gap-2 mb-2">
        {icon && <i className={`bi ${icon} text-muted-foreground`} />}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {children}
    </div>
  );
}
