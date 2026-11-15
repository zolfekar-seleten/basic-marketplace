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
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { listSuppliers, activateSupplier, deactivateSupplier } from "../api/suppliers.api";
import { SupplierPageHeader } from "../components/SupplierPageHeader";
import { SupplierStatusBadge } from "../components/SupplierStatusBadge";
import { SupplierStatusDialog } from "../components/SupplierStatusDialog";
import type { Supplier, SupplierListResponse } from "../types/supplier.types";

const PAGE_SIZE = 20;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState<SupplierListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<Supplier | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    void listSuppliers(
      {
        page,
        limit: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(status === "all" ? {} : { isActive: status === "active" }),
      },
      controller.signal,
    )
      .then((response) => setResult(response))
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(requestError));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [page, debouncedSearch, status, refreshKey]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    setIsLoading(true);
    setError(null);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    setIsLoading(true);
    setError(null);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setRefreshKey((key) => key + 1);
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    if (statusTarget.isActive) {
      await deactivateSupplier(statusTarget.id);
    } else {
      await activateSupplier(statusTarget.id);
    }
    setStatusTarget(null);
    setIsLoading(true);
    setError(null);
    setRefreshKey((key) => key + 1);
  };

  const totalPages = result?.totalPages ?? 0;
  const firstRecord = result && result.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastRecord = result ? Math.min(page * PAGE_SIZE, result.total) : 0;

  return (
    <>
      <SupplierPageHeader
        eyebrow="Admin dashboard"
        title="Suppliers"
        description="Create and manage supplier accounts."
        action={
          <Button nativeButton={false} render={<Link to="/dashboard/admin/suppliers/new" />}>
            Create supplier
          </Button>
        }
      />

      <section className="rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div>
            <h2 className="text-base font-medium text-gray-800 dark:text-white/90">
              Supplier accounts
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {result ? `${result.total} supplier${result.total === 1 ? "" : "s"}` : "Loading suppliers"}
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <div className="w-full sm:w-64">
              <Input
                type="search"
                aria-label="Search suppliers"
                placeholder="Search name or email"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </div>
            <select
              aria-label="Filter suppliers by status"
              className="h-11 rounded-[10px] border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as typeof status);
                setPage(1);
                setIsLoading(true);
                setError(null);
              }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-14 text-center">
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button className="mt-4" variant="outline" onClick={handleRefresh}>
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 px-6 py-8" aria-label="Loading suppliers">
            <div className="h-5 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-12 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-12 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
            <div className="h-12 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        ) : result?.data.length ? (
          <>
            <div className="overflow-x-auto">
              <Table className="text-left">
                <TableHeader>
                  <TableRow className="border-b border-gray-100 dark:border-gray-800">
                    <TableCell isHeader className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Supplier</TableCell>
                    <TableCell isHeader className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Status</TableCell>
                    <TableCell isHeader className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Created</TableCell>
                    <TableCell isHeader className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.data.map((supplier) => (
                    <TableRow key={supplier.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                      <TableCell className="min-w-56 px-6 py-4">
                        <Link
                          className="font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
                          to={`/dashboard/admin/suppliers/${supplier.id}`}
                        >
                          {supplier.name}
                        </Link>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{supplier.email}</p>
                      </TableCell>
                      <TableCell className="px-6 py-4"><SupplierStatusBadge isActive={supplier.isActive} /></TableCell>
                      <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(supplier.createdAt)}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            nativeButton={false}
                            render={<Link to={`/dashboard/admin/suppliers/${supplier.id}`} />}
                          >
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setStatusTarget(supplier)}>
                            {supplier.isActive ? "Deactivate" : "Activate"}
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
                Showing {firstRecord}–{lastRecord} of {result.total}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>
                  Previous
                </Button>
                <span className="px-2 text-sm text-gray-600 dark:text-gray-300">
                  Page {page} of {Math.max(totalPages, 1)}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              {debouncedSearch || status !== "all" ? "No suppliers match these filters" : "No suppliers yet"}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {debouncedSearch || status !== "all"
                ? "Try changing your search or status filter."
                : "Create a supplier account to get started."}
            </p>
            {!debouncedSearch && status === "all" && (
              <Button className="mt-5" nativeButton={false} render={<Link to="/dashboard/admin/suppliers/new" />}>
                Create supplier
              </Button>
            )}
          </div>
        )}
      </section>

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
