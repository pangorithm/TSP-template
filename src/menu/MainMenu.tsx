export type MenuAction = "start" | "continue";

export type MainMenuProps = {
  readonly onAction: (action: MenuAction) => void;
  readonly showContinue: boolean;
};

export function MainMenu(props: MainMenuProps) {
  return (
    <main class="menu">
      <h1 class="menu__title">TSP Template</h1>
      <div class="menu__actions">
        <button
          class="menu__button"
          type="button"
          onClick={() => props.onAction("start")}
        >
          Start
        </button>
        {props.showContinue && (
          <button
            class="menu__button"
            type="button"
            onClick={() => props.onAction("continue")}
          >
            Continue
          </button>
        )}
      </div>
    </main>
  );
}
