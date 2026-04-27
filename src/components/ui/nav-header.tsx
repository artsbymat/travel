import * as React from "react";
import { ShieldCheckIcon } from "lucide-react";

const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OWNER: "OWNER",
  STAFF: "STAFF",
  DRIVER: "DRIVER"
} as const;

type Role = (typeof ROLES)[keyof typeof ROLES];

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
  appName = "MyAdmin",
  role = "SUPER_ADMIN",
  icon = <ShieldCheckIcon className="h-5 w-5" />
}: {
  appName?: string;
  role?: Role;
  icon?: React.ReactNode;
}) {
  const roleConfig = ROLE_CONFIG[role];

  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-xl">
        {icon}
      </div>
      <div className="flex flex-col gap-1 leading-tight">
        <span className="text-sm font-semibold tracking-tight">{appName}</span>
        <span className={`w-fit rounded-md px-2 text-[10px] font-medium ${roleConfig.className}`}>
          {roleConfig.label}
        </span>
      </div>
    </div>
  );
}
