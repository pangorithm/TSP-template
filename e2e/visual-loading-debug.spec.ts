import { expect, test } from "@playwright/test";

for (const width of [375, 768, 1280]) {
  test(`keeps Loading visible until the game module arrives at ${width}px`, async ({ page }) => {
    // Given: the module response remains pending until the loading assertions finish.
    await page.setViewportSize({ width, height: 900 });
    let releaseModule = () => {};
    const moduleGate = new Promise<void>((resolve) => {
      releaseModule = resolve;
    });
    await page.route("**/assets/config-*.js", async (route) => {
      await moduleGate;
      await route.continue();
    });
    await page.goto("/");

    try {
      // When: startup begins while its module response is held.
      await page.getByRole("button", { name: "Start", exact: true }).click();

      // Then: Loading is announced, covers the viewport, and offers no premature actions.
      const status = page.getByRole("status");
      await expect(status).toHaveText("Loading...");
      await expect(status).toBeVisible();
      await expect(status).toHaveAttribute("aria-live", "polite");
      await expect(page.locator(".startup-status")).toHaveCSS("width", `${width}px`);
      await expect(page.locator(".startup-status")).toHaveCSS("height", "900px");
      await expect(page.getByRole("button")).toHaveCount(0);
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page.locator("canvas")).toHaveCount(0);
    } finally {
      releaseModule();
    }

    // Once the real response arrives, startup completes without another interaction.
    await expect(page.locator("#game-container canvas")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(page.locator(".startup-status")).toHaveCount(0);
  });
}
