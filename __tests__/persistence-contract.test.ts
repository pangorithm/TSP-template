import { describe, expect, it } from "vitest";

const persistenceModulePath = "../src/game/persistence";

type StorageLike = {
  readonly getItem: (key: string) => string | null;
  readonly removeItem: (key: string) => void;
  readonly setItem: (key: string, value: string) => void;
};

type Persistence<T> = {
  readonly clear: () => void;
  readonly load: () => T;
  readonly save: (value: T) => void;
};

type PersistenceCodec<T> = {
  readonly decode: (serialized: string) => T | undefined;
  readonly encode: (value: T) => string;
};

type PersistenceModule = {
  readonly createPersistence: <T>(options: {
    readonly codec?: PersistenceCodec<T>;
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

  removeItem(key: string): void {
    this.values.delete(key);
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

  it("uses the fallback when default JSON decoding receives invalid syntax", async () => {
    // Given: persistence with invalid serialized JSON
    const persistenceCandidate: unknown = await import(persistenceModulePath);
    expect(isPersistenceModule(persistenceCandidate)).toBe(true);
    if (!isPersistenceModule(persistenceCandidate)) {
      return;
    }
    const storage = new MemoryStorage();
    storage.setItem("settings", "{");
    const fallback = { musicEnabled: true, volume: 0.6 };
    const persistence = persistenceCandidate.createPersistence({
      storage,
      key: "settings",
      fallback,
    });

    // When: the malformed value is loaded
    const loaded = persistence.load();

    // Then: persistence returns the typed fallback
    expect(loaded).toEqual(fallback);
  });

  it("uses the fallback when a codec declines a stored value", async () => {
    // Given: a codec that cannot decode the stored representation
    const persistenceCandidate: unknown = await import(persistenceModulePath);
    expect(isPersistenceModule(persistenceCandidate)).toBe(true);
    if (!isPersistenceModule(persistenceCandidate)) {
      return;
    }
    const storage = new MemoryStorage();
    storage.setItem("settings", "unrecognized");
    const fallback = { musicEnabled: true, volume: 0.6 };
    const persistence = persistenceCandidate.createPersistence({
      storage,
      key: "settings",
      fallback,
      codec: {
        decode: () => undefined,
        encode: (value) => JSON.stringify(value),
      },
    });

    // When: the codec declines the stored value
    const loaded = persistence.load();

    // Then: persistence returns the typed fallback
    expect(loaded).toEqual(fallback);
  });

  it("propagates unexpected codec errors", async () => {
    // Given: a codec whose decode operation fails unexpectedly
    const persistenceCandidate: unknown = await import(persistenceModulePath);
    expect(isPersistenceModule(persistenceCandidate)).toBe(true);
    if (!isPersistenceModule(persistenceCandidate)) {
      return;
    }
    const storage = new MemoryStorage();
    storage.setItem("settings", "invalid");
    const failure = new RangeError("codec failure");
    const persistence = persistenceCandidate.createPersistence({
      storage,
      key: "settings",
      fallback: { musicEnabled: true, volume: 0.6 },
      codec: {
        decode: () => {
          throw failure;
        },
        encode: (value) => JSON.stringify(value),
      },
    });

    // When: the failing codec loads a stored value
    const load = () => persistence.load();

    // Then: the unexpected error remains visible to the caller
    expect(load).toThrow(failure);
  });

  it("clears its saved value to the fallback without affecting other keys", async () => {
    // Given: storage containing this persistence key and an unrelated key
    const persistenceCandidate: unknown = await import(persistenceModulePath);
    expect(isPersistenceModule(persistenceCandidate)).toBe(true);
    if (!isPersistenceModule(persistenceCandidate)) {
      return;
    }
    const storage = new MemoryStorage();
    storage.setItem("other", "preserved");
    const fallback = { musicEnabled: true, volume: 0.6 };
    const saved = { musicEnabled: false, volume: 0.25 };
    const persistence = persistenceCandidate.createPersistence({
      storage,
      key: "settings",
      fallback,
    });
    persistence.save(saved);

    // When: the persistence value is cleared
    persistence.clear();

    // Then: its load returns the fallback and unrelated storage remains
    expect(persistence.load()).toEqual(fallback);
    expect(storage.values).toEqual(new Map([["other", "preserved"]]));
  });
});
