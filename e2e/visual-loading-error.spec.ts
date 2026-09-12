import { expect, test } from "@playwright/test";

for (const width of [375, 768, 1280]) {
  test(`reloads the document after a module failure at ${width}px`, async ({ page }) => {
    // Given: the module cannot load, and a DOM marker identifies this document.
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/assets/config-*.js", (route) => route.abort());
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.dataset["recoveryDocument"] = "original";
    });
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Unable to start the game.");
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry", exact: true })).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);
    const reload = page.getByRole("button", { name: "Reload", exact: true });
    await expect(reload).toBeInViewport();
    await expect(reload).toHaveCSS("min-height", "44px");
    await page.unroute("**/assets/config-*.js");

    // When: the user reloads after the network recovers.
    await reload.click();

    // Then: a new document returns to the menu and can start the real game.
    await expect(page.getByRole("button", { name: "Start", exact: true })).toBeVisible();
    await expect(page.locator("html")).not.toHaveAttribute("data-recovery-document");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await expect(page.locator("#game-container canvas")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(1);
  });

  test(`retries game creation without reloading the document at ${width}px`, async ({ page }) => {
    // Given: a successfully imported module fails only its first factory call.
    await page.setViewportSize({ width, height: 900 });
    let moduleRequests = 0;
    await page.route("**/assets/config-*.js", async (route) => {
      moduleRequests += 1;
      const originalModule = `${route.request().url()}?original`;
      await route.fulfill({
        contentType: "text/javascript",
        body: `
          import { createGame as createRealGame } from ${JSON.stringify(originalModule)};
          let attempts = 0;
          export function createGame(parent) {
            attempts += 1;
            parent.dataset.factoryAttempts = String(attempts);
            if (attempts === 1) throw new Error("Injected factory failure");
            return createRealGame(parent);
          }
        `,
      });
    });
    await page.goto("/");
    await page.evaluate(() => {
      document.documentElement.dataset["recoveryDocument"] = "original";
    });
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Unable to start the game.");
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.locator("#game-container")).toHaveAttribute("data-factory-attempts", "1");
    await expect(page.getByRole("button", { name: "Reload", exact: true })).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);
    const retry = page.getByRole("button", { name: "Retry", exact: true });
    await expect(retry).toBeInViewport();
    await expect(retry).toHaveCSS("min-height", "44px");

    // When: the user retries the retained factory.
    await retry.click();

    // Then: the second call creates one real Phaser canvas in the same document.
    await expect(page.locator("#game-container canvas")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(page.locator("#game-container")).toHaveAttribute("data-factory-attempts", "2");
    await expect(page.locator("html")).toHaveAttribute("data-recovery-document", "original");
    await expect(page.locator(".startup-status")).toHaveCount(0);
    expect(moduleRequests).toBe(1);
  });
}
