"use client";

import * as React from "react";
import {
  AudioWaveform,
  CircleUserRound,
  Command,
  GalleryVerticalEnd,
  LayoutDashboard,
  Settings2,
  Van,
} from "lucide-react";

import { NavProjects } from "@/components/vendor/nav-projects";
import { NavUser } from "@/components/vendor/nav-user";
import { TeamSwitcher } from "@/components/vendor/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Today",
          url: "/admin",
        },
      ],
    },
    {
      title: "Pengaturan",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Profil",
          url: "/admin/profile",
        },
        {
          title: "Sopir",
          url: "/admin/driver",
        },
        {
          title: "Mobil",
          url: "/admin/cars",
        },
        {
          title: "Rute",
          url: "/admin/route",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Dashboard",
      url: "/driver",
      icon: LayoutDashboard,
    },
    {
      name: "My Trips",
      url: "/driver/trips",
      icon: Van,
    },
    {
      name: "Profile",
      url: "/driver/profile",
      icon: CircleUserRound,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
