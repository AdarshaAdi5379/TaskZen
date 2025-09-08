
"use client";

import type { UserProfile } from "@/components/auth/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Shield, UserCog, UserX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface UserListProps {
  users: UserProfile[];
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name[0];
}

export function UserList({ users }: UserListProps) {
    const { toast } = useToast();

    const updateUser = async (uid: string, data: Partial<UserProfile>) => {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, data);
            toast({
                title: "Success",
                description: `User has been updated.`,
            });
        } catch (error) {
            console.error("Error updating user:", error);
            toast({
                title: "Error",
                description: "Failed to update user.",
                variant: "destructive",
            });
        }
    }


  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="hidden sm:table-cell">Role</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Created At</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.uid}>
              <TableCell>
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="font-medium">
                        <p>{user.displayName}</p>
                        <p className="text-sm text-muted-foreground md:hidden">{user.email}</p>
                    </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                 <Badge variant={user.status === 'active' ? 'outline' : 'destructive'}>
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role !== 'admin' && (
                        <DropdownMenuItem onClick={() => updateUser(user.uid, { role: 'admin' })}>
                            <Shield className="mr-2 h-4 w-4"/>
                            Make Admin
                        </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                         <DropdownMenuItem onClick={() => updateUser(user.uid, { role: 'user' })}>
                            <UserCog className="mr-2 h-4 w-4"/>
                            Make User
                        </DropdownMenuItem>
                    )}
                    {user.status !== 'suspended' && (
                        <DropdownMenuItem className="text-destructive" onClick={() => updateUser(user.uid, { status: 'suspended' })}>
                           <UserX className="mr-2 h-4 w-4"/>
                           Suspend User
                        </DropdownMenuItem>
                    )}
                    {user.status === 'suspended' && (
                        <DropdownMenuItem onClick={() => updateUser(user.uid, { status: 'active' })}>
                           <UserCog className="mr-2 h-4 w-4"/>
                           Re-activate User
                        </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
