import type Phaser from "phaser";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { createGame } from "./game/config";
import { installGameLifecycle } from "./game/lifecycle";
import { MainMenu, type MenuAction } from "./menu/MainMenu";

export type GameFactory = (parent: HTMLElement) => Phaser.Game;

export type AppProps = {
  readonly createContinuationGame?: GameFactory;
};

export function App(props: AppProps) {
  const [action, setAction] = createSignal<MenuAction | null>(null);
  let container: HTMLDivElement | undefined;
  let game: Phaser.Game | undefined;
  let removeLifecycle: (() => void) | undefined;

  createEffect(() => {
    const currentAction = action();
    if (currentAction === null) return;

    if (container === undefined) return;

    if (
      currentAction === "continue" &&
      props.createContinuationGame !== undefined
    ) {
      game = props.createContinuationGame(container);
    } else {
      game = createGame(container);
    }

    removeLifecycle = installGameLifecycle({
      pause: () => {
        if (game === undefined || !game.loop.running) {
          return false;
        }

        game.loop.sleep();
        return true;
      },
      resume: () => game?.loop.wake(),
    });
  });

  onCleanup(() => {
    removeLifecycle?.();
    game?.destroy(true);
  });

  function handleAction(selectedAction: MenuAction): void {
    setAction(selectedAction);
  }

  return (
    <>
      {action() === null ? (
        <MainMenu
          onAction={handleAction}
          showContinue={props.createContinuationGame !== undefined}
        />
      ) : (
        <div ref={(element) => (container = element)} id="game-container" />
      )}
    </>
  );
}
