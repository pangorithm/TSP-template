export type GameLifecycleCallbacks = {
  readonly pause: () => void;
  readonly resume: () => void;
};

export function installGameLifecycle(callbacks: GameLifecycleCallbacks): () => void {
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

  const handleVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      pause();
      return;
    }

    resume();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", pause);
  window.addEventListener("focus", resume);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("blur", pause);
    window.removeEventListener("focus", resume);
  };
}
