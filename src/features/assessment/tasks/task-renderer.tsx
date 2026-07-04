"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

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

// Each renderer loads as its own chunk — a session only ever needs the 1–2
// signal renderers active at a time, not all 7 (spec §19.2 lazy-load by
// section). `ssr: false`: the whole /procena flow is client-only state, so
// there is no SSR benefit, and it keeps these out of the server bundle too.
function taskLoading() {
  return <TaskLoadingFallback />;
}
const GfTask = dynamic(() => import("./gf-task").then((m) => m.GfTask), {
  ssr: false,
  loading: taskLoading,
});
const GvTask = dynamic(() => import("./gv-task").then((m) => m.GvTask), {
  ssr: false,
  loading: taskLoading,
});
const GsmTask = dynamic(() => import("./gsm-task").then((m) => m.GsmTask), {
  ssr: false,
  loading: taskLoading,
});
const GsTask = dynamic(() => import("./gs-task").then((m) => m.GsTask), {
  ssr: false,
  loading: taskLoading,
});
const EfTask = dynamic(() => import("./ef-task").then((m) => m.EfTask), {
  ssr: false,
  loading: taskLoading,
});
const GlrTask = dynamic(() => import("./glr-task").then((m) => m.GlrTask), {
  ssr: false,
  loading: taskLoading,
});
const CtTask = dynamic(() => import("./ct-task").then((m) => m.CtTask), {
  ssr: false,
  loading: taskLoading,
});

// Fills the same `flex-1 items-center justify-center` stimulus slot the
// renderers occupy (see task-screen.tsx), so a chunk load never shifts the
// surrounding chrome (no CLS). `role="status"` announces it to AT.
function TaskLoadingFallback() {
  const t = useTranslations();
  return (
    <div
      role="status"
      aria-label={t("common.loading")}
      className="flex min-h-40 w-full items-center justify-center"
    >
      <span className="size-8 animate-spin rounded-full border-4 border-border border-t-pur" />
    </div>
  );
}

// One renderer per signal, dispatched by the same type guards the scorer uses.
// Each renderer is a pure render of `generateItem` output and emits only the
// signal-specific response fields — the screen merges in timing.
export interface TaskRendererProps {
  item: Item;
  onAnswer: (fields: ResponseFields) => void;
  practice?: boolean;
  /** Glr only: recall rounds for this administration (from the engine action). */
  rounds?: number;
  /** Child age — drives the UX_BY_AGE tap-target minimums (default: brand 44px). */
  age?: number;
}

export function TaskRenderer({
  item,
  onAnswer,
  practice,
  rounds,
  age,
}: TaskRendererProps) {
  if (isGf(item))
    return (
      <GfTask item={item} onAnswer={onAnswer} practice={practice} age={age} />
    );
  if (isGv(item))
    return (
      <GvTask item={item} onAnswer={onAnswer} practice={practice} age={age} />
    );
  if (isGsm(item))
    return <GsmTask item={item} onAnswer={onAnswer} practice={practice} />;
  if (isGs(item))
    return <GsTask item={item} onAnswer={onAnswer} practice={practice} />;
  if (isEf(item))
    return (
      <EfTask item={item} onAnswer={onAnswer} practice={practice} age={age} />
    );
  if (isGlr(item))
    return (
      <GlrTask
        item={item}
        onAnswer={onAnswer}
        rounds={rounds}
        practice={practice}
        age={age}
      />
    );
  if (isCt(item))
    return (
      <CtTask item={item} onAnswer={onAnswer} practice={practice} age={age} />
    );
  return null;
}
