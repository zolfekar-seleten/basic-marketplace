import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { getApiErrorMessage } from "@/api/client";
import {
  AuthPageShell,
  authInputClassName,
  authLabelClassName,
} from "../components/AuthPageShell";
import { useAuth } from "../hooks/useAuth";

const schema = z
  .object({
    name: z.string().trim().min(1, "Enter your name").max(150),
    email: z.string().trim().email("Enter a valid email address").max(255),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setSubmitError(null);
    try {
      await registerAccount({ name, email, password });
      void navigate("/", { replace: true });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  });

  return (
    <AuthPageShell
      title="Create a buyer account"
      subtitle="Register to shop on Watermelon Market."
      footer={
        <>
          Already have an account?{" "}
          <Link className="auth-text-link" to="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label className={authLabelClassName} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            autoComplete="name"
            {...register("name")}
            className={authInputClassName}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className={authLabelClassName} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className={authInputClassName}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className={authLabelClassName} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            className={authInputClassName}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>
        <div>
          <label className={authLabelClassName} htmlFor="confirmPassword">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            className={authInputClassName}
            aria-invalid={Boolean(errors.confirmPassword)}
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
        </div>
        {submitError && <p role="alert" className="text-sm text-red-600">{submitError}</p>}
        <button type="submit" disabled={isSubmitting} className="auth-submit-button">
            {isSubmitting ? "Creating account…" : "Create buyer account"}
          </button>
      </form>
    </AuthPageShell>
  );
}
