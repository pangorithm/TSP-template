export type GameLifecycleCallbacks = {
  readonly pause: () => void;
  readonly resume: () => void;
};

export function installGameLifecycle(callbacks: GameLifecycleCallbacks): () => void {
  let documentIsVisible = document.visibilityState !== "hidden";
  let windowIsFocused = document.hasFocus();
  let pausedByLifecycle = false;

  const pause = (): void => {
    if (pausedByLifecycle) {
      return;
    }

    pausedByLifecycle = true;
    callbacks.pause();
  };

  const resume = (): void => {
    if (!pausedByLifecycle) {
      return;
    }

    pausedByLifecycle = false;
    callbacks.resume();
  };

  const reconcile = (): void => {
    if (!documentIsVisible || !windowIsFocused) {
      pause();
      return;
    }

    resume();
  };

  const handleVisibilityChange = (): void => {
    documentIsVisible = document.visibilityState !== "hidden";
    reconcile();
  };

  const handleBlur = (): void => {
    windowIsFocused = false;
    reconcile();
  };

  const handleFocus = (): void => {
    windowIsFocused = true;
    reconcile();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", handleBlur);
  window.addEventListener("focus", handleFocus);
  reconcile();

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("blur", handleBlur);
    window.removeEventListener("focus", handleFocus);
  };
}
