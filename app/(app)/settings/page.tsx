import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

export default async function SettingsPage() {
  await requireAdmin();
  const [settings, users] = await Promise.all([prisma.workshopSetting.findFirst(), prisma.user.findMany({ orderBy: { name: "asc" } })]);
  return (
    <div className="grid gap-6">
      <header><h1 className="text-2xl font-bold">Settings</h1><p className="text-sm text-muted-foreground">Workshop identity, VAT defaults, users, roles, and labor rates.</p></header>
      <Card><CardHeader><h2 className="font-semibold">Workshop Details</h2></CardHeader><CardContent className="grid gap-1 text-sm">{settings ? <><p className="font-semibold">{settings.companyName}</p><p>{settings.address}</p><p>{settings.phone} · {settings.email}</p><p>VAT {settings.vatNumber} · Registration {settings.registrationNumber}</p><p>Default VAT {String(settings.defaultVatRate)}%</p></> : <p>No settings found.</p>}</CardContent></Card>
      <Card><CardHeader><h2 className="font-semibold">Users</h2></CardHeader><CardContent className="overflow-x-auto p-0"><Table><thead><tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Labor Rate</Th><Th>Active</Th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><Td>{user.name}</Td><Td>{user.email}</Td><Td>{user.role}</Td><Td>€{String(user.hourlyRate)}</Td><Td>{user.active ? "Yes" : "No"}</Td></tr>)}</tbody></Table></CardContent></Card>
    </div>
  );
}
