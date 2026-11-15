import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/api/client";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  activateSupplier,
  deactivateSupplier,
  getSupplier,
  updateSupplier,
} from "../api/suppliers.api";
import { SupplierForm, type SupplierFormValues } from "../components/SupplierForm";
import { SupplierPageHeader } from "../components/SupplierPageHeader";
import { SupplierStatusBadge } from "../components/SupplierStatusBadge";
import { SupplierStatusDialog } from "../components/SupplierStatusDialog";
import type { Supplier } from "../types/supplier.types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SupplierDetailsPage() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<{
    id: number;
    message: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Supplier | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    if (!Number.isSafeInteger(id) || id < 1) {
      return () => controller.abort();
    }
    void getSupplier(id, controller.signal)
      .then((item) => {
        if (!controller.signal.aborted) {
          setSupplier(item);
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

  const handleUpdate = async (values: SupplierFormValues) => {
    setFormError(null);
    try {
      const updated = await updateSupplier(id, {
        name: values.name,
        email: values.email,
      });
      setSupplier(updated);
      setIsEditing(false);
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError));
    }
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    const updated = statusTarget.isActive
      ? await deactivateSupplier(statusTarget.id)
      : await activateSupplier(statusTarget.id);
    setSupplier(updated);
    setStatusTarget(null);
  };

  const currentError = loadError?.id === id ? loadError.message : null;
  const hasCurrentSupplier = supplier?.id === id;
  const hasValidId = Number.isSafeInteger(id) && id > 0;

  if (hasValidId && (isLoading || (!hasCurrentSupplier && !currentError))) {
    return (
      <div className="space-y-4" aria-label="Loading supplier details">
        <div className="h-8 w-56 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (!hasValidId || currentError || !hasCurrentSupplier || !supplier) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Unable to load supplier
        </h1>
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {currentError ?? "Supplier not found"}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button variant="outline" onClick={handleRetry}>
            Try again
          </Button>
          <Button nativeButton={false} render={<Link to="/dashboard/admin/suppliers" />}>
            Back to suppliers
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <SupplierPageHeader
        eyebrow={
          <Link className="hover:text-brand-500" to="/dashboard/admin/suppliers">
            Suppliers
          </Link>
        }
        title={supplier.name}
        description="Supplier account details and access status."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsEditing((editing) => !editing)}>
              {isEditing ? "Cancel edit" : "Edit supplier"}
            </Button>
            <Button
              variant={supplier.isActive ? "destructive" : "default"}
              onClick={() => setStatusTarget(supplier)}
            >
              {supplier.isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        }
      />

      {isEditing ? (
        <section className="max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-7">
          <div className="mb-6 border-b border-gray-200 pb-5 dark:border-gray-800">
            <h2 className="text-base font-medium text-gray-800 dark:text-white/90">
              Edit supplier
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Update the supplier’s name or email address.
            </p>
          </div>
          <SupplierForm
            key={`${supplier.id}-${supplier.updatedAt}`}
            mode="edit"
            initialValues={supplier}
            apiError={formError}
            onSubmit={handleUpdate}
          />
        </section>
      ) : (
        <section className="max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-5 py-5 dark:border-gray-800 sm:px-7">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Supplier status</p>
              <div className="mt-2"><SupplierStatusBadge isActive={supplier.isActive} /></div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Supplier ID #{supplier.id}</span>
          </div>
          <dl className="grid gap-x-8 gap-y-6 px-5 py-6 sm:grid-cols-2 sm:px-7 sm:py-8">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{supplier.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="mt-1 break-all font-medium text-gray-800 dark:text-white/90">{supplier.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Created</dt>
              <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{formatDate(supplier.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Last updated</dt>
              <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">{formatDate(supplier.updatedAt)}</dd>
            </div>
          </dl>
        </section>
      )}

      <SupplierStatusDialog
        key={`${statusTarget?.id ?? "closed"}-${statusTarget?.isActive ?? ""}`}
        supplier={statusTarget}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
        onConfirm={handleStatusChange}
      />
    </>
  );
}
