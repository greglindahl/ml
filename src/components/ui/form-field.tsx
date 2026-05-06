import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface FormFieldProps {
  /** The form control element (Input, Select, etc.) */
  children: React.ReactNode;
  /** Label text */
  label?: string;
  /** Helper text displayed above the input */
  helperText?: string;
  /** Error message displayed below the input (also sets error styling) */
  error?: string;
  /** Description text displayed below the input (when no error) */
  description?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Tooltip text for the info icon */
  tooltip?: string;
  /** Additional className for the wrapper */
  className?: string;
  /** HTML id for the input (used for label association) */
  htmlFor?: string;
}

/**
 * FormField wraps form controls with consistent label, helper text, and error styling.
 *
 * @example
 * <FormField
 *   label="Email"
 *   required
 *   tooltip="Your email address"
 *   helperText="We'll never share your email"
 *   error={errors.email}
 *   htmlFor="email"
 * >
 *   <Input id="email" variant={errors.email ? "error" : "default"} />
 * </FormField>
 */
function FormField({
  children,
  label,
  helperText,
  error,
  description,
  required,
  tooltip,
  className,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Label */}
      {label && (
        <Label htmlFor={htmlFor} required={required} tooltip={tooltip}>
          {label}
        </Label>
      )}

      {/* Helper text above input */}
      {helperText && (
        <p className="text-[13px] text-muted-foreground tracking-tight">
          {helperText}
        </p>
      )}

      {/* Form control */}
      {children}

      {/* Error or description text below input */}
      {error ? (
        <p className="text-[13px] text-destructive tracking-tight">{error}</p>
      ) : description ? (
        <p className="text-[13px] text-muted-foreground tracking-tight">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export { FormField };
