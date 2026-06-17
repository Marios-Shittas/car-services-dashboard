import { Document, Page, Text, View, StyleSheet, renderToStream } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 22, marginBottom: 16 },
  heading: { fontSize: 13, marginTop: 14, marginBottom: 8 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd", paddingVertical: 5 },
  cell: { flex: 1 }
});

function csvValue(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function csvResponse(filename: string, headers: string[], rows: unknown[][]) {
  const body = [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
  return new Response(body, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=${filename}` } });
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const invoices = await prisma.invoice.findMany({ include: { customer: true, job: { include: { vehicle: true, laborEntries: true, partsUsed: true } } }, orderBy: { issueDate: "desc" } });
  const revenue = invoices.reduce((sum, item) => sum + Number(item.grandTotal), 0);

  if (format === "csv") {
    return csvResponse(
      "garageflow-invoices.csv",
      ["Invoice", "Date", "Customer", "Vehicle", "Subtotal", "VAT", "Grand Total", "Paid"],
      invoices.map((item) => [item.invoiceNumber, item.issueDate.toISOString().slice(0, 10), item.customer.fullName, item.job.vehicle.licensePlate, item.subtotal, item.vatAmount, item.grandTotal, item.paid ? "Paid" : "Open"])
    );
  }

  if (format === "monthly-csv") {
    const monthly = Object.values(
      invoices.reduce<Record<string, { month: string; invoices: number; labor: number; parts: number; vat: number; revenue: number; paid: number; open: number }>>((acc, invoice) => {
        const key = monthKey(invoice.issueDate);
        acc[key] ??= { month: key, invoices: 0, labor: 0, parts: 0, vat: 0, revenue: 0, paid: 0, open: 0 };
        acc[key].invoices += 1;
        acc[key].labor += Number(invoice.laborTotal);
        acc[key].parts += Number(invoice.partsTotal);
        acc[key].vat += Number(invoice.vatAmount);
        acc[key].revenue += Number(invoice.grandTotal);
        if (invoice.paid) acc[key].paid += Number(invoice.grandTotal);
        else acc[key].open += Number(invoice.grandTotal);
        return acc;
      }, {})
    ).sort((a, b) => a.month.localeCompare(b.month));

    return csvResponse(
      "garageflow-monthly-revenue.csv",
      ["Month", "Invoices", "Labor Total", "Parts Total", "VAT", "Grand Total", "Paid Total", "Open Balance"],
      monthly.map((item) => [item.month, item.invoices, item.labor.toFixed(2), item.parts.toFixed(2), item.vat.toFixed(2), item.revenue.toFixed(2), item.paid.toFixed(2), item.open.toFixed(2)])
    );
  }

  if (format === "operations-csv") {
    const jobs = await prisma.repairJob.findMany({ include: { customer: true, vehicle: true, assignedMechanic: true, laborEntries: true, partsUsed: true, invoice: true }, orderBy: { dateOpened: "desc" } });
    return csvResponse(
      "garageflow-workshop-operations.csv",
      ["Job", "Opened", "Completed", "Status", "Customer", "Vehicle", "Mechanic", "Labor Hours", "Parts Cost", "Invoice", "Invoice Total"],
      jobs.map((job) => [
        job.jobNumber,
        job.dateOpened.toISOString().slice(0, 10),
        job.dateCompleted?.toISOString().slice(0, 10) ?? "",
        job.status,
        job.customer.fullName,
        `${job.vehicle.licensePlate} ${job.vehicle.make} ${job.vehicle.model}`,
        job.assignedMechanic?.name ?? "Unassigned",
        job.laborEntries.reduce((sum, entry) => sum + Number(entry.hoursWorked), 0).toFixed(2),
        job.partsUsed.reduce((sum, part) => sum + Number(part.quantity) * Number(part.unitPrice), 0).toFixed(2),
        job.invoice?.invoiceNumber ?? "",
        job.invoice?.grandTotal ?? ""
      ])
    );
  }

  if (format === "pdf") {
    const stream = await renderToStream(
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Car Services MGH Revenue Report</Text>
          <Text>Total invoices: {invoices.length}</Text>
          <Text>Total revenue: EUR {revenue.toFixed(2)}</Text>
          <Text style={styles.heading}>Invoices</Text>
          <View style={styles.row}><Text style={styles.cell}>Invoice</Text><Text style={styles.cell}>Customer</Text><Text style={styles.cell}>Vehicle</Text><Text style={styles.cell}>Total</Text></View>
          {invoices.map((item) => <View key={item.id} style={styles.row}><Text style={styles.cell}>{item.invoiceNumber}</Text><Text style={styles.cell}>{item.customer.fullName}</Text><Text style={styles.cell}>{item.job.vehicle.licensePlate}</Text><Text style={styles.cell}>EUR {String(item.grandTotal)}</Text></View>)}
        </Page>
      </Document>
    );
    return new Response(stream as unknown as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=garageflow-report.pdf" } });
  }
  return Response.json(invoices);
}
