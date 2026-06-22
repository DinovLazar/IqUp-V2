import * as React from "react";

import { cn } from "@/lib/utils";

// Lightweight field helpers (no form logic — that's 1.08). A vertical wrapper
// plus muted help text and a red error message. FieldError uses role="alert" so
// the 1.08 validation can surface messages to assistive tech for free.

function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function FieldHelpText({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-help"
      className={cn("text-label font-normal text-muted", className)}
      {...props}
    />
  );
}

function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-error"
      role="alert"
      className={cn("text-label font-normal text-error", className)}
      {...props}
    />
  );
}

export { Field, FieldHelpText, FieldError };
