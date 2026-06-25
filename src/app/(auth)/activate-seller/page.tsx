"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import styles from "./page.module.css";

export default function ActivateSellerPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleActivate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/activate-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "seller" }),
      });

      if (!res.ok) throw new Error("Error activating role");

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    await signOut({ redirectUrl: "/" });
  };

  if (!user) {
    return (
      <div className={styles.spinner}>
        <div className={styles.spinnerCircle} />
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <h1 className={styles.title}>Activate Seller Access</h1>
      <p className={styles.description}>
        You are about to enable seller access for <strong className={styles.highlight}>{user?.emailAddresses[0]?.emailAddress}</strong>.
        Confirm to set up your seller account.
      </p>
      <button
        onClick={handleActivate}
        disabled={isLoading}
        className={styles.primaryAction}
      >
        {isLoading ? "Activating..." : "Yes, activate access"}
      </button>
      <button
        onClick={handleCancel}
        disabled={isLoading}
        className={styles.secondaryAction}
      >
        Cancel
      </button>
    </div>
  );
}
