import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import Phaser from "phaser";
import { createSignal } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App, type GameModuleLoader } from "../src/App";

const mockDestroy = vi.fn();

vi.mock("phaser", () => {
  class MockScene {}

  const MockGame = vi.fn(function (this: {
    destroy: typeof mockDestroy;
    loop: {
      readonly running: boolean;
      readonly sleep: () => void;
      readonly wake: () => void;
    };
  }) {
    this.destroy = mockDestroy;
    this.loop = {
      running: true,
      sleep: vi.fn(),
      wake: vi.fn(),
    };
  });

  return {
    default: {
      AUTO: 0,
      Game: MockGame,
      Scene: MockScene,
      Scale: {
        CENTER_BOTH: 2,
        RESIZE: 1,
      },
    },
  };
});

type Deferred<T> = {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (reason: Error) => void;
};

class MissingDeferredHandlerError extends Error {
  override readonly name = "MissingDeferredHandlerError";
}

function createDeferred<T>(): Deferred<T> {
  let resolvePromise: ((value: T) => void) | undefined;
  let rejectPromise: ((reason: Error) => void) | undefined;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    resolve: (value) => {
      if (resolvePromise === undefined) throw new MissingDeferredHandlerError();
      resolvePromise(value);
    },
    reject: (reason) => {
      if (rejectPromise === undefined) throw new MissingDeferredHandlerError();
      rejectPromise(reason);
    },
  };
}

function createMockGame(): Phaser.Game {
  return new Phaser.Game({ type: Phaser.AUTO });
}

