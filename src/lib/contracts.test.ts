import { describe, expect, it, vi, afterEach } from "vitest";
import { cartSchema, orderSchema, productSchema } from "./contracts";
import { api, ApiError } from "./api";
import { z } from "zod";

afterEach(() => vi.unstubAllGlobals());
const id = "00000000-0000-4000-8000-000000000001";
describe("service contracts", () => {
  it("rejects invalid quantities recovered from browser storage", () => {
    for (const quantity of [0, -1, 1.5, 1000])
      expect(cartSchema.safeParse([{ id, quantity }]).success).toBe(false);
    expect(cartSchema.parse([{ id, quantity: 2 }])).toEqual([
      { id, quantity: 2 },
    ]);
  });
  it("rejects unsupported product payloads and ambiguous timestamps", () => {
    expect(
      productSchema.safeParse({
        id,
        name: "Fixture",
        unit: "item",
        price: "12",
      }).success,
    ).toBe(false);
    expect(
      orderSchema.safeParse({
        id,
        date: "2026-11-09T10:00:00",
        total: 2,
        items: [],
      }).success,
    ).toBe(false);
  });
});
describe("API boundary", () => {
  it("classifies expired sessions without retrying", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetch);
    await expect(api("/session", z.unknown())).rejects.toMatchObject({
      status: 401,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("sends the CSRF token before a mutation and accepts a 204 response", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ token: "test-token", headerName: "X-XSRF-TOKEN" }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    await api("/session/login", z.undefined(), {
      method: "POST",
      body: JSON.stringify({
        email: "fixture@example.test",
        password: "demo-password",
      }),
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(
      new Headers(fetch.mock.calls[1][1].headers).get("X-XSRF-TOKEN"),
    ).toBe("test-token");
    expect(fetch.mock.calls[1][1].credentials).toBe("include");
  });
  it("rejects a successful status carrying an invalid response contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ id: "invalid" })),
    );
    await expect(api("/products/" + id, productSchema)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
