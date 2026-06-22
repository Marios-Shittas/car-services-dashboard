import Image from "next/image";
import { Briefcase, Car, CheckCircle2, FileText, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { eur } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCharts } from "@/components/dashboard-charts";

export default async function DashboardPage() {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startYear = new Date(now.getFullYear(), 0, 1);
  const [today, month, year, openJobs, completedJobs, customers, vehicles, invoices, laborByMechanic] = await Promise.all([
    prisma.invoice.aggregate({ where: { issueDate: { gte: startToday } }, _sum: { grandTotal: true } }),
    prisma.invoice.aggregate({ where: { issueDate: { gte: startMonth } }, _sum: { grandTotal: true } }),
    prisma.invoice.aggregate({ where: { issueDate: { gte: startYear } }, _sum: { grandTotal: true } }),
    prisma.repairJob.count({ where: { status: { in: ["PENDING", "WAITING_FOR_PARTS", "IN_PROGRESS"] } } }),
    prisma.repairJob.count({ where: { status: "COMPLETED" } }),
    prisma.customer.count(),
    prisma.vehicle.count(),
    prisma.invoice.count(),
    prisma.laborEntry.findMany({ include: { mechanic: true }, where: { entryDate: { gte: startYear } } })
  ]);
  const revenue = await monthlyRevenue();
  const jobs = await monthlyJobs();
  const labor = Object.values(
    laborByMechanic.reduce<Record<string, { mechanic: string; hours: number }>>((acc, entry) => {
      const key = entry.mechanic.name;
      acc[key] ??= { mechanic: key.split(" ")[0], hours: 0 };
      acc[key].hours += Number(entry.hoursWorked);
      return acc;
    }, {})
  );
  const stats = [
    { label: "Revenue Today", value: eur(today._sum.grandTotal ?? 0), icon: FileText },
    { label: "Revenue This Month", value: eur(month._sum.grandTotal ?? 0), icon: FileText },
    { label: "Revenue This Year", value: eur(year._sum.grandTotal ?? 0), icon: FileText },
    { label: "Open Jobs", value: openJobs, icon: Briefcase },
    { label: "Completed Jobs", value: completedJobs, icon: CheckCircle2 },
    { label: "Customers", value: customers, icon: Users },
    { label: "Vehicles", value: vehicles, icon: Car },
    { label: "Invoices", value: invoices, icon: FileText }
  ];
  return (
    <div className="grid gap-6">
      <section className="flex justify-center">
        <Image src="/mgh-banner.svg" alt="Car Services MGH" width={1200} height={300} priority className="h-auto w-full max-w-6xl object-contain drop-shadow-lg" />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
        ))}
      </section>
      <DashboardCharts revenue={revenue} jobs={jobs} labor={labor} />
    </div>
  );
}

async function monthlyRevenue() {
  const invoices = await prisma.invoice.findMany({
    where: { issueDate: { gte: new Date(new Date().getFullYear(), 0, 1) } },
    select: { issueDate: true, grandTotal: true }
  });
  return Array.from({ length: 12 }, (_, month) => {
    const date = new Date(new Date().getFullYear(), month, 1);
    const total = invoices.filter((invoice) => invoice.issueDate.getMonth() === month).reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0);
    return { month: date.toLocaleString("en", { month: "short" }), total };
  });
}

async function monthlyJobs() {
  const jobs = await prisma.repairJob.findMany({
    where: { status: { in: ["COMPLETED", "DELIVERED"] }, dateCompleted: { not: null } },
    select: { dateCompleted: true }
  });
  return Array.from({ length: 12 }, (_, month) => {
    const date = new Date(new Date().getFullYear(), month, 1);
    return { month: date.toLocaleString("en", { month: "short" }), completed: jobs.filter((job) => job.dateCompleted?.getMonth() === month).length };
  });
}
