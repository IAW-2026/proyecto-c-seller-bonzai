import { prisma } from "../lib/prisma";
import type { Reservation } from "@prisma/client";
import { ReservationStatus } from "@prisma/client";

export async function createReservation(data: {
  productId: string;
  buyerId: string;
  quantity: number;
  orderId?: string;
  status: ReservationStatus;
  expiresAt: Date;
  sellerId?: string;
}): Promise<Reservation> {
  return prisma.reservation.create({ data });
}

export async function createReservationsBulk(
  items: { productId: string; buyerId: string; quantity: number; sellerId: string; expiresAt: Date; orderId: string }[],
): Promise<Reservation[]> {
  return prisma.$transaction(async (tx) => {
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stock: true },
      });
      if (!product) throw new Error("PRODUCT_NOT_FOUND");
      if (product.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK");

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    const reservations = await Promise.all(
      items.map((item) =>
        tx.reservation.create({
          data: {
            productId: item.productId,
            buyerId: item.buyerId,
            quantity: item.quantity,
            orderId: item.orderId,
            sellerId: item.sellerId,
            status: ReservationStatus.ACTIVE,
            expiresAt: item.expiresAt,
          },
        })
      ),
    );

    return reservations;
  });
}

export async function createReservationWithStockDecrement(
  productId: string,
  buyerId: string,
  quantity: number,
  orderId: string,
  expiresAt: Date,
  sellerId?: string,
): Promise<Reservation> {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { stock: true, isActive: true, suspended: true },
    });
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    if (!product.isActive) throw new Error("PRODUCT_INACTIVE");
    if (product.suspended) throw new Error("PRODUCT_SUSPENDED");
    if (product.stock < quantity) throw new Error("INSUFFICIENT_STOCK");

    await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    return tx.reservation.create({
      data: {
        productId,
        buyerId,
        quantity,
        orderId,
        status: ReservationStatus.ACTIVE,
        expiresAt,
        sellerId,
      },
    });
  });
}

export async function findReservationById(id: string): Promise<Reservation | null> {
  return prisma.reservation.findUnique({ where: { id } });
}

export async function findReservationsByIds(ids: string[]): Promise<Reservation[]> {
  return prisma.reservation.findMany({
    where: { id: { in: ids } },
  });
}

export async function findActiveReservationByProductAndBuyer(productId: string, buyerId: string): Promise<Reservation | null> {
  return prisma.reservation.findFirst({
    where: {
      productId,
      buyerId,
      status: ReservationStatus.ACTIVE,
    },
  });
}

export async function cancelReservationWithStockIncrement(id: string): Promise<Reservation> {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id } });
    if (!reservation) throw new Error("RESERVATION_NOT_FOUND");
    if (reservation.status !== ReservationStatus.ACTIVE) throw new Error("RESERVATION_ALREADY_FINALIZED");

    await tx.product.update({
      where: { id: reservation.productId },
      data: { stock: { increment: reservation.quantity } },
    });

    return tx.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CANCELLED },
    });
  });
}

export async function findExpiredActiveReservations(): Promise<Reservation[]> {
  return prisma.reservation.findMany({
    where: {
      status: ReservationStatus.ACTIVE,
      expiresAt: { lt: new Date() },
    },
  });
}

export async function consumeReservation(id: string): Promise<Reservation> {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) throw new Error("RESERVATION_NOT_FOUND");
  if (reservation.status !== ReservationStatus.ACTIVE) throw new Error("RESERVATION_ALREADY_FINALIZED");

  return prisma.reservation.update({
    where: { id },
    data: { status: ReservationStatus.COMPLETED },
  });
}

export async function releaseExpiredReservationsInBatch(): Promise<number> {
  const expired = await findExpiredActiveReservations();

  let released = 0;
  for (const reservation of expired) {
    try {
      await cancelReservationWithStockIncrement(reservation.id);
      released++;
    } catch (err) {
      console.error("[releaseExpiredReservationsInBatch]", err);
    }
  }

  return released;
}
