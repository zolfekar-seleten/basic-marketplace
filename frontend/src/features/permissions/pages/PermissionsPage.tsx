import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessage } from "@/api/client";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { deletePermission, listPermissions } from "../api/permissions.api";
import { DeletePermissionDialog } from "../components/DeletePermissionDialog";
import { PermissionPageHeader } from "../components/PermissionPageHeader";
import type { Permission } from "../types/permission.types";

const PAGE_SIZE = 20;

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void listPermissions(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setPermissions(items);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(getApiErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return permissions;
    return permissions.filter(
      (permission) =>
        permission.name.toLowerCase().includes(query) ||
        permission.description?.toLowerCase().includes(query),
    );
  }, [permissions, search]);

  const totalPages = Math.ceil(filteredPermissions.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const pagePermissions = filteredPermissions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deletePermission(deleteTarget.id);
    setPermissions((items) =>
      items.filter((permission) => permission.id !== deleteTarget.id),
    );
    setDeleteTarget(null);
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setReloadKey((key) => key + 1);
  };

  const firstRecord = filteredPermissions.length
    ? (currentPage - 1) * PAGE_SIZE + 1
    : 0;
  const lastRecord = Math.min(currentPage * PAGE_SIZE, filteredPermissions.length);

  return (
    <>
      <PermissionPageHeader
        eyebrow="Admin dashboard"
        title="Permissions"
        description="Manage permission definitions used by role access rules."
        action={
          <Button
            nativeButton={false}
            render={<Link to="/dashboard/admin/permissions/new" />}
          >
            Create permission
          </Button>
        }
      />

      <section className="rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div>
            <h2 className="text-base font-medium text-gray-800 dark:text-white/90">
              Permission definitions
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isLoading
                ? "Loading permissions"
                : `${filteredPermissions.length} permission${filteredPermissions.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="w-full sm:w-72">
            <Input
              type="search"
              aria-label="Search permissions"
              placeholder="Search name or description"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {error ? (
          <div className="px-6 py-14 text-center">
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button className="mt-4" variant="outline" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 px-6 py-8" aria-label="Loading permissions">
            <div className="h-5 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-12 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-12 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-12 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        ) : pagePermissions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table className="text-left">
                <TableHeader>
                  <TableRow className="border-b border-gray-100 dark:border-gray-800">
                    <TableCell isHeader className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Permission</TableCell>
                    <TableCell isHeader className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Description</TableCell>
                    <TableCell isHeader className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagePermissions.map((permission) => (
                    <TableRow key={permission.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                      <TableCell className="min-w-52 px-6 py-4">
                        <Link
                          className="font-mono text-sm font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
                          to={`/dashboard/admin/permissions/${permission.id}`}
                        >
                          {permission.name}
                        </Link>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          ID #{permission.id}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-64 px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {permission.description || <span className="text-gray-400 dark:text-gray-400">No description</span>}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            nativeButton={false}
                            render={<Link to={`/dashboard/admin/permissions/${permission.id}`} />}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteTarget(permission)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {firstRecord}–{lastRecord} of {filteredPermissions.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <span className="px-2 text-sm text-gray-600 dark:text-gray-300">
                  Page {currentPage} of {Math.max(totalPages, 1)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              {search.trim() ? "No permissions match this search" : "No permissions yet"}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {search.trim()
                ? "Try a different permission name or description."
                : "Create a permission definition to get started."}
            </p>
            {!search.trim() && (
              <Button
                className="mt-5"
                nativeButton={false}
                render={<Link to="/dashboard/admin/permissions/new" />}
              >
                Create permission
              </Button>
            )}
          </div>
        )}
      </section>

      <DeletePermissionDialog
        key={`${deleteTarget?.id ?? "closed"}`}
        permission={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
