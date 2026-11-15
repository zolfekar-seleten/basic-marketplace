import { ComponentCard } from "@/components/shared/component-card";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import BarChartOne from "./components/one";

export default function BarChartPage() {
  return (
    <div>
      <PageMeta
        title="React.js Chart Dashboard | Dashboard - React.js Admin Dashboard Template"
        description="This is React.js Chart Dashboard page for Dashboard - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Bar Chart" />
      <div className="space-y-6 overflow-x-hidden">
        <ComponentCard title="Bar Chart 1">
          <BarChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
