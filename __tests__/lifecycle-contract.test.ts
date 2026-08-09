import { afterEach, describe, expect, it, vi } from "vitest";

const lifecycleModulePath = "../src/game/lifecycle";

type LifecycleModule = {
  readonly installGameLifecycle: (callbacks: {
    readonly pause: () => void;
    readonly resume: () => void;
  }) => () => void;
};

function isLifecycleModule(value: unknown): value is LifecycleModule {
  return (
    typeof value === "object" &&
    value !== null &&
    "installGameLifecycle" in value &&
    typeof value.installGameLifecycle === "function"
  );
}

afterEach(() => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

describe("game lifecycle", () => {
  it("pauses when the document becomes hidden", async () => {
    // Given: installed lifecycle callbacks for an active game
    const lifecycleCandidate: unknown = await import(lifecycleModulePath);
    expect(isLifecycleModule(lifecycleCandidate)).toBe(true);
    if (!isLifecycleModule(lifecycleCandidate)) {
      return;
    }
    const pause = vi.fn();
    const resume = vi.fn();
    const teardown = lifecycleCandidate.installGameLifecycle({ pause, resume });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    // When: the document emits a visibility change
    document.dispatchEvent(new Event("visibilitychange"));

    // Then: the game pauses
    expect(pause).toHaveBeenCalledTimes(1);
    teardown();
  });

  it("resumes when the document becomes visible after lifecycle pause", async () => {
    // Given: lifecycle callbacks for an active game
    const lifecycleCandidate: unknown = await import(lifecycleModulePath);
    expect(isLifecycleModule(lifecycleCandidate)).toBe(true);
    if (!isLifecycleModule(lifecycleCandidate)) {
      return;
    }
    const pause = vi.fn();
    const resume = vi.fn();
    const teardown = lifecycleCandidate.installGameLifecycle({ pause, resume });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    // When: the document emits a visibility change
    document.dispatchEvent(new Event("visibilitychange"));

    // Then: the game resumes
    expect(resume).toHaveBeenCalledTimes(1);
    teardown();
  });

  it.each([
    ["focus", () => window.dispatchEvent(new Event("focus"))],
    ["visibility-visible", () =>
      document.dispatchEvent(new Event("visibilitychange"))],
  ])("does not resume while unpaused on %s", async (_eventName, dispatch) => {
    // Given: lifecycle callbacks for a game not paused by this binding
    const lifecycleCandidate: unknown = await import(lifecycleModulePath);
    expect(isLifecycleModule(lifecycleCandidate)).toBe(true);
    if (!isLifecycleModule(lifecycleCandidate)) {
      return;
    }
    const pause = vi.fn();
    const resume = vi.fn();
    const teardown = lifecycleCandidate.installGameLifecycle({ pause, resume });

    // When: a visible lifecycle event occurs
    dispatch();

    // Then: the binding does not resume a game it did not pause
    expect(resume).not.toHaveBeenCalled();
    teardown();
  });

  it("pauses when the window loses focus", async () => {
    // Given: installed callbacks for window lifecycle events
    const lifecycleCandidate: unknown = await import(lifecycleModulePath);
    expect(isLifecycleModule(lifecycleCandidate)).toBe(true);
    if (!isLifecycleModule(lifecycleCandidate)) {
      return;
    }
    const pause = vi.fn();
    const resume = vi.fn();
    const teardown = lifecycleCandidate.installGameLifecycle({ pause, resume });

    // When: the window loses focus
    window.dispatchEvent(new Event("blur"));

    // Then: the game pauses
    expect(pause).toHaveBeenCalledTimes(1);
    teardown();
  });

  it("resumes when the window regains focus after lifecycle pause", async () => {
    // Given: installed callbacks for window lifecycle events
    const lifecycleCandidate: unknown = await import(lifecycleModulePath);
    expect(isLifecycleModule(lifecycleCandidate)).toBe(true);
    if (!isLifecycleModule(lifecycleCandidate)) {
      return;
    }
    const pause = vi.fn();
    const resume = vi.fn();
    const teardown = lifecycleCandidate.installGameLifecycle({ pause, resume });

    // When: the window regains focus after it lost focus
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));

    // Then: the game resumes
    expect(resume).toHaveBeenCalledTimes(1);
    teardown();
  });

  it("removes document and window listeners during teardown", async () => {
    // Given: a lifecycle installation that is immediately torn down
    const lifecycleCandidate: unknown = await import(lifecycleModulePath);
    expect(isLifecycleModule(lifecycleCandidate)).toBe(true);
    if (!isLifecycleModule(lifecycleCandidate)) {
      return;
    }
    const pause = vi.fn();
    const resume = vi.fn();
    const teardown = lifecycleCandidate.installGameLifecycle({ pause, resume });
    teardown();

    // When: document and window lifecycle events occur after teardown
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));

    // Then: no orphaned listener invokes game callbacks
    expect(pause).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
  });
});
