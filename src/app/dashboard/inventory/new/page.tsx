"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../../frontend/components/ui/Button/Button";
import { Input } from "../../../../frontend/components/ui/Input/Input";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import styles from "./page.module.css";

interface Category {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [categoryLabel, setCategoryLabel] = useState("No category");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
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
      setPreview(null);
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
    const body: Record<string, unknown> = {
      name: form.get("name"),
      description: form.get("description") || undefined,
      price: parseFloat(form.get("price") as string),
      stock: parseInt(form.get("stock") as string, 10),
      imageUrl: imageUrl || undefined,
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
          <Input label="Product Name" name="name" required placeholder="e.g. Monstera Deliciosa" className={styles.fieldInput} />
          <Input label="Price ($)" name="price" type="number" step="0.01" min="0" required placeholder="0.00" className={styles.fieldInput} />
        </div>

        <div className={styles.row}>
          <Input label="Stock" name="stock" type="number" min="0" required placeholder="0" className={styles.fieldInput} />
          <div className={styles.field}>
            <span className={styles.label}>Category</span>
            <input type="hidden" name="categoryId" value={categoryId} />
            <div className={styles.selectWrap} ref={dropdownRef}>
              <button type="button" className={styles.selectBtn} onClick={() => setCategoryOpen(!categoryOpen)}>
                <span className={categoryId ? styles.selectText : styles.selectPlaceholder}>{categoryLabel}</span>
                <svg width="10" height="6" fill="none" className={`${styles.selectArrow} ${categoryOpen ? styles.selectArrowOpen : ""}`}>
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {categoryOpen && (
                <div className={styles.dropdown}>
                  <button type="button" className={`${styles.dropdownItem} ${!categoryId ? styles.dropdownItemActive : ""}`} onClick={() => { setCategoryId(""); setCategoryLabel("No category"); setCategoryOpen(false); }}>
                    No category
                  </button>
                  {categories.map((c) => (
                    <button key={c.id} type="button" className={`${styles.dropdownItem} ${categoryId === c.id ? styles.dropdownItemActive : ""}`} onClick={() => { setCategoryId(c.id); setCategoryLabel(c.name); setCategoryOpen(false); }}>
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
          />
        </div>

        <label className={styles.checkbox}>
          <input type="checkbox" name="isFragile" />
          <span>Fragile item (requires special handling)</span>
        </label>

        <div className={styles.actions}>
          <Link href="/dashboard/inventory" className={styles.cancelBtn}>Cancel</Link>
          <Button type="submit" disabled={submitting || uploading} className={styles.submitBtn}>
            <Plus size={14} />
            {submitting ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
