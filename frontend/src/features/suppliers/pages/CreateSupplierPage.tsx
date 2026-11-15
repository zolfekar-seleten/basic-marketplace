import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/api/client";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { createSupplier } from "../api/suppliers.api";
import { SupplierForm, type SupplierFormValues } from "../components/SupplierForm";
import { SupplierPageHeader } from "../components/SupplierPageHeader";

export default function CreateSupplierPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: SupplierFormValues) => {
    setError(null);
    try {
      const supplier = await createSupplier({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      void navigate(`/dashboard/admin/suppliers/${supplier.id}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  return (
    <>
      <SupplierPageHeader
        eyebrow="Supplier management"
        title="Create supplier"
        description="Create an account for a supplier. Supplier access is enabled by default."
      />
      <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-7">
        <div className="mb-6 border-b border-gray-200 pb-5 dark:border-gray-800">
          <h2 className="text-base font-medium text-gray-800 dark:text-white/90">
            Supplier details
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The supplier account will be created with the supplier role.
          </p>
        </div>
        <SupplierForm mode="create" apiError={error} onSubmit={handleSubmit} />
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to="/dashboard/admin/suppliers" />}
          >
            Cancel
          </Button>
        </div>
      </section>
    </>
  );
}
