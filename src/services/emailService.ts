import { prisma } from "../lib/prisma";

export async function sendNewOrderEmail(sellerId: string, orderId: string, buyerId: string, items: { productName: string; quantity: number; unitPrice: number; subtotal: number }[], total: number) {
  try {
    const seller = await prisma.sellerProfile.findUnique({ where: { id: sellerId } });
    if (!seller?.email) return;

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_KEY);

    const itemsHtml = items
      .map((i) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #e8ece9">${i.productName}</td><td style="padding:6px 8px;border-bottom:1px solid #e8ece9;text-align:center">${i.quantity}</td><td style="padding:6px 8px;border-bottom:1px solid #e8ece9;text-align:right">$${i.unitPrice.toFixed(2)}</td><td style="padding:6px 8px;border-bottom:1px solid #e8ece9;text-align:right">$${i.subtotal.toFixed(2)}</td></tr>`)
      .join("");

    await resend.emails.send({
      from: "Bonzai Seller <onboarding@resend.dev>",
      to: seller.email,
      subject: `New Order #${orderId.slice(0, 8)}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:2rem">
          <div style="border-left:3px solid #1B3D2F;padding-left:1rem;margin-bottom:1.5rem">
            <h1 style="font-size:1.5rem;font-weight:400;color:#1B3D2F;margin:0">New <em>Order</em></h1>
            <p style="color:#666;font-size:0.85rem;margin:0.25rem 0 0">Order #${orderId.slice(0, 8)}</p>
          </div>

          <p style="color:#333;font-size:0.9rem">A new order has been placed on your store.</p>

          <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
            <thead>
              <tr style="background:#f5f7f6">
                <th style="padding:6px 8px;text-align:left;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:#888">Product</th>
                <th style="padding:6px 8px;text-align:center;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:#888">Qty</th>
                <th style="padding:6px 8px;text-align:right;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:#888">Price</th>
                <th style="padding:6px 8px;text-align:right;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:#888">Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding:8px;text-align:right;font-weight:600;font-size:0.85rem">Total</td>
                <td style="padding:8px;text-align:right;font-weight:700;font-size:0.95rem;color:#1B3D2F">$${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <hr style="border:none;border-top:1px solid #e8ece9;margin:1.5rem 0" />
          <p style="color:#888;font-size:0.75rem">Bonzai Seller App</p>
        </div>
      `,
    });
  } catch {
    // email failure should not block the order
  }
}
