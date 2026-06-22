import * as React from "react";

import { cn } from "@/lib/utils";

// Text input (handover §4.1). 1.5px border → violet + 3px ring on focus; error
// state via aria-invalid (soft red border + red focus ring). No form logic here
// — validation/wiring is Phase 1.08; this just carries every visual state.
function Input({
  className,
  type = "text",
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex min-h-11 w-full rounded-field border-[1.5px] border-border bg-surface px-3.5 py-2.5",
        "text-body text-ink placeholder:text-muted/70",
        "transition-[border-color,box-shadow] outline-none",
        "focus-visible:border-pur focus-visible:ring-[3px] focus-visible:ring-focus",
        "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled-bg disabled:text-disabled-fg",
        "aria-invalid:border-error-border aria-invalid:focus-visible:ring-error/25",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
