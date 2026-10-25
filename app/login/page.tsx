import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";

export const metadata: Metadata = {
  title: "Sign In — Rehearsal",
  description:
    "Log in to your Rehearsal voice-AI studio to build, test, and refine character agents.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-root" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p className="muted">Loading Rehearsal Studio...</p>
        </div>
      }
    >
      <AuthCard initialMode="login" />
    </Suspense>
  );
}
