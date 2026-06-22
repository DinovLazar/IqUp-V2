import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// Explorer / reward pill (handover §4.1). 30px radius, ≥44px min-height, always
// label + icon/shape (never color alone). `filled` = solid violet (the "IQ UP!
// Истражувач" reward); `soft` = violet tint for quieter chips.
const badgeVariants = cva(
  [
    "inline-flex min-h-11 select-none items-center justify-center gap-2 whitespace-nowrap",
    "rounded-badge px-4 py-2 text-label font-semibold",
    "[&_svg]:size-[1.15em] [&_svg]:shrink-0 [&_svg]:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        filled: "bg-pur text-white",
        soft: "bg-tint-pur text-pur",
      },
    },
    defaultVariants: {
      variant: "filled",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
