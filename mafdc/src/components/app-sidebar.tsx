"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Cookies from "js-cookie"
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconLogout,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Appointments",
      url: "/appointments",
      icon: IconListDetails,
    },
    {
      title: "Patients",
      url: "/patients/list",
      
      icon: IconChartBar,
    }
  ];

  const navSecondary = [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/dashboard/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
    {
      title: "Logout",
      url: "#",
      icon: IconLogout,
      onClick: () => {
        console.log("Logging out...");
        logout();
      },
    },
  ];

  const userData = adminData ? {
    name: `${adminData.firstName} ${adminData.lastName}`,
    email: adminData.email,
    avatar: "/avatars/user.jpg",
  } : {
    name: "User",
    email: "user@example.com",
    avatar: "/avatars/user.jpg",
  };

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
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

    </Sidebar>
  )
}
