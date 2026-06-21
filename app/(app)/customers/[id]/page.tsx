import Link from "next/link";
import { notFound } from "next/navigation";
import { Car, FileText, Phone, ReceiptText, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cyDate, eur, jobStatusLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CustomerActions } from "@/components/customer-actions";
import { Table, Td, Th } from "@/components/ui/table";

function customerNumber(id: number) {
  return `CUST-${String(id).padStart(4, "0")}`;
}

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id: Number(id) },
    include: {
      vehicles: { include: { jobs: { orderBy: { dateOpened: "desc" } }, reminders: { orderBy: { dueDate: "asc" } } }, orderBy: { licensePlate: "asc" } },
      jobs: { include: { vehicle: true, assignedMechanic: true, invoice: true }, orderBy: { dateOpened: "desc" } },
      invoices: { include: { job: { include: { vehicle: true } } }, orderBy: { issueDate: "desc" } }
    }
  });
  if (!customer) notFound();
  const totalRevenue = customer.invoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0);
  const unpaidBalance = customer.invoices.filter((invoice) => !invoice.paid).reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0);
  const openJobs = customer.jobs.filter((job) => ["PENDING", "WAITING_FOR_PARTS", "IN_PROGRESS"].includes(job.status));
  const lastVisit = customer.jobs[0]?.dateOpened;
  const nextReminders = customer.vehicles.flatMap((vehicle) => vehicle.reminders.map((reminder) => ({ ...reminder, vehicle }))).filter((reminder) => reminder.status === "PENDING").slice(0, 5);
  const canDelete = customer.vehicles.length === 0 && customer.jobs.length === 0 && customer.invoices.length === 0;

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{customerNumber(customer.id)}</p>
          <h1 className="text-2xl font-bold">{customer.fullName}</h1>
          <p className="text-sm text-muted-foreground">{customer.phone} · {customer.email ?? "No email"} · VAT {customer.vatNumber ?? "-"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-muted">{customer.vehicles.length} vehicle{customer.vehicles.length === 1 ? "" : "s"}</Badge>
          <Badge className={openJobs.length ? "border-primary text-primary" : "bg-muted"}>{openJobs.length} open job{openJobs.length === 1 ? "" : "s"}</Badge>
          <Badge className={unpaidBalance > 0 ? "border-destructive text-destructive" : "bg-muted"}>{eur(unpaidBalance)} unpaid</Badge>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Lifetime Revenue</p><p className="mt-2 text-2xl font-bold">{eur(totalRevenue)}</p></div><ReceiptText className="h-5 w-5 text-primary" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Open Balance</p><p className="mt-2 text-2xl font-bold">{eur(unpaidBalance)}</p></div><FileText className="h-5 w-5 text-primary" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Last Visit</p><p className="mt-2 text-2xl font-bold">{lastVisit ? cyDate(lastVisit) : "-"}</p></div><Wrench className="h-5 w-5 text-primary" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Contact</p><p className="mt-2 text-lg font-bold">{customer.phone}</p></div><Phone className="h-5 w-5 text-primary" /></CardContent></Card>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader><h2 className="font-semibold">Vehicles In This Customer File</h2></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <thead><tr><Th>Plate</Th><Th>Vehicle</Th><Th>Kilometers</Th><Th>Jobs</Th><Th>Next Reminder</Th></tr></thead>
              <tbody>{customer.vehicles.map((vehicle) => {
                const nextReminder = vehicle.reminders.find((reminder) => reminder.status === "PENDING");
                return (
                  <tr key={vehicle.id}>
                    <Td><Link className="font-semibold text-primary" href={`/vehicles/${vehicle.id}`}>{vehicle.licensePlate}</Link></Td>
                    <Td>{vehicle.make} {vehicle.model}<p className="text-xs text-muted-foreground">{vehicle.year ?? "-"} · {vehicle.fuelType} · {vehicle.color ?? "No color"}</p></Td>
                    <Td>{vehicle.mileage.toLocaleString()} km</Td>
                    <Td>{vehicle.jobs.length}</Td>
                    <Td>{nextReminder ? <><p>{nextReminder.title}</p><p className="text-xs text-muted-foreground">{cyDate(nextReminder.dueDate)}</p></> : <span className="text-muted-foreground">-</span>}</Td>
                  </tr>
                );
              })}</tbody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-2"><Car className="h-4 w-4 text-primary" /><h2 className="font-semibold">Mechanic Notes</h2></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div><p className="font-medium">Address</p><p className="text-muted-foreground">{customer.address ?? "No address"}</p></div>
            <div><p className="font-medium">Notes</p><p className="text-muted-foreground">{customer.notes ?? "No notes"}</p></div>
            <div><p className="font-medium">Upcoming Reminders</p>{nextReminders.length ? <div className="mt-2 grid gap-2">{nextReminders.map((reminder) => <div key={reminder.id} className="rounded-md border border-border p-2"><p className="font-medium">{reminder.vehicle.licensePlate} · {reminder.title}</p><p className="text-xs text-muted-foreground">{cyDate(reminder.dueDate)} · {reminder.channel}</p></div>)}</div> : <p className="text-muted-foreground">No pending reminders</p>}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold">Edit Customer Details</h2></CardHeader>
        <CardContent>
          <CustomerActions customer={customer} canDelete={canDelete} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><h2 className="font-semibold">Invoice And Receipt History</h2></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <thead><tr><Th>Invoice</Th><Th>Vehicle</Th><Th>Date</Th><Th>Total</Th><Th>Status</Th></tr></thead>
              <tbody>{customer.invoices.map((invoice) => <tr key={invoice.id}><Td><Link className="font-medium text-primary" href={`/invoices/${invoice.id}`}>{invoice.invoiceNumber}</Link></Td><Td>{invoice.job.vehicle.licensePlate}</Td><Td>{cyDate(invoice.issueDate)}</Td><Td>{eur(invoice.grandTotal)}</Td><Td><Badge className={invoice.paid ? "bg-muted" : "border-destructive text-destructive"}>{invoice.paid ? "Paid" : "Open"}</Badge></Td></tr>)}</tbody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold">Repair History</h2></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <thead><tr><Th>Job</Th><Th>Vehicle</Th><Th>Status</Th><Th>Opened</Th><Th>Mechanic</Th></tr></thead>
              <tbody>{customer.jobs.map((job) => <tr key={job.id}><Td><Link className="font-medium text-primary" href={`/jobs/${job.id}`}>{job.jobNumber}</Link></Td><Td>{job.vehicle.licensePlate}</Td><Td><Badge>{jobStatusLabel(job.status)}</Badge></Td><Td>{cyDate(job.dateOpened)}</Td><Td>{job.assignedMechanic?.name.split(" ")[0] ?? "-"}</Td></tr>)}</tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
