import { z } from "zod";

export const cancelOrderSchema = z.object({
  reason: z.string().min(1, "reason es obligatorio"),
});

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
