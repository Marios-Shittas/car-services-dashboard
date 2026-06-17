"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Car, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type VehicleDraft = {
  id: string;
  licensePlate: string;
  vinNumber: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  engineType: string;
  fuelType: "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC" | "LPG" | "OTHER";
  color: string;
  notes: string;
};

function emptyVehicle(): VehicleDraft {
  return {
    id: crypto.randomUUID(),
    licensePlate: "",
    vinNumber: "",
    make: "",
    model: "",
    year: "",
    mileage: "",
    engineType: "",
    fuelType: "PETROL",
    color: "",
    notes: ""
  };
}

export function CustomerForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carsOpen, setCarsOpen] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleDraft[]>([]);

  function updateVehicle(id: string, patch: Partial<VehicleDraft>) {
    setVehicles((current) => current.map((vehicle) => (vehicle.id === id ? { ...vehicle, ...patch } : vehicle)));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = Object.fromEntries(new FormData(formElement));
    const payload = {
      ...form,
      vehicles: vehicles.map((vehicle) => ({
        licensePlate: vehicle.licensePlate,
        vinNumber: vehicle.vinNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mileage: vehicle.mileage,
        engineType: vehicle.engineType,
        fuelType: vehicle.fuelType,
        color: vehicle.color,
        notes: vehicle.notes
      })).filter((vehicle) => Object.values(vehicle).some(Boolean))
    };

    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "Could not create customer.");
      }
      formElement.reset();
      setVehicles([]);
      setCarsOpen(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create customer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <section className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="fullName" placeholder="Full name" required />
          <Input name="phone" placeholder="Phone number" required />
        </div>
        <Input name="email" type="email" placeholder="Email" />
        <Input name="address" placeholder="Address" />
        <Input name="vatNumber" placeholder="VAT number" />
        <Textarea name="notes" placeholder="Customer notes" />
      </section>

      <section className="rounded-md border border-border bg-muted/20">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 p-3 text-left"
          onClick={() => {
            setCarsOpen((current) => !current);
            if (!carsOpen && vehicles.length === 0) setVehicles([emptyVehicle()]);
          }}
        >
          <span className="flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            <span>
              <span className="block text-sm font-semibold">Cars</span>
              <span className="block text-xs text-muted-foreground">{vehicles.length ? `${vehicles.length} car${vehicles.length === 1 ? "" : "s"} added` : "Optional, expandable section"}</span>
            </span>
          </span>
          {carsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {carsOpen ? (
          <div className="grid gap-3 border-t border-border p-3">
            {vehicles.map((vehicle, index) => (
              <div key={vehicle.id} className="grid gap-3 rounded-md border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Car {index + 1}</p>
                  {vehicles.length > 1 ? (
                    <Button type="button" size="icon" variant="ghost" aria-label="Remove car" onClick={() => setVehicles((current) => current.filter((item) => item.id !== vehicle.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={vehicle.licensePlate} onChange={(event) => updateVehicle(vehicle.id, { licensePlate: event.target.value })} placeholder="License plate" />
                  <Input value={vehicle.vinNumber} onChange={(event) => updateVehicle(vehicle.id, { vinNumber: event.target.value })} placeholder="VIN number" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={vehicle.make} onChange={(event) => updateVehicle(vehicle.id, { make: event.target.value })} placeholder="Make" />
                  <Input value={vehicle.model} onChange={(event) => updateVehicle(vehicle.id, { model: event.target.value })} placeholder="Model" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={vehicle.year} onChange={(event) => updateVehicle(vehicle.id, { year: event.target.value })} type="number" placeholder="Year" />
                  <Input value={vehicle.mileage} onChange={(event) => updateVehicle(vehicle.id, { mileage: event.target.value })} type="number" placeholder="Mileage" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={vehicle.engineType} onChange={(event) => updateVehicle(vehicle.id, { engineType: event.target.value })} placeholder="Engine type" />
                  <Input value={vehicle.color} onChange={(event) => updateVehicle(vehicle.id, { color: event.target.value })} placeholder="Color" />
                </div>
                <select value={vehicle.fuelType} onChange={(event) => updateVehicle(vehicle.id, { fuelType: event.target.value as VehicleDraft["fuelType"] })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG", "OTHER"].map((fuel) => <option key={fuel}>{fuel}</option>)}
                </select>
                <Textarea value={vehicle.notes} onChange={(event) => updateVehicle(vehicle.id, { notes: event.target.value })} placeholder="Vehicle notes" />
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => setVehicles((current) => [...current, emptyVehicle()])}>
              <Plus className="h-4 w-4" />
              Add another car
            </Button>
          </div>
        ) : null}
      </section>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={saving}>{saving ? "Saving..." : "Create customer"}</Button>
    </form>
  );
}
