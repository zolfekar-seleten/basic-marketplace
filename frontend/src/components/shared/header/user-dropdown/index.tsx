import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ChevronDownIcon, KeyIcon, LogOutIcon, UserCircleIcon } from "@/icons";
import { cn } from "@/utils";
import { useState } from "react";
import { useNavigate } from "react-router";

export default function UserDropdown() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    void navigate("/login", { replace: true });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400">
        <span className="me-3 flex size-11 items-center justify-center rounded-full bg-pink-50 text-[#ec187b] dark:bg-pink-500/10">
          <UserCircleIcon className="size-6" aria-hidden="true" />
        </span>

        <span className="me-1 block text-sm font-medium">
          {user?.name ?? "Account"}
        </span>

        <ChevronDownIcon
          className={cn(
            "size-5 text-gray-500 duration-200 dark:text-gray-400",
            isOpen ? "rotate-180" : "rotate-0",
          )}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={12} className="w-65 p-3">
        <div className="px-3 py-2">
          <span className="block text-sm font-medium text-gray-700 dark:text-gray-400">
            {user?.name ?? "Account"}
          </span>
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
            {user?.email ?? ""}
          </span>
        </div>

        <DropdownMenuItem onClick={() => { setIsOpen(false); void navigate("/account/change-password"); }}>
          <KeyIcon />
          Change password
        </DropdownMenuItem>

        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
