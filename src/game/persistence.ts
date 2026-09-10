export type StoragePort = {
  readonly getItem: (key: string) => string | null;
  readonly removeItem: (key: string) => void;
  readonly setItem: (key: string, value: string) => void;
};

export type PersistenceCodec<T> = {
  readonly decode: (serialized: string) => T | undefined;
  readonly encode: (value: T) => string;
};

export type PersistenceOptions<T> = {
  readonly codec: PersistenceCodec<T>;
  readonly fallback: T;
  readonly key: string;
  readonly storage: StoragePort;
};

export type Persistence<T> = {
  readonly clear: () => void;
  readonly hasSavedValue: () => boolean;
  readonly load: () => T;
  readonly save: (value: T) => void;
};

export function createPersistence<T>(options: PersistenceOptions<T>): Persistence<T> {
  return {
    clear: () => {
      options.storage.removeItem(options.key);
    },
    hasSavedValue: () => {
      const serialized = options.storage.getItem(options.key);
      return serialized !== null && options.codec.decode(serialized) !== undefined;
    },
    load: () => {
      const serialized = options.storage.getItem(options.key);
      if (serialized === null) {
        return options.fallback;
      }

      const decoded = options.codec.decode(serialized);

      return decoded === undefined ? options.fallback : decoded;
    },
    save: (value) => {
      options.storage.setItem(options.key, options.codec.encode(value));
    },
  };
}
