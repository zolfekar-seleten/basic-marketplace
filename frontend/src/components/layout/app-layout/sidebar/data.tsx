import { BoxIcon, KeyIcon, LayoutGridIcon, TagIcon, UsersIcon } from "@/icons";
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
  {
    icon: <UsersIcon className="size-6" />,
    key: "roles",
    path: "/dashboard/admin/roles",
    adminOnly: true,
  },
  {
    icon: <TagIcon className="size-6" />,
    key: "categories",
    path: "/dashboard/admin/categories",
    adminOnly: true,
  },
  {
    icon: <BoxIcon className="size-6" />,
    key: "productManagement",
    path: "/dashboard/supplier/products",
    supplierOnly: true,
  },
];

export const othersItems: NavItem[] = [];
export const supportItems: NavItem[] = [];
