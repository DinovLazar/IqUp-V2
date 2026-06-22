import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// Brand button (handover §4.1 + §1.5). Three variants — primary-violet,
// secondary (outline), ghost — each with the full state set: default / hover
// (−8% L) / active (darker + scale .97) / focus-visible (3px violet ring) /
// disabled (muted fill, not-allowed). Min height ≥ 48px keeps every button above
// the 44px tap-target rule for children on phones.
const buttonVariants = cva(
  [
    "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap",
    "rounded-field text-label font-semibold",
    "transition-[background-color,color,box-shadow,transform]",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-focus",
    "active:scale-[0.97]",
    "disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-fg disabled:border-transparent disabled:shadow-none disabled:active:scale-100",
    "[&_svg]:size-[1.15em] [&_svg]:shrink-0 [&_svg]:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-pur text-white hover:bg-pur-hover active:bg-pur-active",
        secondary:
          "border-[1.5px] border-pur bg-surface text-pur hover:bg-tint-pur active:bg-border-pur",
        ghost:
          "border-[1.5px] border-transparent bg-transparent text-pur hover:bg-tint-pur active:bg-border-pur",
      },
      size: {
        default: "min-h-12 px-5 py-3",
        lg: "min-h-14 px-7 py-4 text-base",
        icon: "size-12 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
