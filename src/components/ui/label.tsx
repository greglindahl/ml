import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const labelVariants = cva(
  "text-[15px] font-medium leading-none tracking-tight text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
  tooltip?: string;
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, children, required, tooltip, ...props }, ref) => (
  <div className="inline-flex items-center gap-1">
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </LabelPrimitive.Root>
    {tooltip && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    )}
  </div>
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
