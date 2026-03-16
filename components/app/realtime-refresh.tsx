"use client";

import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

type RealtimeRefreshProps = {
  url: string;
};

export function RealtimeRefresh({ url }: RealtimeRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.onmessage = () => {
      startTransition(() => {
        router.refresh();
      });
    };

    return () => {
      eventSource.close();
    };
  }, [router, url]);

  return null;
}
