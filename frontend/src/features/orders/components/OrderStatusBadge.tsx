import type { OrderStatus } from "../types/supplier-order.types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${status === "completed" ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}>{status}</span>;
}
