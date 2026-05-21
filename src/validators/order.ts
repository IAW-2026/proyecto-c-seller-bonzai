import { z } from "zod";

export const createOrderSchema = z.object({
  orderId: z.string().min(1, "orderId es obligatorio").optional(),
  buyerId: z.string().min(1, "buyerId es obligatorio"),
  reservationIds: z.array(z.string().min(1)).min(1, "La orden debe tener al menos una reserva"),
  status: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
