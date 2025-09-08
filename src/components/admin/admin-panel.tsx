
"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/components/auth/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import { UserList } from "./user-list";
import { useToast } from "@/hooks/use-toast";

export function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
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
  }, [toast]);

  return (
    <Card className="w-full max-w-6xl shadow-2xl backdrop-blur-sm bg-card/80 dark:bg-card/60 border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <CardTitle className="text-3xl font-bold tracking-tight">Admin Panel</CardTitle>
        </div>
         <p className="text-muted-foreground">Manage users, subscriptions, and application settings.</p>
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
  );
}
