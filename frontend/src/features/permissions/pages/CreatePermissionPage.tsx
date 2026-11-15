import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/api/client";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { createPermission } from "../api/permissions.api";
import { PermissionForm, type PermissionFormValues } from "../components/PermissionForm";
import { PermissionPageHeader } from "../components/PermissionPageHeader";

export default function CreatePermissionPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: PermissionFormValues) => {
    setError(null);
    try {
      const permission = await createPermission({
        name: values.name,
        description: values.description || null,
      });
      void navigate(`/dashboard/admin/permissions/${permission.id}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  return (
    <>
      <PermissionPageHeader
        eyebrow="Permission management"
        title="Create permission"
        description="Add a permission definition for future role assignments."
      />
      <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:p-7">
        <div className="mb-6 border-b border-gray-200 pb-5 dark:border-gray-800">
          <h2 className="text-base font-medium text-gray-800 dark:text-white/90">
            Permission details
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Names follow the backend resource.action format and cannot be changed later.
          </p>
        </div>
        <PermissionForm mode="create" apiError={error} onSubmit={handleSubmit} />
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to="/dashboard/admin/permissions" />}
          >
            Cancel
          </Button>
        </div>
      </section>
    </>
  );
}
