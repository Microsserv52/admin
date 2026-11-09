import { test, expect } from "@playwright/test";
import { mockApi } from "./fixtures";
test("ordinary users are shown an access-denied state", async ({ page }) => {
  await mockApi(page, "user");
  await page.goto("/admin/");
  await expect(
    page.getByText("This area is for administrators."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create demo product" }),
  ).toHaveCount(0);
});
test("admin product creation validates and deletion can be cancelled", async ({
  page,
}) => {
  await mockApi(page, "admin");
  await page.goto("/admin/products/");
  await expect(page.getByText("Fixture Tea", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Create demo product", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page
    .getByRole("button", { name: "Delete", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("cannot be undone");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
