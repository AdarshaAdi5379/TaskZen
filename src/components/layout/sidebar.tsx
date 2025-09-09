
"use client";

import React from 'react';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  BarChartBig,
  CheckSquare,
  CreditCard,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../auth/auth-context';
import { ThemeToggle } from '../theme-toggle';
import { TaskZenIcon } from '../todo/taskzen-icon';

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name[0];
}

export function Sidebar() {
  const { user, userProfile, signOut } = useAuth();
  const { state } = useSidebar();
  const isPro = userProfile?.subscriptionStatus === 'active';
  
  if (!user) return null;

  return (
    <SidebarPrimitive>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <TaskZenIcon className="h-7 w-7 text-primary" />
             {state === 'expanded' && <h1 className="text-xl font-semibold tracking-tight">TaskZen</h1>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Dashboard" isActive>
              <LayoutDashboard />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Tasks">
              <CheckSquare />
              <span>Tasks</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="History">
              <History />
              <span>History</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Subscription">
              <CreditCard />
              <span>Subscription</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

            {isPro && (
                 <>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Analytics">
                            <BarChartBig />
                            <span>Analytics</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Smart Suggestions">
                            <Sparkles />
                            <span>Smart Suggestions</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                 </>
            )}

          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="flex-col !gap-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
                <Avatar className="size-8">
                    <AvatarImage src={user.photoURL ?? ''} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                {state === 'expanded' && (
                    <span className="truncate text-sm font-medium">
                    {user.displayName}
                    </span>
                )}
            </div>
            {state === 'expanded' && <ThemeToggle />}
        </div>
         <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip="Logout">
                    <LogOut />
                    <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}

export { SidebarProvider, SidebarInset, useSidebar, SidebarTrigger } from '@/components/ui/sidebar';
