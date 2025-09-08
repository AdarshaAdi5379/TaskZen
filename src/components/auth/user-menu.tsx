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
import useRazorpay from "@/hooks/use-razorpay";

export function UserMenu() {
  const { user, userProfile, signOut } = useAuth();
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const razorpay = useRazorpay();
  
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
      const res = await fetch('/api/razorpay/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create subscription');
      }

      const { subscriptionId } = await res.json();
      
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        subscription_id: subscriptionId,
        name: "TaskZen Pro",
        description: "Annual Subscription",
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_subscription_id: response.razorpay_subscription_id,
                    razorpay_signature: response.razorpay_signature,
                    userId: user.uid,
                }),
            });

            if (!verifyRes.ok) {
              const error = await verifyRes.json();
              throw new Error(error.message || "Payment verification failed");
            }
            
            toast({
              title: "Success!",
              description: "You are now a Pro member.",
            });

          } catch (error) {
              const e = error as Error;
              toast({ title: "Verification Failed", description: e.message, variant: 'destructive' });
          } finally {
            setIsRedirecting(false);
          }
        },
        prefill: {
            name: user.displayName || '',
            email: user.email || '',
        },
        theme: {
            color: "#64B5F6"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

      rzp.on('payment.failed', function (response: any){
        toast({
            title: "Payment Failed",
            description: response.error.description,
            variant: "destructive",
        });
        setIsRedirecting(false);
      });


    } catch (error) {
      console.error("Razorpay checkout error:", error);
      const e = error as Error;
      toast({
        title: "Error",
        description: e.message || "Could not start checkout. Please try again.",
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
                <span>{isRedirecting ? "Processing..." : "Upgrade to Pro"}</span>
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
