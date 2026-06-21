"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function mileageDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatMileage(value: string) {
  const digits = mileageDigits(value);
  return digits ? Number(digits).toLocaleString("en-US") : "";
}

export function VehicleForm({ customers }: { customers: { id: number; fullName: string }[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mileage, setMileage] = useState("");
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = { ...Object.fromEntries(new FormData(formElement)), mileage: mileageDigits(mileage) };

    setError(null);
    setSaving(true);
    try {
      const response = await fetch("/api/vehicles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!response.ok) throw new Error("Could not create vehicle.");
      formElement.reset();
      setMileage("");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create vehicle.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <select name="customerId" required className="h-10 rounded-md border border-input bg-background px-3 text-sm">
        <option value="">Customer</option>
        {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName}</option>)}
      </select>
      <Input name="licensePlate" placeholder="License plate" required />
      <Input name="vinNumber" placeholder="VIN number" />
      <div className="grid gap-3 sm:grid-cols-2"><Input name="make" placeholder="Brand" required /><Input name="model" placeholder="Model" required /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="year" type="number" placeholder="Year" />
        <div className="relative">
          <Input name="mileage" value={mileage} onChange={(event) => setMileage(formatMileage(event.target.value))} inputMode="numeric" pattern="[0-9,]*" placeholder="Kilometers" className="pr-12" />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">km</span>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2"><Input name="engineType" placeholder="Engine type" /><Input name="color" placeholder="Color" /></div>
      <select name="fuelType" className="h-10 rounded-md border border-input bg-background px-3 text-sm">
        {["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG", "OTHER"].map((fuel) => <option key={fuel}>{fuel}</option>)}
      </select>
      <Textarea name="notes" placeholder="Notes" />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={saving}>{saving ? "Saving..." : "Create vehicle"}</Button>
    </form>
  );
}
