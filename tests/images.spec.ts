import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { mockApi, products } from "./fixtures";
import type { Product } from "../src/lib/contracts";

test("admin uploads, replaces, edits alternative text and removes a product image", async ({
  page,
}, testInfo) => {
  await mockApi(page, "admin");
  let product: Product = { ...products[0] };
  let version = 0;
  const png = await readFile("public/brand.png");
  const uploadId = "00000000-0000-4000-8000-000000000555";
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/products" && request.method() === "GET")
      return route.fulfill({ json: [product, products[1]] });
    if (path.includes("/fixture-media-upload/")) {
      expect(request.method()).toBe("PUT");
      expect(request.headers()["content-type"]).toBe("image/png");
      expect(request.headers()["if-none-match"]).toBe("*");
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith("/image/uploads"))
      return route.fulfill({
        json: {
          uploadId,
          uploadHeaders: { "If-None-Match": "*" },
          uploadUrl: new URL(
            "/api/fixture-media-upload/" + uploadId,
            request.url(),
          ).href,
        },
      });
    if (path.endsWith("/image/content"))
      return route.fulfill({ body: png, contentType: "image/png" });
    if (path.endsWith("/image")) {
      if (request.method() === "DELETE") product = { ...product, image: null };
      else if (request.method() === "PATCH")
        product = {
          ...product,
          image: { ...product.image!, alt: request.postDataJSON().alt },
        };
      else
        product = {
          ...product,
          image: {
            url:
              "/api/products/" + product.id + "/image/content?v=" + ++version,
            alt: request.postDataJSON().alt,
            width: 697,
            height: 345,
          },
        };
      return route.fulfill({ json: product });
    }
    return route.fallback();
  });
  await page.goto("/admin/products/");
  const manage = () =>
    page
      .getByRole("row")
      .filter({ hasText: "Fixture Tea" })
      .getByRole("button", { name: "Manage image" });
  await manage().click();
  await expect(page.getByRole("button", { name: "Save image" })).toBeDisabled();
  await page.getByLabel("Image file", { exact: true }).setInputFiles({
    name: "invalid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await expect(
    page.getByText("Choose a JPEG or PNG file up to 5 MB."),
  ).toBeVisible();
  for (const alt of [
    "Project logo upload fixture",
    "Replacement logo fixture",
  ]) {
    await page
      .getByLabel("Image file", { exact: true })
      .setInputFiles("public/brand.png");
    await page.getByLabel("Alternative text", { exact: true }).fill(alt);
    await page.getByRole("button", { name: "Save image", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await manage().click();
    await expect(
      page.getByRole("img", { name: alt, exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page
          .getByRole("img", { name: alt, exact: true })
          .evaluate((element) => (element as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    if (alt === "Project logo upload fixture") {
      const screenshot = testInfo.outputPath("image-dialog.png");
      await page.screenshot({ path: screenshot });
      await testInfo.attach("Image dialog", {
        path: screenshot,
        contentType: "image/png",
      });
    }
  }
  await page
    .getByLabel("Alternative text", { exact: true })
    .fill("Updated alternative text");
  await page.getByRole("button", { name: "Save image", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await manage().click();
  await expect(
    page.getByRole("img", { name: "Updated alternative text", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove image", exact: true }).click();
  await page.getByRole("button", { name: "Keep image", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Confirm removal" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Remove image", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm removal", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await manage().click();
  await expect(
    page.getByRole("img", { name: "Updated alternative text", exact: true }),
  ).toHaveCount(0);
});
