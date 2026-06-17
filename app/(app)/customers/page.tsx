import Link from "next/link";
import { ArrowDownUp, Car, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cyDate, eur } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CustomerForm } from "@/components/forms/customer-form";

type SortKey = "name" | "revenue" | "balance" | "vehicles" | "lastVisit";
const LIST_LIMIT = 10;

function customerNumber(id: number) {
  return `CUST-${String(id).padStart(4, "0")}`;
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: SortKey; view?: string }> }) {
  const { q = "", sort = "name", view = "" } = await searchParams;
  const customersRaw = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
            { vehicles: { some: { OR: [{ licensePlate: { contains: q } }, { vinNumber: { contains: q } }] } } }
          ]
        }
      : undefined,
    include: {
      vehicles: { orderBy: { licensePlate: "asc" } },
      invoices: { orderBy: { issueDate: "desc" } },
      jobs: { include: { vehicle: true }, orderBy: { dateOpened: "desc" } }
    },
    orderBy: { fullName: "asc" }
  });
  const customers = customersRaw
    .map((customer) => {
      const revenue = customer.invoices.reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0);
      const balance = customer.invoices.filter((invoice) => !invoice.paid).reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0);
      const lastJob = customer.jobs[0];
      return { ...customer, revenue, balance, lastJob };
    })
    .sort((a, b) => {
      if (sort === "revenue") return b.revenue - a.revenue;
      if (sort === "balance") return b.balance - a.balance;
      if (sort === "vehicles") return b.vehicles.length - a.vehicles.length;
      if (sort === "lastVisit") return (b.lastJob?.dateOpened.getTime() ?? 0) - (a.lastJob?.dateOpened.getTime() ?? 0);
      return a.fullName.localeCompare(b.fullName);
    });
  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "lastVisit", label: "Last Visit" },
    { key: "balance", label: "Balance" },
    { key: "revenue", label: "Revenue" },
    { key: "vehicles", label: "Vehicles" }
  ];
  const showAll = view === "all";
  const visibleCustomers = showAll ? customers : customers.slice(0, LIST_LIMIT);
  const viewMoreHref = `/customers?${new URLSearchParams({ ...(q ? { q } : {}), sort, view: "all" }).toString()}`;

  return (
    <div className="grid gap-6">
      <header className="grid gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">Find a customer by name, phone, plate, or VIN.</p>
        </div>
        <Card>
          <CardContent className="grid gap-3 p-4">
            <form className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Input name="q" defaultValue={q} placeholder="Search customer, phone, plate, VIN" className="h-12 text-base" />
              <input type="hidden" name="sort" value={sort} />
              <Button className="h-12 px-5" aria-label="Search">
                <Search className="h-4 w-4" /> Search
              </Button>
            </form>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Sort</span>
              {sortOptions.map((option) => (
                <Button key={option.key} asChild size="sm" variant={sort === option.key ? "primary" : "secondary"}>
                  <Link href={`/customers?${new URLSearchParams({ ...(q ? { q } : {}), sort: option.key }).toString()}`}>{option.label}</Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_460px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">{customers.length} Customer{customers.length === 1 ? "" : "s"}</h2>
            </div>
            {q ? <Button asChild size="sm" variant="secondary"><Link href="/customers">Clear search</Link></Button> : null}
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {visibleCustomers.map((customer) => (
                <Link key={customer.id} href={`/customers/${customer.id}`} className="grid gap-3 p-4 transition hover:bg-muted/60 lg:grid-cols-[minmax(220px,1.2fr)_minmax(220px,1fr)_minmax(160px,0.8fr)_120px] lg:items-center">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{customerNumber(customer.id)}</p>
                    <p className="font-semibold text-primary">{customer.fullName}</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    {customer.email ? <p className="text-xs text-muted-foreground">{customer.email}</p> : null}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Car className="h-3.5 w-3.5" /> Vehicles
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {customer.vehicles.length ? customer.vehicles.slice(0, 5).map((vehicle) => (
                        <Badge key={vehicle.id} className="bg-muted">{vehicle.licensePlate}</Badge>
                      )) : <span className="text-sm text-muted-foreground">No vehicles</span>}
                      {customer.vehicles.length > 5 ? <Badge>+{customer.vehicles.length - 5}</Badge> : null}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Last visit</p>
                    {customer.lastJob ? (
                      <>
                        <p className="font-medium">{cyDate(customer.lastJob.dateOpened)}</p>
                        <p className="text-xs text-muted-foreground">{customer.lastJob.vehicle.licensePlate} · {customer.lastJob.jobNumber}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No jobs yet</p>
                    )}
                  </div>
                  <div className="lg:text-right">
                    <p className={customer.balance > 0 ? "font-semibold text-destructive" : "font-semibold"}>{eur(customer.balance)}</p>
                    <p className="text-xs text-muted-foreground">{customer.invoices.length} invoices</p>
                    <p className="text-xs text-muted-foreground">{eur(customer.revenue)} total</p>
                  </div>
                </Link>
              ))}
              {!customers.length ? (
                <div className="p-8 text-center">
                  <p className="font-semibold">No customers found</p>
                  <p className="text-sm text-muted-foreground">Try a different name, phone number, plate, or VIN.</p>
                </div>
              ) : null}
              {!showAll && customers.length > LIST_LIMIT ? (
                <div className="flex items-center justify-between gap-3 p-4">
                  <p className="text-sm text-muted-foreground">Showing latest {LIST_LIMIT} of {customers.length}</p>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={viewMoreHref}>View more</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <div>
              <h2 className="font-semibold">New Customer</h2>
              <p className="text-xs text-muted-foreground">Create a customer and optional cars in one step.</p>
            </div>
          </CardHeader>
          <CardContent>
            <CustomerForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
