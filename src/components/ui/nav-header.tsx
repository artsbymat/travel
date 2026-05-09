import * as React from "react";
import { ShieldCheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Role = "SUPER_ADMIN" | "OWNER" | "STAFF" | "DRIVER";

const ROLE_CONFIG: Record<
  Role,
  {
    label: string;
    className: string;
  }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    className: "bg-purple-500/10 text-purple-600"
  },
  OWNER: {
    label: "Owner",
    className: "bg-red-500/10 text-red-600"
  },
  STAFF: {
    label: "Staff",
    className: "bg-blue-500/10 text-blue-600"
  },
  DRIVER: {
    label: "Driver",
    className: "bg-green-500/10 text-green-600"
  }
};

export function NavHeader({
  appName = "Travel",
  role = "SUPER_ADMIN",
  icon = <ShieldCheckIcon className="h-5 w-5" />
}: {
  appName?: string;
  role?: Role;
  icon?: React.ReactNode;
}) {
  const roleConfig = ROLE_CONFIG[role];

  return (
    <div className="flex min-w-0 items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl group-data-[collapsible=icon]:size-8">
        {icon}
      </div>
      <div className="flex min-w-0 flex-col gap-1 leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate text-sm font-semibold tracking-tight">{appName}</span>
        <span className={cn("w-fit rounded-md px-2 text-[10px] font-medium", roleConfig.className)}>
          {roleConfig.label}
        </span>
      </div>
    </div>
  );
}
