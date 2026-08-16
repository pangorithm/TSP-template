import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";

export type GameFactoryOptions = Pick<
  Phaser.Types.Core.GameConfig,
  "backgroundColor" | "banner" | "fps" | "render"
>;

export function createGame(
  parent: HTMLElement,
  options: GameFactoryOptions = {},
): Phaser.Game {
  const DEFAULT_BACKGROUND = "#000000" as const;

  const optionalConfig = {
    backgroundColor: options.backgroundColor ?? DEFAULT_BACKGROUND,
    ...(options.banner === undefined ? {} : { banner: options.banner }),
    ...(options.fps === undefined ? {} : { fps: options.fps }),
    ...(options.render === undefined ? {} : { render: options.render }),
  };

  return new Phaser.Game({
    type: Phaser.AUTO,
    width: "100%",
    height: "100%",
    parent,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, GameScene],
    ...optionalConfig,
  });
}
