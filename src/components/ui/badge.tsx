import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center flex-nowrap whitespace-nowrap border text-[10px] font-medium uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      // Color style
      colorStyle: {
        primary: "",
        secondary: "",
        success: "",
        danger: "",
        warning: "",
        info: "",
        light: "",
        dark: "",
      },
      // Theme intensity
      theme: {
        default: "",
        subtle: "",
        soft: "",
      },
      // Shape
      shape: {
        square: "rounded",
        rounded: "rounded-full",
      },
      // Size
      size: {
        default: "px-2 py-0.5",
        sm: "px-1.5 py-0.5 text-[9px]",
        lg: "px-2.5 py-1 text-[11px]",
      },
    },
    compoundVariants: [
      // Primary
      { colorStyle: "primary", theme: "default", className: "bg-primary text-white border-transparent" },
      { colorStyle: "primary", theme: "subtle", className: "bg-primary/10 text-primary border-transparent" },
      { colorStyle: "primary", theme: "soft", className: "bg-primary/20 text-primary border-transparent" },
      // Secondary
      { colorStyle: "secondary", theme: "default", className: "bg-[#6E84A3] text-white border-transparent" },
      { colorStyle: "secondary", theme: "subtle", className: "bg-[#6E84A3]/10 text-[#6E84A3] border-transparent" },
      { colorStyle: "secondary", theme: "soft", className: "bg-[#6E84A3]/20 text-[#6E84A3] border-transparent" },
      // Success
      { colorStyle: "success", theme: "default", className: "bg-[#00D97E] text-white border-transparent" },
      { colorStyle: "success", theme: "subtle", className: "bg-[#CCF2E0] text-[#00D97E] border-transparent" },
      { colorStyle: "success", theme: "soft", className: "bg-[#00D97E]/20 text-[#00D97E] border-transparent" },
      // Danger
      { colorStyle: "danger", theme: "default", className: "bg-[#E63757] text-white border-transparent" },
      { colorStyle: "danger", theme: "subtle", className: "bg-[#FAD7DD] text-[#E63757] border-transparent" },
      { colorStyle: "danger", theme: "soft", className: "bg-[#E63757]/20 text-[#E63757] border-transparent" },
      // Warning
      { colorStyle: "warning", theme: "default", className: "bg-[#F6C343] text-[#12263F] border-transparent" },
      { colorStyle: "warning", theme: "subtle", className: "bg-[#F6C343]/10 text-[#F6C343] border-transparent" },
      { colorStyle: "warning", theme: "soft", className: "bg-[#F6C343]/20 text-[#F6C343] border-transparent" },
      // Info
      { colorStyle: "info", theme: "default", className: "bg-[#39AFD1] text-white border-transparent" },
      { colorStyle: "info", theme: "subtle", className: "bg-[#39AFD1]/10 text-[#39AFD1] border-transparent" },
      { colorStyle: "info", theme: "soft", className: "bg-[#39AFD1]/20 text-[#39AFD1] border-transparent" },
      // Light
      { colorStyle: "light", theme: "default", className: "bg-[#EDF2F9] text-[#6E84A3] border-transparent" },
      { colorStyle: "light", theme: "subtle", className: "bg-[#EDF2F9]/50 text-[#6E84A3] border-transparent" },
      { colorStyle: "light", theme: "soft", className: "bg-[#EDF2F9]/70 text-[#6E84A3] border-transparent" },
      // Dark
      { colorStyle: "dark", theme: "default", className: "bg-[#12263F] text-white border-transparent" },
      { colorStyle: "dark", theme: "subtle", className: "bg-[#12263F]/10 text-[#12263F] border-transparent" },
      { colorStyle: "dark", theme: "soft", className: "bg-[#12263F]/20 text-[#12263F] border-transparent" },
    ],
    defaultVariants: {
      colorStyle: "primary",
      theme: "default",
      shape: "square",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  onRemove?: () => void;
  leadingIcon?: React.ReactNode;
}

function Badge({
  className,
  colorStyle,
  theme,
  shape,
  size,
  children,
  onRemove,
  leadingIcon,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ colorStyle, theme, shape, size }),
        onRemove && "gap-1 pr-1",
        className
      )}
      {...props}
    >
      {leadingIcon && (
        <span className="flex-shrink-0 -ml-0.5">{leadingIcon}</span>
      )}
      <span className="inline-flex items-center gap-1">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 rounded-full p-0.5 hover:bg-black/10 transition-colors"
          aria-label="Remove"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

export { Badge, badgeVariants };
