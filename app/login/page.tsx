import { getServerSession } from "next-auth";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BadgeCheck, Clock3, FileText, Gauge, Wrench } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/forms/login-form";

const highlights = [
  { label: "Live job cards", icon: Wrench, value: "Active" },
  { label: "Fast invoicing", icon: FileText, value: "Ready" },
  { label: "Daily workshop flow", icon: Clock3, value: "Clear" }
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");
  return (
    <main className="grid min-h-screen bg-slate-950 text-slate-950 lg:grid-cols-[minmax(0,1fr)_540px]">
      <section
        className="relative hidden overflow-hidden bg-cover bg-center lg:block"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(3, 7, 18, 0.08), rgba(3, 7, 18, 0.42) 42%, rgba(3, 7, 18, 0.86)), url('/mgh-building.jpg')"
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.16)_0%,rgba(2,6,23,0.36)_48%,rgba(2,6,23,0.96)_100%)]" />
        <div className="absolute left-8 top-8 flex items-center rounded-md border border-white/15 bg-slate-950/45 px-4 py-3 text-white shadow-2xl shadow-slate-950/30 backdrop-blur xl:left-10 xl:top-10">
          <div>
            <p className="text-sm font-bold leading-5">Car Services MGH</p>
            <p className="text-xs font-medium leading-4 text-slate-300">Staff operations</p>
          </div>
        </div>
        <div className="absolute right-8 top-8 rounded-md border border-emerald-300/25 bg-emerald-400/12 px-4 py-3 text-emerald-50 shadow-2xl shadow-slate-950/20 backdrop-blur xl:right-10 xl:top-10">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BadgeCheck className="h-4 w-4 text-emerald-300" />
            System online
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
          <div className="max-w-3xl text-white">
            <div className="inline-flex items-center gap-2 rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-200 backdrop-blur">
              <Gauge className="h-4 w-4" />
              Workshop command
            </div>
            <h1 className="mt-5 max-w-3xl text-6xl font-bold leading-[1.03] tracking-tight xl:text-7xl">Workshop control, ready before the first lift goes up.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200">
              Staff access for customers, vehicles, active jobs, invoices, and daily service work.
            </p>
            <div className="mt-9 grid max-w-3xl grid-cols-3 gap-3">
              {highlights.map((item) => (
                <div key={item.label} className="flex min-h-28 items-end rounded-md border border-white/15 bg-white/10 p-4 shadow-xl shadow-slate-950/20 backdrop-blur-md">
                  <div className="w-full">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <item.icon className="h-5 w-5 text-amber-300" />
                      <span className="rounded-md bg-slate-950/45 px-2 py-1 text-xs font-semibold text-slate-200">{item.value}</span>
                    </div>
                    <p className="text-base font-semibold leading-5 text-slate-50">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cover bg-center px-6 py-10 lg:bg-none"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(248, 250, 252, 0.92), rgba(238, 242, 247, 0.96)), url('/mgh-building.jpg')"
        }}
      >
        <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_22%_18%,rgba(13,148,136,0.18),transparent_30%),radial-gradient(circle_at_80%_74%,rgba(245,158,11,0.22),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] lg:block" />
        <div className="relative w-full max-w-[410px]">
          <div className="mb-8">
            <div className="mb-7 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-950 shadow-xl shadow-slate-950/20">
              <Image src="/mgh-sidebar-logo.svg" alt="Car Services MGH" width={64} height={64} className="h-full w-full object-cover" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Staff portal</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">Welcome back</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">Sign in to manage today&apos;s workshop schedule.</p>
          </div>
          <LoginForm serverError={error ? "Invalid email or password." : ""} />
          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
            <BadgeCheck className="h-4 w-4 text-primary" />
            Demo password for all seed accounts: password123
          </div>
        </div>
      </section>
    </main>
  );
}
