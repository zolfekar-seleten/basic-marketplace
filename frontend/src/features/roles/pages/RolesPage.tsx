import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listRoles } from "../api/roles.api";
import { RolePageHeader } from "../components/RolePageHeader";
import type { RoleSummary } from "../types/role.types";

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    listRoles(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setRoles(result); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  return (
    <>
      <RolePageHeader eyebrow="Admin dashboard" title="Roles" description="Review role access and manage each role’s assigned permissions." />
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="font-medium text-gray-800 dark:text-white/90">Available roles</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{loading ? "Loading roles…" : `${roles.length} role${roles.length === 1 ? "" : "s"}`}</p>
        </div>
        {error ? <div className="px-6 py-12 text-center"><p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p><Button className="mt-4" variant="outline" onClick={() => { setError(null); setReload((value) => value + 1); }}>Try again</Button></div>
          : loading ? <div className="space-y-3 p-6" aria-label="Loading roles">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}</div>
          : roles.length ? <ul className="divide-y divide-gray-100 dark:divide-gray-800">{roles.map((role) => <li key={role.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
            <div><h3 className="font-medium capitalize text-gray-800 dark:text-white/90">{role.name}</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{role.description || "No description provided."}</p></div>
            <div className="flex items-center gap-4"><span className="text-xs text-gray-500 dark:text-gray-400">Permissions version {role.permissionsVersion}</span><Button size="sm" variant="outline" nativeButton={false} render={<Link to={`/dashboard/admin/roles/${role.id}`} />}>Manage permissions</Button></div>
          </li>)}</ul>
          : <div className="px-6 py-14 text-center text-sm text-gray-500 dark:text-gray-400">No roles are available.</div>}
      </section>
    </>
  );
}