describe("App startup flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the default game only after Start and announces pending startup", async () => {
    // Given: a loader whose module remains pending
    const module = createDeferred<Awaited<ReturnType<GameModuleLoader>>>();
    const loadGame = vi.fn<GameModuleLoader>(() => module.promise);
    const { getByRole, queryByRole, unmount } = render(() => <App loadGame={loadGame} />);
    const start = getByRole("button", { name: "Start" });
    expect(loadGame).not.toHaveBeenCalled();

    // When: Start receives duplicate activation attempts
    fireEvent.click(start);
    fireEvent.click(start);

    // Then: one lazy load starts and its progress is announced
    await waitFor(() => expect(loadGame).toHaveBeenCalledTimes(1));
    expect(getByRole("status")).toBeDefined();

    module.resolve({ createGame: vi.fn(() => createMockGame()) });
    await waitFor(() => expect(queryByRole("status")).toBeNull());
    unmount();
  });

  it("awaits an injected continuation factory before completing startup", async () => {
    // Given: a continuation factory that has not resolved
    const game = createDeferred<Phaser.Game>();
    const createContinuationGame = vi.fn(() => game.promise);
    const loadGame = vi.fn<GameModuleLoader>();
    const { getByRole, queryByRole } = render(() => (
      <App createContinuationGame={createContinuationGame} loadGame={loadGame} />
    ));

    // When: Continue is selected
    fireEvent.click(getByRole("button", { name: "Continue" }));

    // Then: the continuation path remains loading without loading the default module
    expect(getByRole("status")).toBeDefined();
    await waitFor(() => expect(createContinuationGame).toHaveBeenCalledTimes(1));
    expect(loadGame).not.toHaveBeenCalled();

    game.resolve(createMockGame());
    await waitFor(() => expect(queryByRole("status")).toBeNull());
  });

  it("keeps the loader selected at activation when the prop changes", async () => {
    // Given: startup has begun with a pending loader
    const module = createDeferred<Awaited<ReturnType<GameModuleLoader>>>();
    const selectedLoader = vi.fn<GameModuleLoader>(() => module.promise);
    const replacementLoader = vi.fn<GameModuleLoader>();
    const [loadGame, setLoadGame] = createSignal<GameModuleLoader>(selectedLoader);
    const { getByRole, queryByRole } = render(() => <App loadGame={loadGame()} />);
    fireEvent.click(getByRole("button", { name: "Start" }));
    await waitFor(() => expect(selectedLoader).toHaveBeenCalledTimes(1));

    // When: the loader prop changes while startup is pending
    setLoadGame(() => replacementLoader);

    // Then: the in-flight request remains bound to the selected loader
    expect(replacementLoader).not.toHaveBeenCalled();
    module.resolve({ createGame: vi.fn(() => createMockGame()) });
    await waitFor(() => expect(queryByRole("status")).toBeNull());
    expect(selectedLoader).toHaveBeenCalledTimes(1);
  });

  it("shows a neutral error and retries the selected continuation action", async () => {
    // Given: a continuation that rejects once and succeeds on retry
    const game = createMockGame();
    const createContinuationGame = vi
      .fn<() => Phaser.Game | Promise<Phaser.Game>>()
      .mockRejectedValueOnce(new Error("startup failed"))
      .mockReturnValueOnce(game);
    const loadGame = vi.fn<GameModuleLoader>();
    const { getByRole } = render(() => (
      <App createContinuationGame={createContinuationGame} loadGame={loadGame} />
    ));
    fireEvent.click(getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(getByRole("alert")).toBeDefined());

    // When: the user retries
    fireEvent.click(getByRole("button", { name: "Retry" }));

    // Then: the same continuation action runs without using the default loader
    await waitFor(() => expect(createContinuationGame).toHaveBeenCalledTimes(2));
    expect(loadGame).not.toHaveBeenCalled();
  });

  it("retries the selected start action when game creation fails", async () => {
    // Given: a loaded module whose game factory rejects once and succeeds on retry
    const game = createMockGame();
    const createGame = vi
      .fn<() => Phaser.Game | Promise<Phaser.Game>>()
      .mockRejectedValueOnce(new Error("startup failed"))
      .mockReturnValueOnce(game);
    const loadGame = vi.fn<GameModuleLoader>().mockResolvedValue({ createGame });
    const { getByRole } = render(() => <App loadGame={loadGame} />);
    fireEvent.click(getByRole("button", { name: "Start" }));
    await waitFor(() => expect(getByRole("alert")).toBeDefined());

    // When: the user retries
    fireEvent.click(getByRole("button", { name: "Retry" }));

    // Then: the retained start request loads and creates the game again
    await waitFor(() => expect(createGame).toHaveBeenCalledTimes(2));
    expect(loadGame).toHaveBeenCalledTimes(2);
  });

  it("destroys a game that resolves after App unmounts", async () => {
    // Given: startup is pending when the component unmounts
    const game = createDeferred<Phaser.Game>();
    const createGame = vi.fn(() => game.promise);
    const loadGame = vi.fn<GameModuleLoader>().mockResolvedValue({ createGame });
    const { getByRole, unmount } = render(() => <App loadGame={loadGame} />);
    fireEvent.click(getByRole("button", { name: "Start" }));
    await waitFor(() => expect(createGame).toHaveBeenCalledTimes(1));
    unmount();

    // When: the factory resolves after teardown
    game.resolve(createMockGame());

    // Then: the orphaned game is destroyed immediately
    await waitFor(() => expect(mockDestroy).toHaveBeenCalledWith(true));
  });

  it("skips creation when the module arrives after unmount", async () => {
    // Given: the module is still loading.
    const module = createDeferred<Awaited<ReturnType<GameModuleLoader>>>();
    const loadGame = vi.fn(() => module.promise);
    const createGame = vi.fn(createMockGame);
    const { getByRole, unmount } = render(() => <App loadGame={loadGame} />);
    fireEvent.click(getByRole("button", { name: "Start" }));
    await waitFor(() => expect(loadGame).toHaveBeenCalledOnce());
    // When: the owner disappears before the module resolves.
    unmount();
    module.resolve({ createGame });
    await module.promise;
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    // Then: no orphan initialization runs.
    expect(createGame).not.toHaveBeenCalled();
  });

  it.each(["module", "creation"] as const)("reports the original %s error", async (stage) => {
    // Given: startup fails at the selected boundary.
    const cause = new Error("private diagnostic");
    const onStartupError = vi.fn();
    const loadGame: GameModuleLoader =
      stage === "module"
        ? () => Promise.reject(cause)
        : () => Promise.resolve({ createGame: () => Promise.reject(cause) });
    const { getByRole } = render(() => <App loadGame={loadGame} onStartupError={onStartupError} />);
    // When: startup is requested.
    fireEvent.click(getByRole("button", { name: "Start" }));
    // Then: diagnostics retain their cause without exposing it in the UI.
    await waitFor(() =>
      expect(onStartupError).toHaveBeenCalledWith({ stage, action: "start", cause }),
    );
    expect(getByRole("alert").textContent).not.toContain(cause.message);
  });

  it("wakes a sleeping game only after scheduling its destruction", async () => {
    // Given: a factory returns a stopped game.
    const game = createMockGame();
    Object.defineProperty(game.loop, "running", { value: false });
    const wake = vi.spyOn(game.loop, "wake");
    const { getByRole, queryByRole, unmount } = render(() => (
      <App loadGame={async () => ({ createGame: () => game })} />
    ));
    fireEvent.click(getByRole("button", { name: "Start" }));
    await waitFor(() => expect(queryByRole("status")).toBeNull());
    // When: the owner is disposed.
    unmount();
    // Then: destruction gets a frame even though the game was sleeping.
    expect(wake).toHaveBeenCalledOnce();
    expect(mockDestroy.mock.invocationCallOrder[0]).toBeLessThan(
      wake.mock.invocationCallOrder[0] ?? 0,
    );
  });
});
