import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().min(1, "productId es obligatorio"),
  name: z.string().min(1, "name es obligatorio"),
  quantity: z.number().int().positive("quantity debe ser mayor a cero"),
  price: z.number().positive("price debe ser mayor a cero"),
});

export const createOrderSchema = z.object({
  orderId: z.string().min(1, "orderId es obligatorio").optional(),
  buyerId: z.string().min(1, "buyerId es obligatorio"),
  items: z.array(orderItemSchema).min(1, "La orden debe tener al menos un item"),
  status: z.string().optional(),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
