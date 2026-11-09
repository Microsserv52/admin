import { z } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const messages: Record<number, string> = {
  400: "Check the submitted details and try again.",
  401: "Sign in to continue.",
  403: "You do not have permission to do that.",
  404: "This item could not be found.",
  409: "This change conflicts with existing data. Check the details before retrying.",
  422: "This option is not supported.",
  429: "Too many requests. Please try again shortly.",
};
const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
export async function api<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const method = options.method || "GET";
  if (!["GET", "HEAD"].includes(method)) {
    const csrf = await fetch(base + "/session/csrf", {
      credentials: "include",
      cache: "no-store",
      signal: options.signal,
    });
    if (!csrf.ok)
      throw new ApiError(
        csrf.status,
        "Could not prepare a secure request. Try again.",
      );
    const token = z
      .object({ token: z.string(), headerName: z.string() })
      .parse(await csrf.json());
    headers.set(token.headerName, token.token);
    if (options.body) headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(base + path, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      0,
      "The API could not be reached. Check your connection and try again.",
    );
  }
  if (!response.ok)
    throw new ApiError(
      response.status,
      messages[response.status] ||
        "The service is unavailable. Please try again.",
    );
  if (response.status === 204) return schema.parse(undefined);
  const result = schema.safeParse(await response.json());
  if (!result.success)
    throw new ApiError(
      502,
      "The service returned an unexpected response. Please try again later.",
    );
  return result.data;
}
export const money = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
export const date = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone:
      process.env.NEXT_PUBLIC_DISPLAY_TIME_ZONE ||
      Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(value));
