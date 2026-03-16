import type { Metadata } from "next";
import { Toaster } from "sonner";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Flash QR Ordering",
  description: "QR-based self-service food ordering for restaurants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div className="bg-grid" />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
