export type StoragePort = {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
};

export type PersistenceCodec<T> = {
  readonly decode: (serialized: string) => T | undefined;
  readonly encode: (value: T) => string;
};

export type PersistenceOptions<T> = {
  readonly codec?: PersistenceCodec<T>;
  readonly fallback: T;
  readonly key: string;
  readonly storage: StoragePort;
};

export type Persistence<T> = {
  readonly load: () => T;
  readonly save: (value: T) => void;
};

function decodeJson<T>(serialized: string): T | undefined {
  try {
    return JSON.parse(serialized);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return undefined;
    }
    throw error;
  }
}

export function createPersistence<T>(options: PersistenceOptions<T>): Persistence<T> {
  return {
    load: () => {
      const serialized = options.storage.getItem(options.key);
      if (serialized === null) {
        return options.fallback;
      }

      const decoded = options.codec
        ? options.codec.decode(serialized)
        : decodeJson<T>(serialized);

      return decoded ?? options.fallback;
    },
    save: (value) => {
      options.storage.setItem(
        options.key,
        options.codec?.encode(value) ?? JSON.stringify(value),
      );
    },
  };
}
