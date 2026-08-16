import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const lifecycleModulePath = "../src/game/lifecycle";
let documentHasFocus = true;

type LifecycleModule = {
  readonly installGameLifecycle: (callbacks: {
    readonly pause: () => boolean;
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

beforeEach(() => {
  documentHasFocus = true;
  Object.defineProperty(document, "hasFocus", {
    configurable: true,
    value: () => documentHasFocus,
  });
});

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
    const pause = vi.fn(() => true);
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
    const pause = vi.fn(() => true);
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
    const pause = vi.fn(() => true);
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
    const pause = vi.fn(() => true);
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
    const pause = vi.fn(() => true);
    const resume = vi.fn();
    const teardown = lifecycleCandidate.installGameLifecycle({ pause, resume });

    // When: the window regains focus after it lost focus
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));

    // Then: the game resumes
    expect(resume).toHaveBeenCalledTimes(1);
    teardown();
  });

  it("does not resume when focus returns while the document remains hidden", async () => {
    // Given: an active game that loses focus and then becomes hidden
    const lifecycleCandidate: unknown = await import(lifecycleModulePath);
    expect(isLifecycleModule(lifecycleCandidate)).toBe(true);
    if (!isLifecycleModule(lifecycleCandidate)) {
      return;
    }
    const pause = vi.fn(() => true);
    const resume = vi.fn();
    const teardown = lifecycleCandidate.installGameLifecycle({ pause, resume });
    window.dispatchEvent(new Event("blur"));
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    // When: focus returns while visibility still blocks the game
    window.dispatchEvent(new Event("focus"));

    // Then: lifecycle keeps the game paused before visibility clears
    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).not.toHaveBeenCalled();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    // Then: lifecycle resumes exactly once after the final blocker clears
    expect(resume).toHaveBeenCalledTimes(1);
    teardown();
  });

  it("pauses immediately when installed while the document is hidden", async () => {
    // Given: a document that is already hidden before lifecycle installation
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    const lifecycleCandidate: unknown = await import(lifecycleModulePath);
    expect(isLifecycleModule(lifecycleCandidate)).toBe(true);
    if (!isLifecycleModule(lifecycleCandidate)) {
      return;
    }
    const pause = vi.fn(() => true);
    const resume = vi.fn();

    // When: lifecycle ownership is installed
    const teardown = lifecycleCandidate.installGameLifecycle({ pause, resume });

    // Then: it pauses the game without waiting for another event
    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).not.toHaveBeenCalled();
    teardown();
  });

  it("pauses immediately when installed while the document is unfocused", async () => {
    // Given: a visible document that does not have focus
    documentHasFocus = false;
    const lifecycleCandidate: unknown = await import(lifecycleModulePath);
    expect(isLifecycleModule(lifecycleCandidate)).toBe(true);
    if (!isLifecycleModule(lifecycleCandidate)) {
      return;
    }
    const pause = vi.fn(() => true);
    const resume = vi.fn();

    // When: lifecycle ownership is installed
    const teardown = lifecycleCandidate.installGameLifecycle({ pause, resume });

    // Then: it pauses without waiting for a blur event
    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).not.toHaveBeenCalled();
    teardown();
  });

  it("removes document and window listeners during teardown", async () => {
    // Given: a lifecycle installation paused before teardown
    const lifecycleCandidate: unknown = await import(lifecycleModulePath);
    expect(isLifecycleModule(lifecycleCandidate)).toBe(true);
    if (!isLifecycleModule(lifecycleCandidate)) {
      return;
    }
    const pause = vi.fn(() => true);
    const resume = vi.fn();
    const teardown = lifecycleCandidate.installGameLifecycle({ pause, resume });
    window.dispatchEvent(new Event("blur"));
    teardown();

    // When: document and window lifecycle events occur after teardown
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));

    // Then: no orphaned listener resumes the lifecycle-paused game
    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).not.toHaveBeenCalled();
  });

  it("does not pause after teardown when visibility or focus changes", async () => {
    // Given: an active lifecycle installation that is immediately torn down
    const lifecycleCandidate: unknown = await import(lifecycleModulePath);
    expect(isLifecycleModule(lifecycleCandidate)).toBe(true);
    if (!isLifecycleModule(lifecycleCandidate)) {
      return;
    }
    const pause = vi.fn(() => true);
    const resume = vi.fn();
    const teardown = lifecycleCandidate.installGameLifecycle({ pause, resume });
    teardown();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    // When: the removed document and window listeners would receive blockers
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("blur"));

    // Then: no orphaned listener pauses the game
    expect(pause).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
  });

  it("does not resume after an externally paused game rejects lifecycle ownership", async () => {
    // Given: an externally paused game whose lifecycle pause cannot acquire ownership
    const lifecycleCandidate: unknown = await import(lifecycleModulePath);
    expect(isLifecycleModule(lifecycleCandidate)).toBe(true);
    if (!isLifecycleModule(lifecycleCandidate)) {
      return;
    }
    const pause = vi.fn(() => false);
    const resume = vi.fn();
    const teardown = lifecycleCandidate.installGameLifecycle({ pause, resume });

    // When: focus is lost and subsequently restored
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));

    // Then: lifecycle preserves the external pause
    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).not.toHaveBeenCalled();
    teardown();
  });
});
