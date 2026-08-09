import { describe, expect, it } from "vitest";

const inputModulePath = "../src/game/input";

type ActionInput = {
  readonly actionForKeyboard: (code: string) => string | undefined;
  readonly actionForPointer: () => string;
  readonly actionForTouch: () => string;
};

type InputModule = {
  readonly createActionInput: (bindings: {
    readonly keyboard: Readonly<Record<string, string>>;
    readonly pointer: string;
    readonly touch: string;
  }) => ActionInput;
};

function isInputModule(value: unknown): value is InputModule {
  return (
    typeof value === "object" &&
    value !== null &&
    "createActionInput" in value &&
    typeof value.createActionInput === "function"
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
});
