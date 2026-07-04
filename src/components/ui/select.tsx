"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

// Select (handover §4.1). Trigger mirrors the Input field (1.5px border → violet
// + 3px ring on focus, aria-invalid error state). The dropdown is a popover, so
// it is the one place --shadow-pop is allowed (the no-shadow rule's exception).

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex min-h-11 w-full items-center justify-between gap-2 rounded-field border-[1.5px] border-border bg-surface px-3.5 py-2.5",
        // /70 measured 3.39:1 on white (axe color-contrast, below 4.5:1) — /90
        // keeps the placeholder visually faded while passing AA.
        "text-body text-ink data-[placeholder]:text-muted/90",
        "transition-[border-color,box-shadow] outline-none",
        "focus-visible:border-pur focus-visible:ring-[3px] focus-visible:ring-focus",
        "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-disabled-bg disabled:text-disabled-fg",
        "aria-invalid:border-error-border aria-invalid:focus-visible:ring-error/25",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="text-muted" aria-hidden />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        className={cn(
          "relative z-50 max-h-[var(--radix-select-content-available-height)] min-w-[8rem] overflow-hidden rounded-field border border-border bg-surface text-ink shadow-pop",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center text-muted">
          <ChevronUp className="size-4" aria-hidden />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center text-muted">
          <ChevronDown className="size-4" aria-hidden />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-3 py-1.5 text-label text-muted", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md py-2 pr-8 pl-3 text-body text-ink outline-none select-none",
        "data-highlighted:bg-tint-pur data-highlighted:text-pur",
        "data-[disabled]:pointer-events-none data-[disabled]:text-disabled-fg",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-2.5 flex items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4 text-pur" strokeWidth={3} aria-hidden />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
