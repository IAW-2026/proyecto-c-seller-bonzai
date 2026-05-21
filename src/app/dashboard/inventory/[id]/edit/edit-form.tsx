"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../../../frontend/components/ui/Button/Button";
import { Input } from "../../../../../frontend/components/ui/Input/Input";
import { ArrowLeft, Upload, Save } from "lucide-react";
import styles from "./page.module.css";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  isFragile: boolean;
}

export function EditProductForm({ product, categoryId }: { product: Product; categoryId?: string | null }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(product.imageUrl || "");
  const [preview, setPreview] = useState<string | null>(product.imageUrl);
  const [categories, setCategories] = useState<Category[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId || "");
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        const cats = d.categories || [];
        setCategories(cats);
        const current = cats.find((c: Category) => c.id === selectedCategoryId);
        if (current) setSelectedCategoryLabel(current.name);
        if (!selectedCategoryId && cats.length > 0) setSelectedCategoryLabel("No category");
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setError("");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setImageUrl(data.url);
    } catch {
      setError("Image upload failed. You can use a URL instead.");
      setPreview(product.imageUrl);
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    setImageUrl("");
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const formCategoryId = form.get("categoryId") as string;
    const body: Record<string, unknown> = {
      name: form.get("name"),
      description: form.get("description") || undefined,
      price: parseFloat(form.get("price") as string),
      stock: parseInt(form.get("stock") as string, 10),
      imageUrl: imageUrl || undefined,
      isFragile: form.get("isFragile") === "on",
    };
    if (formCategoryId) {
      body.categoryId = formCategoryId;
    } else {
      body.categoryId = null;
    }

    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
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
          Edit <span className={styles.italic}>Product</span>
        </h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.row}>
          <Input
            label="Product Name"
            name="name"
            required
            defaultValue={product.name}
            className={styles.fieldInput}
          />
          <Input
            label="Price ($)"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product.price}
            className={styles.fieldInput}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Stock"
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={product.stock}
            className={styles.fieldInput}
          />
          <div className={styles.field}>
            <span className={styles.label}>Category</span>
            <input type="hidden" name="categoryId" value={selectedCategoryId} />
            <div className={styles.selectWrap} ref={dropdownRef}>
              <button type="button" className={styles.selectBtn} onClick={() => setCategoryOpen(!categoryOpen)}>
                <span className={selectedCategoryId ? styles.selectText : styles.selectPlaceholder}>{selectedCategoryLabel}</span>
                <svg width="10" height="6" fill="none" className={`${styles.selectArrow} ${categoryOpen ? styles.selectArrowOpen : ""}`}>
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {categoryOpen && (
                <div className={styles.dropdown}>
                  <button type="button" className={`${styles.dropdownItem} ${!selectedCategoryId ? styles.dropdownItemActive : ""}`} onClick={() => { setSelectedCategoryId(""); setSelectedCategoryLabel("No category"); setCategoryOpen(false); }}>
                    No category
                  </button>
                  {categories.map((c) => (
                    <button key={c.id} type="button" className={`${styles.dropdownItem} ${selectedCategoryId === c.id ? styles.dropdownItemActive : ""}`} onClick={() => { setSelectedCategoryId(c.id); setSelectedCategoryLabel(c.name); setCategoryOpen(false); }}>
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Image</span>
          <div
            className={`${styles.uploadArea} ${preview ? styles.uploadAreaHasImage : ""}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className={styles.uploading}>
                <div className={styles.spinner} />
                <span>Uploading...</span>
              </div>
            ) : preview ? (
              <div className={styles.previewWrap}>
                <img src={preview} alt="Preview" className={styles.preview} />
                <div className={styles.previewOverlay}>
                  <button type="button" className={styles.changeBtn}>Change</button>
                  <button type="button" className={styles.removeBtn} onClick={(e) => { e.stopPropagation(); clearImage(); }}>Remove</button>
                </div>
              </div>
            ) : (
              <div className={styles.uploadPlaceholder}>
                <Upload size={20} />
                <span className={styles.uploadText}>Click to upload an image</span>
                <span className={styles.uploadHint}>or drag and drop — PNG, JPG up to 5MB</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className={styles.fileInput}
          />
          {!imageUrl && !uploading && (
            <div className={styles.urlRow}>
              <span className={styles.urlDivider}>or</span>
              <input
                type="text"
                placeholder="Paste an image URL"
                className={styles.urlInput}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className={styles.textarea}
            placeholder="Brief description of the product"
            rows={2}
            defaultValue={product.description || ""}
          />
        </div>

        <label className={styles.checkbox}>
          <input type="checkbox" name="isFragile" defaultChecked={product.isFragile} />
          <span>Fragile item (requires special handling)</span>
        </label>

        <div className={styles.actions}>
          <Link href="/dashboard/inventory" className={styles.cancelBtn}>Cancel</Link>
          <Button type="submit" disabled={submitting || uploading} className={styles.submitBtn}>
            <Save size={14} />
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
