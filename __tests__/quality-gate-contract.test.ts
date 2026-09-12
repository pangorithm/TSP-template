import { describe, expect, it } from "vitest";

import packageManifest from "../package.json";

describe("aggregate web quality gate", () => {
  it("runs the declared dependency audit", () => {
    // Given: the package scripts consumed by local development and CI
    const scripts: Readonly<Record<string, string>> = packageManifest.scripts;

    // When: the aggregate quality command is inspected
    const auditCommand = scripts["audit"];
    const checkCommand = scripts["check"];

    // Then: the aggregate gate invokes the declared audit command
    expect({ auditCommand, checkCommand }).toEqual({
      auditCommand: "bun audit",
      checkCommand:
        "bun run audit && bun run format:check && bun run lint && bun run typecheck && bun run test",
    });
  });
});
