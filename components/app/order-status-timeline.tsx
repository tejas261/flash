import type { OrderStatus } from "@/generated/prisma/enums";
import { CheckCheck, ChefHat, CircleDot, PartyPopper } from "lucide-react";

import { ORDER_STATUS_LABELS, ORDER_STATUS_STEPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const icons = {
  NEW: CircleDot,
  PREPARING: ChefHat,
  READY: CheckCheck,
  COMPLETED: PartyPopper,
};

type OrderStatusTimelineProps = {
  status: OrderStatus;
};

export function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  const currentIndex = ORDER_STATUS_STEPS.indexOf(status);

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {ORDER_STATUS_STEPS.map((step, index) => {
        const Icon = icons[step];
        const isActive = index <= currentIndex;
        const isCurrent = step === status;

        return (
          <div
            key={step}
            className={cn(
              "rounded-3xl border px-4 py-4 transition",
              isActive ? "border-primary/20 bg-primary/10" : "border-border bg-white/70",
              isCurrent && "status-pulse",
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <Icon className={cn("size-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Step {index + 1}
              </span>
            </div>
            <p className="font-heading text-lg font-semibold">{ORDER_STATUS_LABELS[step]}</p>
          </div>
        );
      })}
    </div>
  );
}
