"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FilePlus2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JobActions({ jobId, mechanics, invoiceId }: { jobId: number; mechanics: { id: number; name: string; hourlyRate: string }[]; invoiceId?: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function post(path: string, data: FormData | Record<string, unknown>) {
    setBusy(true);
    const response = await fetch(path, { method: "POST", headers: data instanceof FormData ? undefined : { "Content-Type": "application/json" }, body: data instanceof FormData ? data : JSON.stringify(data) });
    const payload = await response.json().catch(() => null) as { id?: number } | null;
    setBusy(false);
    if (path.endsWith("/invoice") && payload?.id) {
      router.push(`/invoices/${payload.id}`);
      return;
    }
    router.refresh();
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form className="grid gap-3 rounded-lg border border-border bg-card p-4" onSubmit={(event) => { event.preventDefault(); post(`/api/jobs/${jobId}/labor`, new FormData(event.currentTarget)); event.currentTarget.reset(); }}>
        <h2 className="font-semibold">Add Labor</h2>
        <Input name="description" placeholder="Description" required />
        <div className="grid gap-3 sm:grid-cols-2"><Input name="hoursWorked" type="number" step="0.1" placeholder="Hours" required /><Input name="hourlyRate" type="number" step="0.01" placeholder="Rate" required /></div>
        <select name="mechanicId" required className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Mechanic</option>{mechanics.map((mechanic) => <option key={mechanic.id} value={mechanic.id}>{mechanic.name} (€{mechanic.hourlyRate}/h)</option>)}</select>
        <Button disabled={busy}><Save className="h-4 w-4" /> Add labor</Button>
      </form>
      <form className="grid gap-3 rounded-lg border border-border bg-card p-4" onSubmit={(event) => { event.preventDefault(); post(`/api/jobs/${jobId}/parts`, new FormData(event.currentTarget)); event.currentTarget.reset(); }}>
        <h2 className="font-semibold">Add Part</h2>
        <Input name="partName" placeholder="Part name" required />
        <Input name="partNumber" placeholder="Part number" />
        <div className="grid gap-3 sm:grid-cols-2"><Input name="quantity" type="number" step="0.01" placeholder="Qty" required /><Input name="unitPrice" type="number" step="0.01" placeholder="Unit price" required /></div>
        <Input name="supplier" placeholder="Supplier" />
        <Button disabled={busy}><Save className="h-4 w-4" /> Add part</Button>
      </form>
      <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2">
        <Button variant="secondary" disabled={busy} onClick={() => post(`/api/jobs/${jobId}/complete`, {})}>Mark completed</Button>
        <Button disabled={busy} onClick={() => post(`/api/jobs/${jobId}/invoice`, {})}><FilePlus2 className="h-4 w-4" /> {invoiceId ? "Update invoice" : "Generate invoice"}</Button>
      </div>
    </div>
  );
}
