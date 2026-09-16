import { test, expect } from "@playwright/test";
test("demo cockpit explains itself and is responsive", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Your local AI stack/i }),
  ).toBeVisible();
  await expect(page.getByText(/NO CLOUD.*NO TELEMETRY/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Demo Mode" })).toBeVisible();
  await expect(page.getByLabel("Model")).toHaveValue("qwen3.5:9b");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText("LOCAL CHAT")).toBeVisible();
});
