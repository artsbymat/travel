"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";

export function NavUser({
  user
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex min-w-0 items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:px-0">
          <Avatar className="size-9 shrink-0 group-data-[collapsible=icon]:size-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden text-left group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="text-muted-foreground truncate text-xs">{user.email}</span>
          </div>

          <SidebarMenuButton
            aria-label="Logout"
            className="ml-auto size-8 shrink-0 justify-center p-0 text-destructive hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:ml-0"
            onClick={() => signOut({ callbackUrl: "/login" })}
            tooltip="Logout"
          >
            <LogOutIcon />
            <span className="sr-only">Logout</span>
          </SidebarMenuButton>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
