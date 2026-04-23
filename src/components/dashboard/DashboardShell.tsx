"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
    Car, LogOut, Menu, X,
    LayoutDashboard, Users, Building2, Truck, BarChart3,
    UserCog, MapPin, Settings, CalendarCheck, Navigation, Calendar, History
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "@/app/dashboard.css";

export interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: string;
}

const ROLE_NAV_MAP: Record<string, NavItem[]> = {
    SUPER_ADMIN: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Owners", href: "/admin/owners", icon: Building2 },
        { label: "Fleets", href: "/admin/fleets", icon: Truck },
        { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
    OWNER: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Fleet", href: "/dashboard/fleet", icon: Car },
        { label: "Drivers", href: "/dashboard/drivers", icon: UserCog },
        { label: "Trips", href: "/dashboard/trips", icon: MapPin },
        { label: "Staff", href: "/dashboard/staff", icon: Users },
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
    STAFF: [
        { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
        { label: "Bookings", href: "/staff/bookings", icon: CalendarCheck },
        { label: "Trips", href: "/staff/trips", icon: Navigation },
    ],
    DRIVER: [
        { label: "Dashboard", href: "/driver", icon: LayoutDashboard },
        { label: "Schedule", href: "/driver/schedule", icon: Calendar },
        { label: "History", href: "/driver/history", icon: History },
    ]
};

interface DashboardUser {
    name: string;
    email: string;
    roleLabel: string;
    role: string;
}

interface DashboardShellProps {
    children: React.ReactNode;
    user: DashboardUser;
    accentColor: string;
}

function getInitials(name: string) {
    if (!name) return "U";
    return name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

export default function DashboardShell({
    children,
    user,
    accentColor,
}: DashboardShellProps) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navItems = ROLE_NAV_MAP[user.role] || [];

    const isActive = (href: string) => {
        // exact match for root dashboard pages
        if (["/admin", "/dashboard", "/staff", "/driver"].includes(href)) {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    const cssVars = { "--ds-accent": accentColor } as React.CSSProperties;

    return (
        <div className="ds-shell" style={cssVars}>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="ds-overlay"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ─── Sidebar ─── */}
            <aside className={`ds-sidebar${sidebarOpen ? " ds-sidebar--open" : ""}`}>
                {/* Logo */}
                <div className="ds-logo">
                    <span className="ds-logo-icon">
                        <Car size={16} strokeWidth={2.5} />
                    </span>
                    <span className="ds-logo-name">FluxFleet</span>
                    <button
                        className="ds-sidebar-close"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Role badge */}
                <div className="ds-role-badge">
                    <span className="ds-role-dot" />
                    <span>{user.roleLabel}</span>
                </div>

                {/* Navigation */}
                <nav className="ds-nav" aria-label="Sidebar navigation">
                    <span className="ds-nav-section-label">Menu</span>
                    <ul className="ds-nav-list">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`ds-nav-item${active ? " ds-nav-item--active" : ""}`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                                        <span className="ds-nav-spacer">{item.label}</span>
                                        {item.badge && (
                                            <span className="ds-nav-badge">{item.badge}</span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User footer */}
                <div className="ds-user">
                    <div className="ds-user-avatar">{getInitials(user.name)}</div>
                    <div className="ds-user-info">
                        <span className="ds-user-name">{user.name}</span>
                        <span className="ds-user-email">{user.email}</span>
                    </div>
                    <button
                        className="ds-signout-btn"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* ─── Main area ─── */}
            <div className="ds-main">
                {/* Mobile topbar */}
                <header className="ds-topbar">
                    <button
                        className="ds-menu-btn"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open sidebar"
                    >
                        <Menu size={22} />
                    </button>
                    <span className="ds-topbar-title">FluxFleet</span>
                    <div className="ds-user-avatar ds-topbar-avatar">
                        {getInitials(user.name)}
                    </div>
                </header>

                {/* Page content */}
                <main className="ds-content">{children}</main>
            </div>
        </div>
    );
}
