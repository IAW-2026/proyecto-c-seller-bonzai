import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireAdminOrServiceKey } from "../../../../../../lib/auth-helpers";
import { ReservationStatus } from "@prisma/client";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrServiceKey(_req);

    const { id } = await context.params;

    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return NextResponse.json({ error: "RESERVATION_NOT_FOUND", message: "Reservation not found." }, { status: 404 });
    }

    if (reservation.status !== "ACTIVE") {
      return NextResponse.json({ error: "INVALID_STATUS", message: "Reservation is not active." }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: reservation.productId },
        data: { stock: { increment: reservation.quantity } },
      });

      await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.CANCELLED },
      });
    });

    return NextResponse.json({ success: true, reservationId: id, newStatus: "CANCELLED" });
  } catch (error: any) {
    console.error("[admin/reservations/release]", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
