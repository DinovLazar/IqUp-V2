"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Compass } from "lucide-react";

import type { Item } from "@/features/tasks";
import type { RawResponse } from "@/features/assessment";
import { useItemTimer, type DeviceCalibration } from "@/features/timing";
import { INDICES } from "@/lib/indices";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IdleNudge } from "@/components/ui/idle-nudge";
import { PuzzleBrain } from "@/components/ui/puzzle-brain";
import { TaskRenderer } from "./task-renderer";
import { withTiming, type ResponseFields } from "./view";

// The task-agnostic chrome that wraps EVERY task (handover §5.2): puzzle-brain
// progress + "Секција X од 5" + section dots, a calm instruction, a barely-there
// explorer accent, the renderer, and the gentle idle nudge. Owns the silent
// per-item stopwatch (the app's only clock) and routes practice vs real answers.
// No countdown lives here — the only timer is inside the Gs renderer.

export interface TaskScreenProps {
  item: Item;
  mode: "practice" | "real";
  /** First practice item → capture the device calibration baseline. */
  calibrate?: boolean;
  section: { current: number; total: number };
  /** Index-groups completed (0–5), drives the puzzle-brain + dots. */
  brainCompleted: number;
  instruction: string;
  hint?: string;
  /** Glr only. */
  rounds?: number;
  onRespond: (response: RawResponse) => void;
  onAdvance?: () => void;
  onCalibration?: (cal: DeviceCalibration) => void;
}

export function TaskScreen({
  item,
  mode,
  calibrate = false,
  section,
  brainCompleted,
  instruction,
  hint,
  rounds,
  onRespond,
  onAdvance,
  onCalibration,
}: TaskScreenProps) {
  const t = useTranslations();
  const timer = useItemTimer({
    suppressIdle: item.signal === "gs",
    calibrate,
  });

  const handleAnswer = (fields: ResponseFields) => {
    const { timing, calibration } = timer.finish();
    if (calibration && onCalibration) onCalibration(calibration);
    if (mode === "practice") {
      onAdvance?.();
    } else {
      onRespond(withTiming(fields, timing));
    }
  };

  // Skipping a practice still tries to capture calibration, so a parent skipping
  // the first example doesn't silently drop the device baseline.
  const handleSkip = () => {
    if (calibrate) {
      const { calibration } = timer.finish();
      if (calibration && onCalibration) onCalibration(calibration);
    }
    onAdvance?.();
  };

  return (
    <div
      className="flex w-full flex-1 flex-col gap-6"
      onPointerDownCapture={timer.markActivity}
      onKeyDownCapture={timer.markActivity}
    >
      {/* Progress chrome */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PuzzleBrain completed={brainCompleted} variant="chip" />
            <span className="text-label text-muted">
              {t("task.section", {
                current: section.current,
                total: section.total,
              })}
            </span>
          </div>
          <Compass className="size-4 text-grey" aria-hidden />
        </div>
        <div className="flex items-center gap-1.5" aria-hidden>
          {INDICES.map((idx, i) => (
            <span
              key={idx.key}
              className={cn(
                "h-2 flex-1 rounded-full",
                i < brainCompleted ? "" : "bg-border",
              )}
              style={
                i < brainCompleted ? { backgroundColor: idx.color } : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Instruction */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        {mode === "practice" && (
          <Badge variant="soft" className="mb-1">
            {t("practice.badge")} · {t("practice.thisIsHow")}
          </Badge>
        )}
        <h2 className="text-subhead text-ink">{instruction}</h2>
        {hint && <p className="text-label font-normal text-muted">{hint}</p>}
      </div>

      {/* Stimulus + interaction */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <TaskRenderer
          key={`${item.seed}:${mode}`}
          item={item}
          onAnswer={handleAnswer}
          practice={mode === "practice"}
          rounds={rounds}
        />
      </div>

      {/* Practice skip */}
      {mode === "practice" && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={handleSkip}>
            {t("practice.skip")}
          </Button>
        </div>
      )}

      <IdleNudge
        open={timer.nudgeActive}
        title={t("idle.title")}
        body={t("idle.body")}
        resumeLabel={t("idle.resume")}
        onResume={timer.dismissNudge}
      />
    </div>
  );
}
