import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import type { Product } from "../types/product.types";

export function ProductActionDialog({ product, action, onOpenChange, onConfirm }: {
  product: Product | null;
  action: "delete" | "activate" | "deactivate";
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDelete = action === "delete";
  const title = isDelete ? "Delete product?" : `${action === "activate" ? "Activate" : "Deactivate"} product?`;
  const confirm = async () => {
    setBusy(true); setError(null);
    try { await onConfirm(); }
    catch (reason) { setError(getApiErrorMessage(reason)); }
    finally { setBusy(false); }
  };
  return <Dialog open={product !== null} onOpenChange={(open) => { if (!busy) onOpenChange(open); }}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{isDelete ? <>Delete <strong className="font-semibold text-gray-800 dark:text-white/90">{product?.name}</strong>? Products referenced by carts or orders cannot be deleted.</> : <>{action === "activate" ? "Make" : "Hide"} <strong className="font-semibold text-gray-800 dark:text-white/90">{product?.name}</strong> {action === "activate" ? "visible in" : "from"} the marketplace?</>}</DialogDescription></DialogHeader>{error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</p>}<DialogFooter><Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button><Button variant={isDelete || action === "deactivate" ? "destructive" : "default"} disabled={busy || !product} onClick={() => void confirm()}>{busy ? "Saving…" : isDelete ? "Delete product" : action === "activate" ? "Activate product" : "Deactivate product"}</Button></DialogFooter></DialogContent></Dialog>;
}
