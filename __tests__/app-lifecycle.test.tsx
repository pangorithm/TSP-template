import { render } from "@solidjs/testing-library";
import Phaser from "phaser";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/App";
import { createGame } from "../src/game/config";

/* ------------------------------------------------------------------ */
/*  Phaser mock — captures Game constructor + destroy() calls          */
/* ------------------------------------------------------------------ */
const mockDestroy = vi.fn();

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

  const mockSleep = vi.fn();
  const mockWake = vi.fn();
  const MockGame = vi.fn(function (
    this: {
      destroy: typeof mockDestroy;
      loop: { readonly sleep: typeof mockSleep; readonly wake: typeof mockWake };
    },
    _config?: unknown,
  ) {
    void _config;
    this.destroy = mockDestroy;
    this.loop = { sleep: mockSleep, wake: mockWake };
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

const MockGame = vi.mocked(Phaser.Game);

/* ------------------------------------------------------------------ */
/*  Lifecycle tests                                                    */
/* ------------------------------------------------------------------ */
describe("App Phaser lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates Phaser game on mount with responsive config", () => {
    // Given: an unmounted application
    // When: the application mounts
    const { unmount } = render(() => <App />);

    // Then: Phaser receives a responsive canvas configuration
    expect(MockGame).toHaveBeenCalledTimes(1);
    const config = MockGame.mock.calls[0]?.[0];
    expect(config).toBeDefined();
    if (config === undefined) {
      unmount();
      return;
    }
    expect(config).toMatchObject({
      type: 0,
      width: "100%",
      height: "100%",
      scale: { mode: 1, autoCenter: 2 },
    });
    expect(config.parent).toBeInstanceOf(HTMLElement);

    unmount();
  });

  it("calls game.destroy(true) on cleanup", () => {
    const { unmount } = render(() => <App />);

    expect(mockDestroy).not.toHaveBeenCalled();
    unmount();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
    expect(mockDestroy).toHaveBeenCalledWith(true);
  });

  it("destroy fires exactly once per unmount (no double-cleanup)", () => {
    const { unmount } = render(() => <App />);
    unmount();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
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
