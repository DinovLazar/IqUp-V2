/**
 * Task renderers — public barrel (Phase 1.06).
 *
 * The pure presenters/response-builders (`view.ts`) are node-testable; the `.tsx`
 * renderers are thin shells that draw `generateItem` output and emit signal
 * response fields. `TaskRenderer` dispatches by signal; `TaskScreen` wraps any
 * renderer with the shared chrome, silent stopwatch and idle nudge.
 */

export * from "./view";
export { TaskRenderer, type TaskRendererProps } from "./task-renderer";
export { TaskScreen, type TaskScreenProps } from "./task-screen";
