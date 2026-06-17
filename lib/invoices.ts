import { prisma } from "@/lib/prisma";

export async function calculateJobTotals(jobId: number) {
  const [laborEntries, partsUsed] = await Promise.all([
    prisma.laborEntry.findMany({ where: { jobId } }),
    prisma.partUsed.findMany({ where: { jobId } })
  ]);
  const laborTotal = laborEntries.reduce((sum, item) => sum + Number(item.hoursWorked) * Number(item.hourlyRate), 0);
  const partsTotal = partsUsed.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitPrice), 0);
  const subtotal = laborTotal + partsTotal;
  const setting = await prisma.workshopSetting.findFirst();
  const vatRate = Number(setting?.defaultVatRate ?? 19);
  const vatAmount = subtotal * (vatRate / 100);
  return {
    laborTotal: round(laborTotal),
    partsTotal: round(partsTotal),
    subtotal: round(subtotal),
    vatRate,
    vatAmount: round(vatAmount),
    grandTotal: round(subtotal + vatAmount)
  };
}

export async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const latest = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: `INV-${year}-` } },
    orderBy: { invoiceNumber: "desc" }
  });
  const last = latest ? Number(latest.invoiceNumber.split("-").at(-1)) : 0;
  return `INV-${year}-${String(last + 1).padStart(5, "0")}`;
}

export function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
