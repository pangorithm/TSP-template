import type Phaser from "phaser";
import { onCleanup, onMount } from "solid-js";
import { createGame } from "./game/config";
import { installGameLifecycle } from "./game/lifecycle";

export function App() {
  let container: HTMLDivElement | undefined;
  let game: Phaser.Game | undefined;
  let removeLifecycle: (() => void) | undefined;

  onMount(() => {
    if (container === undefined) {
      return;
    }

    game = createGame(container);
    removeLifecycle = installGameLifecycle({
      pause: () => game?.loop.sleep(),
      resume: () => game?.loop.wake(),
    });
  });

  onCleanup(() => {
    removeLifecycle?.();
    game?.destroy(true);
  });

  return <div ref={(element) => (container = element)} id="game-container" />;
}
