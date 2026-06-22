"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

// Checkbox (handover §4.1) — also the consent-checkbox style. 24px box, 7px
// radius, violet when checked with a white check. It is NEVER pre-ticked (no
// defaultChecked): consent must be an explicit, deliberate action (GDPR). Error
// state via aria-invalid is ready for the 1.08 form wiring.
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-6 shrink-0 rounded-[7px] border-[1.5px] border-border bg-surface",
        "transition-[border-color,background-color,box-shadow] outline-none",
        "focus-visible:border-pur focus-visible:ring-[3px] focus-visible:ring-focus",
        "data-checked:border-pur data-checked:bg-pur data-checked:text-white",
        "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled-bg",
        "aria-invalid:border-error-border",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <Check className="size-4" strokeWidth={3} aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
