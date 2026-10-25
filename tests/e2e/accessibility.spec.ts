import { expect, test } from "@playwright/test";

test("reduced-motion topology keeps keyboard access to the existing controls", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("img", { name: /AI topology with \d+ nodes/ }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Demo Mode" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Model")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Message")).toBeFocused();
  await page.keyboard.type("Keyboard fixture");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/^Demo reply:/)).toBeVisible();
  await expect(
    page.getByRole("img", { name: /AI topology with \d+ nodes/ }),
  ).toBeVisible();
});
