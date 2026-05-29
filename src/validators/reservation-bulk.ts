import { z } from "zod";

export const createReservationBulkSchema = z.object({
  buyerId: z.string().min(1, "buyerId es obligatorio"),
  orderId: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "productId es obligatorio"),
        quantity: z.coerce.number().int().positive("quantity debe ser mayor a cero"),
        sellerId: z.string().min(1, "sellerId es obligatorio"),
      })
    )
    .min(1, "Debe incluir al menos un item"),
});

export type CreateReservationBulkInput = z.infer<typeof createReservationBulkSchema>;
