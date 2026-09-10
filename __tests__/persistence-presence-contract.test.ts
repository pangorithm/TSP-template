import { describe, expect, it } from "vitest";
import {
  createPersistence,
  type PersistenceCodec,
  type StoragePort,
} from "../src/game/persistence";

class MemoryStorage implements StoragePort {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const codec: PersistenceCodec<string> = {
  decode: (serialized) => {
    if (serialized === "valid" || serialized === "malformed-but-accepted") {
      return "decoded";
    }
    return undefined;
  },
  encode: (value) => value,
};

function createTestPersistence(storage: StoragePort) {
  return createPersistence({
    storage,
    key: "value",
    fallback: "fallback",
    codec,
  });
}

describe("persistence saved-value presence", () => {
  it("returns false for empty storage", () => {
    // Given: persistence backed by storage without its key
    const persistence = createTestPersistence(new MemoryStorage());

    // When: saved-value presence is checked
    const hasSavedValue = persistence.hasSavedValue();

    // Then: no saved value is reported
    expect(hasSavedValue).toBe(false);
  });

  it("returns true for a stored value accepted by the codec", () => {
    // Given: storage contains a representation the codec decodes
    const storage = new MemoryStorage();
    storage.setItem("value", "valid");
    const persistence = createTestPersistence(storage);

    // When: saved-value presence is checked
    const hasSavedValue = persistence.hasSavedValue();

    // Then: an accepted saved value is reported
    expect(hasSavedValue).toBe(true);
  });

  it("returns false for a stored value rejected by the codec", () => {
    // Given: storage contains a representation the codec declines
    const storage = new MemoryStorage();
    storage.setItem("value", "rejected");
    const persistence = createTestPersistence(storage);

    // When: saved-value presence is checked
    const hasSavedValue = persistence.hasSavedValue();

    // Then: an unusable saved value is not reported
    expect(hasSavedValue).toBe(false);
  });

  it("delegates malformed representations to the codec", () => {
    // Given: a malformed representation that this neutral codec accepts
    const storage = new MemoryStorage();
    storage.setItem("value", "malformed-but-accepted");
    const persistence = createTestPersistence(storage);

    // When: saved-value presence is checked
    const hasSavedValue = persistence.hasSavedValue();

    // Then: presence follows codec acceptance without schema coupling
    expect(hasSavedValue).toBe(true);
  });
});
