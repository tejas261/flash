import { ScanQrCode } from "lucide-react";

import { AdminLoginForm } from "@/components/app/admin-login-form";
import { redirectAuthenticatedAdmin } from "@/lib/actions/admin-auth";

export default async function AdminLoginPage() {
  await redirectAuthenticatedAdmin();

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10 md:px-10">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <ScanQrCode className="size-4" />
            Restaurant admin access
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight md:text-6xl">
              Manage menu updates, kitchen flow, and ready tokens from one dashboard.
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Seed data includes a demo owner account. Sign in to manage the sample self-service restaurant.
            </p>
          </div>
        </section>
        <AdminLoginForm
          defaultEmail={process.env.ADMIN_EMAIL ?? "owner@flash.demo"}
          defaultPassword={process.env.ADMIN_PASSWORD ?? "flash-admin-123"}
        />
      </div>
    </main>
  );
}
