import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import Calendar from "./calendar";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/palette.css";
import "@fullcalendar/react/themes/classic/theme.css";

export default function CalendarPage() {
  return (
    <div>
      <PageMeta
        title="React.js Calendar Dashboard | Dashboard - React.js Admin Dashboard Template"
        description="This is React.js Calendar Dashboard page for Dashboard - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Calendar" />
      <Calendar />
    </div>
  );
}
