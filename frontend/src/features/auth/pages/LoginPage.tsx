import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { z } from "zod";
import { getApiErrorMessage } from "@/api/client";
import {
  AuthPageShell,
  authInputClassName,
  authLabelClassName,
} from "../components/AuthPageShell";
import { homeForRole } from "../utils/auth-routing";
import { useAuth } from "../hooks/useAuth";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const user = await login(values);
      const destination = (location.state as { from?: unknown } | null)?.from;
      const home = homeForRole(user.role.name);
      const rolePrefix =
        user.role.name === "admin"
          ? "/dashboard/admin"
          : user.role.name === "supplier"
            ? "/dashboard/supplier"
            : null;
      const canReturnToDestination =
        typeof destination === "string" &&
        destination.startsWith("/") &&
        (user.role.name === "buyer"
          ? ["/cart", "/checkout", "/my-orders"].some(
              (path) => destination === path || destination.startsWith(`${path}/`),
            )
          : rolePrefix !== null &&
            (destination === rolePrefix || destination.startsWith(`${rolePrefix}/`)));
      void navigate(canReturnToDestination ? destination : home, { replace: true });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  });

  return (
    <AuthPageShell
      title="Sign in to your account"
      subtitle="Use your Watermelon Market account to continue."
      footer={
        <>
          New to Watermelon Market?{" "}
          <Link className="auth-text-link" to="/register">
            Create a buyer account
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div>
          <label className={authLabelClassName} htmlFor="email">Email</label>
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
          <label className={authLabelClassName} htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password")}
              className={`${authInputClassName} pe-20`}
              aria-invalid={Boolean(errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="auth-text-link absolute inset-y-0 end-3 my-auto text-sm"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>
        {submitError && <p role="alert" className="text-sm text-red-600">{submitError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="auth-submit-button"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthPageShell>
  );
}
