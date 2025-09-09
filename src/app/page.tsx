
"use client";

import { TodoApp } from "@/components/todo/todo-app";
import { useAuth } from "@/components/auth/auth-context";
import { Login } from "@/components/auth/login";
import { Loader2 } from "lucide-react";
import { AdminPanel } from "@/components/admin/admin-panel";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/layout/sidebar";

export default function Home() {
  const { user, isAdmin, loading } = useAuth();

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    if (!user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
            <Login />
        </div>
      )
    }
    
    return (
        <SidebarProvider>
            <Sidebar />
            <SidebarInset>
                {isAdmin ? <AdminPanel /> : <TodoApp />}
            </SidebarInset>
        </SidebarProvider>
    );
  };

  return (
    <div className="relative min-h-screen flex-col">
       {renderContent()}
    </div>
  );
}
