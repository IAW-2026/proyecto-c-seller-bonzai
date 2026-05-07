"use client";

import { useState } from "react";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { clerkTheme } from "../../lib/clerkTheme";
import styles from "./EmailCheck.module.css";

type CheckStatus = "idle" | "loading" | "available" | "exists_no_seller" | "exists_seller";

export function EmailCheckSignUp() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [error, setError] = useState("");

  const handleCheck = async () => {
    if (!email.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }

    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) throw new Error("Error checking email");

      const data = await res.json();

      if (!data.exists) {
        setStatus("available");
      } else if (data.hasSellerRole) {
        setStatus("exists_seller");
      } else {
        setStatus("exists_no_seller");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  };

  if (status === "available") {
    return (
      <SignUp
        routing="hash"
        signInUrl="/sign-in"
        forceRedirectUrl="/activate-seller"
        appearance={clerkTheme}
      />
    );
  }

  return (
    <div className={styles.container}>
      {status === "idle" && (
        <div className={styles.inputGroup}>
          <label className={styles.label}>Email address</label>
          <input
            type="email"
            className={styles.input}
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCheck(); }}
            autoFocus
          />
          {error && <span className={styles.errorText}>{error}</span>}
          <button className={styles.continueBtn} onClick={handleCheck}>
            Continue
          </button>
        </div>
      )}

      {status === "loading" && (
        <div className={styles.spinner} />
      )}

      {status === "exists_no_seller" && (
        <div className={styles.message}>
          <h3 className={styles.messageTitle}>Account found</h3>
          <p className={styles.messageDesc}>
            <strong>{email}</strong> is registered but does not have seller access yet.
            Sign in to activate the seller role.
          </p>
          <div className={styles.messageActions}>
            <Link href="/sign-in" className={styles.primaryAction}>
              Sign in
            </Link>
            <button
              className={styles.secondaryAction}
              onClick={() => setStatus("idle")}
            >
              Use a different email
            </button>
          </div>
        </div>
      )}

      {status === "exists_seller" && (
        <div className={styles.message}>
          <h3 className={styles.messageTitle}>Already a seller</h3>
          <p className={styles.messageDesc}>
            <strong>{email}</strong> already belongs to an existing seller account.
            Please sign in to access your dashboard.
          </p>
          <div className={styles.messageActions}>
            <Link href="/sign-in" className={styles.primaryAction}>
              Sign in
            </Link>
            <button
              className={styles.secondaryAction}
              onClick={() => setStatus("idle")}
            >
              Use a different email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
