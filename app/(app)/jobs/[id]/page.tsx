import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cyDate, cyDateTime, eur, jobStatusLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { JobActions } from "@/components/job-actions";
import { JobServiceChecklist } from "@/components/job-service-checklist";
import { JobBreakdownEditor } from "@/components/job-breakdown-editor";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, mechanics] = await Promise.all([
    prisma.repairJob.findUnique({ where: { id: Number(id) }, include: { customer: true, vehicle: true, assignedMechanic: true, laborEntries: { include: { mechanic: true } }, partsUsed: true, serviceItems: { orderBy: [{ category: "asc" }, { label: "asc" }] }, invoice: true } }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true, hourlyRate: true }, orderBy: { name: "asc" } })
  ]);
  if (!job) notFound();
  const laborTotal = job.laborEntries.reduce((sum, item) => sum + Number(item.hoursWorked) * Number(item.hourlyRate), 0);
  const partsTotal = job.partsUsed.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="text-sm text-muted-foreground">{job.jobNumber}</p><h1 className="text-2xl font-bold">{job.vehicle.licensePlate} - {job.customer.fullName}</h1><p className="text-sm text-muted-foreground">Opened {cyDate(job.dateOpened)} by {job.assignedMechanic?.name ?? "unassigned"}</p></div>
        <div className="flex gap-2"><Badge>{jobStatusLabel(job.status)}</Badge>{job.invoice ? <Button asChild><Link href={`/invoices/${job.invoice.id}`}>{job.invoice.invoiceNumber}</Link></Button> : null}</div>
      </header>
      <section className="grid gap-4 lg:grid-cols-3">
        <Card><CardHeader><h2 className="font-semibold">Customer</h2></CardHeader><CardContent><p className="font-semibold">{job.customer.fullName}</p><p className="text-sm text-muted-foreground">{job.customer.phone}</p><p className="text-sm text-muted-foreground">{job.customer.vatNumber ?? "No VAT number"}</p></CardContent></Card>
        <Card><CardHeader><h2 className="font-semibold">Vehicle</h2></CardHeader><CardContent><p className="font-semibold">{job.vehicle.make} {job.vehicle.model}</p><p className="text-sm text-muted-foreground">VIN {job.vehicle.vinNumber ?? "-"}</p><p className="text-sm text-muted-foreground">{job.vehicle.mileage.toLocaleString()} km</p></CardContent></Card>
        <Card><CardHeader><h2 className="font-semibold">Totals</h2></CardHeader><CardContent><p>Labor {eur(laborTotal)}</p><p>Parts {eur(partsTotal)}</p><p className="font-semibold">Subtotal {eur(laborTotal + partsTotal)}</p></CardContent></Card>
      </section>
      <Card><CardHeader><h2 className="font-semibold">Work Description</h2></CardHeader><CardContent className="grid gap-3 text-sm"><p><strong>Problem:</strong> {job.problemDescription}</p><p><strong>Estimated completion:</strong> {cyDateTime(job.estimatedCompletionAt)}</p><p><strong>Mechanic notes:</strong> {job.mechanicNotes ?? "-"}</p></CardContent></Card>
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Service Checklist</h2>
        </CardHeader>
        <CardContent>
          <JobServiceChecklist
            jobId={job.id}
            vehicleMileage={job.vehicle.mileage}
            service={{
              vehicleReceivedAt: job.vehicleReceivedAt?.toISOString() ?? null,
              jobCardIssuedAt: job.jobCardIssuedAt?.toISOString() ?? null,
              serviceMileage: job.serviceMileage,
              oilChangeDueMileage: job.oilChangeDueMileage,
              nextServiceDueMileage: job.nextServiceDueMileage
            }}
            items={job.serviceItems.map((item) => ({
              itemKey: item.itemKey,
              label: item.label,
              category: item.category,
              completed: item.completed,
              notes: item.notes
            }))}
          />
        </CardContent>
      </Card>
      <JobActions jobId={job.id} mechanics={mechanics.map((item) => ({ ...item, hourlyRate: String(item.hourlyRate) }))} invoiceId={job.invoice?.id} />
      <JobBreakdownEditor
        jobId={job.id}
        mechanics={mechanics.map((item) => ({ ...item, hourlyRate: String(item.hourlyRate) }))}
        laborEntries={job.laborEntries.map((entry) => ({
          id: entry.id,
          description: entry.description,
          hoursWorked: String(entry.hoursWorked),
          hourlyRate: String(entry.hourlyRate),
          mechanicId: entry.mechanicId,
          mechanicName: entry.mechanic.name
        }))}
        partsUsed={job.partsUsed.map((part) => ({
          id: part.id,
          partName: part.partName,
          partNumber: part.partNumber,
          quantity: String(part.quantity),
          unitPrice: String(part.unitPrice),
          supplier: part.supplier
        }))}
      />
    </div>
  );
}
