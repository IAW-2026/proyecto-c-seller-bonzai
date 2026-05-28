import { prisma } from "../lib/prisma";
import type { CreateReviewInput } from "../validators/review";

export async function createReview(sellerId: string, input: CreateReviewInput) {
  return prisma.sellerReview.create({
    data: {
      sellerId,
      rating: input.rating,
      comment: input.comment,
    },
    include: { seller: { select: { email: true } } },
  });
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
  return prisma.sellerReview.delete({ where: { id } });
}
