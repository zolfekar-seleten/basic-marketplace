import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmPermissionChangesDialog({
  open,
  roleName,
  addedNames,
  removedNames,
  isSaving,
  error,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  roleName: string;
  addedNames: string[];
  removedNames: string[];
  isSaving: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSaving) onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save role permissions?</DialogTitle>
          <DialogDescription>
            This will replace the current permission assignments for the {roleName} role.
            The change is saved as one operation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="font-medium text-gray-700 dark:text-gray-200">
            {addedNames.length} permission{addedNames.length === 1 ? "" : "s"} to add, {removedNames.length} to remove.
          </p>
          {addedNames.length > 0 && (
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                Adding
              </h3>
              <ul className="max-h-28 space-y-1 overflow-y-auto font-mono text-xs text-gray-600 dark:text-gray-300">
                {addedNames.map((name) => <li key={name}>{name}</li>)}
              </ul>
            </div>
          )}
          {removedNames.length > 0 && (
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
                Removing
              </h3>
              <ul className="max-h-28 space-y-1 overflow-y-auto font-mono text-xs text-gray-600 dark:text-gray-300">
                {removedNames.map((name) => <li key={name}>{name}</li>)}
              </ul>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={isSaving} onClick={onConfirm}>
            {isSaving ? "Saving…" : "Confirm changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
