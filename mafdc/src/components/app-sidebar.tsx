"use client"

import * as React from "react"
import { useEffect, useState, useMemo, useCallback } from "react"
import Cookies from "js-cookie"
import {
  IconChartBar,
  IconDashboard,
  IconInnerShadowTop,
  IconListDetails,
  IconLogout,
  IconMessageCircle,
  IconSettings
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useLogin } from "@/hooks/loginController"

interface AdminData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { logout } = useLogin();
  const [adminData, setAdminData] = useState<AdminData | null>(null);

  useEffect(() => {
    // Get admin data from cookie
    const adminDataStr = Cookies.get('adminData');
    if (adminDataStr) {
      try {
        const data = JSON.parse(adminDataStr);
        setAdminData(data);
      } catch (error) {
        console.error('Error parsing admin data', error);
      }
    }
  }, []);

  // Memoize navigation items to prevent unnecessary re-renders
  const navMain = useMemo(() => [
    {
      title: "Appointments",
      url: "/appointments",
      icon: IconListDetails,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Patients",
      url: "/patients/list",
      icon: IconChartBar,
    },
    {
      title: "Inquiries",
      url: "/inquiries",
      icon: IconMessageCircle,
    },
    {
      title: "Logs",
      url: "/logs",
      icon: IconListDetails,
    }
  ], []);

  // Memoize the logout handler
  const handleLogout = useCallback(() => {
    console.log("Logging out...");
    logout();
  }, [logout]);

  // Memoize secondary navigation items
  const navSecondary = useMemo(() => [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Logout",
      url: "#",
      icon: IconLogout,
      onClick: handleLogout,
    },
  ], [handleLogout]);

  // Memoize user info
  const userInfo = useMemo(() => adminData ? {
    name: `${adminData.firstName} ${adminData.lastName}`,
    email: adminData.email,
    avatar: "/avatars/user.jpg",
  } : {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/user.jpg",
  }, [adminData]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">MA Florencio Dental Clinic</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-4">
            <div className="flex items-center gap-3 px-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{userInfo.name}</span>
                <span className="text-xs text-muted-foreground">{userInfo.email}</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}
