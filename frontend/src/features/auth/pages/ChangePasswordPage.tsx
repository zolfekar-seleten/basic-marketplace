import { getApiErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { changePassword } from "@/features/auth/api/auth.api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { homeForRole } from "@/features/auth/utils/auth-routing";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

const passwordSchema = z.string().refine((value) => new TextEncoder().encode(value).length <= 72, "Password must be 72 bytes or fewer");
const schema = z.object({
  currentPassword: z.string().min(1, "Enter your current password").and(passwordSchema),
  newPassword: z.string().min(8, "Use at least 8 characters").and(passwordSchema),
  confirmPassword: z.string().min(1, "Confirm your new password"),
}).refine((values) => values.newPassword === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
}).refine((values) => values.currentPassword !== values.newPassword, {
  path: ["newPassword"],
  message: "Your new password must be different from your current password",
});

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setSubmitError(null);
    try {
      await changePassword({ currentPassword, newPassword });
      reset();
      void navigate(homeForRole(user?.role.name ?? "buyer"), { replace: true });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  });

  return <>
    <PageMeta title="Change password | Watermelon Market" description="Update your Watermelon Market password" />
    <PageBreadcrumb pageTitle="Change password" />
    <Card className="max-w-3xl gap-0 p-0">
      <CardHeader className="border-b border-gray-100 p-5 sm:p-6 dark:border-gray-800">
        <CardTitle>Change password</CardTitle>
        <CardDescription>Choose a strong password you don’t use elsewhere. Your current password is required to save the change.</CardDescription>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <Field data-invalid={Boolean(errors.currentPassword)}>
            <FieldLabel htmlFor="current-password">Current password</FieldLabel>
            <Input id="current-password" type="password" autoComplete="current-password" placeholder="Enter current password" aria-invalid={Boolean(errors.currentPassword)} {...register("currentPassword")} />
            <FieldError errors={[errors.currentPassword]} />
          </Field>
          <Field data-invalid={Boolean(errors.newPassword)}>
            <FieldLabel htmlFor="new-password">New password</FieldLabel>
            <Input id="new-password" type="password" autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={Boolean(errors.newPassword)} {...register("newPassword")} />
            <FieldError errors={[errors.newPassword]} />
          </Field>
          <Field data-invalid={Boolean(errors.confirmPassword)}>
            <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
            <Input id="confirm-password" type="password" autoComplete="new-password" placeholder="Re-enter new password" aria-invalid={Boolean(errors.confirmPassword)} {...register("confirmPassword")} />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>
          {submitError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{submitError}</p>}
          <div className="flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving password…" : "Save new password"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </>;
}
