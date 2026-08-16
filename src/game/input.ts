export type ActionInputBindings<TAction extends string> = {
  readonly keyboard: Readonly<Record<string, TAction>>;
  readonly pointer: TAction;
  readonly touch: TAction;
};

export type ActionInput<TAction extends string> = {
  readonly actionForKeyboard: (code: string) => TAction | undefined;
  readonly actionForPointer: () => TAction;
  readonly actionForTouch: () => TAction;
};

export type ActionSource = "keyboard" | "pointer" | "touch";

export type ActionEvent<TAction extends string> = {
  readonly action: TAction;
  readonly source: ActionSource;
};

export type ActionDispatcher<TAction extends string> = {
  readonly [dispatcherAction]?: TAction;
  readonly dispatchKeyboard: (code: string) => void;
  readonly dispatchPointer: () => void;
  readonly dispatchTouch: () => void;
};

export function createActionInput<TAction extends string>(
  bindings: ActionInputBindings<TAction>,
): ActionInput<TAction> {
  return {
    actionForKeyboard: (code) => bindings.keyboard[code],
    actionForPointer: () => bindings.pointer,
    actionForTouch: () => bindings.touch,
  };
}

export function createActionDispatcher<TAction extends string>(
  input: ActionInput<TAction>,
  emit: (event: ActionEvent<TAction>) => void,
): ActionDispatcher<TAction> {
  const dispatch = (action: TAction | undefined, source: ActionSource): void => {
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
declare const dispatcherAction: unique symbol;
