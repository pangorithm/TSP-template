import {
  type ActionEvent,
  type ActionInputBindings,
  createActionDispatcher,
  createActionInput,
} from "./input";

export type ActionInputAdapterOptions<TAction extends string> = {
  readonly keyboardTarget: EventTarget;
  readonly pointerTarget: EventTarget;
  readonly bindings: ActionInputBindings<TAction>;
  readonly emit: (event: ActionEvent<TAction>) => void;
};

export function installActionInputAdapter<TAction extends string>(
  options: ActionInputAdapterOptions<TAction>,
): () => void {
  const input = createActionInput(options.bindings);
  const dispatcher = createActionDispatcher(input, options.emit);
  const handleKeydown = (event: Event): void => {
    if (event instanceof KeyboardEvent) {
      dispatcher.dispatchKeyboard(event.code);
    }
  };
  const handlePointerdown = (event: Event): void => {
    if (event instanceof PointerEvent) {
      if (event.pointerType === "touch") {
        dispatcher.dispatchTouch();
      } else {
        dispatcher.dispatchPointer();
      }
    }
  };

  options.keyboardTarget.addEventListener("keydown", handleKeydown);
  options.pointerTarget.addEventListener("pointerdown", handlePointerdown);

  return (): void => {
    options.keyboardTarget.removeEventListener("keydown", handleKeydown);
    options.pointerTarget.removeEventListener("pointerdown", handlePointerdown);
  };
}
