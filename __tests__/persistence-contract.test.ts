import { describe, expect, it } from "vitest";

const persistenceModulePath = "../src/game/persistence";

type StorageLike = {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
};

type Persistence<T> = {
  readonly load: () => T;
  readonly save: (value: T) => void;
};

type PersistenceModule = {
  readonly createPersistence: <T>(options: {
    readonly storage: StorageLike;
    readonly key: string;
    readonly fallback: T;
  }) => Persistence<T>;
};

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function isPersistenceModule(value: unknown): value is PersistenceModule {
  return (
    typeof value === "object" &&
    value !== null &&
    "createPersistence" in value &&
    typeof value.createPersistence === "function"
  );
}

describe("typed persistence", () => {
  it("loads the typed fallback when no stored value exists", async () => {
    // Given: empty storage and a typed settings fallback
    const persistenceCandidate: unknown = await import(persistenceModulePath);
    expect(isPersistenceModule(persistenceCandidate)).toBe(true);
    if (!isPersistenceModule(persistenceCandidate)) {
      return;
    }
    const fallback = { musicEnabled: true, volume: 0.6 };
    const persistence = persistenceCandidate.createPersistence({
      storage: new MemoryStorage(),
      key: "settings",
      fallback,
    });

    // When: settings are loaded before a save
    const loaded = persistence.load();

    // Then: callers receive the declared fallback type
    expect(loaded).toEqual(fallback);
  });

  it("round-trips a typed value through storage", async () => {
    // Given: typed persistence backed by memory storage
    const persistenceCandidate: unknown = await import(persistenceModulePath);
    expect(isPersistenceModule(persistenceCandidate)).toBe(true);
    if (!isPersistenceModule(persistenceCandidate)) {
      return;
    }
    const persistence = persistenceCandidate.createPersistence({
      storage: new MemoryStorage(),
      key: "settings",
      fallback: { musicEnabled: true, volume: 0.6 },
    });
    const saved = { musicEnabled: false, volume: 0.25 };

    // When: a typed value is saved and loaded
    persistence.save(saved);
    const loaded = persistence.load();

    // Then: persistence preserves the complete typed value
    expect(loaded).toEqual(saved);
  });
});
