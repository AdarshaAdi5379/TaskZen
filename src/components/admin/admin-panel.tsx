
"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { UserProfile } from "@/components/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import { UserList } from "./user-list";
import { useToast } from "@/hooks/use-toast";
import { SidebarTrigger } from "../layout/sidebar";

export function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const db = getFirebaseDb();
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(), // Convert Timestamp to Date
        })) as UserProfile[];
        setUsers(usersData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching users:", error);
        toast({ title: "Error", description: "Could not fetch users.", variant: "destructive" });
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Failed to get DB instance in AdminPanel", e);
      toast({ title: "Error", description: "Could not connect to the database.", variant: "destructive" });
      setLoading(false);
    }
  }, [toast]);

  return (
    <main className="p-4 sm:p-6 w-full max-w-6xl mx-auto">
        <Card className="w-full shadow-2xl backdrop-blur-sm bg-card/80 dark:bg-card/60 border-2">
            <CardHeader className="flex flex-row items-center gap-3">
                <SidebarTrigger className="md:hidden"/>
                <Shield className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Admin Panel</CardTitle>
                    <p className="text-muted-foreground">Manage users, subscriptions, and application settings.</p>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                ) : (
                <UserList users={users} />
                )}
            </CardContent>
        </Card>
    </main>
  );
}
