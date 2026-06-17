"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function WorkItemForm({
  mechanics,
  customers
}: {
  mechanics: { id: number; name: string }[];
  customers: { id: number; fullName: string; phone: string }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const matchingCustomers = customerSearch.trim()
    ? customers
        .filter((customer) => `${customer.fullName} ${customer.phone}`.toLowerCase().includes(customerSearch.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!selectedCustomerName) {
      setError("Choose an existing customer from the list.");
      return;
    }
    const form = Object.fromEntries(new FormData(formElement));

    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/work", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error("Could not add work.");
      formElement.reset();
      setCustomerSearch("");
      setSelectedCustomerName("");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not add work.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <Input name="title" placeholder="Work title" required />
      <Textarea name="description" placeholder="Notes or next step" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <input type="hidden" name="customerName" value={selectedCustomerName} />
          <Input
            value={customerSearch}
            placeholder="Customer"
            autoComplete="off"
            required
            onChange={(event) => {
              setCustomerSearch(event.target.value);
              setSelectedCustomerName("");
              setError(null);
            }}
            onBlur={() => {
              window.setTimeout(() => {
                if (!selectedCustomerName) setCustomerSearch("");
              }, 120);
            }}
          />
          {matchingCustomers.length ? (
            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-lg">
              {matchingCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm transition hover:bg-muted"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setCustomerSearch(customer.fullName);
                    setSelectedCustomerName(customer.fullName);
                    setError(null);
                  }}
                >
                  <span className="block font-medium">{customer.fullName}</span>
                  <span className="block text-xs text-muted-foreground">{customer.phone}</span>
                </button>
              ))}
            </div>
          ) : customerSearch && !selectedCustomerName ? (
            <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-lg">
              No existing customer found
            </div>
          ) : null}
        </div>
        <Input name="vehiclePlate" placeholder="Vehicle plate" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="assignedMechanicId" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Assigned mechanic</option>
          {mechanics.map((mechanic) => <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>)}
        </select>
        <Input name="dueDate" type="datetime-local" />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={saving}>{saving ? "Adding..." : "Add work"}</Button>
    </form>
  );
}
