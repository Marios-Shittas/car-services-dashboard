"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ serverError = "" }: { serverError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(serverError);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      className="grid gap-5 rounded-lg border border-white/80 bg-white/95 p-6 shadow-2xl shadow-slate-950/12 backdrop-blur-xl"
      action="/api/login"
      method="post"
      onSubmit={onSubmit}
    >
      <input type="hidden" name="callbackUrl" value="/dashboard" />
      <label className="grid gap-2 text-sm font-semibold text-slate-800">
        Email
        <span className="relative block">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            name="email"
            type="email"
            defaultValue="andreas@garageflow.cy"
            placeholder="name@carservicesmgh.com"
            autoComplete="email"
            className="h-12 bg-white pl-10 text-base shadow-sm shadow-slate-950/5"
            required
          />
        </span>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-800">
        Password
        <span className="relative block">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            name="password"
            type="password"
            defaultValue="password123"
            placeholder="Enter password"
            autoComplete="current-password"
            className="h-12 bg-white pl-10 text-base shadow-sm shadow-slate-950/5"
            required
          />
        </span>
      </label>
      {error ? (
        <p className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      ) : null}
      <Button type="submit" className="h-12 text-base font-semibold shadow-lg shadow-primary/20" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Sign in
      </Button>
    </form>
  );
}
