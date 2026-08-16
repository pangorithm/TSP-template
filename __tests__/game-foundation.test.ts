import Phaser from "phaser";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const sceneConfigurations: unknown[] = [];

  return {
    game: vi.fn(),
    sceneConfigurations,
    sceneStart: vi.fn(),
  };
});

vi.mock("phaser", () => {
  class MockScene {
    readonly add = {
      rectangle: vi.fn(),
      text: vi.fn().mockReturnValue({ setOrigin: vi.fn() }),
    };
    readonly scene = { start: mocks.sceneStart };

    constructor(configuration?: unknown) {
      mocks.sceneConfigurations.push(configuration);
    }
  }

  return {
    default: {
      AUTO: 0,
      Game: mocks.game,
      Scale: {
        RESIZE: 1,
        CENTER_BOTH: 2,
      },
      Scene: MockScene,
    },
  };
});

import { createGame } from "../src/game/config";
import { BootScene } from "../src/game/scenes/BootScene";

const gameSceneModulePath = "../src/game/scenes/GameScene";
const sceneKeysModulePath = "../src/game/scene-keys";

type SceneConstructor = new () => unknown;

type GameSceneModule = {
  readonly GameScene: SceneConstructor;
};

type SceneKeysModule = {
  readonly SCENE_KEYS: {
    readonly boot: string;
    readonly game: string;
  };
};

function isGameSceneModule(value: unknown): value is GameSceneModule {
  return (
    typeof value === "object" &&
    value !== null &&
    "GameScene" in value &&
    typeof value.GameScene === "function"
  );
}

function isSceneKeysModule(value: unknown): value is SceneKeysModule {
  return (
    typeof value === "object" &&
    value !== null &&
    "SCENE_KEYS" in value &&
    typeof value.SCENE_KEYS === "object" &&
    value.SCENE_KEYS !== null &&
    "boot" in value.SCENE_KEYS &&
    typeof value.SCENE_KEYS.boot === "string" &&
    "game" in value.SCENE_KEYS &&
    typeof value.SCENE_KEYS.game === "string"
  );
}

describe("Phaser foundation", () => {
  it("configures a responsive canvas", () => {
    // Given: a host element for the game canvas
    const host = document.createElement("div");

    // When: the game factory creates Phaser
    createGame(host);

    // Then: the canvas uses responsive resize settings
    expect(mocks.game).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 0,
        width: "100%",
        height: "100%",
        parent: host,
        scale: { mode: 1, autoCenter: 2 },
      }),
    );
  });

  it("does not send unsupported visibility configuration to Phaser", () => {
    // Given: a host element for the game canvas
    const host = document.createElement("div");

    // When: the factory creates Phaser
    createGame(host);
    const config = mocks.game.mock.calls.at(-1)?.[0];

    // Then: the native Phaser configuration has no unsupported visibility field
    expect(config).toBeDefined();
    if (config === undefined) {
      return;
    }
    expect(config).not.toHaveProperty("disableVisibilityChange");
  });

  it("omits unset optional configuration from the Phaser constructor", () => {
    // Given: a factory call without optional presentation settings
    const host = document.createElement("div");

    // When: the game is created with its default configuration
    createGame(host);

    // Then: Phaser receives only concrete optional values
    const config = mocks.game.mock.calls.at(-1)?.[0];
    expect(config).not.toHaveProperty("backgroundColor");
    expect(config).not.toHaveProperty("banner");
    expect(config).not.toHaveProperty("fps");
    expect(config).not.toHaveProperty("render");
  });

  it("allows only optional presentation and render settings around its protected config", () => {
    // Given: factory settings that do not own the host, sizing, scale, or scenes
    const host = document.createElement("div");
    const render = { pixelArt: true };
    const fps = { target: 30 };

    // When: the factory receives its supported optional settings
    createGame(host, {
      backgroundColor: "#102030",
      banner: false,
      fps,
      render,
    });

    // Then: it preserves them while retaining the foundation-owned configuration
    expect(mocks.game).toHaveBeenLastCalledWith({
      type: 0,
      width: "100%",
      height: "100%",
      parent: host,
      scale: { mode: 1, autoCenter: 2 },
      scene: [BootScene, expect.any(Function)],
      backgroundColor: "#102030",
      banner: false,
      fps,
      render,
    });
  });

  it("registers BootScene and GameScene in startup order", async () => {
    // Given: the generic game scene contract
    const gameSceneCandidate: unknown = await import(gameSceneModulePath);
    expect(isGameSceneModule(gameSceneCandidate)).toBe(true);
    if (!isGameSceneModule(gameSceneCandidate)) {
      return;
    }

    const host = document.createElement("div");

    // When: the game factory creates Phaser
    createGame(host);

    // Then: BootScene precedes the genre-agnostic GameScene
    expect(mocks.game).toHaveBeenLastCalledWith(
      expect.objectContaining({
        scene: [BootScene, gameSceneCandidate.GameScene],
      }),
    );
  });

  it("transitions BootScene to the generic game scene", () => {
    // Given: a boot scene ready to create
    const bootScene = new BootScene();

    // When: Phaser invokes its create hook
    bootScene.create();

    // Then: startup advances without introducing game behavior
    expect(mocks.sceneStart).toHaveBeenCalledWith("game");
  });

  it("exposes shared boot and game scene keys", async () => {
    // Given: the scene key module contract
    const sceneKeysCandidate: unknown = await import(sceneKeysModulePath);

    // When: consumers inspect the scene keys
    // Then: the startup keys are stable and genre-agnostic
    expect(isSceneKeysModule(sceneKeysCandidate)).toBe(true);
    if (!isSceneKeysModule(sceneKeysCandidate)) {
      return;
    }
    expect(sceneKeysCandidate.SCENE_KEYS).toEqual({ boot: "boot", game: "game" });
  });

  it("constructs GameScene with the shared game key", async () => {
    // Given: the generic scene and its key contract
    const gameSceneCandidate: unknown = await import(gameSceneModulePath);
    const sceneKeysCandidate: unknown = await import(sceneKeysModulePath);
    expect(isGameSceneModule(gameSceneCandidate)).toBe(true);
    expect(isSceneKeysModule(sceneKeysCandidate)).toBe(true);
    if (
      !isGameSceneModule(gameSceneCandidate) ||
      !isSceneKeysModule(sceneKeysCandidate)
    ) {
      return;
    }

    // When: Phaser constructs the game scene
    const gameScene = new gameSceneCandidate.GameScene();

    // Then: it is a Phaser scene identified by the generic game key
    expect(gameScene).toBeInstanceOf(Phaser.Scene);
    expect(mocks.sceneConfigurations).toContainEqual({
      key: sceneKeysCandidate.SCENE_KEYS.game,
    });
  });
});
