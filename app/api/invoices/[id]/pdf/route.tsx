import { Document, Page, Text, View, StyleSheet, renderToStream } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  title: { fontSize: 22, marginBottom: 8 },
  heading: { fontSize: 13, marginTop: 18, marginBottom: 8 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd", paddingVertical: 5 },
  cell: { flex: 1 },
  right: { textAlign: "right" }
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: { customer: true, job: { include: { vehicle: true, laborEntries: true, partsUsed: true } } }
  });
  const settings = await prisma.workshopSetting.findFirst();
  if (!invoice || !settings) return Response.json({ message: "Invoice not found" }, { status: 404 });
  const stream = await renderToStream(
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.row}>
          <View><Text style={styles.title}>{settings.companyName}</Text><Text>{settings.address}</Text><Text>{settings.phone} - {settings.email}</Text><Text>VAT {settings.vatNumber}</Text></View>
          <View><Text style={styles.title}>{invoice.invoiceNumber}</Text><Text>Issued {invoice.issueDate.toLocaleDateString("en-GB")}</Text></View>
        </View>
        <View style={styles.row}>
          <View><Text style={styles.heading}>Customer</Text><Text>{invoice.customer.fullName}</Text><Text>{invoice.customer.address ?? "-"}</Text><Text>{invoice.customer.phone}</Text></View>
          <View><Text style={styles.heading}>Vehicle</Text><Text>{invoice.job.vehicle.licensePlate}</Text><Text>{invoice.job.vehicle.make} {invoice.job.vehicle.model}</Text><Text>VIN {invoice.job.vehicle.vinNumber ?? "-"}</Text></View>
        </View>
        <Text style={styles.heading}>Labor</Text>
        {invoice.job.laborEntries.map((entry) => <View key={entry.id} style={styles.tableRow}><Text style={styles.cell}>{entry.description}</Text><Text style={styles.cell}>{String(entry.hoursWorked)} h</Text><Text style={styles.cell}>EUR {String(entry.hourlyRate)}</Text><Text style={[styles.cell, styles.right]}>EUR {(Number(entry.hoursWorked) * Number(entry.hourlyRate)).toFixed(2)}</Text></View>)}
        <Text style={styles.heading}>Parts</Text>
        {invoice.job.partsUsed.map((part) => <View key={part.id} style={styles.tableRow}><Text style={styles.cell}>{part.partName}</Text><Text style={styles.cell}>{String(part.quantity)}</Text><Text style={styles.cell}>EUR {String(part.unitPrice)}</Text><Text style={[styles.cell, styles.right]}>EUR {(Number(part.quantity) * Number(part.unitPrice)).toFixed(2)}</Text></View>)}
        <View style={{ marginTop: 24, marginLeft: 300 }}>
          <View style={styles.row}><Text>Subtotal</Text><Text>EUR {String(invoice.subtotal)}</Text></View>
          <View style={styles.row}><Text>VAT {String(invoice.vatRate)}%</Text><Text>EUR {String(invoice.vatAmount)}</Text></View>
          <View style={styles.row}><Text>Grand Total</Text><Text>EUR {String(invoice.grandTotal)}</Text></View>
        </View>
      </Page>
    </Document>
  );
  return new Response(stream as unknown as BodyInit, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"` }
  });
}
