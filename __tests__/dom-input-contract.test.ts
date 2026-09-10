import { describe, expect, it } from "vitest";
import { installActionInputAdapter } from "../src/game/dom-input";

type TestAction = "activate" | "select";

type ActionEvent = {
  readonly action: TestAction;
  readonly source: "keyboard" | "pointer" | "touch";
};

type AdapterOptions = {
  readonly keyboardTarget: EventTarget;
  readonly pointerTarget: EventTarget;
  readonly bindings: {
    readonly keyboard: Readonly<Record<string, TestAction>>;
    readonly pointer: TestAction;
    readonly touch: TestAction;
  };
  readonly emit: (event: ActionEvent) => void;
};

const createAdapter = (
  keyboardTarget: EventTarget,
  pointerTarget: EventTarget,
  emit: (event: ActionEvent) => void,
) =>
  installActionInputAdapter({
    keyboardTarget,
    pointerTarget,
    bindings: {
      keyboard: { KeyA: "activate" },
      pointer: "select",
      touch: "activate",
    },
    emit,
  } satisfies AdapterOptions);

describe("DOM action input adapter", () => {
  it("emits the mapped action for a keyboard keydown", () => {
    // Given: injected keyboard and pointer event targets with a keyboard binding
    const keyboardTarget = new EventTarget();
    const pointerTarget = new EventTarget();
    const events: ActionEvent[] = [];
    const teardown = createAdapter(keyboardTarget, pointerTarget, (event) => {
      events.push(event);
    });

    // When: the configured key is pressed
    keyboardTarget.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyA" }));

    // Then: one keyboard action event is emitted
    expect(events).toEqual([{ action: "activate", source: "keyboard" }]);
    teardown();
  });

  it.each(["mouse", "pen"] as const)(
    "routes %s pointerdown input to the pointer action",
    (pointerType) => {
      // Given: injected targets and distinct pointer and touch actions
      const keyboardTarget = new EventTarget();
      const pointerTarget = new EventTarget();
      const events: ActionEvent[] = [];
      const teardown = createAdapter(keyboardTarget, pointerTarget, (event) => {
        events.push(event);
      });

      // When: a mouse or pen pointer is pressed
      pointerTarget.dispatchEvent(new PointerEvent("pointerdown", { pointerType }));

      // Then: the pointer action event is emitted
      expect(events).toEqual([{ action: "select", source: "pointer" }]);
      teardown();
    },
  );

  it("routes touch pointerdown input to the touch action", () => {
    // Given: injected targets and distinct pointer and touch actions
    const keyboardTarget = new EventTarget();
    const pointerTarget = new EventTarget();
    const events: ActionEvent[] = [];
    const teardown = createAdapter(keyboardTarget, pointerTarget, (event) => {
      events.push(event);
    });

    // When: a touch pointer is pressed
    pointerTarget.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "touch" }));

    // Then: the touch action event is emitted
    expect(events).toEqual([{ action: "activate", source: "touch" }]);
    teardown();
  });

  it("does not emit an event for an unmapped keyboard code", () => {
    // Given: an adapter with only one configured keyboard code
    const keyboardTarget = new EventTarget();
    const pointerTarget = new EventTarget();
    const events: ActionEvent[] = [];
    const teardown = createAdapter(keyboardTarget, pointerTarget, (event) => {
      events.push(event);
    });

    // When: an unconfigured key is pressed
    keyboardTarget.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyX" }));

    // Then: no action event is emitted
    expect(events).toEqual([]);
    teardown();
  });

  it("makes listener teardown idempotent", () => {
    // Given: an installed adapter and its injected event targets
    const keyboardTarget = new EventTarget();
    const pointerTarget = new EventTarget();
    const events: ActionEvent[] = [];
    const teardown = createAdapter(keyboardTarget, pointerTarget, (event) => {
      events.push(event);
    });

    // When: teardown is called twice, then both input targets receive events
    teardown();
    teardown();
    keyboardTarget.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyA" }));
    pointerTarget.dispatchEvent(new PointerEvent("pointerdown", { pointerType: "mouse" }));

    // Then: no events are emitted after teardown
    expect(events).toEqual([]);
  });
});
