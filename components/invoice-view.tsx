import { cyDate, eur } from "@/lib/utils";

type InvoiceViewProps = {
  invoice: {
    invoiceNumber: string;
    issueDate: Date;
    dueDate: Date | null;
    laborTotal: unknown;
    partsTotal: unknown;
    subtotal: unknown;
    vatRate: unknown;
    vatAmount: unknown;
    grandTotal: unknown;
    customer: { fullName: string; address: string | null; phone: string; vatNumber: string | null };
    job: {
      vehicle: { licensePlate: string; vinNumber: string | null; make: string; model: string; mileage: number };
      laborEntries: { id: number; description: string; hoursWorked: unknown; hourlyRate: unknown }[];
      partsUsed: { id: number; partName: string; quantity: unknown; unitPrice: unknown }[];
    };
  };
  settings: { companyName: string; address: string; phone: string; email: string; vatNumber: string; registrationNumber: string };
};

export function InvoiceView({ invoice, settings }: InvoiceViewProps) {
  return (
    <article className="mx-auto max-w-4xl bg-white p-8 text-slate-950 shadow-sm print:shadow-none">
      <header className="flex items-start justify-between border-b border-slate-300 pb-6">
        <div>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-teal-700 text-xl font-bold text-white">GF</div>
          <h1 className="text-2xl font-bold">{settings.companyName}</h1>
          <p className="text-sm">{settings.address}</p>
          <p className="text-sm">{settings.phone} · {settings.email}</p>
          <p className="text-sm">VAT {settings.vatNumber} · Reg. {settings.registrationNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-sm uppercase tracking-wide text-slate-500">Invoice</p>
          <p className="text-2xl font-bold">{invoice.invoiceNumber}</p>
          <p className="text-sm">Issued {cyDate(invoice.issueDate)}</p>
          <p className="text-sm">Due {cyDate(invoice.dueDate)}</p>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-8 border-b border-slate-200 py-6 text-sm">
        <div><h2 className="mb-2 font-bold">Customer Details</h2><p>{invoice.customer.fullName}</p><p>{invoice.customer.address ?? "-"}</p><p>{invoice.customer.phone}</p><p>VAT {invoice.customer.vatNumber ?? "-"}</p></div>
        <div><h2 className="mb-2 font-bold">Vehicle Details</h2><p>{invoice.job.vehicle.licensePlate}</p><p>{invoice.job.vehicle.make} {invoice.job.vehicle.model}</p><p>VIN {invoice.job.vehicle.vinNumber ?? "-"}</p><p>Mileage {invoice.job.vehicle.mileage.toLocaleString()} km</p></div>
      </section>
      <section className="py-6">
        <h2 className="mb-3 font-bold">Labor Breakdown</h2>
        <table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-2">Description</th><th>Hours</th><th>Rate</th><th className="text-right">Total</th></tr></thead><tbody>
          {invoice.job.laborEntries.map((entry) => <tr key={entry.id} className="border-b border-slate-100"><td className="py-2">{entry.description}</td><td>{String(entry.hoursWorked)}</td><td>{eur(entry.hourlyRate as string)}</td><td className="text-right">{eur(Number(entry.hoursWorked) * Number(entry.hourlyRate))}</td></tr>)}
        </tbody></table>
      </section>
      <section className="py-6">
        <h2 className="mb-3 font-bold">Parts Breakdown</h2>
        <table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="py-2">Part</th><th>Quantity</th><th>Unit Price</th><th className="text-right">Total</th></tr></thead><tbody>
          {invoice.job.partsUsed.map((part) => <tr key={part.id} className="border-b border-slate-100"><td className="py-2">{part.partName}</td><td>{String(part.quantity)}</td><td>{eur(part.unitPrice as string)}</td><td className="text-right">{eur(Number(part.quantity) * Number(part.unitPrice))}</td></tr>)}
        </tbody></table>
      </section>
      <section className="ml-auto w-80 border-t border-slate-300 pt-4 text-sm">
        <div className="flex justify-between py-1"><span>Labor Total</span><strong>{eur(invoice.laborTotal as string)}</strong></div>
        <div className="flex justify-between py-1"><span>Parts Total</span><strong>{eur(invoice.partsTotal as string)}</strong></div>
        <div className="flex justify-between py-1"><span>Subtotal</span><strong>{eur(invoice.subtotal as string)}</strong></div>
        <div className="flex justify-between py-1"><span>VAT {String(invoice.vatRate)}%</span><strong>{eur(invoice.vatAmount as string)}</strong></div>
        <div className="mt-2 flex justify-between border-t border-slate-300 py-3 text-lg"><span>Grand Total</span><strong>{eur(invoice.grandTotal as string)}</strong></div>
      </section>
    </article>
  );
}
