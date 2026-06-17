"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  function handleSignOut() {
    const callbackUrl = new URL("/login", window.location.origin).toString();
    void signOut({ callbackUrl });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size={compact ? "icon" : "sm"}
      className={cn("mt-3", compact ? "w-10 lg:mx-auto" : "w-full")}
      aria-label="Sign out"
      title="Sign out"
      onClick={handleSignOut}
    >
      <LogOut className="h-4 w-4" />
      <span className={cn(compact && "lg:hidden")}>Sign out</span>
    </Button>
  );
}
