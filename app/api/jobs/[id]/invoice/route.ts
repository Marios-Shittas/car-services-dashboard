import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateJobTotals, nextInvoiceNumber } from "@/lib/invoices";
import { requireUser } from "@/lib/rbac";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const jobId = Number(id);
  const existing = await prisma.invoice.findUnique({ where: { jobId } });
  const job = await prisma.repairJob.findUniqueOrThrow({ where: { id: jobId } });
  const totals = await calculateJobTotals(jobId);
  if (existing) {
    const invoice = await prisma.invoice.update({
      where: { id: existing.id },
      data: {
        ...totals,
        issueDate: new Date(),
        dueDate: existing.dueDate ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    });
    return NextResponse.json(invoice);
  }
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: await nextInvoiceNumber(),
      jobId,
      customerId: job.customerId,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      ...totals
    }
  });
  await prisma.repairJob.update({ where: { id: jobId }, data: { status: "COMPLETED", dateCompleted: job.dateCompleted ?? new Date() } });
  return NextResponse.json(invoice, { status: 201 });
}
