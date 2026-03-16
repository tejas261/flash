export const ORDER_STATUS_LABELS = {
  NEW: "New",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
} as const;

export const ORDER_STATUS_STEPS = ["NEW", "PREPARING", "READY", "COMPLETED"] as const;

export const ORDER_STATUS_COLORS = {
  NEW: "bg-amber-100 text-amber-900 border-amber-300",
  PREPARING: "bg-sky-100 text-sky-900 border-sky-300",
  READY: "bg-emerald-100 text-emerald-900 border-emerald-300",
  COMPLETED: "bg-zinc-200 text-zinc-900 border-zinc-300",
} as const;

export const TAX_RATE_BPS = 500;
