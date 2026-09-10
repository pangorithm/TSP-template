import { expect, type Request, test } from "@playwright/test";

function isJavaScriptRequest(request: Request): boolean {
  return request.resourceType() === "script" && new URL(request.url()).pathname.endsWith(".js");
}

test("starts the lazy-loaded game from the production menu", async ({ page }) => {
  const javaScriptRequests: string[] = [];
  const runtimeErrors: string[] = [];

  page.on("request", (request) => {
    if (isJavaScriptRequest(request)) javaScriptRequests.push(request.url());
  });
  page.on("pageerror", (error) => runtimeErrors.push(`Page error: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`Console error: ${message.text()}`);
  });

  await test.step("Given the production menu has loaded", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "TSP Template" })).toBeVisible();
  });

  const startButton = page.getByRole("button", { name: "Start" });
  await test.step("Then the menu is interactive before Phaser is requested", async () => {
    await expect(startButton).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(javaScriptRequests).toHaveLength(1);
  });

  const initialJavaScriptRequests = new Set(javaScriptRequests);
  const lazyJavaScriptRequest = page.waitForRequest(
    (request) => isJavaScriptRequest(request) && !initialJavaScriptRequests.has(request.url()),
  );

  await test.step("When the user starts the game", async () => {
    await startButton.click();
  });

  await test.step("Then Phaser loads and renders without runtime errors", async () => {
    const lazyRequest = await lazyJavaScriptRequest;
    await expect(page.locator("#game-container canvas")).toBeVisible();
    expect(javaScriptRequests).toContain(lazyRequest.url());
    expect(javaScriptRequests.length).toBeGreaterThan(initialJavaScriptRequests.size);
    expect(runtimeErrors).toEqual([]);
  });
});

test("reloads after the lazy game module request fails", async ({ page }) => {
  await test.step("Given the first lazy game module request will fail", async () => {
    await page.route("**/assets/config-*.js", (route) => route.abort(), { times: 1 });
    await page.goto("/");
  });

  await test.step("When the user starts the game", async () => {
    await page.getByRole("button", { name: "Start" }).click();
  });

  await test.step("Then the startup error offers a document reload", async () => {
    await expect(page.getByRole("alert")).toHaveText("Unable to start the game.");
    await page.getByRole("button", { name: "Reload" }).click();
    await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
  });

  await test.step("When the user starts again after reload", async () => {
    await page.getByRole("button", { name: "Start" }).click();
  });

  await test.step("Then the game module loads in the fresh document", async () => {
    await expect(page.locator("#game-container canvas")).toBeVisible();
  });
});
