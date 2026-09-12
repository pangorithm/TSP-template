import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const workflowDirectory = join(repositoryRoot, ".github", "workflows");
const workflowFiles = readdirSync(workflowDirectory).filter(
  (fileName) => fileName.endsWith(".yml") || fileName.endsWith(".yaml"),
);
const workflowSource = workflowFiles
  .map((fileName) => readFileSync(join(workflowDirectory, fileName), "utf8"))
  .join("\n");
const playwrightSource = readFileSync(join(repositoryRoot, "playwright.config.ts"), "utf8");
const gitignoreSource = readFileSync(join(repositoryRoot, ".gitignore"), "utf8");

function thirdPartyActionUses(source: string): readonly string[] {
  return Array.from(source.matchAll(/^\s*-\s+uses:\s*([^\s#]+)/gmu), ([, action]) => action).filter(
    (action): action is string => action !== undefined && !action.startsWith("./"),
  );
}

describe("continuous integration contracts", () => {
  it("pins every third-party action to an immutable commit", () => {
    // Given: all repository-owned GitHub Actions workflows
    const actions = thirdPartyActionUses(workflowSource);

    // When: mutable action references are selected
    const mutableActions = actions.filter((action) => !/@[0-9a-f]{40}$/u.test(action));

    // Then: no tag or branch can silently change CI behavior
    expect(actions.length).toBeGreaterThan(0);
    expect(mutableActions).toEqual([]);
  });

  it("runs the browser contracts in Chromium and WebKit", () => {
    expect(playwrightSource).toContain('name: "chromium"');
    expect(playwrightSource).toContain('name: "webkit"');
    expect(workflowSource).toContain("playwright install --with-deps chromium webkit");
  });

  it("covers supply-chain and SBOM checks", () => {
    expect(workflowSource).toContain("rust-supply-chain:");
    expect(workflowSource).toContain("cargo install cargo-audit --version 0.22.2 --locked");
    expect(workflowSource).toContain("cargo install cargo-deny --version 0.20.2 --locked");
    expect(workflowSource).toContain("cargo audit --file src-tauri/Cargo.lock");
    expect(workflowSource).toMatch(/cargo deny .*check bans licenses sources/u);
    expect(workflowSource).toContain("syft-version: v1.51.1");
    expect(workflowSource).toContain("sbom-action");
    expect(workflowSource).toContain("sbom.spdx.json");
  });

  it("builds native desktop targets on every hosted desktop platform", () => {
    expect(workflowSource).toContain("desktop:");
    expect(workflowSource).toContain("ubuntu-latest");
    expect(workflowSource).toContain("windows-latest");
    expect(workflowSource).toContain("macos-latest");
    expect(workflowSource).toContain("bun run tauri -- build --no-bundle");
  });

  it("installs native Tauri libraries before the standalone Linux Rust tests", () => {
    // Given: the standalone Rust job that links the Tauri library on Linux.
    const rustJobSource = workflowSource.split("\n  rust-supply-chain:")[0]?.split("\n  rust:")[1];

    // When: its setup steps are inspected.
    // Then: the WebKit and application-indicator development libraries are installed.
    expect(rustJobSource).toContain("libwebkit2gtk-4.1-dev");
    expect(rustJobSource).toContain("libayatana-appindicator3-dev");
  });

  it("initializes and compiles both hosted mobile targets", () => {
    expect(workflowSource).toContain("android:");
    expect(workflowSource).toContain("bun run tauri -- android init --ci");
    expect(workflowSource).toContain(
      "bun run tauri -- android build --debug --apk --target aarch64 --ci",
    );
    expect(workflowSource).toContain("ios:");
    expect(workflowSource).toContain("bun run tauri -- ios init --ci");
    expect(workflowSource).toContain(
      "bun run tauri -- ios build --debug --target aarch64-sim --ci",
    );
    expect(gitignoreSource).toContain("src-tauri/gen/");
  });
});
