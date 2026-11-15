import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

function createSupplierSchema(isCreate: boolean) {
  return z
    .object({
      name: z.string().trim().min(1, "Enter a supplier name").max(150),
      email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Enter a valid email address")
        .max(255),
      password: z.string(),
    })
    .superRefine((values, context) => {
      if (!values.password && isCreate) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Enter an initial password",
        });
        return;
      }
      if (!values.password) return;
      if (values.password.length < 8) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Use at least 8 characters",
        });
      }
      if (new TextEncoder().encode(values.password).length > 72) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Password must be 72 UTF-8 bytes or fewer",
        });
      }
    });
}

export interface SupplierFormValues {
  name: string;
  email: string;
  password: string;
}

export function SupplierForm({
  mode,
  initialValues,
  apiError,
  onSubmit,
}: {
  mode: "create" | "edit";
  initialValues?: Partial<SupplierFormValues>;
  apiError: string | null;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
}) {
  const schema = useMemo(() => createSupplierSchema(mode === "create"), [mode]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues?.name ?? "",
      email: initialValues?.email ?? "",
      password: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    if (mode === "edit") {
      await onSubmit({ ...values, password: "" });
      return;
    }
    await onSubmit(values);
  });

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="supplier-name">
          Supplier name
        </label>
        <Input
          id="supplier-name"
          autoComplete="organization"
          placeholder="Example Foods LLC"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="supplier-email">
          Email address
        </label>
        <Input
          id="supplier-email"
          type="email"
          autoComplete="email"
          placeholder="contact@example.com"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>}
      </div>

      {mode === "create" && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="supplier-password">
            Initial password
          </label>
          <Input
            id="supplier-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The supplier can change this password after signing in.
          </p>
          {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>}
        </div>
      )}

      {apiError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{apiError}</p>}

      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : mode === "create"
              ? "Create supplier"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
