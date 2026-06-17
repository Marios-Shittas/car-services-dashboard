"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function JobForm({
  customers,
  vehicles,
  mechanics
}: {
  customers: { id: number; fullName: string }[];
  vehicles: { id: number; licensePlate: string; make: string; model: string; customerId: number; mileage: number }[];
  mechanics: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [vehicleMileage, setVehicleMileage] = useState("");
  const filteredVehicles = selectedCustomerId ? vehicles.filter((vehicle) => String(vehicle.customerId) === selectedCustomerId) : [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = Object.fromEntries(new FormData(formElement));

    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Could not create job card.");
      }
      formElement.reset();
      setSelectedCustomerId("");
      setSelectedVehicleId("");
      setVehicleMileage("");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create job card.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <select
        name="customerId"
        required
        value={selectedCustomerId}
        onChange={(event) => {
          setSelectedCustomerId(event.target.value);
          setSelectedVehicleId("");
          setVehicleMileage("");
        }}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Customer</option>
        {customers.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}
      </select>
      <select
        name="vehicleId"
        required
        disabled={!selectedCustomerId}
        value={selectedVehicleId}
        onChange={(event) => {
          setSelectedVehicleId(event.target.value);
          const vehicle = vehicles.find((item) => String(item.id) === event.target.value);
          setVehicleMileage(vehicle ? String(vehicle.mileage) : "");
        }}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
      >
        <option value="">{selectedCustomerId ? "Vehicle" : "Select customer first"}</option>
        {filteredVehicles.map((item) => <option key={item.id} value={item.id}>{item.licensePlate} - {item.make} {item.model}</option>)}
      </select>
      <Input name="vehicleMileage" type="number" min="0" value={vehicleMileage} onChange={(event) => setVehicleMileage(event.target.value)} placeholder="Current vehicle mileage" />
      <select name="assignedMechanicId" className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Assigned mechanic</option>{mechanics.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <Textarea name="problemDescription" placeholder="Problem description" required />
      <section className="grid gap-2 rounded-md border border-border bg-muted/30 p-3">
        <div>
          <p className="text-sm font-semibold">Estimated completion</p>
          <p className="text-xs text-muted-foreground">When do you expect the vehicle to be ready?</p>
        </div>
        <Input name="estimatedCompletionAt" type="datetime-local" />
      </section>
      <Textarea name="mechanicNotes" placeholder="Mechanic notes" />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={saving}>{saving ? "Saving..." : "Create job card"}</Button>
    </form>
  );
}
