import Link from "next/link";
import { Download } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { InvoiceView } from "@/components/invoice-view";
import { PrintButton } from "@/components/print-button";

const defaultSettings = {
  companyName: "Minas Auto Garage Ltd",
  address: "Limassol, Cyprus",
  phone: "+357 25 555500",
  email: "service@minasgarage.cy",
  vatNumber: "CY10345678A",
  registrationNumber: "HE456789"
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({ where: { id: Number(id) }, include: { customer: true, job: { include: { vehicle: true, laborEntries: true, partsUsed: true } } } }),
    prisma.workshopSetting.findFirst()
  ]);
  if (!invoice) notFound();
  return (
    <div className="grid gap-4">
      <div className="no-print flex justify-end gap-2">
        <PrintButton />
        <Button asChild><Link href={`/api/invoices/${invoice.id}/pdf`} target="_blank"><Download className="h-4 w-4" /> PDF</Link></Button>
      </div>
      <InvoiceView invoice={invoice} settings={settings ?? defaultSettings} />
    </div>
  );
}
