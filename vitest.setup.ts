// Vitest setup (Phase 1.08). jsdom polyfills the Radix primitives rely on but
// jsdom does not implement (ResizeObserver via react-use-size; pointer-capture /
// scrollIntoView). Guarded by `typeof window` so it is a NO-OP in the Node
// environment — the pure suites (task bank / engine / scoring / report / lead
// schema) run untouched.
if (typeof window !== "undefined") {
  if (typeof globalThis.ResizeObserver === "undefined") {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver =
      ResizeObserverStub as unknown as typeof ResizeObserver;
  }
  const proto = Element.prototype as unknown as Record<string, unknown>;
  for (const m of [
    "hasPointerCapture",
    "setPointerCapture",
    "releasePointerCapture",
    "scrollIntoView",
  ]) {
    if (!(m in Element.prototype)) proto[m] = () => {};
  }
}
