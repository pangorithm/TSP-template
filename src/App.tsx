import type Phaser from "phaser";
import type { JSX } from "solid-js";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { installGameLifecycle } from "./game/lifecycle";
import { MainMenu, type MenuAction } from "./menu/MainMenu";
import { StartupStatus } from "./menu/StartupStatus";

export type GameFactory = (parent: HTMLElement) => Phaser.Game | Promise<Phaser.Game>;

type GameModule = {
  readonly createGame: GameFactory;
};

export type GameModuleLoader = () => Promise<GameModule>;

export type AppProps = {
  readonly createContinuationGame?: GameFactory;
  readonly loadGame?: GameModuleLoader;
};

type StartupRequest =
  | { readonly kind: "start"; readonly loadGame: GameModuleLoader }
  | { readonly kind: "continue"; readonly createGame: GameFactory };

type StartupRecovery =
  | { readonly kind: "reload" }
  | { readonly kind: "retry"; readonly request: StartupRequest };

type StartupState =
  | { readonly kind: "menu" }
  | { readonly kind: "loading"; readonly request: StartupRequest }
  | { readonly kind: "error"; readonly recovery: StartupRecovery }
  | { readonly kind: "running" };

const loadDefaultGame: GameModuleLoader = () => import("./game/config");

export function App(props: AppProps) {
  const [startup, setStartup] = createSignal<StartupState>({ kind: "menu" });
  let container: HTMLDivElement | undefined;
  let game: Phaser.Game | undefined;
  let removeLifecycle: (() => void) | undefined;
  let mounted = true;

  createEffect(() => {
    const state = startup();
    switch (state.kind) {
      case "menu":
      case "error":
      case "running":
        return;
      case "loading": {
        const parent = container;
        if (parent === undefined) return;

        const createGame = (create: GameFactory, request: StartupRequest): void => {
          void Promise.resolve()
            .then(() => create(parent))
            .then(
              (createdGame) => {
                if (!mounted) {
                  createdGame.destroy(true);
                  return;
                }

                game = createdGame;
                removeLifecycle = installGameLifecycle({
                  pause: () => {
                    if (!createdGame.loop.running) return false;

                    createdGame.loop.sleep();
                    return true;
                  },
                  resume: () => createdGame.loop.wake(),
                });
                setStartup({ kind: "running" });
              },
              () => {
                if (mounted) setStartup({ kind: "error", recovery: { kind: "retry", request } });
              },
            );
        };

        const request = state.request;
        switch (request.kind) {
          case "start":
            void Promise.resolve()
              .then(() => request.loadGame())
              .then(
                (module) => createGame(module.createGame, request),
                () => {
                  if (mounted) setStartup({ kind: "error", recovery: { kind: "reload" } });
                },
              );
            return;
          case "continue":
            createGame(request.createGame, request);
            return;
          default:
            return request;
        }
      }
      default:
        return state;
    }
  });

  onCleanup(() => {
    mounted = false;
    removeLifecycle?.();
    game?.destroy(true);
  });

  function handleAction(selectedAction: MenuAction): void {
    const state = startup();
    if (state.kind !== "menu") return;

    switch (selectedAction) {
      case "start":
        setStartup({
          kind: "loading",
          request: {
            kind: "start",
            loadGame: props.loadGame ?? loadDefaultGame,
          },
        });
        return;
      case "continue": {
        const createContinuationGame = props.createContinuationGame;
        if (createContinuationGame === undefined) return;

        setStartup({
          kind: "loading",
          request: { kind: "continue", createGame: createContinuationGame },
        });
        return;
      }
      default:
        selectedAction satisfies never;
        return;
    }
  }

  function renderStatus(): JSX.Element {
    const state = startup();
    switch (state.kind) {
      case "menu":
      case "running":
        return null;
      case "loading":
        return <StartupStatus kind="loading" />;
      case "error": {
        const recovery = state.recovery;
        switch (recovery.kind) {
          case "reload":
            return (
              <StartupStatus
                kind="error"
                actionLabel="Reload"
                onAction={() => window.location.reload()}
              />
            );
          case "retry":
            return (
              <StartupStatus
                kind="error"
                actionLabel="Retry"
                onAction={() => setStartup({ kind: "loading", request: recovery.request })}
              />
            );
          default:
            return recovery;
        }
      }
      default:
        return state;
    }
  }

  return (
    <Show
      when={startup().kind !== "menu"}
      fallback={
        <MainMenu
          onAction={handleAction}
          showContinue={props.createContinuationGame !== undefined}
        />
      }
    >
      <div class="game-stage">
        <div
          ref={(element) => {
            container = element;
          }}
          id="game-container"
        />
        {renderStatus()}
      </div>
    </Show>
  );
}
