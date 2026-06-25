import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "name es obligatorio"),
  description: z.string().optional(),
  price: z.number().positive("price debe ser mayor a cero"),
  stock: z.number().int().nonnegative("stock no puede ser negativo"),
  sellerId: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  isFragile: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  isFragile: z.boolean().optional(),
  isActive: z.boolean().optional(),
  suspended: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
