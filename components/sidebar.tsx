import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SidebarClient } from "@/components/sidebar-client";

export async function Sidebar() {
  const session = await getServerSession(authOptions);
  return <SidebarClient user={session?.user} />;
}
