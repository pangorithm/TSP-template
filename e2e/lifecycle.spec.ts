import { expect, test } from "@playwright/test";
import { build } from "vite";

let harness = "";

test.beforeAll(async () => {
  const result = await build({
    build: {
      write: false,
      minify: false,
      rollupOptions: {
        input: "e2e/fixtures/lifecycle.tsx",
        output: { inlineDynamicImports: true },
      },
    },
  });
  if (!("output" in result)) throw new Error("Expected a single harness bundle");
  const entry = result.output.find((output) => output.type === "chunk" && output.isEntry);
  if (entry?.type !== "chunk") throw new Error("Missing harness entry");
  harness = entry.code;
});

test("destroys the real sleeping Phaser instance on App disposal", async ({ page }) => {
  await test.step("Given an App running the real game factory", async () => {
    await page.route("**/lifecycle-harness.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: harness,
      }),
    );
    await page.route("**/lifecycle-harness", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<html><body><script type="module" src="/lifecycle-harness.js"></script></body></html>',
      }),
    );
    await page.goto("/lifecycle-harness");
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await expect(page.locator("canvas")).toHaveCount(1);
  });
  await test.step("When App is disposed while its loop is sleeping", async () => {
    await page.locator("#dispose-game").evaluate((element) => {
      if (element instanceof HTMLButtonElement) element.click();
    });
  });
  await test.step("Then Phaser finishes destruction rather than leaving it pending", async () => {
    await expect(page.locator("body")).toHaveAttribute("data-sleeping", "true");
    await expect(page.locator("body")).toHaveAttribute("data-destroyed", "true");
    await expect(page.locator("body")).toHaveAttribute("data-canvas-removed", "true");
  });
});
