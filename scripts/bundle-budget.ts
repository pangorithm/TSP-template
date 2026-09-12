export const EAGER_BUNDLE_BUDGET_BYTES = 24 * 1024;

export type JavaScriptAsset = {
  readonly bytes: number;
  readonly fileName: string;
};

const eagerEntryPattern = /^index-[A-Za-z0-9_-]+\.js$/u;

export function assertEagerBundleBudget(
  assets: readonly JavaScriptAsset[],
  budgetBytes = EAGER_BUNDLE_BUDGET_BYTES,
): void {
  const eagerEntries = assets.filter((asset) => eagerEntryPattern.test(asset.fileName));
  if (eagerEntries.length !== 1) {
    throw new Error(`Expected exactly one eager JavaScript entry, found ${eagerEntries.length}.`);
  }

  const [entry] = eagerEntries;
  if (entry === undefined) {
    return;
  }

  if (entry.bytes > budgetBytes) {
    throw new Error(
      `${entry.fileName} is ${entry.bytes} bytes and exceeds the ${budgetBytes / 1024} KiB budget.`,
    );
  }
}
