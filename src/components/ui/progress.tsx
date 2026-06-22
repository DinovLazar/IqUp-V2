"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

// Word-labelled progress track (handover §2 / §4.1). Slim track + --grad-brand
// fill. The optional `label` is shown in WORDS (e.g. "3 од 5 секции"); never show
// a raw percentage to the child. Built on Radix Progress for proper a11y
// semantics (role=progressbar, aria-valuenow/min/max).
interface ProgressProps extends React.ComponentProps<
  typeof ProgressPrimitive.Root
> {
  /** 0–100. */
  value?: number;
  /** Optional word label rendered above the track. */
  label?: React.ReactNode;
}

function Progress({ className, value = 0, label, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label != null && <span className="text-label text-muted">{label}</span>}
      <ProgressPrimitive.Root
        data-slot="progress"
        value={clamped}
        className={cn(
          "relative h-2.5 w-full overflow-hidden rounded-full bg-tint-pur",
          className,
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="h-full w-full flex-1 rounded-full bg-grad-brand transition-transform"
          style={{ transform: `translateX(-${100 - clamped}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}

export { Progress };
