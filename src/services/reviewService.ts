import { prisma } from "../lib/prisma";
import type { CreateReviewInput } from "../validators/review";

export async function createReview(sellerId: string, input: CreateReviewInput) {
  const existing = await prisma.sellerReview.findUnique({ where: { sellerId } });
  if (existing) {
    return { success: false, error: "REVIEW_ALREADY_EXISTS", message: "Ya enviaste una reseña.", status: 409 };
  }

  const review = await prisma.sellerReview.create({
    data: {
      sellerId,
      rating: input.rating,
      comment: input.comment,
    },
    include: { seller: { select: { email: true } } },
  });

  return { success: true, review };
}

export async function getAllReviews(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    prisma.sellerReview.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { seller: { select: { email: true } } },
    }),
    prisma.sellerReview.count(),
  ]);
  return { reviews, total, page, totalPages: Math.ceil(total / limit) };
}

export async function deleteReview(id: string) {
  const existing = await prisma.sellerReview.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "REVIEW_NOT_FOUND", message: "La reseña no existe.", status: 404 };
  }

  await prisma.sellerReview.delete({ where: { id } });
  return { success: true };
}
