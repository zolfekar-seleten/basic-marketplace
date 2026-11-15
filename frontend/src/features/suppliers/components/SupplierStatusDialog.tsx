import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/api/client";
import { useState } from "react";
import type { Supplier } from "../types/supplier.types";

export function SupplierStatusDialog({
  supplier,
  onOpenChange,
  onConfirm,
}: {
  supplier: Supplier | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStatus = supplier?.isActive ? "deactivate" : "activate";

  return (
    <Dialog
      open={supplier !== null}
      onOpenChange={(open) => {
        if (!isSubmitting) onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {supplier?.isActive ? "Deactivate supplier?" : "Activate supplier?"}
          </DialogTitle>
          <DialogDescription>
            {supplier?.isActive
              ? `${supplier.name} will no longer be able to sign in or manage supplier activity.`
              : `${supplier?.name ?? "This supplier"} will be able to sign in and manage supplier activity again.`}
          </DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant={nextStatus === "deactivate" ? "destructive" : "default"}
            disabled={isSubmitting || supplier === null}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? "Saving…" : `Confirm ${nextStatus}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
