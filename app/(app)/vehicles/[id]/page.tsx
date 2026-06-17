import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cyDate } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";

export default async function VehicleProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(id) }, include: { customer: true, jobs: { include: { invoice: true } }, reminders: true } });
  if (!vehicle) notFound();
  return (
    <div className="grid gap-6">
      <header><h1 className="text-2xl font-bold">{vehicle.licensePlate}</h1><p className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model} · VIN {vehicle.vinNumber ?? "-"} · {vehicle.mileage.toLocaleString()} km</p></header>
      <section className="grid gap-4 lg:grid-cols-3">
        <Card><CardHeader><h2 className="font-semibold">Owner</h2></CardHeader><CardContent><Link className="font-semibold text-primary" href={`/customers/${vehicle.customer.id}`}>{vehicle.customer.fullName}</Link><p className="text-sm text-muted-foreground">{vehicle.customer.phone}</p></CardContent></Card>
        <Card><CardHeader><h2 className="font-semibold">Vehicle</h2></CardHeader><CardContent className="text-sm"><p>{vehicle.year ?? "-"} {vehicle.make} {vehicle.model}</p><p>{vehicle.engineType ?? "-"} · {vehicle.fuelType}</p><p>{vehicle.color ?? "-"}</p></CardContent></Card>
        <Card><CardHeader><h2 className="font-semibold">Reminders</h2></CardHeader><CardContent className="text-sm">{vehicle.reminders.map((reminder) => <p key={reminder.id}>{reminder.title} · {cyDate(reminder.dueDate)}</p>)}</CardContent></Card>
      </section>
      <Card><CardHeader><h2 className="font-semibold">Service History</h2></CardHeader><CardContent className="overflow-x-auto p-0"><Table><thead><tr><Th>Job</Th><Th>Status</Th><Th>Opened</Th><Th>Invoice</Th></tr></thead><tbody>{vehicle.jobs.map((job) => <tr key={job.id}><Td><Link className="text-primary" href={`/jobs/${job.id}`}>{job.jobNumber}</Link></Td><Td>{job.status}</Td><Td>{cyDate(job.dateOpened)}</Td><Td>{job.invoice ? <Link className="text-primary" href={`/invoices/${job.invoice.id}`}>{job.invoice.invoiceNumber}</Link> : "-"}</Td></tr>)}</tbody></Table></CardContent></Card>
    </div>
  );
}
