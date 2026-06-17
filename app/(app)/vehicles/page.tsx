import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";
import { VehicleForm } from "@/components/forms/vehicle-form";

const LIST_LIMIT = 10;

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<{ q?: string; view?: string }> }) {
  const { q = "", view = "" } = await searchParams;
  const [vehicles, customers] = await Promise.all([
    prisma.vehicle.findMany({
      where: q ? { OR: [{ licensePlate: { contains: q } }, { vinNumber: { contains: q } }, { make: { contains: q } }, { model: { contains: q } }] } : undefined,
      include: { customer: true, jobs: true },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.customer.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true } })
  ]);
  const showAll = view === "all";
  const visibleVehicles = showAll ? vehicles : vehicles.slice(0, LIST_LIMIT);
  const viewMoreHref = `/vehicles?${new URLSearchParams({ ...(q ? { q } : {}), view: "all" }).toString()}`;
  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div><h1 className="text-2xl font-bold">Vehicles</h1><p className="text-sm text-muted-foreground">Search by plate, VIN, make, or model.</p></div>
        <form className="grid w-full grid-cols-[minmax(0,1fr)_40px] gap-2 lg:w-96"><Input name="q" defaultValue={q} placeholder="Plate, VIN, make" /><Button size="icon"><Search className="h-4 w-4" /></Button></form>
      </header>
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card><CardHeader className="flex-row items-center gap-2"><Plus className="h-4 w-4 text-primary" /><h2 className="font-semibold">New Vehicle</h2></CardHeader><CardContent><VehicleForm customers={customers} /></CardContent></Card>
        <Card><CardContent className="overflow-x-auto p-0"><Table><thead><tr><Th>Vehicle</Th><Th>Customer</Th><Th>VIN</Th><Th>Mileage</Th><Th>Jobs</Th></tr></thead><tbody>
          {visibleVehicles.map((vehicle) => <tr key={vehicle.id}><Td><Link className="font-semibold text-primary" href={`/vehicles/${vehicle.id}`}>{vehicle.licensePlate}</Link><p className="text-xs text-muted-foreground">{vehicle.make} {vehicle.model} {vehicle.year}</p></Td><Td>{vehicle.customer.fullName}</Td><Td>{vehicle.vinNumber ?? "-"}</Td><Td>{vehicle.mileage.toLocaleString()}</Td><Td>{vehicle.jobs.length}</Td></tr>)}
        </tbody></Table>{!showAll && vehicles.length > LIST_LIMIT ? <div className="flex items-center justify-between gap-3 border-t border-border p-4"><p className="text-sm text-muted-foreground">Showing latest {LIST_LIMIT} of {vehicles.length}</p><Button asChild size="sm" variant="secondary"><Link href={viewMoreHref}>View more</Link></Button></div> : null}</CardContent></Card>
      </div>
    </div>
  );
}
