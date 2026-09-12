import { describe, expect, it } from "vitest";
import {
  assertEagerBundleBudget,
  EAGER_BUNDLE_BUDGET_BYTES,
  type JavaScriptAsset,
} from "../scripts/bundle-budget";

const lazyGameChunk: JavaScriptAsset = {
  fileName: "config-example.js",
  bytes: 1_500_000,
};

describe("eager web bundle budget", () => {
  it("accepts the host entry at the inclusive limit without constraining lazy game code", () => {
    const assets: readonly JavaScriptAsset[] = [
      { fileName: "index-example.js", bytes: EAGER_BUNDLE_BUDGET_BYTES },
      lazyGameChunk,
    ];

    expect(() => assertEagerBundleBudget(assets)).not.toThrow();
  });

  it("rejects an oversized eager host entry", () => {
    const assets: readonly JavaScriptAsset[] = [
      { fileName: "index-example.js", bytes: EAGER_BUNDLE_BUDGET_BYTES + 1 },
      lazyGameChunk,
    ];

    expect(() => assertEagerBundleBudget(assets)).toThrow(/exceeds.*24 KiB/iu);
  });

  it("requires exactly one eager host entry", () => {
    expect(() => assertEagerBundleBudget([lazyGameChunk])).toThrow(/exactly one/iu);
  });
});
