import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "../../../../lib/prisma";

interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 }
    );
  }

  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers." },
      { status: 400 }
    );
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[webhooks/clerk verify]", err);
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  const { type, data } = evt;

  try {
    switch (type) {
      case "user.updated": {
        const clerkId = data.id as string;
        const email =
          ((data.email_addresses as Array<{ email_address: string }>)?.[0]
            ?.email_address) || "";

        // Only update email if the user already has a SellerProfile
        const existing = await prisma.sellerProfile.findUnique({ where: { clerkId } });
        if (existing) {
          await prisma.sellerProfile.update({ where: { clerkId }, data: { email } });
        }

        return NextResponse.json({ success: true });
      }

      case "user.deleted": {
        const clerkId = data.id as string;

        const profile = await prisma.sellerProfile.findUnique({
          where: { clerkId },
        });

        if (profile) {
          await prisma.product.updateMany({
            where: { sellerId: profile.id },
            data: { isActive: false },
          });

          await prisma.sellerProfile.delete({ where: { clerkId } });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: true });
    }
  } catch (err) {
    console.error("[webhooks/clerk]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
