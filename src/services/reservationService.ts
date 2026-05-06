import * as productRepo from "../repositories/productRepository";
import * as reservationRepo from "../repositories/reservationRepository";
import { ReservationStatus } from "@prisma/client";

export async function createReservation(productId: string, quantity: number, orderId: string, buyerId: string) {
  const product = await productRepo.findProductById(productId);

  if (!product) {
    return { success: false, error: "PRODUCT_NOT_FOUND", message: "El producto no existe.", status: 404 };
  }

  if (!product.isActive) {
    return { success: false, error: "PRODUCT_INACTIVE", message: "El producto no está disponible.", status: 409 };
  }

  if (product.stock <= 0) {
    return { success: false, error: "OUT_OF_STOCK", message: "No hay stock disponible para este producto.", status: 409 };
  }

  if (product.stock < quantity) {
    return { success: false, error: "INSUFFICIENT_STOCK", message: "La cantidad solicitada supera el stock disponible.", status: 409 };
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const reservation = await reservationRepo.createReservationWithStockDecrement(
    productId,
    buyerId,
    quantity,
    orderId,
    expiresAt,
  );

  return {
    success: true,
    reservationId: reservation.id,
    expiresAt: expiresAt.toISOString(),
    status: 201,
  };
}

export async function cancelReservation(reservationId: string) {
  const reservation = await reservationRepo.findReservationById(reservationId);

  if (!reservation) {
    return { success: false, error: "RESERVATION_NOT_FOUND", message: "La reserva no existe.", status: 404 };
  }

  if (reservation.status !== ReservationStatus.ACTIVE) {
    return { success: false, error: "RESERVATION_ALREADY_FINALIZED", message: "La reserva ya fue consumida, cancelada o expirada.", status: 409 };
  }

  await reservationRepo.cancelReservationWithStockIncrement(reservationId);

  return { success: true };
}

export async function releaseExpiredReservations() {
  return reservationRepo.releaseExpiredReservationsInBatch();
}
