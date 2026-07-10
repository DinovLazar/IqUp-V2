"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import type { Signal } from "@/features/tasks";
import {
  advanceEndPhase,
  applyResponse,
  groupsCompleted,
  nextStep,
  sectionOfSignal,
  settle,
  startFlow,
  SECTION_TOTAL,
  type EndPhase,
  type RawResponse,
  type SessionState,
} from "@/features/assessment";
import {
  TaskScreen,
  instructionKey,
  showsNoRush,
} from "@/features/assessment/tasks";
import { finalize, type AssessmentResult } from "@/features/scoring";
import type { LeadFormValues } from "@/features/lead";
import type { DeviceCalibration } from "@/features/timing";
import {
  loadPriorProfile,
  resolveSessionSeed,
  saveSessionProfile,
} from "@/features/progress";
import { SetupScreen } from "./setup-screen";
import { PrestartScreen } from "./prestart-screen";
import { CompletionScreen } from "./completion-screen";
import { EndPhaseView } from "./end-phase-view";

// The in-memory assessment state machine (Phase 1.06 + 1.08): setup → pre-start →
// practice/real (driven by the 1.05 engine via the pure flow controller) →
// completion + reward → lead form → confirmation. The end-phase sequence is the
// pure `advanceEndPhase` controller (resolved-decision 1). The lead values + the
// scored result are held in browser memory only (no server session).
//
// Phase 3.01 activates two previously-inert seams and adds the first client-local
// persistence:
//  • `parentAssistMode` + the device calibration baseline are now CONSUMED by
//    scoring (`finalize` context) to modulate the §7.1 validity thresholds.
//  • An ANONYMOUS, PII-free summary of each finished run is persisted ON-DEVICE
//    (`@/features/progress`, spec Дел 14.2) so a repeat derives a fresh item set
//    and — in a later phase — a local growth comparison. No server, no PII, and no
//    join to the score or Brevo stores (§14.1). The session master seed still fans
//    out to per-item seeds inside the engine (`deriveSeed`).

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
  // Consumed by scoring in 3.01: parent-assist relaxes the time-based validity
  // thresholds (§7.4) and the device baseline makes "too fast" device-relative
  // (§7.2). Both ride at the session level; neither widens the engine state.
  const [parentAssistMode, setParentAssistMode] = React.useState(false);
  const [calibrated, setCalibrated] = React.useState(false);
  const [calibration, setCalibration] =
    React.useState<DeviceCalibration | null>(null);
  const [state, setState] = React.useState<SessionState | null>(null);
  const [practiceShown, setPracticeShown] = React.useState<ReadonlySet<Signal>>(
    new Set(),
  );
  // End-phase sequence (1.08): completion → form → confirmation. The scored
  // result + validated form values ride in memory only (nothing persisted).
  const [endPhase, setEndPhase] = React.useState<EndPhase>("completion");
  const [result, setResult] = React.useState<AssessmentResult | null>(null);
  const [leadValues, setLeadValues] = React.useState<LeadFormValues | null>(
    null,
  );
  // The seed + attempt this run used — resolved from the anonymous on-device
  // profile (Phase 3.01): a repeat derives a FRESH seed so the item set differs,
  // and the finished summary is saved back for the next repeat's growth compare.
  const [session, setSession] = React.useState<{
    setSeed: string;
    attempt: number;
  }>({ setSeed: "", attempt: 1 });

  const beginSession = (parentAssist: boolean) => {
    setParentAssistMode(parentAssist);
    setCalibrated(false);
    setCalibration(null);
    // Repeat-test new-set: a prior on-device profile derives a fresh seed so the
    // same domains/levels yield a NEW item set (spec Дел 14.2); first run uses a
    // fresh random seed. Reading local progress must never break the flow.
    const { setSeed, attempt } = resolveSessionSeed(
      loadPriorProfile(),
      makeSessionSeed(),
    );
    setSession({ setSeed, attempt });
    setState(startFlow({ sessionSeed: setSeed, age }));
    setPracticeShown(new Set());
    setEndPhase("completion");
    setResult(null);
    setLeadValues(null);
    setPhase("running");
  };

  const restart = () => {
    setState(null);
    setPracticeShown(new Set());
    setEndPhase("completion");
    setResult(null);
    setLeadValues(null);
    setPhase("setup");
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
  if (step.kind === "complete") {
    // End of the engine. Walk completion → form → confirmation. The result is
    // finalized once on leaving completion and reused (assembleReport is
    // deterministic — resolved-decision 2).
    return shell(
      <EndPhaseView
        endPhase={endPhase}
        result={result}
        leadValues={leadValues}
        onProceed={() => {
          const scored = finalize(state, {
            parentAssistMode,
            deviceBaselineMs: calibration?.baselineTapMs,
          });
          setResult(scored);
          // Persist the anonymous summary on-device for the NEXT visit's repeat +
          // growth compare (no PII, no server, no join — spec Дел 14.2 / §14.1).
          // ORDERING (for the later growth-UI phase): this overwrites the stored
          // "prior" with THIS run, so a growth comparison must read the prior
          // BEFORE this save — snapshot it at `beginSession` (where it is already
          // loaded), never via a post-save `loadPriorProfile()`/`readGrowth()`.
          saveSessionProfile(scored, session);
          setEndPhase(advanceEndPhase("completion")); // → form
        }}
        onSubmitted={(values) => {
          setLeadValues(values);
          setEndPhase(advanceEndPhase("form")); // → confirmation
        }}
        onRestart={restart}
      />,
    );
  }

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
      age={age}
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
