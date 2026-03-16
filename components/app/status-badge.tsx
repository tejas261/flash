import type { OrderStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

const variantByStatus: Record<OrderStatus, "warning" | "default" | "success" | "secondary"> = {
  NEW: "warning",
  PREPARING: "default",
  READY: "success",
  COMPLETED: "secondary",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={variantByStatus[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
