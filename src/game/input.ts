export type ActionInputBindings = {
  readonly keyboard: Readonly<Record<string, string>>;
  readonly pointer: string;
  readonly touch: string;
};

export type ActionInput = {
  readonly actionForKeyboard: (code: string) => string | undefined;
  readonly actionForPointer: () => string;
  readonly actionForTouch: () => string;
};

export type ActionSource = "keyboard" | "pointer" | "touch";

export type ActionEvent = {
  readonly action: string;
  readonly source: ActionSource;
};

export type ActionDispatcher = {
  readonly dispatchKeyboard: (code: string) => void;
  readonly dispatchPointer: () => void;
  readonly dispatchTouch: () => void;
};

export function createActionInput(bindings: ActionInputBindings): ActionInput {
  return {
    actionForKeyboard: (code) => bindings.keyboard[code],
    actionForPointer: () => bindings.pointer,
    actionForTouch: () => bindings.touch,
  };
}

export function createActionDispatcher(
  input: ActionInput,
  emit: (event: ActionEvent) => void,
): ActionDispatcher {
  const dispatch = (action: string | undefined, source: ActionSource): void => {
    if (action !== undefined) {
      emit({ action, source });
    }
  };

  return {
    dispatchKeyboard: (code) => dispatch(input.actionForKeyboard(code), "keyboard"),
    dispatchPointer: () => dispatch(input.actionForPointer(), "pointer"),
    dispatchTouch: () => dispatch(input.actionForTouch(), "touch"),
  };
}
