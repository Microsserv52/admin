import type { Page } from "@playwright/test";
export const products = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Fixture Tea",
    price: 5,
    unit: "bag",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Fixture Notebook",
    price: 3,
    unit: "item",
  },
];
export async function mockApi(
  page: Page,
  role: "guest" | "user" | "admin" = "guest",
) {
  let accountRole = role;
  const profile = () => ({
    id: "00000000-0000-4000-8000-000000000100",
    name: "Fixture Visitor",
    email: "fixture@example.test",
    roles: accountRole === "admin" ? "ROLE_ADMIN" : "ROLE_USER",
    enabled: true,
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname
      .replace("/api", "")
      .replace(/\/$/, "");
    if (path === "/session/csrf")
      return route.fulfill({
        json: { token: "fixture-csrf", headerName: "X-XSRF-TOKEN" },
      });
    if (path === "/session/login") {
      accountRole = "user";
      return route.fulfill({ status: 204 });
    }
    if (path === "/session")
      return route.fulfill(
        accountRole === "guest" ? { status: 401 } : { json: profile() },
      );
    if (path === "/products" && request.method() === "GET")
      return route.fulfill({ json: products });
    if (path.startsWith("/products/") && request.method() === "GET")
      return route.fulfill({ json: products[0] });
    if (path === "/accounts" && request.method() === "GET")
      return route.fulfill({ json: [profile()] });
    if (path === "/accounts")
      return route.fulfill({ status: 201, json: profile() });
    if (path === "/orders" && request.method() === "GET")
      return route.fulfill({ json: [] });
    if (path === "/orders" || path.startsWith("/orders/"))
      return route.fulfill({
        status: request.method() === "POST" ? 201 : 200,
        json: {
          id: "00000000-0000-4000-8000-000000000200",
          date: "2026-11-09T12:00:00Z",
          currency: "USD",
          total: 5,
          items: [
            {
              id: "00000000-0000-4000-8000-000000000201",
              productId: products[0].id,
              quantity: 1,
              total: 5,
            },
          ],
        },
      });
    return route.fulfill({ status: 204 });
  });
}
