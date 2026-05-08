"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../../frontend/components/ui/Button/Button";
import { Input } from "../../../../frontend/components/ui/Input/Input";
import { ArrowLeft, Plus } from "lucide-react";
import styles from "./page.module.css";

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name: form.get("name"),
      description: form.get("description") || undefined,
      price: parseFloat(form.get("price") as string),
      stock: parseInt(form.get("stock") as string, 10),
      imageUrl: (form.get("imageUrl") as string) || undefined,
      isFragile: form.get("isFragile") === "on",
    };

    const categoryId = form.get("categoryId") as string;
    if (categoryId) body.categoryId = categoryId;

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || "Something went wrong");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard/inventory");
    router.refresh();
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <Link href="/dashboard/inventory" className={styles.backLink}>
          <ArrowLeft size={12} />
          Back to Inventory
        </Link>
        <h1 className={styles.title}>
          New <span className={styles.italic}>Product</span>
        </h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.row}>
          <Input label="Product Name" name="name" required placeholder="e.g. Monstera Deliciosa" />
          <Input label="Price ($)" name="price" type="number" step="0.01" min="0" required placeholder="0.00" />
        </div>

        <div className={styles.row}>
          <Input label="Stock" name="stock" type="number" min="0" required placeholder="0" />
          <Input label="Image URL" name="imageUrl" type="url" placeholder="https://example.com/image.jpg" hint="Optional" />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className={styles.textarea}
            placeholder="Brief description of the product"
            rows={2}
          />
        </div>

        <label className={styles.checkbox}>
          <input type="checkbox" name="isFragile" />
          <span>Fragile item (requires special handling)</span>
        </label>

        <div className={styles.actions}>
          <Link href="/dashboard/inventory" className={styles.cancelBtn}>Cancel</Link>
          <Button type="submit" disabled={submitting}>
            <Plus size={14} />
            {submitting ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
