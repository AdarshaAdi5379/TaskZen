"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskZenIcon } from "../todo/taskzen-icon";
import { useAuth } from "./auth-context";

export function Login() {
  const { signInWithGoogle } = useAuth();

  return (
    <Card className="w-full max-w-sm shadow-2xl backdrop-blur-sm bg-card/80 dark:bg-card/60 border-2">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-3 mb-2">
            <TaskZenIcon className="h-8 w-8 text-primary" />
            <CardTitle className="text-4xl font-bold tracking-tight">TaskZen</CardTitle>
        </div>
        <p className="text-muted-foreground">Sign in to sync your tasks</p>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={signInWithGoogle}>
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 64.5c-20.3-19.1-49.3-30.8-82.6-30.8-62.8 0-113.4 50.6-113.4 113.3s50.6 113.3 113.4 113.3c71.5 0 99.1-53.8 103.8-78.9H248v-96.2h239.2c1.3 12.8 2.3 26.6 2.3 41.8z"></path></svg>
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  );
}
