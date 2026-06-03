import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[15px] font-medium tracking-tight ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary - solid blue background
        default: "bg-primary text-white hover:bg-primary/90",
        // Secondary - gray background
        secondary: "bg-[#E3EBF6] text-foreground hover:bg-[#D2DDEC]",
        // Primary Outline - blue border, transparent bg
        "primary-outline": "border border-primary bg-transparent text-primary hover:bg-primary/5",
        // Secondary Outline - gray border, transparent bg
        outline: "border border-[#D2DDEC] bg-transparent text-foreground hover:bg-accent",
        // Light - light gray background
        light: "bg-[#EDF2F9] text-foreground hover:bg-[#E3EBF6]",
        // Dark - dark navy background
        dark: "bg-[#12263F] text-white hover:bg-[#0F2036]",
        // Danger - red background
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        // Warning - amber/yellow background
        warning: "bg-[#F6C343] text-[#12263F] hover:bg-[#D1A639]",
        // Success - green background
        success: "bg-[#00D97E] text-white hover:bg-[#00B86B]",
        // Info - cyan background
        info: "bg-[#39AFD1] text-white hover:bg-[#3095B2]",
        // White - white background with border
        white: "bg-white text-foreground border border-[#D2DDEC] hover:bg-gray-100",
        // Link - no background, just text
        link: "text-primary underline-offset-4 hover:underline bg-transparent",
        // Ghost - no background, hover shows bg
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        // Small - 28px height
        sm: "h-7 px-3 py-1 text-[13px]",
        // Medium - 40px height (default)
        default: "h-10 px-3 py-2",
        // Large - 48px height
        lg: "h-12 px-4 py-3",
        // Icon sizes (square buttons)
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-7 w-7 p-0 text-[13px]",
        "icon-lg": "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
