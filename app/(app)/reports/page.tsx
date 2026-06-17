import { BarChart3, Download, FileSpreadsheet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { eur } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

export default async function ReportsPage() {
  const [invoices, labor, jobs, customers, vehicles] = await Promise.all([
    prisma.invoice.findMany({ include: { customer: true }, orderBy: { issueDate: "desc" } }),
    prisma.laborEntry.findMany({ include: { mechanic: true } }),
    prisma.repairJob.findMany(),
    prisma.customer.findMany({ include: { invoices: true, vehicles: true } }),
    prisma.vehicle.count()
  ]);
  const revenue = invoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0);
  const openBalance = invoices.filter((invoice) => !invoice.paid).reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0);
  const laborHours = labor.reduce((sum, entry) => sum + Number(entry.hoursWorked), 0);
  const openJobs = jobs.filter((job) => ["PENDING", "WAITING_FOR_PARTS", "IN_PROGRESS"].includes(job.status)).length;
  const completedJobs = jobs.filter((job) => ["COMPLETED", "DELIVERED"].includes(job.status)).length;
  const topCustomers = customers
    .map((customer) => ({
      name: customer.fullName,
      vehicles: customer.vehicles.length,
      invoices: customer.invoices.length,
      total: customer.invoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const monthlyRevenue = Object.values(
    invoices.reduce<Record<string, { month: string; invoices: number; revenue: number; open: number }>>((acc, invoice) => {
      const key = invoice.issueDate.toISOString().slice(0, 7);
      acc[key] ??= { month: key, invoices: 0, revenue: 0, open: 0 };
      acc[key].invoices += 1;
      acc[key].revenue += Number(invoice.grandTotal);
      if (!invoice.paid) acc[key].open += Number(invoice.grandTotal);
      return acc;
    }, {})
  ).sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Money collected, unpaid balances, workshop load, and loyal customers.</p>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Button asChild variant="secondary"><a href="/api/reports?format=monthly-csv"><BarChart3 className="h-4 w-4" /> Monthly CSV</a></Button>
          <Button asChild variant="secondary"><a href="/api/reports?format=operations-csv"><FileSpreadsheet className="h-4 w-4" /> Operations CSV</a></Button>
          <Button asChild variant="secondary"><a href="/api/reports?format=csv"><Download className="h-4 w-4" /> Invoices CSV</a></Button>
          <Button asChild><a href="/api/reports?format=pdf"><Download className="h-4 w-4" /> PDF</a></Button>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">{eur(revenue)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-muted-foreground">Open Balance</p><p className="text-2xl font-bold">{eur(openBalance)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-muted-foreground">Labor Hours</p><p className="text-2xl font-bold">{laborHours.toFixed(1)}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-muted-foreground">Workshop Load</p><p className="text-2xl font-bold">{openJobs} open</p><p className="text-xs text-muted-foreground">{completedJobs} completed/delivered · {vehicles} vehicles</p></CardContent></Card>
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><h2 className="font-semibold">Monthly Revenue</h2></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table><thead><tr><Th>Month</Th><Th>Invoices</Th><Th>Revenue</Th><Th>Open</Th></tr></thead><tbody>{monthlyRevenue.map((month) => <tr key={month.month}><Td>{month.month}</Td><Td>{month.invoices}</Td><Td>{eur(month.revenue)}</Td><Td>{eur(month.open)}</Td></tr>)}</tbody></Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold">Top Customers</h2></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table><thead><tr><Th>Customer</Th><Th>Vehicles</Th><Th>Invoices</Th><Th>Total Revenue</Th></tr></thead><tbody>{topCustomers.map((customer) => <tr key={customer.name}><Td>{customer.name}</Td><Td>{customer.vehicles}</Td><Td>{customer.invoices}</Td><Td>{eur(customer.total)}</Td></tr>)}</tbody></Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
