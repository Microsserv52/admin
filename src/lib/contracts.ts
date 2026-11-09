import { z } from "zod";

export const imageSchema = z.object({
  url: z.string().refine((value) => {
    if (
      /^\/(media|api\/products)\/[^\\\\]*$/.test(value) &&
      !value.includes("//")
    )
      return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use an HTTPS image URL or a /media/ path."),
  alt: z.string().trim().min(1).max(200),
  width: z.number().int().positive().max(4096),
  height: z.number().int().positive().max(4096),
});

export const productSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  unit: z.string().min(1),
  image: imageSchema.nullish(),
});
export const productsSchema = z.array(productSchema);
export type Product = z.infer<typeof productSchema>;
export const accountSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  roles: z.string(),
  enabled: z.boolean(),
});
export const accountsSchema = z.array(accountSchema);
export type Account = z.infer<typeof accountSchema>;
export const orderSchema = z.object({
  id: z.uuid(),
  date: z.string().regex(/(?:Z|[+-]\d{2}:\d{2})$/),
  currency: z.string().default("USD"),
  total: z.number(),
  items: z.array(
    z.object({
      id: z.uuid(),
      productId: z.uuid(),
      quantity: z.number().int().positive(),
      total: z.number(),
    }),
  ),
});
export const ordersSchema = z.array(orderSchema);
export type Order = z.infer<typeof orderSchema>;
export const cartSchema = z
  .array(z.object({ id: z.uuid(), quantity: z.number().int().min(1).max(999) }))
  .max(100);
export type CartLine = z.infer<typeof cartSchema>[number];
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Enter your password."),
});
export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(1, "Enter your name.").max(100),
  password: z.string().min(8, "Use at least 8 characters.").max(128),
});
export const newProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a product name.")
    .max(150, "Use at most 150 characters."),
  price: z
    .number({ error: "Enter a USD price." })
    .positive("Enter a price greater than zero."),
  unit: z
    .string()
    .trim()
    .min(1, "Enter a unit, such as kg or item.")
    .max(30, "Use at most 30 characters."),
});
