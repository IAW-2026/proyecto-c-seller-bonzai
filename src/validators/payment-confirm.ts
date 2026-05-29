import { z } from "zod";

export const confirmPaymentSchema = z.object({
  buyerId: z.string().min(1, "buyerId es obligatorio"),
  orderIds: z.array(z.string().min(1)).min(1, "Debe incluir al menos un orderId"),
  transactionId: z.string().min(1, "transactionId es obligatorio"),
  paidAt: z.string().datetime().optional(),
});

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
