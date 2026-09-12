import { describe, expectTypeOf, it } from "vitest";
import type { AppProps, GameFactory, GameModuleLoader, StartupError } from "../src/App";
import type { GameFactoryOptions } from "../src/game/config";
import type {
  ActionDispatcher,
  ActionEvent,
  ActionInput,
  ActionInputBindings,
  ActionSource,
} from "../src/game/input";
import type { GameLifecycleCallbacks } from "../src/game/lifecycle";
import type {
  Persistence,
  PersistenceCodec,
  PersistenceOptions,
  StoragePort,
} from "../src/game/persistence";

type TestAction = "confirm" | "cancel";
type TestSave = { readonly slot: number };

describe("foundation public type contracts", () => {
  it("preserves the caller-owned game startup boundary", () => {
    expectTypeOf<GameFactory>().toBeFunction();
    expectTypeOf<GameModuleLoader>().returns.resolves.toHaveProperty("createGame");
    expectTypeOf<AppProps>().toHaveProperty("createContinuationGame");
    expectTypeOf<StartupError["cause"]>().toEqualTypeOf<unknown>();
    expectTypeOf<GameFactoryOptions>().not.toHaveProperty("scene");
  });

  it("preserves caller-defined input actions", () => {
    expectTypeOf<ActionInputBindings<TestAction>["pointer"]>().toEqualTypeOf<TestAction>();
    expectTypeOf<ActionInput<TestAction>["actionForKeyboard"]>().returns.toEqualTypeOf<
      TestAction | undefined
    >();
    expectTypeOf<ActionSource>().toEqualTypeOf<"keyboard" | "pointer" | "touch">();
    expectTypeOf<ActionEvent<TestAction>["action"]>().toEqualTypeOf<TestAction>();
    expectTypeOf<ActionDispatcher<TestAction>["dispatchKeyboard"]>().parameters.toEqualTypeOf<
      [code: string]
    >();
  });

  it("preserves injected lifecycle and persistence ports", () => {
    expectTypeOf<GameLifecycleCallbacks["pause"]>().returns.toEqualTypeOf<boolean>();
    expectTypeOf<StoragePort["getItem"]>().returns.toEqualTypeOf<string | null>();
    expectTypeOf<PersistenceCodec<TestSave>["decode"]>().returns.toEqualTypeOf<
      TestSave | undefined
    >();
    expectTypeOf<PersistenceOptions<TestSave>>().toHaveProperty("storage");
    expectTypeOf<Persistence<TestSave>["load"]>().returns.toEqualTypeOf<TestSave>();
  });
});
