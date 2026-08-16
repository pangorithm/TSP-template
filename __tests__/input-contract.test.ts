import { describe, expect, it } from "vitest";

const inputModulePath = "../src/game/input";

type ActionInput = {
  readonly actionForKeyboard: (code: string) => string | undefined;
  readonly actionForPointer: () => string;
  readonly actionForTouch: () => string;
};

type ActionEvent = {
  readonly action: string;
  readonly source: "keyboard" | "pointer" | "touch";
};

type ActionDispatcher = {
  readonly dispatchKeyboard: (code: string) => void;
  readonly dispatchPointer: () => void;
  readonly dispatchTouch: () => void;
};

type InputModule = {
  readonly createActionInput: (bindings: {
    readonly keyboard: Readonly<Record<string, string>>;
    readonly pointer: string;
    readonly touch: string;
  }) => ActionInput;
  readonly createActionDispatcher: (
    input: ActionInput,
    dispatch: (event: ActionEvent) => void,
  ) => ActionDispatcher;
};

function isInputModule(value: unknown): value is InputModule {
  return (
    typeof value === "object" &&
    value !== null &&
      "createActionInput" in value &&
      typeof value.createActionInput === "function" &&
      "createActionDispatcher" in value &&
      typeof value.createActionDispatcher === "function"
  );
}

describe("generic action input", () => {
  it("maps configured keyboard codes to caller-defined actions", async () => {
    // Given: keyboard bindings that use no genre-specific action names
    const inputCandidate: unknown = await import(inputModulePath);
    expect(isInputModule(inputCandidate)).toBe(true);
    if (!isInputModule(inputCandidate)) {
      return;
    }
    const input = inputCandidate.createActionInput({
      keyboard: { KeyF: "interact", Escape: "dismiss" },
      pointer: "interact",
      touch: "interact",
    });

    // When: a configured keyboard code is received
    const action = input.actionForKeyboard("KeyF");

    // Then: the configured generic action is returned
    expect(action).toBe("interact");
  });

  it("leaves unconfigured keyboard codes unmapped", async () => {
    // Given: an action input with one keyboard binding
    const inputCandidate: unknown = await import(inputModulePath);
    expect(isInputModule(inputCandidate)).toBe(true);
    if (!isInputModule(inputCandidate)) {
      return;
    }
    const input = inputCandidate.createActionInput({
      keyboard: { KeyF: "interact" },
      pointer: "interact",
      touch: "interact",
    });

    // When: an unconfigured keyboard code is received
    const action = input.actionForKeyboard("KeyX");

    // Then: no action is emitted
    expect(action).toBeUndefined();
  });

  it("maps pointer input to its configured generic action", async () => {
    // Given: distinct pointer and touch bindings
    const inputCandidate: unknown = await import(inputModulePath);
    expect(isInputModule(inputCandidate)).toBe(true);
    if (!isInputModule(inputCandidate)) {
      return;
    }
    const input = inputCandidate.createActionInput({
      keyboard: {},
      pointer: "select",
      touch: "activate",
    });

    // When: pointer input is received
    const pointerAction = input.actionForPointer();

    // Then: pointer input preserves its configured action
    expect(pointerAction).toBe("select");
  });

  it("maps touch input to its configured generic action", async () => {
    // Given: distinct pointer and touch bindings
    const inputCandidate: unknown = await import(inputModulePath);
    expect(isInputModule(inputCandidate)).toBe(true);
    if (!isInputModule(inputCandidate)) {
      return;
    }
    const input = inputCandidate.createActionInput({
      keyboard: {},
      pointer: "select",
      touch: "activate",
    });

    // When: touch input is received
    const touchAction = input.actionForTouch();

    // Then: touch input preserves its configured action
    expect(touchAction).toBe("activate");
  });

  it("dispatches configured actions with their physical source", async () => {
    // Given: generic mappings and an action event collector
    const inputCandidate: unknown = await import(inputModulePath);
    expect(isInputModule(inputCandidate)).toBe(true);
    if (!isInputModule(inputCandidate)) {
      return;
    }
    const events: ActionEvent[] = [];
    const input = inputCandidate.createActionInput({
      keyboard: { KeyF: "interact" },
      pointer: "select",
      touch: "activate",
    });
    const dispatcher = inputCandidate.createActionDispatcher(input, (event) => {
      events.push(event);
    });

    // When: configured keyboard input is dispatched
    dispatcher.dispatchKeyboard("KeyF");

    // Then: one action event retains the action and physical source
    expect(events).toEqual([{ action: "interact", source: "keyboard" }]);
  });

  it("does not dispatch an action for an unmapped keyboard code", async () => {
    // Given: a dispatcher with a single keyboard mapping
    const inputCandidate: unknown = await import(inputModulePath);
    expect(isInputModule(inputCandidate)).toBe(true);
    if (!isInputModule(inputCandidate)) {
      return;
    }
    const events: ActionEvent[] = [];
    const input = inputCandidate.createActionInput({
      keyboard: { KeyF: "interact" },
      pointer: "select",
      touch: "activate",
    });
    const dispatcher = inputCandidate.createActionDispatcher(input, (event) => {
      events.push(event);
    });

    // When: an unmapped keyboard code is dispatched
    dispatcher.dispatchKeyboard("KeyX");

    // Then: no action event is sent
    expect(events).toEqual([]);
  });

  it("dispatches the configured pointer action with a pointer source", async () => {
    // Given: a dispatcher with a configured pointer action
    const inputCandidate: unknown = await import(inputModulePath);
    expect(isInputModule(inputCandidate)).toBe(true);
    if (!isInputModule(inputCandidate)) {
      return;
    }
    const events: ActionEvent[] = [];
    const input = inputCandidate.createActionInput({
      keyboard: {},
      pointer: "select",
      touch: "activate",
    });
    const dispatcher = inputCandidate.createActionDispatcher(input, (event) => {
      events.push(event);
    });

    // When: pointer input is dispatched
    dispatcher.dispatchPointer();

    // Then: the event identifies the configured action and pointer source
    expect(events).toEqual([{ action: "select", source: "pointer" }]);
  });

  it("dispatches the configured touch action with a touch source", async () => {
    // Given: a dispatcher with a configured touch action
    const inputCandidate: unknown = await import(inputModulePath);
    expect(isInputModule(inputCandidate)).toBe(true);
    if (!isInputModule(inputCandidate)) {
      return;
    }
    const events: ActionEvent[] = [];
    const input = inputCandidate.createActionInput({
      keyboard: {},
      pointer: "select",
      touch: "activate",
    });
    const dispatcher = inputCandidate.createActionDispatcher(input, (event) => {
      events.push(event);
    });

    // When: touch input is dispatched
    dispatcher.dispatchTouch();

    // Then: the event identifies the configured action and touch source
    expect(events).toEqual([{ action: "activate", source: "touch" }]);
  });
});
