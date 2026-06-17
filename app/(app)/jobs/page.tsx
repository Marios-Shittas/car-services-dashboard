import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cyDate, cyDateTime, jobStatusLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import { JobForm } from "@/components/forms/job-form";

const LIST_LIMIT = 10;

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; view?: string }> }) {
  const { q = "", status = "", view = "" } = await searchParams;
  const [jobs, customers, vehicles, mechanics] = await Promise.all([
    prisma.repairJob.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(q ? { OR: [{ jobNumber: { contains: q } }, { customer: { fullName: { contains: q } } }, { vehicle: { licensePlate: { contains: q } } }, { vehicle: { vinNumber: { contains: q } } }] } : {})
      },
      include: { customer: true, vehicle: true, assignedMechanic: true, invoice: true },
      orderBy: { dateOpened: "desc" }
    }),
    prisma.customer.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    prisma.vehicle.findMany({ orderBy: { licensePlate: "asc" }, select: { id: true, customerId: true, licensePlate: true, make: true, model: true, mileage: true } }),
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);
  const showAll = view === "all";
  const visibleJobs = showAll ? jobs : jobs.slice(0, LIST_LIMIT);
  const viewMoreHref = `/jobs?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), view: "all" }).toString()}`;
  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div><h1 className="text-2xl font-bold">Job Cards</h1><p className="text-sm text-muted-foreground">Create work orders and track status, labor, parts, and invoices.</p></div>
        <form className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_180px_40px] lg:w-[560px]"><Input name="q" defaultValue={q} placeholder="Customer, plate, VIN, job" /><select name="status" defaultValue={status} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">All</option>{["PENDING","WAITING_FOR_PARTS","IN_PROGRESS","COMPLETED","DELIVERED"].map((item) => <option key={item}>{item}</option>)}</select><Button size="icon"><Search className="h-4 w-4" /></Button></form>
      </header>
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card><CardHeader className="flex-row items-center gap-2"><Plus className="h-4 w-4 text-primary" /><h2 className="font-semibold">New Job</h2></CardHeader><CardContent><JobForm customers={customers} vehicles={vehicles} mechanics={mechanics} /></CardContent></Card>
        <Card><CardContent className="overflow-x-auto p-0"><Table><thead><tr><Th>Job</Th><Th>Customer</Th><Th>Vehicle</Th><Th>Status</Th><Th>Mechanic</Th><Th>Opened</Th><Th>Ready ETA</Th><Th>Invoice</Th></tr></thead><tbody>
          {visibleJobs.map((job) => <tr key={job.id}><Td><Link href={`/jobs/${job.id}`} className="font-semibold text-primary">{job.jobNumber}</Link></Td><Td>{job.customer.fullName}</Td><Td>{job.vehicle.licensePlate}<p className="text-xs text-muted-foreground">{job.vehicle.make} {job.vehicle.model}</p></Td><Td><Badge>{jobStatusLabel(job.status)}</Badge></Td><Td>{job.assignedMechanic?.name ?? "-"}</Td><Td>{cyDate(job.dateOpened)}</Td><Td className="whitespace-nowrap">{cyDateTime(job.estimatedCompletionAt)}</Td><Td>{job.invoice ? <Link className="text-primary" href={`/invoices/${job.invoice.id}`}>{job.invoice.invoiceNumber}</Link> : "-"}</Td></tr>)}
        </tbody></Table>{!showAll && jobs.length > LIST_LIMIT ? <div className="flex items-center justify-between gap-3 border-t border-border p-4"><p className="text-sm text-muted-foreground">Showing latest {LIST_LIMIT} of {jobs.length}</p><Button asChild size="sm" variant="secondary"><Link href={viewMoreHref}>View more</Link></Button></div> : null}</CardContent></Card>
      </div>
    </div>
  );
}
