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

export function createActionInput(bindings: ActionInputBindings): ActionInput {
  return {
    actionForKeyboard: (code) => bindings.keyboard[code],
    actionForPointer: () => bindings.pointer,
    actionForTouch: () => bindings.touch,
  };
}
