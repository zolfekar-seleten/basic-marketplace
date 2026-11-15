import { KeyIcon, LayoutGridIcon, UsersIcon } from "@/icons";
import type { NavItem } from "./types";

export const navItems: NavItem[] = [
  {
    icon: <LayoutGridIcon className="size-6" />,
    key: "dashboard",
    path: "/dashboard",
  },
  {
    icon: <UsersIcon className="size-6" />,
    key: "suppliers",
    path: "/dashboard/admin/suppliers",
    adminOnly: true,
  },
  {
    icon: <KeyIcon className="size-6" />,
    key: "permissions",
    path: "/dashboard/admin/permissions",
    adminOnly: true,
  },
];

export const othersItems: NavItem[] = [];
export const supportItems: NavItem[] = [];
