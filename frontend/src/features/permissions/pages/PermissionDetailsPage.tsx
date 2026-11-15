import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/api/client";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  deletePermission,
  getPermission,
  updatePermission,
} from "../api/permissions.api";
import { DeletePermissionDialog } from "../components/DeletePermissionDialog";
import {
  PermissionForm,
  type PermissionFormValues,
} from "../components/PermissionForm";
import { PermissionPageHeader } from "../components/PermissionPageHeader";
import type { Permission } from "../types/permission.types";

export default function PermissionDetailsPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const navigate = useNavigate();
  const [permission, setPermission] = useState<Permission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<{
    id: number;
    message: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    if (!Number.isSafeInteger(id) || id < 1) {
      return () => controller.abort();
    }
    void getPermission(id, controller.signal)
      .then((item) => {
        if (!controller.signal.aborted) {
          setPermission(item);
          setLoadError(null);
        }
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError({ id, message: getApiErrorMessage(requestError) });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [id, reloadKey]);

  const handleRetry = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  };

  const handleUpdate = async (values: PermissionFormValues) => {
    setFormError(null);
    try {
      const updated = await updatePermission(id, {
        description: values.description,
      });
      setPermission(updated);
      setIsEditing(false);
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError));
    }
  };

  const handleDelete = async () => {
    await deletePermission(id);
    void navigate("/dashboard/admin/permissions", { replace: true });
  };

  const currentError = loadError?.id === id ? loadError.message : null;
  const isValidId = Number.isSafeInteger(id) && id > 0;
  const isCurrentPermission = permission?.id === id;

  if (isValidId && (isLoading || (!isCurrentPermission && !currentError))) {
    return (
      <div className="space-y-4" aria-label="Loading permission details">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (!isValidId || currentError || !isCurrentPermission || !permission) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Unable to load permission
        </h1>
        <p role="alert" className="mt-2 text-sm text-red-600">
          {currentError ?? "Permission not found"}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button variant="outline" onClick={handleRetry}>
            Try again
          </Button>
          <Button
            nativeButton={false}
            render={<Link to="/dashboard/admin/permissions" />}
          >
            Back to permissions
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <PermissionPageHeader
        eyebrow="Permission details"
        title={permission.name}
        description="Permission names are immutable. Only the description can be updated."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing((editing) => !editing)}
            >
              {isEditing ? "Cancel edit" : "Edit description"}
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              Delete permission
            </Button>
          </div>
        }
      />

      {isEditing ? (
        <section className="max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-7">
          <div className="mb-6 border-b border-gray-200 pb-5 dark:border-gray-800">
            <h2 className="text-base font-medium text-gray-800 dark:text-white/90">
              Update description
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The permission name cannot be changed.
            </p>
          </div>
          <PermissionForm
            key={`${permission.id}-${permission.description ?? ""}`}
            mode="edit"
            initialValues={{
              name: permission.name,
              description: permission.description ?? "",
            }}
            apiError={formError}
            onSubmit={handleUpdate}
          />
        </section>
      ) : (
        <section className="max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <dl className="grid gap-x-8 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7 sm:py-8">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Permission ID</dt>
              <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">#{permission.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="mt-1 break-all font-mono font-medium text-gray-800 dark:text-white/90">{permission.name}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-gray-500 dark:text-gray-400">Description</dt>
              <dd className="mt-1 whitespace-pre-wrap text-gray-800 dark:text-white/90">
                {permission.description || "No description provided."}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <div className="mt-5">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/dashboard/admin/permissions" />}
        >
          Back to permissions
        </Button>
      </div>

      <DeletePermissionDialog
        key={`${permission.id}-${deleteOpen}`}
        permission={deleteOpen ? permission : null}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
      />
    </>
  );
}
