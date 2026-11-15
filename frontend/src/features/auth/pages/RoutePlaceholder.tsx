export default function RoutePlaceholder({ title }: { title: string }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        This page is reserved for a future marketplace feature.
      </p>
    </section>
  );
}
