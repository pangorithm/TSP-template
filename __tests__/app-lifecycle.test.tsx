import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/App";
import { createGame } from "../src/game/config";

/* ------------------------------------------------------------------ */
/*  Phaser mock — captures Game constructor + destroy() calls          */
/* ------------------------------------------------------------------ */
const mockDestroy = vi.fn();
type MockLoop = {
  running: boolean;
  readonly sleep: () => void;
  readonly wake: () => void;
};
const mockLoops: MockLoop[] = [];

vi.mock("phaser", () => {
  class MockScene {
    add = {
      text: vi.fn().mockReturnValue({ setOrigin: vi.fn().mockReturnThis() }),
      rectangle: vi.fn().mockReturnThis(),
    };
    constructor(..._args: unknown[]) {
      void _args;
    }
  }

  const MockGame = vi.fn(function (
    this: {
      destroy: typeof mockDestroy;
      loop: MockLoop;
    },
    _config?: unknown,
  ) {
    void _config;
    const loop: MockLoop = {
      running: true,
      sleep: vi.fn(() => {
        loop.running = false;
      }),
      wake: vi.fn(() => {
        loop.running = true;
      }),
    };
    this.destroy = mockDestroy;
    this.loop = loop;
    mockLoops.push(loop);
  });

  return {
    default: {
      Game: MockGame,
      AUTO: 0,
      Scale: {
        RESIZE: 1,
        CENTER_BOTH: 2,
      },
      Scene: MockScene,
    },
  };
});

/* ------------------------------------------------------------------ */
/*  Post-Start lifecycle tests                                         */
/* ------------------------------------------------------------------ */
describe("App Phaser lifecycle (post-Start)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoops.length = 0;
  });

  it("calls game.destroy(true) on cleanup after Start", async () => {
    const { unmount, getByRole } = render(() => <App />);
    fireEvent.click(getByRole("button", { name: "Start" }));

    await waitFor(() => expect(mockLoops).toHaveLength(1));
    expect(mockDestroy).not.toHaveBeenCalled();
    unmount();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
    expect(mockDestroy).toHaveBeenCalledWith(true);
  });

  it("destroy fires exactly once per unmount (no double-cleanup)", async () => {
    const { unmount, getByRole } = render(() => <App />);
    fireEvent.click(getByRole("button", { name: "Start" }));
    await waitFor(() => expect(mockLoops).toHaveLength(1));
    unmount();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it("does not destroy on unmount before Start (no game to destroy)", () => {
    const { unmount } = render(() => <App />);
    unmount();
    expect(mockDestroy).not.toHaveBeenCalled();
  });

  it("sleeps and wakes a running Phaser loop across blur and focus", async () => {
    // Given: a mounted game started via Start
    const { unmount, getByRole } = render(() => <App />);
    fireEvent.click(getByRole("button", { name: "Start" }));
    await waitFor(() => expect(mockLoops).toHaveLength(1));
    const loop = mockLoops[0];
    expect(loop).toBeDefined();
    if (loop === undefined) {
      unmount();
      return;
    }

    // When: the window loses and then regains focus
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));

    // Then: App acquires lifecycle ownership and restores the loop
    expect(loop.sleep).toHaveBeenCalledTimes(1);
    expect(loop.wake).toHaveBeenCalledTimes(1);
    expect(loop.running).toBe(true);
    unmount();
  });

  it("preserves an externally stopped Phaser loop across blur and focus", async () => {
    // Given: a game started via Start whose Phaser loop was stopped externally
    const { unmount, getByRole } = render(() => <App />);
    fireEvent.click(getByRole("button", { name: "Start" }));
    await waitFor(() => expect(mockLoops).toHaveLength(1));
    const loop = mockLoops[0];
    expect(loop).toBeDefined();
    if (loop === undefined) {
      unmount();
      return;
    }
    loop.running = false;

    // When: the window loses and then regains focus
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));

    // Then: App does not claim ownership or wake the external stop
    expect(loop.sleep).not.toHaveBeenCalled();
    expect(loop.wake).not.toHaveBeenCalled();
    expect(loop.running).toBe(false);
    unmount();
  });

  it("does not install lifecycle before Start (no blur/focus handlers)", () => {
    // Given: a mounted application on the menu (no game started)
    const { unmount } = render(() => <App />);

    // When: window loses and regains focus before Start
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));

    // Then: no lifecycle handlers were active (no loops affected)
    expect(mockLoops).toHaveLength(0);
    unmount();
  });
});

/* ------------------------------------------------------------------ */
/*  Factory tests                                                      */
/* ------------------------------------------------------------------ */
describe("createGame factory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a Phaser.Game with a destroy method", () => {
    const container = document.createElement("div");
    const game = createGame(container);
    expect(game).toBeDefined();
    expect(typeof game.destroy).toBe("function");
  });
});

/* ------------------------------------------------------------------ */
/*  Import / regression tests                                          */
/* ------------------------------------------------------------------ */
describe("module exports", () => {
  it("App is a named export function", () => {
    expect(typeof App).toBe("function");
  });

  it("createGame is a named export function", () => {
    expect(typeof createGame).toBe("function");
  });
});
