"use client";

import { TodoApp } from "@/components/todo/todo-app";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth/auth-context";
import { Login } from "@/components/auth/login";
import { UserMenu } from "@/components/auth/user-menu";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start sm:justify-center p-4 sm:p-6">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        {user && <UserMenu />}
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : user ? (
        <TodoApp />
      ) : (
        <Login />
      )}
    </div>
  );
}
