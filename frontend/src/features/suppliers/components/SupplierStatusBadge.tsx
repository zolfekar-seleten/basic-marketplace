import { Badge } from "@/components/ui/badge";

export function SupplierStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant="light" color={isActive ? "success" : "gray"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
