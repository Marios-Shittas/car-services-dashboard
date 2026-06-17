"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Customer = {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  vatNumber: string | null;
  notes: string | null;
};

export function CustomerActions({ customer, canDelete }: { customer: Customer; canDelete: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!response.ok) throw new Error("Could not update customer.");
      setMessage("Customer details updated.");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not update customer.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCustomer() {
    if (!window.confirm("Delete this customer? This is only for records created by mistake.")) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
      if (response.status === 409) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "This customer cannot be deleted because it has history.");
      }
      if (!response.ok) throw new Error("Could not delete customer.");
      router.push("/customers");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not delete customer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <form className="grid gap-3" onSubmit={updateCustomer}>
        <Input name="fullName" defaultValue={customer.fullName} placeholder="Full name" required />
        <Input name="phone" defaultValue={customer.phone} placeholder="Phone number" required />
        <Input name="email" type="email" defaultValue={customer.email ?? ""} placeholder="Email" />
        <Input name="address" defaultValue={customer.address ?? ""} placeholder="Address" />
        <Input name="vatNumber" defaultValue={customer.vatNumber ?? ""} placeholder="VAT number" />
        <Textarea name="notes" defaultValue={customer.notes ?? ""} placeholder="Mechanic notes" />
        {message ? <p className="text-sm text-primary">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button disabled={busy}><Save className="h-4 w-4" /> Save details</Button>
      </form>
      <Button type="button" variant="danger" disabled={busy || !canDelete} onClick={deleteCustomer}>
        <Trash2 className="h-4 w-4" /> Delete customer
      </Button>
      {!canDelete ? <p className="text-xs text-muted-foreground">Customers with vehicles, jobs, or invoices stay in the system to protect workshop history.</p> : null}
    </div>
  );
}
