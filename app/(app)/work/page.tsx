import Link from "next/link";
import { AlertCircle, CheckCircle2, ClipboardList, Plus, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn, cyDate, cyDateTime, jobStatusLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { JobForm } from "@/components/forms/job-form";

type WorkTab = "progress" | "completed";
type JobWorkRow = {
  id: number;
  title: string;
  description: string | null;
  customerName: string | null;
  vehiclePlate: string | null;
  dueDate: Date | null;
  completed: boolean;
  completedAt: Date | null;
  assignedMechanicName: string | null;
  status: string;
};
const LIST_LIMIT = 10;

function cleanTab(value: string | undefined): WorkTab {
  return value === "completed" ? "completed" : "progress";
}

async function currentTimestamp() {
  return Date.now();
}

export default async function WorkPage({ searchParams }: { searchParams: Promise<{ tab?: string; view?: string }> }) {
  const { tab: rawTab, view = "" } = await searchParams;
  const tab = cleanTab(rawTab);
  const showAll = view === "all";
  const now = await currentTimestamp();
  const completedFilter = tab === "completed";
  const completedJobStatuses = ["COMPLETED", "DELIVERED"] as const;
  const activeJobStatuses = ["PENDING", "WAITING_FOR_PARTS", "IN_PROGRESS"] as const;
  const [jobRows, mechanics, customers, vehicles, activeJobsCount, completedJobsCount] = await Promise.all([
    prisma.repairJob.findMany({
      where: { status: { in: completedFilter ? [...completedJobStatuses] : [...activeJobStatuses] } },
      include: { customer: true, vehicle: true, assignedMechanic: true },
      orderBy: [{ estimatedCompletionAt: "asc" }, { dateOpened: "desc" }]
    }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.customer.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    prisma.vehicle.findMany({ orderBy: { licensePlate: "asc" }, select: { id: true, customerId: true, licensePlate: true, make: true, model: true, mileage: true } }),
    prisma.repairJob.count({ where: { status: { in: [...activeJobStatuses] } } }),
    prisma.repairJob.count({ where: { status: { in: [...completedJobStatuses] } } })
  ]);

  const items: JobWorkRow[] = jobRows.map((job) => ({
    id: job.id,
    title: `${job.jobNumber} - ${job.vehicle.licensePlate}`,
    description: job.problemDescription,
    customerName: job.customer.fullName,
    vehiclePlate: `${job.vehicle.make} ${job.vehicle.model}`,
    dueDate: job.estimatedCompletionAt,
    completed: completedJobStatuses.includes(job.status as never),
    completedAt: job.dateCompleted,
    assignedMechanicName: job.assignedMechanic?.name ?? null,
    status: jobStatusLabel(job.status)
  })).sort((a, b) => {
    const aDue = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDue = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aDue - bDue || b.id - a.id;
  });
  const inProgressCount = activeJobsCount;
  const completedCount = completedJobsCount;
  const overdueCount = items.filter((item) => !item.completed && item.dueDate && item.dueDate.getTime() < now).length;
  const visibleItems = showAll ? items : items.slice(0, LIST_LIMIT);
  const viewMoreHref = `/work?${new URLSearchParams({ ...(tab === "completed" ? { tab } : {}), view: "all" }).toString()}`;

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Work In Progress</h1>
          <p className="text-sm text-muted-foreground">Track active job cards, ready ETAs, and completed workshop jobs.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant={tab === "progress" ? "primary" : "secondary"}>
            <Link href="/work">
              <Wrench className="h-4 w-4" />
              In Progress ({inProgressCount})
            </Link>
          </Button>
          <Button asChild variant={tab === "completed" ? "primary" : "secondary"}>
            <Link href="/work?tab=completed">
              <CheckCircle2 className="h-4 w-4" />
              Completed ({completedCount})
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{inProgressCount}</p>
            </div>
            <ClipboardList className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedCount}</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Overdue In This View</p>
              <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
            </div>
            <AlertCircle className="h-5 w-5 text-destructive" />
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">New Job</h2>
          </CardHeader>
          <CardContent>
            <JobForm mechanics={mechanics} customers={customers} vehicles={vehicles} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">{tab === "completed" ? "Completed Jobs" : "Work In Progress"}</h2>
              <p className="text-xs text-muted-foreground">Job cards sorted by ready ETA, then newest created.</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {visibleItems.map((item) => {
                const isOverdue = !item.completed && item.dueDate && item.dueDate.getTime() < now;
                return (
                  <div key={item.id} className="grid gap-3 p-4 transition hover:bg-muted/50 lg:grid-cols-[minmax(220px,1fr)_minmax(160px,0.65fr)_180px] lg:items-center">
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className={cn("font-semibold", item.completed && "text-muted-foreground line-through")}>{item.title}</h3>
                        <Badge className="border-primary/30 bg-primary/10 text-primary">Job card</Badge>
                        <Badge className={cn(item.completed ? "bg-primary/10 text-primary" : "bg-muted", isOverdue && "border-destructive/30 bg-destructive/10 text-destructive")}>
                          {isOverdue ? "Overdue" : item.status}
                        </Badge>
                      </div>
                      {item.description ? <p className="text-sm text-muted-foreground">{item.description}</p> : null}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {item.customerName ? <span>{item.customerName}</span> : null}
                        {item.vehiclePlate ? <span>{item.vehiclePlate}</span> : null}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Assigned</p>
                      <p className="text-sm font-medium">{item.assignedMechanicName ?? "Unassigned"}</p>
                      <p className={cn("mt-1 text-xs text-muted-foreground", isOverdue && "font-semibold text-destructive")}>
                        Ready ETA {cyDateTime(item.dueDate)}
                      </p>
                      {item.completedAt ? <p className="text-xs text-muted-foreground">Completed {cyDate(item.completedAt)}</p> : null}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/jobs/${item.id}`}>View job</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!items.length ? (
                <div className="p-10 text-center">
                  <p className="font-semibold">{tab === "completed" ? "No completed jobs yet" : "No jobs in progress"}</p>
                  <p className="text-sm text-muted-foreground">Create a job card from the form to start tracking it here.</p>
                </div>
              ) : null}
              {!showAll && items.length > LIST_LIMIT ? (
                <div className="flex items-center justify-between gap-3 p-4">
                  <p className="text-sm text-muted-foreground">Showing latest {LIST_LIMIT} of {items.length}</p>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={viewMoreHref}>View more</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
