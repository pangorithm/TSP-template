import Phaser from "phaser";
import { SCENE_KEYS } from "../scene-keys";

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.game });
  }
}
