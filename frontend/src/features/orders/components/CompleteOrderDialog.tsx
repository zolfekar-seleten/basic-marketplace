import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import type { SupplierOrder } from "../types/supplier-order.types";

export function CompleteOrderDialog({ order, onOpenChange, onConfirm }: {
  order: SupplierOrder | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = async () => {
    setSaving(true); setError(null);
    try { await onConfirm(); }
    catch (reason) { setError(getApiErrorMessage(reason)); }
    finally { setSaving(false); }
  };
  return <Dialog open={order !== null} onOpenChange={(open) => { if (!saving) onOpenChange(open); }}><DialogContent><DialogHeader><DialogTitle>Complete order #{order?.id}?</DialogTitle><DialogDescription>Mark this pending order as completed? Completed orders cannot be changed back to pending.</DialogDescription></DialogHeader>{error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</p>}<DialogFooter><Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={saving || !order} onClick={() => void confirm()}>{saving ? "Updating…" : "Mark completed"}</Button></DialogFooter></DialogContent></Dialog>;
}
