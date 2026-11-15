import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { useState } from "react";
import type { Permission } from "../types/permission.types";

export function DeletePermissionDialog({
  permission,
  onOpenChange,
  onConfirm,
}: {
  permission: Permission | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (deleteError) {
      if (
        axios.isAxiosError(deleteError) &&
        deleteError.response?.status === 409
      ) {
        setError(
          "This permission is assigned to one or more roles. Remove it from every role before deleting it.",
        );
      } else {
        setError(getApiErrorMessage(deleteError));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={permission !== null}
      onOpenChange={(open) => {
        if (!isDeleting) onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete permission?</DialogTitle>
          <DialogDescription>
            Delete <strong className="font-semibold text-gray-800 dark:text-white/90">{permission?.name}</strong>?
            This cannot be undone. Permissions assigned to roles cannot be deleted.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting || permission === null}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? "Deleting…" : "Delete permission"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
