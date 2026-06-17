import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarClock, CheckCircle2, FileText, Search, WalletCards } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn, cyDate, eur } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/table";

type SortKey = "date" | "due" | "invoice" | "customer" | "vehicle" | "total" | "status";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "open" | "paid";
const LIST_LIMIT = 10;

const sortLabels: Record<SortKey, string> = {
  date: "Issue date",
  due: "Due date",
  invoice: "Invoice",
  customer: "Customer",
  vehicle: "Vehicle",
  total: "Total",
  status: "Status"
};

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "date", label: "Newest" },
  { key: "due", label: "Due Date" },
  { key: "total", label: "Total" },
  { key: "status", label: "Status" },
  { key: "customer", label: "Customer" },
  { key: "vehicle", label: "Vehicle" }
];

function cleanSort(value: string | undefined): SortKey {
  return value && value in sortLabels ? (value as SortKey) : "date";
}

function cleanDir(value: string | undefined): SortDir {
  return value === "asc" ? "asc" : "desc";
}

function cleanStatus(value: string | undefined): StatusFilter {
  return value === "open" || value === "paid" ? value : "all";
}

function routeFor(params: { q: string; status: StatusFilter; sort: SortKey; dir: SortDir }) {
  const next = new URLSearchParams();
  if (params.q) next.set("q", params.q);
  if (params.status !== "all") next.set("status", params.status);
  if (params.sort !== "date") next.set("sort", params.sort);
  if (!(params.sort === "date" && params.dir === "desc")) next.set("dir", params.dir);
  const query = next.toString();
  return query ? `/invoices?${query}` : "/invoices";
}

function viewMoreRoute(params: { q: string; status: StatusFilter; sort: SortKey; dir: SortDir }) {
  const next = new URLSearchParams();
  if (params.q) next.set("q", params.q);
  if (params.status !== "all") next.set("status", params.status);
  if (params.sort !== "date") next.set("sort", params.sort);
  if (!(params.sort === "date" && params.dir === "desc")) next.set("dir", params.dir);
  next.set("view", "all");
  return `/invoices?${next.toString()}`;
}

function compareText(a: string | null | undefined, b: string | null | undefined) {
  return (a ?? "").localeCompare(b ?? "", undefined, { numeric: true, sensitivity: "base" });
}

function compareDate(a: Date | null | undefined, b: Date | null | undefined) {
  return (a?.getTime() ?? 0) - (b?.getTime() ?? 0);
}

function invert(value: number, dir: SortDir) {
  return dir === "asc" ? value : -value;
}

function SortLink({
  column,
  currentSort,
  currentDir,
  q,
  status,
  children,
  className
}: {
  column: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  q: string;
  status: StatusFilter;
  children: ReactNode;
  className?: string;
}) {
  const isActive = currentSort === column;
  const nextDir: SortDir = isActive && currentDir === "asc" ? "desc" : "asc";
  const Icon = isActive ? (currentDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <Link
      href={routeFor({ q, status, sort: column, dir: nextDir })}
      className={cn("inline-flex items-center gap-1.5 hover:text-foreground", isActive && "text-foreground", className)}
    >
      {children}
      <Icon className="h-3.5 w-3.5" />
    </Link>
  );
}

async function currentTimestamp() {
  return Date.now();
}

