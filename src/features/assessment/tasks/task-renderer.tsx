"use client";

import * as React from "react";

import {
  isCt,
  isEf,
  isGf,
  isGlr,
  isGs,
  isGsm,
  isGv,
  type Item,
} from "@/features/tasks";
import type { ResponseFields } from "./view";
import { GfTask } from "./gf-task";
import { GvTask } from "./gv-task";
import { GsmTask } from "./gsm-task";
import { GsTask } from "./gs-task";
import { EfTask } from "./ef-task";
import { GlrTask } from "./glr-task";
import { CtTask } from "./ct-task";

// One renderer per signal, dispatched by the same type guards the scorer uses.
// Each renderer is a pure render of `generateItem` output and emits only the
// signal-specific response fields — the screen merges in timing.
export interface TaskRendererProps {
  item: Item;
  onAnswer: (fields: ResponseFields) => void;
  practice?: boolean;
  /** Glr only: recall rounds for this administration (from the engine action). */
  rounds?: number;
}

export function TaskRenderer({
  item,
  onAnswer,
  practice,
  rounds,
}: TaskRendererProps) {
  if (isGf(item))
    return <GfTask item={item} onAnswer={onAnswer} practice={practice} />;
  if (isGv(item))
    return <GvTask item={item} onAnswer={onAnswer} practice={practice} />;
  if (isGsm(item))
    return <GsmTask item={item} onAnswer={onAnswer} practice={practice} />;
  if (isGs(item))
    return <GsTask item={item} onAnswer={onAnswer} practice={practice} />;
  if (isEf(item))
    return <EfTask item={item} onAnswer={onAnswer} practice={practice} />;
  if (isGlr(item))
    return (
      <GlrTask
        item={item}
        onAnswer={onAnswer}
        rounds={rounds}
        practice={practice}
      />
    );
  if (isCt(item))
    return <CtTask item={item} onAnswer={onAnswer} practice={practice} />;
  return null;
}
