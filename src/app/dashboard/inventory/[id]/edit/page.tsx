import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../../../../lib/prisma";
import { redirect } from "next/navigation";
import { EditProductForm } from "./edit-form";

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect("/sign-in");

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) redirect("/dashboard/inventory");

  return <EditProductForm product={product} categoryId={product.categoryId} />;
}
