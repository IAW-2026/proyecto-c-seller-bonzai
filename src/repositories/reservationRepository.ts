import { prisma } from "../lib/prisma";
import type { Reservation, Prisma } from "@prisma/client";
import { ReservationStatus } from "@prisma/client";

export async function createReservation(data: {
  productId: string;
  buyerId: string;
  quantity: number;
  orderId?: string;
  status: ReservationStatus;
  expiresAt: Date;
}): Promise<Reservation> {
  return prisma.reservation.create({ data });
}

export async function createReservationWithStockDecrement(
  productId: string,
  buyerId: string,
  quantity: number,
  orderId: string,
  expiresAt: Date,
): Promise<Reservation> {
  return prisma.$transaction(async (tx) => {
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
      },
    });
  });
}

export async function findReservationById(id: string): Promise<Reservation | null> {
  return prisma.reservation.findUnique({ where: { id } });
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

export async function cancelReservation(id: string): Promise<Reservation> {
  return prisma.reservation.update({
    where: { id },
    data: { status: ReservationStatus.CANCELLED },
  });
}

export async function cancelReservationWithStockIncrement(id: string): Promise<Reservation> {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id } });
    if (!reservation) throw new Error("RESERVATION_NOT_FOUND");

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
    } catch {
      // saltar reservas que ya fueron procesadas
    }
  }

  return released;
}
