import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const permissionNamePattern = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

const createSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a permission name")
    .max(100, "Permission names may contain at most 100 characters")
    .regex(
      permissionNamePattern,
      "Use the format resource.action, with lowercase letters, digits, and underscores",
    ),
  description: z
    .string()
    .trim()
    .max(255, "Descriptions may contain at most 255 characters"),
});

const updateSchema = z.object({
  name: z.string(),
  description: z
    .string()
    .trim()
    .max(255, "Descriptions may contain at most 255 characters"),
});

export interface PermissionFormValues {
  name: string;
  description: string;
}

export function PermissionForm({
  mode,
  initialValues,
  apiError,
  onSubmit,
}: {
  mode: "create" | "edit";
  initialValues?: Partial<PermissionFormValues>;
  apiError: string | null;
  onSubmit: (values: PermissionFormValues) => Promise<void>;
}) {
  const schema = mode === "create" ? createSchema : updateSchema;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PermissionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
    },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      {mode === "create" ? (
        <div>
          <label
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="permission-name"
          >
            Permission name
          </label>
          <Input
            id="permission-name"
            placeholder="inventory.view"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Use a lowercase resource.action name. Names cannot be edited after creation.
          </p>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>
      ) : (
        <div>
          <label
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            htmlFor="permission-name"
          >
            Permission name
          </label>
          <Input
            id="permission-name"
            value={initialValues?.name ?? ""}
            disabled
            aria-describedby="permission-name-note"
          />
          <p
            id="permission-name-note"
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            Permission names are immutable.
          </p>
        </div>
      )}

      <div>
        <label
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor="permission-description"
        >
          Description
        </label>
        <textarea
          id="permission-description"
          rows={4}
          maxLength={255}
          placeholder="Explain what this permission allows."
          className="w-full resize-y rounded-[10px] border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none transition-colors placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 aria-invalid:border-red-500 aria-invalid:ring-3 aria-invalid:ring-red-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
        <div className="mt-1 flex justify-between gap-3">
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Optional, up to 255 characters.
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">255 max</span>
        </div>
      </div>

      {apiError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400"
        >
          {apiError}
        </p>
      )}

      <div className="flex justify-end border-t border-gray-200 pt-5 dark:border-gray-800">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : mode === "create"
              ? "Create permission"
              : "Save description"}
        </Button>
      </div>
    </form>
  );
}
