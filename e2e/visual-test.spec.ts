import { expect, test } from "@playwright/test";

for (const width of [375, 768, 1280]) {
  test(`centers an accessible menu at ${width}px`, async ({ page }) => {
    // Given: a supported mobile, tablet, or desktop viewport.
    await page.setViewportSize({ width, height: 900 });

    // When: the default menu is opened.
    await page.goto("/");

    // Then: its title and touch target fit the viewport and remain centered.
    const title = page.getByRole("heading", { name: "TSP Template", level: 1 });
    const start = page.getByRole("button", { name: "Start", exact: true });
    await expect(title).toBeInViewport({ ratio: 1 });
    await expect(start).toBeInViewport({ ratio: 1 });
    await expect(start).toHaveCSS("width", `${width === 375 ? 327 : 120}px`);
    await expect(start).toHaveCSS("height", "44px");
    await expect(page.getByRole("button", { name: "Continue", exact: true })).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);
    const titleBox = await title.boundingBox();
    const startBox = await start.boundingBox();
    expect(titleBox).not.toBeNull();
    expect(startBox).not.toBeNull();
    if (titleBox === null || startBox === null) return;
    expect(titleBox.x + titleBox.width / 2).toBeCloseTo(width / 2, 0);
    expect(startBox.x + startBox.width / 2).toBeCloseTo(width / 2, 0);
    expect((titleBox.y + startBox.y + startBox.height) / 2).toBeCloseTo(450, 0);
    expect(titleBox.y + titleBox.height).toBeLessThan(startBox.y);
  });

  test(`starts by keyboard and resizes one canvas from ${width}px`, async ({ page }) => {
    // Given: the initial menu has keyboard focus on Start.
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Start", exact: true })).toBeFocused();

    // When: the focused action is activated with the keyboard.
    await page.keyboard.press("Enter");

    // Then: one real canvas fills the initial viewport and follows later resizing.
    const canvas = page.locator("#game-container canvas");
    await expect(canvas).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(canvas).toHaveCSS("width", `${width}px`);
    await expect(canvas).toHaveCSS("height", "900px");
    await expect(page.locator(".menu")).toHaveCount(0);
    const resizedWidth = width === 375 ? 1280 : 375;
    await page.setViewportSize({ width: resizedWidth, height: 720 });
    await expect(canvas).toHaveCSS("width", `${resizedWidth}px`);
    await expect(canvas).toHaveCSS("height", "720px");
    await expect(canvas).toBeInViewport({ ratio: 1 });
    await expect(page.locator("canvas")).toHaveCount(1);
  });
}
