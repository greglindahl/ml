import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  // Base styles
  "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-[15px] tracking-tight ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#6e84a3] focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-muted-foreground disabled:border-gray-300",
  {
    variants: {
      variant: {
        default:
          "border-gray-400 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        error:
          "border-destructive focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
