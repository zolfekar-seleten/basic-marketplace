import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { listPermissions } from "@/features/permissions/api/permissions.api";
import type { Permission } from "@/features/permissions/types/permission.types";
import { getRolePermissions, synchronizeRolePermissions } from "../api/roles.api";
import { ConfirmPermissionChangesDialog } from "../components/ConfirmPermissionChangesDialog";
import { RolePageHeader } from "../components/RolePageHeader";
import type { RolePermissions } from "../types/role.types";

const ADMIN_REQUIRED = new Set(["permissions.view", "permissions.create", "permissions.update", "permissions.delete", "roles.view", "roles.assign_permissions"]);

export default function RoleDetailsPage() {
  const { id = "" } = useParams();
  const roleId = /^\d+$/.test(id) && Number(id) > 0 ? Number(id) : null;
  const { refreshProfile } = useAuth();
  const [role, setRole] = useState<RolePermissions | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (roleId === null) { setLoading(false); setError("Invalid role ID."); return; }
    const controller = new AbortController();
    setLoading(true); setError(null);
    Promise.all([getRolePermissions(roleId, controller.signal), listPermissions(controller.signal)])
      .then(([roleResult, allPermissions]) => {
        if (controller.signal.aborted) return;
        setRole(roleResult);
        const rolePermissionIds = roleResult.permissions.map(({ id: permissionId }) => permissionId);
        const requiredAdminIds = roleResult.name === "admin"
          ? allPermissions.filter((permission) => ADMIN_REQUIRED.has(permission.name)).map(({ id: permissionId }) => permissionId)
          : [];
        setSelectedIds([...new Set([...rolePermissionIds, ...requiredAdminIds])]);
        setPermissions(allPermissions);
      })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [roleId, reload]);

  const currentIds = useMemo(() => new Set(role?.permissions.map(({ id: permissionId }) => permissionId) ?? []), [role]);
  const permissionById = useMemo(() => new Map(permissions.map((permission) => [permission.id, permission])), [permissions]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return permissions.filter((item) => !term || `${item.name} ${item.description ?? ""}`.toLowerCase().includes(term));
  }, [permissions, query]);
  const groups = useMemo(() => {
    const result = new Map<string, Permission[]>();
    for (const permission of filtered) {
      const group = permission.name.split(".")[0] || "other";
      result.set(group, [...(result.get(group) ?? []), permission]);
    }
    return [...result.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);
  const added = selectedIds.filter((permissionId) => !currentIds.has(permissionId)).map((permissionId) => permissionById.get(permissionId)?.name).filter((name): name is string => Boolean(name)).sort();
  const removed = [...currentIds].filter((permissionId) => !selectedIds.includes(permissionId)).map((permissionId) => permissionById.get(permissionId)?.name).filter((name): name is string => Boolean(name)).sort();
  const missingRequired = role?.name === "admin" ? [...ADMIN_REQUIRED].filter((name) => !permissions.some((item) => item.name === name)) : [];
  const changed = added.length > 0 || removed.length > 0;

  const togglePermission = (permission: Permission, checked: boolean) => {
    if (role?.name === "admin" && ADMIN_REQUIRED.has(permission.name)) return;
    setSelectedIds((ids) => checked ? [...new Set([...ids, permission.id])] : ids.filter((permissionId) => permissionId !== permission.id));
    setSuccess(null);
  };

  const save = async () => {
    if (!role || roleId === null || !changed || missingRequired.length) return;
    setSaving(true); setSaveError(null);
    try {
      const updated = await synchronizeRolePermissions(roleId, [...selectedIds].sort((a, b) => a - b));
      setRole(updated); setSelectedIds(updated.permissions.map(({ id: permissionId }) => permissionId));
      setConfirmOpen(false); setSuccess("Role permissions were updated.");
      try { await refreshProfile(); } catch { setSuccess("Role permissions were updated. Your current session permissions could not be refreshed; sign in again if access appears unchanged."); }
    } catch (reason) { setSaveError(getApiErrorMessage(reason)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4" aria-label="Loading role permissions"><div className="h-8 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" /><div className="h-72 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" /></div>;
  if (error || !role) return <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]"><p role="alert" className="text-sm text-red-600 dark:text-red-400">{error ?? "Role not found."}</p><div className="mt-4 flex justify-center gap-3"><Button variant="outline" onClick={() => { setError(null); setLoading(true); setReload((value) => value + 1); }}>Try again</Button><Button variant="outline" nativeButton={false} render={<Link to="/dashboard/admin/roles" />}>Back to roles</Button></div></section>;

  return <>
    <RolePageHeader eyebrow="Admin dashboard / Roles" title={`${role.name[0]?.toUpperCase()}${role.name.slice(1)} role`} description="Select the permissions this role should have, then review and confirm the complete change." action={<Button variant="outline" nativeButton={false} render={<Link to="/dashboard/admin/roles" />}>Back to roles</Button>} />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]"><div><p className="text-sm font-medium text-gray-800 dark:text-white/90">Current assignments: {role.permissions.length}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Permissions version {role.permissionsVersion}</p></div><div className="flex gap-3"><Button variant="outline" disabled={!changed || saving} onClick={() => { setSelectedIds(role.permissions.map(({ id: permissionId }) => permissionId)); setSuccess(null); }}>Discard changes</Button><Button disabled={!changed || saving || missingRequired.length > 0} onClick={() => { setSaveError(null); setConfirmOpen(true); }}>Review and save</Button></div></div>
    {success && <p role="status" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-400">{success}</p>}
    {missingRequired.length > 0 && <p role="alert" className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">Admin assignments cannot be changed because required permissions are missing from the permission catalog: {missingRequired.join(", ")}.</p>}
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800"><div><h2 className="font-medium text-gray-800 dark:text-white/90">Permission assignments</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{selectedIds.length} selected of {permissions.length}</p></div><div className="w-full sm:w-80"><Input type="search" aria-label="Search permissions" placeholder="Search by permission or description" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
      {permissions.length === 0 ? <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">No permissions are available.</div> : filtered.length === 0 ? <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">No permissions match your search.</div> : <div className="grid gap-5 p-5 md:grid-cols-2">{groups.map(([group, items]) => <fieldset key={group} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"><legend className="px-2 text-sm font-semibold capitalize text-gray-800 dark:text-white/90">{group}</legend><div className="space-y-1">{items.map((permission) => { const checked = selectedIds.includes(permission.id); const locked = role.name === "admin" && ADMIN_REQUIRED.has(permission.name); return <label key={permission.id} className={`flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 ${locked ? "cursor-not-allowed bg-gray-50 dark:bg-white/[0.03]" : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"}`}><input type="checkbox" checked={checked} disabled={locked} onChange={(event) => togglePermission(permission, event.target.checked)} className="mt-0.5 size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-70 dark:border-gray-700" /><span className="min-w-0"><span className="block font-mono text-xs font-medium text-gray-800 dark:text-white/90">{permission.name}{locked && <span className="ml-2 font-sans text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">required</span>}</span><span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{permission.description || "No description provided."}</span></span></label>; })}</div></fieldset>)}</div>}
    </section>
    <ConfirmPermissionChangesDialog open={confirmOpen} roleName={role.name} addedNames={added} removedNames={removed} isSaving={saving} error={saveError} onOpenChange={setConfirmOpen} onConfirm={() => void save()} />
  </>;
}
