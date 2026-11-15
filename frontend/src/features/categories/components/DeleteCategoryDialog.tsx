import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios from "axios";
import { useState } from "react";
import type { Category } from "../types/category.types";

export function DeleteCategoryDialog({ category, onOpenChange, onConfirm }: {
  category: Category | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = async () => {
    setDeleting(true); setError(null);
    try { await onConfirm(); }
    catch (reason) {
      setError(axios.isAxiosError(reason) && reason.response?.status === 409
        ? "This category contains products and cannot be deleted. Move or remove its products first."
        : getApiErrorMessage(reason));
    } finally { setDeleting(false); }
  };
  return <Dialog open={category !== null} onOpenChange={(open) => { if (!deleting) onOpenChange(open); }}>
    <DialogContent><DialogHeader><DialogTitle>Delete category?</DialogTitle><DialogDescription>Delete <strong className="font-semibold text-gray-800 dark:text-white/90">{category?.name}</strong>? This action cannot be undone.{typeof category?.productCount === "number" && category.productCount > 0 ? ` The category currently contains ${category.productCount} products.` : ""}</DialogDescription></DialogHeader>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{error}</p>}
      <DialogFooter><Button variant="outline" disabled={deleting} onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="destructive" disabled={deleting || !category} onClick={() => void confirm()}>{deleting ? "Deleting…" : "Delete category"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
