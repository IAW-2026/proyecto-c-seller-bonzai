import { z } from "zod";

export const createOrderSchema = z.object({
  orderId: z.string().min(1, "orderId es obligatorio").optional(),
  buyerId: z.string().min(1, "buyerId es obligatorio"),
  reservationIds: z.array(z.string().min(1)).min(1, "La orden debe tener al menos una reserva"),
  status: z.string().optional(),
  shippingName: z.string().min(1, "shippingName es obligatorio"),
  shippingLastName: z.string().min(1, "shippingLastName es obligatorio"),
  shippingAddress: z.string().min(1, "shippingAddress es obligatorio"),
  shippingCity: z.string().min(1, "shippingCity es obligatorio"),
  shippingProvince: z.string().min(1, "shippingProvince es obligatorio"),
  shippingZip: z.string().min(1, "shippingZip es obligatorio"),
  shippingPhone: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
