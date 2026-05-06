import { z } from "zod";

export const confirmPaymentSchema = z.object({
  transactionId: z.string().min(1, "transactionId es obligatorio"),
  status: z.string().optional(),
  paidAt: z.string().datetime().optional(),
});

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
