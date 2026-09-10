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
    readonly codec: PersistenceCodec<T>;
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

type Settings = {
  readonly musicEnabled: boolean;
  readonly volume: number;
};

function isSettings(value: unknown): value is Settings {
  return (
    typeof value === "object" &&
    value !== null &&
    "musicEnabled" in value &&
    typeof value.musicEnabled === "boolean" &&
    "volume" in value &&
    typeof value.volume === "number"
  );
}

function decodeSettings(serialized: string): Settings | undefined {
  try {
    const value: unknown = JSON.parse(serialized);
    return isSettings(value) ? value : undefined;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return undefined;
    }
    throw error;
  }
}

const settingsCodec: PersistenceCodec<Settings> = {
  decode: decodeSettings,
  encode: (value) => JSON.stringify(value),
};

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
      codec: settingsCodec,
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
      codec: settingsCodec,
    });
    const saved = { musicEnabled: false, volume: 0.25 };

    // When: a typed value is saved and loaded
    persistence.save(saved);
    const loaded = persistence.load();

    // Then: the codec serializes and restores the complete typed value
    expect(loaded).toEqual(saved);
  });

  it("uses the fallback when the codec rejects invalid syntax", async () => {
    // Given: persistence with invalid serialized JSON and a validating codec
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
      codec: settingsCodec,
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
        encode: settingsCodec.encode,
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
        encode: settingsCodec.encode,
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
      codec: settingsCodec,
    });
    persistence.save(saved);

    // When: the persistence value is cleared
    persistence.clear();

    // Then: its load returns the fallback and unrelated storage remains
    expect(persistence.load()).toEqual(fallback);
    expect(storage.values).toEqual(new Map([["other", "preserved"]]));
  });

  it("uses the fallback when the validating codec rejects a wrong-shaped value", async () => {
    // Given: storage containing valid JSON that is not settings data
    const persistenceCandidate: unknown = await import(persistenceModulePath);
    expect(isPersistenceModule(persistenceCandidate)).toBe(true);
    if (!isPersistenceModule(persistenceCandidate)) {
      return;
    }
    const storage = new MemoryStorage();
    storage.setItem("settings", "42");
    const fallback = { musicEnabled: true, volume: 0.6 };
    const persistence = persistenceCandidate.createPersistence({
      storage,
      key: "settings",
      fallback,
      codec: settingsCodec,
    });

    // When: the wrong-shaped stored value is loaded
    const loaded = persistence.load();

    // Then: callers receive the typed fallback instead of arbitrary JSON
    expect(loaded).toEqual(fallback);
  });

  it("preserves null when the codec accepts it", async () => {
    // Given: nullable persistence with a codec that accepts a stored null
    const persistenceCandidate: unknown = await import(persistenceModulePath);
    expect(isPersistenceModule(persistenceCandidate)).toBe(true);
    if (!isPersistenceModule(persistenceCandidate)) {
      return;
    }
    const storage = new MemoryStorage();
    storage.setItem("settings", "null");
    const fallback: Settings = { musicEnabled: true, volume: 0.6 };
    const nullableCodec: PersistenceCodec<Settings | null> = {
      decode: (serialized) => (serialized === "null" ? null : settingsCodec.decode(serialized)),
      encode: (value) => (value === null ? "null" : settingsCodec.encode(value)),
    };
    const persistence = persistenceCandidate.createPersistence<Settings | null>({
      storage,
      key: "settings",
      fallback,
      codec: nullableCodec,
    });

    // When: the codec decodes the persisted null
    const loaded = persistence.load();

    // Then: null is returned rather than replaced with the fallback
    expect(loaded).toBeNull();
  });

  it("stores the serialized string produced by the codec", async () => {
    // Given: typed persistence with the validating codec
    const persistenceCandidate: unknown = await import(persistenceModulePath);
    expect(isPersistenceModule(persistenceCandidate)).toBe(true);
    if (!isPersistenceModule(persistenceCandidate)) {
      return;
    }
    const storage = new MemoryStorage();
    const persistence = persistenceCandidate.createPersistence({
      storage,
      key: "settings",
      fallback: { musicEnabled: true, volume: 0.6 },
      codec: settingsCodec,
    });

    // When: a value is saved
    persistence.save({ musicEnabled: false, volume: 0.25 });

    // Then: storage receives the codec's serialized string
    expect(storage.getItem("settings")).toBe('{"musicEnabled":false,"volume":0.25}');
  });
});
