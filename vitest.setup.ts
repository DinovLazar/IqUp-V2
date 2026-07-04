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

  // Some jsdom builds ship without the Web Storage API. The Phase 3.01 progress
  // adapter (Дел 14.2) reads `window.localStorage`, so provide a faithful
  // in-memory Storage when it is absent — a NO-OP where jsdom already implements
  // it, and never present in the Node suites. Behaviour matches the DOM contract
  // the storage tests assert (round-trip / clear / null-miss / versioned key).
  if (!window.localStorage) {
    class MemoryStorage implements Storage {
      #store = new Map<string, string>();
      get length() {
        return this.#store.size;
      }
      clear() {
        this.#store.clear();
      }
      getItem(key: string) {
        return this.#store.has(key) ? this.#store.get(key)! : null;
      }
      setItem(key: string, value: string) {
        this.#store.set(key, String(value));
      }
      removeItem(key: string) {
        this.#store.delete(key);
      }
      key(index: number) {
        return [...this.#store.keys()][index] ?? null;
      }
    }
    Object.defineProperty(window, "localStorage", {
      value: new MemoryStorage(),
      configurable: true,
    });
  }
}
