"use client";

import * as React from "react";

import { NavHeader } from "@/components/ui/nav-header";
import { NavMain } from "@/components/ui/nav-main";
import { NavUser } from "@/components/ui/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar";
import { LayoutDashboard, Building2, BookUser, ClipboardList } from "lucide-react";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg"
  },
  navMain: [
    {
      title: "Dashboard",
      url: "",
      icon: <LayoutDashboard />,
      isActive: true,
      items: [
        {
          title: "Pamasukan",
          url: "#income"
        }
      ]
    },
    {
      title: "Vendor",
      url: "/admin/vendors",
      icon: <Building2 />,
      isActive: true,
      items: [
        {
          title: "Kelola Vendor",
          url: "/admin/vendors#manage"
        },
        {
          title: "Kelola Owner",
          url: "/admin/owners#manage"
        }
      ]
    },
    {
      title: "Laporan",
      url: "#",
      icon: <ClipboardList />,
      items: [
        {
          title: "Laporan Keuangan",
          url: "#"
        }
      ]
    }
  ]
};

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavHeader role="SUPER_ADMIN" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
