import { SidebarHeader } from "@/components/ui/sidebar";
import { LayoutGridIcon } from "@/icons";
import { Link } from "react-router";

interface AppSidebarHeaderProps {
  showContent: boolean;
}

export default function AppSidebarHeader({
  showContent,
}: AppSidebarHeaderProps) {
  return (
    <SidebarHeader className="px-5 py-8">
      <Link to="/dashboard">
        {showContent ? (
          <span className="flex h-10 items-center gap-3 text-lg font-semibold text-gray-800 dark:text-white/90"><LayoutGridIcon className="size-7 text-[#ec187b]" />Dashboard</span>
        ) : (
          <LayoutGridIcon className="size-8 text-[#ec187b]" aria-label="Dashboard" />
        )}
      </Link>
    </SidebarHeader>
  );
}
