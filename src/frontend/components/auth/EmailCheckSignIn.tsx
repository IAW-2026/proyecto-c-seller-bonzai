"use client";

import { useState } from "react";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { clerkTheme } from "../../lib/clerkTheme";
import styles from "./EmailCheck.module.css";

type CheckStatus = "idle" | "loading" | "no_account" | "exists_no_seller" | "exists_seller";

export function EmailCheckSignIn() {
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
        setStatus("no_account");
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

  if (status === "exists_seller") {
    return (
      <SignIn
        routing="hash"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
        initialValues={{ emailAddress: email }}
        appearance={clerkTheme}
      />
    );
  }

  if (status === "exists_no_seller") {
    return (
      <div className={styles.message}>
        <h3 className={styles.messageTitle}>Activate seller access</h3>
        <p className={styles.messageDesc}>
          <strong>{email}</strong> has an account but does not have seller access yet.
          Sign in to activate your seller account.
        </p>
        <SignIn
          routing="hash"
          signUpUrl="/sign-up"
          forceRedirectUrl="/activate-seller"
          initialValues={{ emailAddress: email }}
          appearance={clerkTheme}
        />
        <div className={styles.messageActions}>
          <button
            className={styles.secondaryAction}
            onClick={() => setStatus("idle")}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  if (status === "no_account") {
    return (
      <div className={styles.message}>
        <h3 className={styles.messageTitle}>No account found</h3>
        <p className={styles.messageDesc}>
          There is no account with <strong>{email}</strong>.
          Please sign up to create a new account.
        </p>
        <div className={styles.messageActions}>
          <Link href="/sign-up" className={styles.primaryAction}>
            Sign up
          </Link>
          <button
            className={styles.secondaryAction}
            onClick={() => setStatus("idle")}
          >
            Use a different email
          </button>
        </div>
      </div>
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
    </div>
  );
}
