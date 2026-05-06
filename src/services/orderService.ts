import * as orderRepo from "../repositories/orderRepository";
import * as productRepo from "../repositories/productRepository";
import type { Prisma } from "@prisma/client";

export async function createOrder(orderId: string, buyerId: string, items: { productId: string; name: string; quantity: number; price: number }[], status?: string) {
  const existing = await orderRepo.findOrderById(orderId);
  if (existing) {
    return { success: false, error: "ORDER_ALREADY_EXISTS", message: "La orden ya fue registrada previamente en el contexto del seller.", status: 409 };
  }

  let sellerId: string | null = null;
  const orderItems: Prisma.OrderItemCreateManyOrderInput[] = [];

  for (const item of items) {
    const product = await productRepo.findProductById(item.productId);
    if (!product) {
      return { success: false, error: "PRODUCT_NOT_FOUND", message: `El producto ${item.productId} no existe.`, status: 404 };
    }

    if (!sellerId) {
      sellerId = product.sellerId;
    }

    orderItems.push({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    });
  }

  if (!sellerId) {
    return { success: false, error: "SELLER_NOT_FOUND", message: "No existe un vendedor asociado a la orden indicada.", status: 404 };
  }

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  await orderRepo.createOrder({
    id: orderId,
    buyerId,
    sellerId,
    status: status || "PAID",
    total,
    items: {
      create: orderItems,
    },
  });

  return { success: true, status: 201 };
}

export async function cancelOrder(orderId: string) {
  const order = await orderRepo.findOrderById(orderId);

  if (!order) {
    return { success: false, error: "ORDER_NOT_FOUND", message: "La orden indicada no existe en el contexto del seller.", status: 404 };
  }

  if (order.status === "CANCELLED") {
    return { success: false, error: "ORDER_ALREADY_CANCELLED", message: "La orden ya fue cancelada previamente.", status: 409 };
  }

  await orderRepo.updateOrderStatus(orderId, "CANCELLED");

  return { success: true };
}

export async function confirmPayment(orderId: string, transactionId: string, paidAt?: string) {
  const order = await orderRepo.findOrderById(orderId);

  if (!order) {
    return { success: false, error: "ORDER_NOT_FOUND", message: "No existe una orden con ese orderId.", status: 404 };
  }

  if (order.status === "CANCELLED") {
    return { success: false, error: "ORDER_CANCELLED", message: "La orden fue cancelada y no puede recibir pago.", status: 409 };
  }

  const paidAtDate = paidAt ? new Date(paidAt) : new Date();

  await orderRepo.confirmPayment(orderId, transactionId, paidAtDate);

  return {
    success: true,
    orderId,
    newStatus: "PAID",
  };
}

export async function getOrdersByBuyer(buyerId: string) {
  const orders = await orderRepo.findOrdersByBuyerId(buyerId);

  return {
    orders: orders.map((order) => ({
      orderId: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      items: order.items || [],
      trackingId: null,
    })),
  };
}
