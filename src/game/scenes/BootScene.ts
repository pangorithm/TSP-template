import Phaser from "phaser";
import { SCENE_KEYS } from "../scene-keys";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.boot });
  }

  create(): void {
    this.scene.start(SCENE_KEYS.game);
  }
}
