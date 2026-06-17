import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/rbac";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 lg:px-8 lg:py-5">{children}</main>
    </div>
  );
}
