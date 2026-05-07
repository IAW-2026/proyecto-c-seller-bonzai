import { z } from "zod";

export const createReservationSchema = z.object({
  productId: z.string().min(1, "productId es obligatorio"),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a cero"),
  orderId: z.string().min(1, "orderId es obligatorio"),
  buyerId: z.string().min(1, "buyerId es obligatorio"),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
