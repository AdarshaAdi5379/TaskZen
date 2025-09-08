"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "./auth-context";
import { LogOut, Palette, Zap, Gem } from "lucide-react";
import { Button } from "../ui/button";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function UserMenu() {
  const { user, userProfile, signOut } = useAuth();
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const isPro = userProfile?.subscriptionStatus === 'active';

  if (!user) return null;
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name[0];
  }

  const handleUpgrade = async () => {
    setIsRedirecting(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email, userId: user.uid }),
      });

      if (!res.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await res.json();
      // Redirect to Stripe Checkout
      window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;

    } catch (error) {
      console.error("Stripe checkout error:", error);
      toast({
        title: "Error",
        description: "Could not redirect to checkout. Please try again.",
        variant: "destructive"
      });
      setIsRedirecting(false);
    }
  }


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
         {isPro ? (
            <DropdownMenuItem disabled>
                <Gem className="mr-2 h-4 w-4 text-primary" />
                <span>Pro Member</span>
            </DropdownMenuItem>
        ) : (
            <DropdownMenuItem onClick={handleUpgrade} disabled={isRedirecting}>
                <Zap className="mr-2 h-4 w-4" />
                <span>{isRedirecting ? "Redirecting..." : "Upgrade to Pro"}</span>
            </DropdownMenuItem>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("theme-zen")}>
                Zen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("theme-twilight")}>
                Twilight
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("theme-crimson")}>
                Crimson
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
