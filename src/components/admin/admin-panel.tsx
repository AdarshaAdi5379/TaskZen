"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export function AdminPanel() {
  return (
    <Card className="w-full max-w-4xl shadow-2xl backdrop-blur-sm bg-card/80 dark:bg-card/60 border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <CardTitle className="text-3xl font-bold tracking-tight">Admin Panel</CardTitle>
        </div>
         <p className="text-muted-foreground">Manage users, subscriptions, and application settings.</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Admin features will be added here.</p>
        </div>
      </CardContent>
    </Card>
  );
}
