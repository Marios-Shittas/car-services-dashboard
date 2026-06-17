"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { eur } from "@/lib/utils";

type Mechanic = { id: number; name: string; hourlyRate: string };
type LaborEntry = { id: number; description: string; hoursWorked: string; hourlyRate: string; mechanicId: number; mechanicName: string };
type PartUsed = { id: number; partName: string; partNumber: string | null; quantity: string; unitPrice: string; supplier: string | null };

function numberValue(value: string) {
  return Number(value || 0);
}

export function JobBreakdownEditor({ jobId, mechanics, laborEntries, partsUsed }: { jobId: number; mechanics: Mechanic[]; laborEntries: LaborEntry[]; partsUsed: PartUsed[] }) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function request(path: string, init: RequestInit, busy: string) {
    setBusyKey(busy);
    await fetch(path, init);
    setBusyKey(null);
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><h2 className="font-semibold">Labor Breakdown</h2></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead><tr><Th>Description</Th><Th>Hours</Th><Th>Rate</Th><Th>Total</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {laborEntries.map((entry) => {
                const busy = busyKey === `labor-${entry.id}`;
                return (
                  <tr key={entry.id}>
                    <Td className="min-w-56">
                      <Input form={`labor-${entry.id}`} name="description" defaultValue={entry.description} required />
                      <select form={`labor-${entry.id}`} name="mechanicId" defaultValue={entry.mechanicId} required className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        {mechanics.map((mechanic) => <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>)}
                      </select>
                    </Td>
                    <Td className="min-w-28"><Input form={`labor-${entry.id}`} name="hoursWorked" type="number" step="0.1" defaultValue={entry.hoursWorked} required /></Td>
                    <Td className="min-w-28"><Input form={`labor-${entry.id}`} name="hourlyRate" type="number" step="0.01" defaultValue={entry.hourlyRate} required /></Td>
                    <Td className="whitespace-nowrap font-medium">{eur(numberValue(entry.hoursWorked) * numberValue(entry.hourlyRate))}</Td>
                    <Td>
                      <form
                        id={`labor-${entry.id}`}
                        className="flex gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const data = Object.fromEntries(new FormData(event.currentTarget));
                          request(`/api/jobs/${jobId}/labor/${entry.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }, `labor-${entry.id}`);
                        }}
                      >
                        <Button size="icon" type="submit" disabled={busy} aria-label="Save labor"><Save className="h-4 w-4" /></Button>
                        <Button size="icon" type="button" variant="danger" disabled={busy} aria-label="Delete labor" onClick={() => request(`/api/jobs/${jobId}/labor/${entry.id}`, { method: "DELETE" }, `labor-${entry.id}`)}><Trash2 className="h-4 w-4" /></Button>
                      </form>
                    </Td>
                  </tr>
                );
              })}
              {!laborEntries.length ? <tr><Td colSpan={5} className="text-muted-foreground">No labor entries yet.</Td></tr> : null}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold">Parts Breakdown</h2></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <thead><tr><Th>Part</Th><Th>Qty</Th><Th>Unit</Th><Th>Total</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {partsUsed.map((part) => {
                const busy = busyKey === `part-${part.id}`;
                return (
                  <tr key={part.id}>
                    <Td className="min-w-56">
                      <Input form={`part-${part.id}`} name="partName" defaultValue={part.partName} required />
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <Input form={`part-${part.id}`} name="partNumber" defaultValue={part.partNumber ?? ""} placeholder="Part number" />
                        <Input form={`part-${part.id}`} name="supplier" defaultValue={part.supplier ?? ""} placeholder="Supplier" />
                      </div>
                    </Td>
                    <Td className="min-w-28"><Input form={`part-${part.id}`} name="quantity" type="number" step="0.01" defaultValue={part.quantity} required /></Td>
                    <Td className="min-w-28"><Input form={`part-${part.id}`} name="unitPrice" type="number" step="0.01" defaultValue={part.unitPrice} required /></Td>
                    <Td className="whitespace-nowrap font-medium">{eur(numberValue(part.quantity) * numberValue(part.unitPrice))}</Td>
                    <Td>
                      <form
                        id={`part-${part.id}`}
                        className="flex gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const data = Object.fromEntries(new FormData(event.currentTarget));
                          request(`/api/jobs/${jobId}/parts/${part.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }, `part-${part.id}`);
                        }}
                      >
                        <Button size="icon" type="submit" disabled={busy} aria-label="Save part"><Save className="h-4 w-4" /></Button>
                        <Button size="icon" type="button" variant="danger" disabled={busy} aria-label="Delete part" onClick={() => request(`/api/jobs/${jobId}/parts/${part.id}`, { method: "DELETE" }, `part-${part.id}`)}><Trash2 className="h-4 w-4" /></Button>
                      </form>
                    </Td>
                  </tr>
                );
              })}
              {!partsUsed.length ? <tr><Td colSpan={5} className="text-muted-foreground">No parts used yet.</Td></tr> : null}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
