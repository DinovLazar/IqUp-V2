"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type { Signal } from "@/features/tasks";
import {
  applyResponse,
  groupsCompleted,
  nextStep,
  sectionOfSignal,
  settle,
  startFlow,
  SECTION_TOTAL,
  type RawResponse,
  type SessionState,
} from "@/features/assessment";
import {
  TaskScreen,
  instructionKey,
  showsNoRush,
} from "@/features/assessment/tasks";
import type { DeviceCalibration } from "@/features/timing";
import { SetupScreen } from "./setup-screen";
import { PrestartScreen } from "./prestart-screen";
import { CompletionScreen } from "./completion-screen";

// The in-memory assessment state machine (Phase 1.06): setup → pre-start →
// practice/real (driven by the 1.05 engine via the pure flow controller) →
// completion + reward. NOTHING is persisted before the (1.08) form. The session
// master seed fans out to per-item seeds inside the engine (`deriveSeed`);
// `parentAssistMode` is plumbed but inert (Phase 3.01).

function makeSessionSeed(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s-${Math.floor(Math.random() * 1e9)}`;
}

type Phase = "setup" | "prestart" | "running";

export function Assessment() {
  const t = useTranslations();
  const [phase, setPhase] = React.useState<Phase>("setup");
  const [age, setAge] = React.useState(8);
  const [, setParentAssistMode] = React.useState(false); // plumbed; inert (3.01)
  const [calibrated, setCalibrated] = React.useState(false);
  const [, setCalibration] = React.useState<DeviceCalibration | null>(null);
  const [state, setState] = React.useState<SessionState | null>(null);
  const [practiceShown, setPracticeShown] = React.useState<ReadonlySet<Signal>>(
    new Set(),
  );

  const beginSession = (parentAssist: boolean) => {
    setParentAssistMode(parentAssist);
    setCalibrated(false);
    setState(startFlow({ sessionSeed: makeSessionSeed(), age }));
    setPracticeShown(new Set());
    setPhase("running");
  };

  const shell = (content: React.ReactNode) => (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-7">
      {content}
    </main>
  );

  if (phase === "setup") {
    return shell(
      <SetupScreen
        onSubmit={(a) => {
          setAge(a);
          setPhase("prestart");
        }}
      />,
    );
  }
  if (phase === "prestart") {
    return shell(<PrestartScreen age={age} onStart={beginSession} />);
  }

  // running
  if (!state) return shell(<CompletionScreen />);
  const step = nextStep(state, practiceShown);
  if (step.kind === "complete") return shell(<CompletionScreen />);

  const item = step.kind === "practice" ? step.item : step.action.item;
  const signal = step.kind === "practice" ? step.signal : step.action.signal;
  const mode: "practice" | "real" =
    step.kind === "practice" ? "practice" : "real";
  const rounds = step.kind === "item" ? step.action.rounds : undefined;
  // Calibrate on the first practice that's actually engaged — so skipping the
  // very first example doesn't silently drop the device baseline (D-077).
  const calibrate = step.kind === "practice" && !calibrated;

  const instruction = t(`task.${instructionKey(item)}`);
  const hint =
    step.kind === "practice"
      ? step.firstDomain
        ? t("encourage.start")
        : t("encourage.transition")
      : showsNoRush(item)
        ? t("task.noRush")
        : undefined;

  return shell(
    <TaskScreen
      key={`${mode}:${item.seed}`}
      item={item}
      mode={mode}
      calibrate={calibrate}
      section={{ current: sectionOfSignal(signal), total: SECTION_TOTAL }}
      brainCompleted={groupsCompleted(state)}
      instruction={instruction}
      hint={hint}
      rounds={rounds}
      onRespond={(r: RawResponse) =>
        setState((s) => (s ? settle(applyResponse(s, r)) : s))
      }
      onAdvance={() => setPracticeShown((prev) => new Set(prev).add(signal))}
      onCalibration={(c) => {
        setCalibrated(true);
        setCalibration(c);
      }}
    />,
  );
}
