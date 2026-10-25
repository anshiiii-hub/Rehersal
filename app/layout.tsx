import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-context";

export const metadata: Metadata = {
  title: "Rehearsal — Make every conversation count",
  description: "Build, rehearse, and launch voice AI agents.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
