import type { JSX } from "solid-js";

export type StartupStatusProps =
  | { readonly kind: "loading" }
  | {
      readonly kind: "error";
      readonly actionLabel: "Reload" | "Retry";
      readonly onAction: () => void;
    };

export function StartupStatus(props: StartupStatusProps): JSX.Element {
  switch (props.kind) {
    case "loading":
      return (
        <main class="menu startup-status">
          <h1 class="menu__title">TSP Template</h1>
          <p class="menu__message" role="status" aria-live="polite">
            Loading...
          </p>
        </main>
      );
    case "error":
      return (
        <main class="menu startup-status">
          <h1 class="menu__title">TSP Template</h1>
          <p class="menu__message" role="alert">
            Unable to start the game.
          </p>
          <div class="menu__actions">
            <button class="menu__button" type="button" onClick={props.onAction}>
              {props.actionLabel}
            </button>
          </div>
        </main>
      );
    default:
      return props;
  }
}
