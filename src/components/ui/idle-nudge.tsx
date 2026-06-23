"use client";

import * as React from "react";
import { Hand } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

// Gentle idle nudge (handover §4.2 — D-047). A calm, light-blue prompt that
// appears after a stretch of inactivity (~20–25 s). NO timer, NO countdown, NO
// penalty styling: just reassurance + a "Продолжи" button. Rendered as a soft
// overlay so it interrupts kindly without losing the task underneath.
interface IdleNudgeProps {
  open: boolean;
  title: string;
  body: string;
  resumeLabel: string;
  onResume: () => void;
  /** Inline (kit/demo) instead of a fixed overlay. */
  inline?: boolean;
}

function IdleNudge({
  open,
  title,
  body,
  resumeLabel,
  onResume,
  inline = false,
}: IdleNudgeProps) {
  if (!open) return null;

  const card = (
    <div
      role="status"
      className={cn(
        "flex max-w-sm flex-col items-center gap-3 rounded-card-lg border border-blu2 bg-blu-soft px-6 py-5 text-center",
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-surface text-blu-ink">
        <Hand className="size-5" aria-hidden />
      </span>
      <p className="text-subhead text-ink">{title}</p>
      <p className="text-body text-muted">{body}</p>
      <Button variant="primary" onClick={onResume} className="mt-1">
        {resumeLabel}
      </Button>
    </div>
  );

  if (inline) return card;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-6 backdrop-blur-[1px]">
      {card}
    </div>
  );
}

export { IdleNudge };
