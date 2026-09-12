import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const tauriLibrarySource = readFileSync(join(process.cwd(), "src-tauri", "src", "lib.rs"), "utf8");

describe("Tauri bootstrap contracts", () => {
  it("generates one Tauri context for application startup and configuration tests", () => {
    // Given: the Rust library used by desktop startup and its unit tests.
    // When: compile-time Tauri context expansions are counted.
    const contextExpansions = tauriLibrarySource.match(/tauri::generate_context!/gu) ?? [];

    // Then: one expansion owns platform metadata for every build target.
    expect(contextExpansions).toHaveLength(1);
  });
});
