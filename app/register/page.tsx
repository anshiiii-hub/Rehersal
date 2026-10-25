import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";

export const metadata: Metadata = {
  title: "Create Account — Rehearsal",
  description:
    "Register your personal voice-AI studio on Rehearsal to rehearse lifelike conversations.",
};

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p className="muted">Loading Rehearsal Studio...</p>
        </div>
      }
    >
      <AuthCard initialMode="register" />
    </Suspense>
  );
}
