import type { ReactNode } from "react";

export function RolePageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
