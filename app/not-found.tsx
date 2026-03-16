import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-10 text-center">
      <div className="surface space-y-5 px-8 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">404</p>
        <h1 className="font-heading text-4xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">
          The requested restaurant, order, or admin view does not exist in this workspace.
        </p>
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
