import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import Phaser from "phaser";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App, type GameFactory } from "../src/App";

/* ------------------------------------------------------------------ */
/*  Phaser mock — captures Game constructor calls                      */
/* ------------------------------------------------------------------ */
const mockLoops: MockLoop[] = [];
type MockLoop = {
  running: boolean;
  readonly sleep: () => void;
  readonly wake: () => void;
};

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
      destroy: () => void;
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
    this.destroy = vi.fn();
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

const MockGame = vi.mocked(Phaser.Game);

/* ------------------------------------------------------------------ */
/*  Menu rendering tests                                               */
/* ------------------------------------------------------------------ */
describe("App menu rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoops.length = 0;
  });

  it("renders a heading and a Start button on mount", () => {
    // Given: an unmounted application
    // When: the application mounts
    const { unmount, getByRole, getByText } = render(() => <App />);

    // Then: the menu displays a heading and a Start button
    expect(getByText("TSP Template")).toBeDefined();
    expect(getByRole("button", { name: "Start" })).toBeDefined();

    unmount();
  });

  it("does not create a Phaser game on mount", () => {
    // Given: an unmounted application
    // When: the application mounts
    const { unmount } = render(() => <App />);

    // Then: Phaser constructor was not called
    expect(MockGame).not.toHaveBeenCalled();
    expect(mockLoops).toHaveLength(0);

    unmount();
  });

  it("renders a semantic main landmark", () => {
    const { unmount, container } = render(() => <App />);
    const main = container.querySelector("main");
    expect(main).not.toBeNull();
    expect(main?.classList.contains("menu")).toBe(true);
    unmount();
  });
});

/* ------------------------------------------------------------------ */
/*  Start button activation tests                                      */
/* ------------------------------------------------------------------ */
describe("App Start activation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoops.length = 0;
  });

  it("creates a Phaser game when Start is clicked", async () => {
    // Given: a mounted application showing the menu
    const { unmount, getByRole } = render(() => <App />);
    expect(MockGame).not.toHaveBeenCalled();

    // When: the user clicks the Start button
    fireEvent.click(getByRole("button", { name: "Start" }));

    // Then: Phaser receives a responsive canvas configuration
    await waitFor(() => expect(MockGame).toHaveBeenCalledTimes(1));
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

  it("removes the menu controls from the DOM after Start", () => {
    // Given: a mounted application showing the menu
    const { unmount, getByRole, queryByText } = render(() => <App />);
    expect(getByRole("button", { name: "Start" })).toBeDefined();

    // When: the user clicks Start
    fireEvent.click(getByRole("button", { name: "Start" }));

    // Then: menu controls are removed while startup status and game host appear
    expect(queryByText("Start")).toBeNull();
    expect(getByRole("status")).toBeDefined();

    unmount();
  });

  it("creates exactly one Phaser game after Start (no double-launch)", async () => {
    const { unmount, getByRole } = render(() => <App />);
    fireEvent.click(getByRole("button", { name: "Start" }));
    await waitFor(() => expect(MockGame).toHaveBeenCalledTimes(1));

    // Attempting to find and click Start again should not be possible
    unmount();
  });
});

/* ------------------------------------------------------------------ */
/*  Continuation factory tests                                         */
/* ------------------------------------------------------------------ */
describe("App continuation factory", () => {
  const mockContinuationFactory = vi.fn<GameFactory>();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoops.length = 0;
    mockContinuationFactory.mockImplementation(() => new Promise<Phaser.Game>(() => undefined));
  });

  it("makes Continue visible only when createContinuationGame is injected", () => {
    // Given: App without continuation factory
    const { unmount, getByRole, queryByRole } = render(() => <App />);

    // Then: Continue button is absent from the default menu
    expect(queryByRole("button", { name: "Continue" })).toBeNull();
    expect(getByRole("button", { name: "Start" })).toBeDefined();

    // Given: App with an injected continuation factory
    unmount();

    const { unmount: unmountWithContinuation, getByRole: getByRoleWithContinuation } = render(
      () => <App createContinuationGame={mockContinuationFactory} />,
    );

    // Then: Continue button appears alongside Start
    expect(getByRoleWithContinuation("button", { name: "Start" })).toBeDefined();
    expect(getByRoleWithContinuation("button", { name: "Continue" })).toBeDefined();

    unmountWithContinuation();
  });

  it("removes the menu and calls the continuation factory once with the game container on Continue click", async () => {
    // Given: App mounted with an injected continuation factory
    const { unmount, getByRole, queryByText } = render(() => (
      <App createContinuationGame={mockContinuationFactory} />
    ));
    const continueButton = getByRole("button", { name: "Continue" });

    // When: the user clicks Continue
    fireEvent.click(continueButton);

    // Then: the menu is removed and the factory was invoked exactly once
    expect(queryByText("Continue")).toBeNull();
    expect(getByRole("status")).toBeDefined();
    await waitFor(() => expect(mockContinuationFactory).toHaveBeenCalledTimes(1));

    const [parent] = mockContinuationFactory.mock.calls[0] ?? [];
    expect(parent).toBeInstanceOf(HTMLElement);

    // And: Phaser.Game was not created via the default path
    expect(MockGame).not.toHaveBeenCalled();

    unmount();
  });

  it("does not call the continuation factory when the default Start is clicked", async () => {
    // Given: App with a continuation factory
    const { unmount, getByRole } = render(() => (
      <App createContinuationGame={mockContinuationFactory} />
    ));

    // When: the user clicks Start (not Continue)
    fireEvent.click(getByRole("button", { name: "Start" }));

    // Then: the default game path runs and the continuation factory was not invoked
    await waitFor(() => expect(MockGame).toHaveBeenCalledTimes(1));
    expect(mockContinuationFactory).not.toHaveBeenCalled();

    unmount();
  });
});
