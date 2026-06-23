"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

// Shared answer-option control (handover §4.2 — the D-047 deferred component).
// A large, task-agnostic tap target: the stimulus (a shape, polygon, arrow row,
// number…) is passed as children; this just carries selection + focus + optional
// post-answer feedback. Default white + 2px border; selected = violet border +
// tint fill + a violet check disc. ≥44px rule honoured (min 64px square).
const optionStateClasses: Record<"default" | "correct" | "incorrect", string> =
  {
    default: "",
    correct: "border-teal ring-2 ring-teal/40",
    incorrect: "border-error ring-2 ring-error/30",
  };

interface AnswerOptionProps extends Omit<
  React.ComponentProps<"button">,
  "onSelect"
> {
  selected?: boolean;
  onSelect?: () => void;
  /** Optional feedback shown on practice/reveal — never used to score. */
  state?: "default" | "correct" | "incorrect";
}

function AnswerOption({
  selected = false,
  onSelect,
  state = "default",
  className,
  children,
  disabled,
  ...props
}: AnswerOptionProps) {
  return (
    <button
      type="button"
      data-slot="answer-option"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex min-h-16 min-w-16 items-center justify-center",
        "rounded-card border-2 border-border bg-surface p-3",
        "transition-[border-color,background-color,box-shadow,transform]",
        "outline-none focus-visible:ring-[3px] focus-visible:ring-focus",
        "active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
        selected && "border-pur bg-tint-pur",
        state !== "default" && optionStateClasses[state],
        className,
      )}
      {...props}
    >
      {children}
      {selected && (
        <span
          aria-hidden
          className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-pur text-white shadow-pop"
        >
          <Check className="size-4" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

export { AnswerOption };