export default async function InvoicesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; dir?: string; view?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = cleanStatus(params.status);
  const sort = cleanSort(params.sort);
  const dir = cleanDir(params.dir);
  const showAll = params.view === "all";

  const invoicesRaw = await prisma.invoice.findMany({
    where: {
      ...(status === "open" ? { paid: false } : {}),
      ...(status === "paid" ? { paid: true } : {}),
      ...(q
        ? {
            OR: [
              { invoiceNumber: { contains: q } },
              { customer: { fullName: { contains: q } } },
              { job: { jobNumber: { contains: q } } },
              { job: { vehicle: { licensePlate: { contains: q } } } },
              { job: { vehicle: { make: { contains: q } } } },
              { job: { vehicle: { model: { contains: q } } } }
            ]
          }
        : {})
    },
    include: { customer: true, job: { include: { vehicle: true } } },
    orderBy: { issueDate: "desc" }
  });

  const invoices = invoicesRaw
    .map((invoice) => ({
      ...invoice,
      total: Number(invoice.grandTotal),
      vehicleLabel: `${invoice.job.vehicle.licensePlate} ${invoice.job.vehicle.make} ${invoice.job.vehicle.model}`.trim()
    }))
    .sort((a, b) => {
      const fallback = compareDate(b.issueDate, a.issueDate) || compareText(a.invoiceNumber, b.invoiceNumber);
      let result = 0;
      if (sort === "date") result = compareDate(a.issueDate, b.issueDate);
      if (sort === "due") result = compareDate(a.dueDate, b.dueDate);
      if (sort === "invoice") result = compareText(a.invoiceNumber, b.invoiceNumber);
      if (sort === "customer") result = compareText(a.customer.fullName, b.customer.fullName);
      if (sort === "vehicle") result = compareText(a.vehicleLabel, b.vehicleLabel);
      if (sort === "total") result = a.total - b.total;
      if (sort === "status") result = Number(a.paid) - Number(b.paid);
      return invert(result, dir) || fallback;
    });

  const paidTotal = invoicesRaw.filter((invoice) => invoice.paid).reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0);
  const openTotal = invoicesRaw.filter((invoice) => !invoice.paid).reduce((sum, invoice) => sum + Number(invoice.grandTotal), 0);
  const grossTotal = paidTotal + openTotal;
  const now = await currentTimestamp();
  const overdueCount = invoicesRaw.filter((invoice) => !invoice.paid && invoice.dueDate && invoice.dueDate.getTime() < now).length;
  const activeSortLabel = `${sortLabels[sort]} ${dir === "asc" ? "ascending" : "descending"}`;
  const visibleInvoices = showAll ? invoices : invoices.slice(0, LIST_LIMIT);

  return (
    <div className="grid gap-6">
      <header className="grid gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Invoices</h1>
            <p className="text-sm text-muted-foreground">Find, sort, print, and collect VAT invoices.</p>
          </div>
          <form className="flex w-full flex-col gap-2 sm:flex-row lg:w-[620px]">
            <Input name="q" defaultValue={q} placeholder="Invoice, customer, job, plate, vehicle" className="h-11" />
            <select name="status" defaultValue={status} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All status</option>
              <option value="open">Open only</option>
              <option value="paid">Paid only</option>
            </select>
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="dir" value={dir} />
            <Button className="h-11 px-5" aria-label="Search invoices">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Visible Total</p>
                <p className="text-2xl font-bold">{eur(grossTotal)}</p>
              </div>
              <WalletCards className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Open Balance</p>
                <p className="text-2xl font-bold text-destructive">{eur(openTotal)}</p>
              </div>
              <CalendarClock className="h-5 w-5 text-destructive" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold">{eur(paidTotal)}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{overdueCount}</p>
              </div>
              <FileText className="h-5 w-5 text-primary" />
            </CardContent>
          </Card>
        </section>
      </header>

      <Card>
        <CardHeader className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">{invoices.length} Invoice{invoices.length === 1 ? "" : "s"}</h2>
            <p className="text-xs text-muted-foreground">Sorted by {activeSortLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sortOptions.map((option) => (
              <Button key={option.key} asChild size="sm" variant={sort === option.key ? "primary" : "secondary"}>
                <Link href={routeFor({ q, status, sort: option.key, dir: sort === option.key ? dir : option.key === "date" || option.key === "due" || option.key === "total" ? "desc" : "asc" })}>
                  {option.label}
                </Link>
              </Button>
            ))}
            {q || status !== "all" || sort !== "date" || dir !== "desc" ? (
              <Button asChild size="sm" variant="ghost">
                <Link href="/invoices">Clear</Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th><SortLink column="invoice" currentSort={sort} currentDir={dir} q={q} status={status}>Invoice</SortLink></Th>
                  <Th><SortLink column="customer" currentSort={sort} currentDir={dir} q={q} status={status}>Customer</SortLink></Th>
                  <Th><SortLink column="vehicle" currentSort={sort} currentDir={dir} q={q} status={status}>Vehicle</SortLink></Th>
                  <Th><SortLink column="date" currentSort={sort} currentDir={dir} q={q} status={status}>Issued</SortLink></Th>
                  <Th><SortLink column="due" currentSort={sort} currentDir={dir} q={q} status={status}>Due</SortLink></Th>
                  <Th className="text-right"><SortLink column="total" currentSort={sort} currentDir={dir} q={q} status={status} className="justify-end">Total</SortLink></Th>
                  <Th><SortLink column="status" currentSort={sort} currentDir={dir} q={q} status={status}>Status</SortLink></Th>
                </tr>
              </thead>
              <tbody>
                {visibleInvoices.map((invoice) => {
                  const isOverdue = !invoice.paid && invoice.dueDate && invoice.dueDate.getTime() < now;
                  return (
                    <tr key={invoice.id} className="transition hover:bg-muted/50">
                      <Td>
                        <Link className="font-semibold text-primary" href={`/invoices/${invoice.id}`}>{invoice.invoiceNumber}</Link>
                        <p className="text-xs text-muted-foreground">{invoice.job.jobNumber}</p>
                      </Td>
                      <Td>
                        <Link className="font-medium hover:text-primary" href={`/customers/${invoice.customer.id}`}>{invoice.customer.fullName}</Link>
                      </Td>
                      <Td>
                        <Link className="font-medium hover:text-primary" href={`/vehicles/${invoice.job.vehicle.id}`}>{invoice.job.vehicle.licensePlate}</Link>
                        <p className="text-xs text-muted-foreground">{invoice.job.vehicle.make} {invoice.job.vehicle.model}</p>
                      </Td>
                      <Td className="whitespace-nowrap">{cyDate(invoice.issueDate)}</Td>
                      <Td className={cn("whitespace-nowrap", isOverdue && "font-semibold text-destructive")}>{cyDate(invoice.dueDate)}</Td>
                      <Td className="whitespace-nowrap text-right font-semibold">{eur(invoice.grandTotal)}</Td>
                      <Td>
                        <Badge className={cn(invoice.paid ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive", isOverdue && "border-destructive/30")}>
                          {invoice.paid ? "Paid" : isOverdue ? "Overdue" : "Open"}
                        </Badge>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
          {!invoices.length ? (
            <div className="p-10 text-center">
              <p className="font-semibold">No invoices found</p>
              <p className="text-sm text-muted-foreground">Try a different invoice number, customer, job, or plate.</p>
            </div>
          ) : null}
          {!showAll && invoices.length > LIST_LIMIT ? (
            <div className="flex items-center justify-between gap-3 border-t border-border p-4">
              <p className="text-sm text-muted-foreground">Showing latest {LIST_LIMIT} of {invoices.length}</p>
              <Button asChild size="sm" variant="secondary">
                <Link href={viewMoreRoute({ q, status, sort, dir })}>View more</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
