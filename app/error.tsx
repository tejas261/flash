"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-10 text-center">
      <div className="surface space-y-5 px-8 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Application error</p>
        <h1 className="font-heading text-4xl font-semibold">Something broke while rendering this page.</h1>
        <p className="text-muted-foreground">
          Retry once. If the error persists, verify the database, Redis, and Razorpay environment values.
        </p>
        <Button type="button" onClick={() => reset()}>
          Retry
        </Button>
      </div>
    </main>
  );
}
