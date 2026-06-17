"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, ClipboardList, FileText, Home, LineChart, Menu, PanelLeftClose, PanelLeftOpen, Settings, Users, Wrench, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home, group: "Overview" },
  { href: "/customers", label: "Customers", icon: Users, group: "Workshop" },
  { href: "/vehicles", label: "Vehicles", icon: Car, group: "Workshop" },
  { href: "/jobs", label: "Jobs", icon: Wrench, group: "Workshop" },
  { href: "/work", label: "Work", icon: ClipboardList, group: "Workshop" },
  { href: "/invoices", label: "Invoices", icon: FileText, group: "Finance" },
  { href: "/reports", label: "Reports", icon: LineChart, group: "Finance" },
  { href: "/settings", label: "Settings", icon: Settings, group: "System" }
];

type SidebarClientProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
};

export function SidebarClient({ user }: SidebarClientProps) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const ToggleIcon = open ? PanelLeftClose : PanelLeftOpen;
  const visibleItems = items.filter((item) => item.href !== "/settings" || user?.role === "ADMIN");
  const groups = Array.from(new Set(visibleItems.map((item) => item.group)));

  return (
    <aside
      className={cn(
        "no-print flex w-full min-w-0 flex-col border-b border-border bg-card px-3 py-3 transition-all duration-200 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-3 lg:py-5",
        open ? "lg:w-64" : "lg:w-[76px]"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard" className={cn("flex min-w-0 items-center gap-3", !open && "lg:justify-center")}>
          <span className={cn("min-w-0 lg:transition-opacity", !open && "lg:hidden")}>
            <span className="block text-lg font-bold">Car Services MGH</span>
            <span className="block text-xs text-muted-foreground">Workshop Management</span>
          </span>
        </Link>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="hidden lg:inline-flex"
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          title={open ? "Close sidebar" : "Open sidebar"}
          onClick={() => setOpen((current) => !current)}
        >
          <ToggleIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          title={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      <div className={cn("mt-3 grid gap-3 lg:mt-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col", !open && "hidden lg:flex")}>
        <nav className="grid gap-4">
          {groups.map((group) => (
            <div key={group} className="grid gap-1">
              <p className={cn("px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70", !open && "lg:hidden")}>{group}</p>
              {visibleItems
                .filter((item) => item.group === group)
                .map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex h-11 min-w-0 items-center gap-3 rounded-md px-2 text-sm font-semibold transition",
                        active
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        !open && "lg:justify-center lg:px-0"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition",
                          active
                            ? "border-white/20 bg-white/15 text-primary-foreground"
                            : "border-border bg-background text-muted-foreground group-hover:border-primary/20 group-hover:text-primary"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className={cn("truncate", !open && "lg:hidden")}>{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        <div className={cn("rounded-lg border border-border bg-background p-3 lg:mt-auto", !open && "lg:border-0 lg:bg-transparent lg:p-0")}>
          <div className={cn(!open && "lg:hidden")}>
            <div className="mb-3 flex justify-center">
              <img src="/mgh-sidebar-logo.svg" alt="Car Services MGH" className="h-24 w-24 rounded-full object-contain shadow-lg shadow-slate-950/15" />
            </div>
            <p className="text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            <p className="mt-1 text-xs font-medium text-primary">{user?.role}</p>
          </div>
          <SignOutButton compact={!open} />
        </div>
      </div>
    </aside>
  );
}
